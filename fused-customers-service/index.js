const express = require("express");

// Tell controllers we are in fused mode
process.env.MODE = "fused-runtime";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Import v1 and v2 routers
const v1Router = require("./v1/routes/customers.routes");
const v2Router = require("./v2/routes/customers.routes");

// Mount both versions
app.use("/v1", v1Router);
app.use("/v2", v2Router);

// Dispatcher for version-agnostic route
app.use("/customers", (req, res, next) => {
  const target = (req.headers["x-version"] || "v1").toLowerCase();
  return target === "v2" ? v2Router(req, res, next) : v1Router(req, res, next);
});

app.get("/ping", (_req, res) => res.send("pong customers fused"));

app.listen(PORT, () => {
  console.log(`🧩 Fused Customers Service running on port ${PORT}`);
});
