const { createProxyMiddleware } = require("http-proxy-middleware");

const FUSION_POLICY_URL = process.env.FUSION_POLICY_URL || "http://fusion-policy-store:3000";
const TTL = parseInt(process.env.FUSION_RESOLVE_TTL_SEC || "0", 10);
const cache = new Map();

const upstreamsFor = (serviceKey) => ({
  legacy: process.env[`${serviceKey.toUpperCase()}_LEGACY_URI`],
  v1:     process.env[`${serviceKey.toUpperCase()}_V1_URI`],
  v2:     process.env[`${serviceKey.toUpperCase()}_V2_URI`],
  fused:  process.env[`${serviceKey.toUpperCase()}_FUSED_URI`],
});

function normLogical(v) {
  const x = (v || "").toString().toLowerCase();
  return ["v1", "v2", "legacy"].includes(x) ? x : "";
}

async function resolveTarget(service, logicalMaybeEmpty) {
  const key = `${service}:${logicalMaybeEmpty || "_auto_"}`;
  const now = Date.now();
  if (TTL > 0) {
    const hit = cache.get(key);
    if (hit && hit.exp > now) return hit.data;
  }

  const url = new URL(`${FUSION_POLICY_URL}/resolve`);
  url.searchParams.set("service", service);
  if (logicalMaybeEmpty) url.searchParams.set("logical", logicalMaybeEmpty);

  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(`resolve failed ${r.status}`);

  const data = await r.json();
  if (TTL > 0) cache.set(key, { data, exp: now + TTL * 1000 });

  return data;
}

// G1: Send fused traffic as logicalVersion = "fused"
function emitMetric(service, logicalVersion, isFused) {
  const lv = isFused ? "fused" : logicalVersion;
  fetch(`${FUSION_POLICY_URL}/metrics`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ service, logicalVersion: lv }),
  }).catch(() => {});
}

/**
 * fusionProxyTo(serviceKey, { fixedLogical, stripPrefix })
 * fixedLogical: 'v1'|'v2'|'legacy'|undefined
 * stripPrefix: regex matching mount path
 */
function fusionProxyTo(serviceKey, { fixedLogical, stripPrefix }) {
  const upstreams = upstreamsFor(serviceKey);
  if (!upstreams.v1 || !upstreams.v2 || !upstreams.fused) {
    throw new Error(`[fusionProxyTo] missing upstream URIs for ${serviceKey}`);
  }

  const prepare = async (req, res, next) => {
    try {
      const headerLogical = normLogical(req.headers["x-version"]);
      const requested = fixedLogical ? normLogical(fixedLogical) : headerLogical;

      const resolved = await resolveTarget(serviceKey, requested);

      const isFused = (resolved.targetKey || "").startsWith("fused:");

      req.__fusion = {
        service: serviceKey,
        logicalVersion: resolved.logicalVersion, // original version selected
        targetKey: resolved.targetKey,           // fused:svc:v1v2 OR v1/v2/legacy
        isFused
      };

      emitMetric(serviceKey, resolved.logicalVersion, isFused);

      console.log(
        `[fusion] ${serviceKey}: logical=${resolved.logicalVersion}, target=${resolved.targetKey}`
      );

      next();
    } catch (e) {
      console.error(`[fusion] ${serviceKey}: resolve error ->`, e.message);
      if (!res.headersSent) res.status(502).json({ message: "Fusion resolution failed", error: e.message });
    }
  };

  const proxy = createProxyMiddleware({
    target: upstreams.v1,
    changeOrigin: true,

    router: (req) => {
      const { isFused, logicalVersion } = req.__fusion || {};
      return isFused ? upstreams.fused : upstreams[logicalVersion] || upstreams.v1;
    },

    pathRewrite: (pathReq, req) => {
      const original = req.originalUrl;
      const { logicalVersion, isFused } = req.__fusion || { logicalVersion: "v1" };
      let suffix = original.replace(stripPrefix, "");
      if (!suffix.startsWith("/")) suffix = `/${suffix}`;
      if (suffix === "/") suffix = "";

      // fused uses same routing, only metrics differ
      let newPath = `/${logicalVersion}/${serviceKey}${suffix}`;
      newPath = newPath.replace(/\/{2,}/g, "/");

      console.log(`[fusion] ${serviceKey}: ${original} -> ${newPath}`);
      return newPath;
    },

    onProxyReq: (proxyReq, req) => {
      const { logicalVersion, targetKey } = req.__fusion || {};
      proxyReq.setHeader("x-version", logicalVersion || "v1");
      proxyReq.setHeader("x-fused-target", targetKey || "none");
    },

    onProxyRes: (proxyRes, req) => {
      console.log(`[fusion] ${serviceKey}: upstream responded ${proxyRes.statusCode}`);
    },

    onError: (err, req, res) => {
      console.error(`[fusion] ${serviceKey}: proxy error`, err.message);
      if (!res.headersSent) {
        res.status(502).json({ message: "Downstream unreachable", error: err.message });
      }
    },

    timeout: 60000,
    proxyTimeout: 60000,
    selfHandleResponse: false,
  });

  return [prepare, proxy];
}

module.exports = { fusionProxyTo };
