require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");  
const { fusionProxyTo } = require("./middlewares/fusionProxy.middleware");

const app = express();
app.use(cors());     
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_req, res) => res.json({ status: "Fusion Gateway up" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.get("/api/_status", async (_req, res) => {
  try {
    const services = ["customers", "orders", "products"];
    const rows = await Promise.all(services.map(async (svc) => {
      const [v1, v2, fusion] = await Promise.all([
        fetch(`http://fusion-policy-store:3000/resolve?service=${svc}&logical=v1`).then(r=>r.json()),
        fetch(`http://fusion-policy-store:3000/resolve?service=${svc}&logical=v2`).then(r=>r.json()),
        fetch(`http://fusion-policy-store:3000/fusion/${svc}`).then(r=>r.json())
      ]);
      return { service: svc, v1, v2, fusion };
    }));
    res.json({ ok: true, data: rows, ts: Date.now() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});


// Version-aware mounts
// customers
app.use("/api/v1/customers", ...fusionProxyTo("customers", { fixedLogical: "v1", stripPrefix: /^\/api\/v1\/customers/ }));
app.use("/api/v2/customers", ...fusionProxyTo("customers", { fixedLogical: "v2", stripPrefix: /^\/api\/v2\/customers/ }));
app.use("/api/customers",    ...fusionProxyTo("customers", { /* AUTO */     stripPrefix: /^\/api\/customers/ }));

// orders
app.use("/api/v1/orders", ...fusionProxyTo("orders", { fixedLogical: "v1", stripPrefix: /^\/api\/v1\/orders/ }));
app.use("/api/v2/orders", ...fusionProxyTo("orders", { fixedLogical: "v2", stripPrefix: /^\/api\/v2\/orders/ }));
app.use("/api/orders",    ...fusionProxyTo("orders", { /* AUTO */     stripPrefix: /^\/api\/orders/ }));

// products
app.use("/api/v1/products", ...fusionProxyTo("products", { fixedLogical: "v1", stripPrefix: /^\/api\/v1\/products/ }));
app.use("/api/v2/products", ...fusionProxyTo("products", { fixedLogical: "v2", stripPrefix: /^\/api\/v2\/products/ }));
app.use("/api/products",    ...fusionProxyTo("products", { /* AUTO */     stripPrefix: /^\/api\/products/ }));

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Fusion Gateway listening on ${PORT}`));
