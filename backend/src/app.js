const express = require("express");
const cors = require("cors");

const dishesRoutes = require("./routes/dishes.routes");
const ordersRoutes = require("./routes/orders.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();
app.use(express.json());

// allow multiple origins from env
const allowed = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl/postman
    if (allowed.includes(origin)) return cb(null, true);
    return cb(new Error("CORS blocked: " + origin));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options("/.*/", cors(corsOptions)); // ✅ IMPORTANT

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/dishes", dishesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/admin", adminRoutes);

module.exports = app;