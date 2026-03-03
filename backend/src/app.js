const express = require("express");
const cors = require("cors");

const dishesRoutes = require("./routes/dishes.routes");
const ordersRoutes = require("./routes/orders.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();
app.use(express.json());

// ✅ allow multiple origins from env
const allowed = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// ✅ CORS options
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // postman/curl
    if (allowed.length === 0) return cb(null, true); // if not set, allow all (dev)
    if (allowed.includes(origin)) return cb(null, true);
    return cb(new Error("CORS blocked: " + origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// ✅ IMPORTANT: preflight handler (DON'T use "*")
app.options(/.*/, cors(corsOptions));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/dishes", dishesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/admin", adminRoutes);

module.exports = app;