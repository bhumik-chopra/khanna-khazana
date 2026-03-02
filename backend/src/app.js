const express = require("express");
const cors = require("cors");
const path = require("path");

const dishesRoutes = require("./routes/dishes.routes");
const ordersRoutes = require("./routes/orders.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));

// ✅ serve uploaded images (folder: backend/uploads)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/dishes", dishesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/admin", adminRoutes);

module.exports = app;