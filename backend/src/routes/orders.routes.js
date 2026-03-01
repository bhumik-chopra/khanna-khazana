const express = require("express");
const Order = require("../models/Order");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { items } = req.body;

    console.log("🛒 /api/orders payload:", items);

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    const normalizedItems = items.map((i) => {
      const name = String(i.name || "").trim();
      const price = Number(i.price);
      const quantity = Number(i.quantity || 1);

      if (!name) throw new Error("Item name missing");
      if (!Number.isFinite(price)) throw new Error(`Invalid price for ${name}`);
      if (!Number.isFinite(quantity) || quantity < 1) throw new Error(`Invalid quantity for ${name}`);

      return {
        dishId: null, // since your frontend is using data.js ids
        name,
        price,
        quantity
      };
    });

    const subtotal = normalizedItems.reduce((s, it) => s + it.price * it.quantity, 0);

    const order = await Order.create({
      items: normalizedItems,
      subtotal
    });

    return res.status(201).json({
      message: "Order created",
      orderId: String(order._id),
      subtotal
    });
  } catch (err) {
    console.error("❌ ORDER CREATE ERROR:", err);
    return res.status(500).json({
      message: "Failed to create order",
      error: String(err.message || err)
    });
  }
});

module.exports = router;