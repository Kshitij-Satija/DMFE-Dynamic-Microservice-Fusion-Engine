const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

// Supported services
const SERVICE_KEYS = ["customers", "orders", "products"];

// Default routing version if not specified
const defaultLogicalVersion = {
  customers: "v1",
  orders: "v1",
  products: "v1"
};

// Fusion groups
const fusionGroups = {
  customers: { groups: { v1v2: { versions: ["v1", "v2"], enabled: false, targetKey: "fused:customers:v1v2" } } },
  orders:    { groups: { v1v2: { versions: ["v1", "v2"], enabled: false, targetKey: "fused:orders:v1v2" } } },
  products:  { groups: { v1v2: { versions: ["v1", "v2"], enabled: false, targetKey: "fused:products:v1v2" } } }
};

// Per-second sliding window counters
const metrics = {
  customers: { v1: 0, v2: 0, fused: 0, legacy: 0 },
  orders:    { v1: 0, v2: 0, fused: 0, legacy: 0 },
  products:  { v1: 0, v2: 0, fused: 0, legacy: 0 }
};

let windowEndsAt = Date.now() + 1000;
function tickWindow() {
  const now = Date.now();
  if (now >= windowEndsAt) {
    for (const svc of Object.keys(metrics)) {
      for (const key of Object.keys(metrics[svc])) metrics[svc][key] = 0;
    }
    windowEndsAt = now + 1000;
  }
}

// Update default version mapping
app.post("/mappings/default/:service", (req, res) => {
  const { service } = req.params;
  const { logicalVersion } = req.body || {};
  if (!SERVICE_KEYS.includes(service)) return res.status(404).json({ error: "unknown service" });
  if (!["v1", "v2", "legacy"].includes((logicalVersion || "").toLowerCase()))
    return res.status(400).json({ error: "logicalVersion must be v1|v2|legacy" });

  defaultLogicalVersion[service] = logicalVersion.toLowerCase();
  res.json({ service, logicalVersion: defaultLogicalVersion[service] });
});

// Fusion admin APIs
app.get("/fusion/:service", (req, res) => {
  const { service } = req.params;
  if (!SERVICE_KEYS.includes(service)) return res.status(404).json({ error: "unknown service" });
  res.json(fusionGroups[service]);
});

app.post("/fusion/:service/:group", (req, res) => {
  const { service, group } = req.params;
  const { enabled } = req.body || {};
  if (!SERVICE_KEYS.includes(service)) return res.status(404).json({ error: "unknown service" });
  if (!fusionGroups[service].groups[group]) return res.status(404).json({ error: "unknown group" });
  fusionGroups[service].groups[group].enabled = !!enabled;
  res.json(fusionGroups[service].groups[group]);
});

// Metrics ingest
// body: { service, logicalVersion: 'v1'|'v2'|'fused'|'legacy' }
app.post("/metrics", (req, res) => {
  tickWindow();
  const { service, logicalVersion } = req.body || {};
  if (!SERVICE_KEYS.includes(service)) return res.status(404).json({ error: "unknown service" });

  const lv = logicalVersion || "v1";
  if (!metrics[service][lv]) metrics[service][lv] = 0;
  metrics[service][lv] += 1;

  res.json({ ok: true });
});

// Metrics view
app.get("/metrics/:service", (req, res) => {
  tickWindow();
  const { service } = req.params;
  if (!SERVICE_KEYS.includes(service)) return res.status(404).json({ error: "unknown service" });

  res.json({
    windowEndsAt,
    counts: metrics[service],     // raw this-second counts
    rps: metrics[service]         // alias for UI clarity
  });
});

// Resolver
app.get("/resolve", (req, res) => {
  tickWindow();

  const service = (req.query.service || "").toLowerCase();
  let logicalVersion = (req.query.logical || "").toLowerCase();

  if (!SERVICE_KEYS.includes(service)) return res.status(404).json({ error: "unknown service" });
  if (!["v1", "v2", "legacy"].includes(logicalVersion)) {
    logicalVersion = defaultLogicalVersion[service] || "v1";
  }

  let targetKey = logicalVersion;
  const groups = fusionGroups[service]?.groups || {};
  for (const g of Object.values(groups)) {
    if (g.enabled && g.versions.includes(logicalVersion)) {
      targetKey = g.targetKey;
      break;
    }
  }

  res.json({ service, logicalVersion, targetKey });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🧭 Fusion Policy Store running on ${PORT} (1-sec windows)`));
