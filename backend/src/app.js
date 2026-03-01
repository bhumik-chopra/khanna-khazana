const express = require("express");
const cors = require("cors");

const dishesRoutes = require("./routes/dishes.routes");
const ordersRoutes = require("./routes/orders.routes");

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "*",
    credentials: true
  })
);

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/dishes", dishesRoutes);
app.use("/api/orders", ordersRoutes);

module.exports = app;