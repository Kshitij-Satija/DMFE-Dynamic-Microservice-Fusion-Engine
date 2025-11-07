const POLICY_URL = process.env.POLICY_URL || "http://fusion-policy-store:3000";
const SERVICES = (process.env.SERVICES || "customers,orders,products").split(",");

// thresholds (per-minute)
const FUSE_COMBINED = parseInt(process.env.FUSE_COMBINED_PER_MIN || "30", 10);
const FUSE_EACH = parseInt(process.env.FUSE_EACH_PER_MIN || "20", 10);
const UNFUSE_ANY = parseInt(process.env.UNFUSE_ANY_PER_MIN || "40", 10);
const INTERVAL_MS = parseInt(process.env.CHECK_INTERVAL_MS || "5000", 10);
const COOLDOWN_SEC = parseInt(process.env.COOLDOWN_SEC || "60", 10);

const cooldownUntil = new Map();

function inCooldown(svc) {
  return Date.now() < (cooldownUntil.get(svc) || 0);
}
function startCooldown(svc) {
  cooldownUntil.set(svc, Date.now() + COOLDOWN_SEC * 1000);
}

async function tickService(service) {
  try {
    const m = await fetch(`${POLICY_URL}/metrics/${service}`).then(r => r.json());
    const f = await fetch(`${POLICY_URL}/fusion/${service}`).then(r => r.json());

    const v1 = m.counts?.v1 || 0;
    const v2 = m.counts?.v2 || 0;
    const combined = v1 + v2;
    const enabled = !!f?.groups?.v1v2?.enabled;

    const wantFuse = combined < FUSE_COMBINED && v1 < FUSE_EACH && v2 < FUSE_EACH;
    const wantUnfuse = v1 >= UNFUSE_ANY || v2 >= UNFUSE_ANY;

    if (!enabled && wantFuse && !inCooldown(service)) {
      console.log(`🔁 [${service}] FUSION ON (v1=${v1}, v2=${v2}, combined=${combined})`);
      await fetch(`${POLICY_URL}/fusion/${service}/v1v2`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: true })
      });
      startCooldown(service);
    } else if (enabled && wantUnfuse && !inCooldown(service)) {
      console.log(`⛔ [${service}] FUSION OFF (v1=${v1}, v2=${v2})`);
      await fetch(`${POLICY_URL}/fusion/${service}/v1v2`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: false })
      });
      startCooldown(service);
    }
  } catch (e) {
    console.error(`❌ [${service}] Fusion tick error:`, e.message);
  }
}

function tick() {
  for (const svc of SERVICES) tickService(svc.trim());
}

console.log(`🧠 Fusion Engine watching services: ${SERVICES.join(", ")} (every ${INTERVAL_MS}ms)`);
setInterval(tick, INTERVAL_MS);
