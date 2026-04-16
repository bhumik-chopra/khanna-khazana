const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const Order = require("../models/Order");
const Dish = require("../models/Dish");

const router = express.Router();

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "";

const razorpay =
  razorpayKeyId && razorpayKeySecret
    ? new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret
      })
    : null;

async function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Items are required");
  }

  const dishIds = items.map((item) => item.id || item.dishId).filter(Boolean);
  const dishes = dishIds.length ? await Dish.find({ _id: { $in: dishIds } }).populate("restaurantId") : [];
  const dishMap = new Map(dishes.map((dish) => [String(dish._id), dish]));

  return items.map((item) => {
    const dish = dishMap.get(String(item.id || item.dishId || ""));
    const name = String(item.name || "").trim();
    const price = Number(item.price);
    const quantity = Number(item.quantity || 1);

    if (!name) throw new Error("Item name missing");
    if (!Number.isFinite(price)) throw new Error(`Invalid price for ${name}`);
    if (!Number.isFinite(quantity) || quantity < 1) {
      throw new Error(`Invalid quantity for ${name}`);
    }

    return {
      dishId: dish ? dish._id : null,
      restaurantId: dish?.restaurantId?._id || null,
      name,
      price,
      quantity
    };
  });
}

function getSubtotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function deriveRestaurantSummary(items) {
  const restaurants = items
    .map((item) => (item.restaurantId ? String(item.restaurantId) : ""))
    .filter(Boolean);
  const uniqueRestaurantIds = [...new Set(restaurants)];
  return {
    restaurantId: uniqueRestaurantIds.length === 1 ? uniqueRestaurantIds[0] : null,
    restaurantName: ""
  };
}

router.post("/create-payment-order", async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({ message: "Razorpay is not configured on the server" });
    }

    const normalizedItems = await normalizeItems(req.body.items);
    const subtotal = getSubtotal(normalizedItems);

    const paymentOrder = await razorpay.orders.create({
      amount: Math.round(subtotal * 100),
      currency: "INR",
      receipt: `kk_${Date.now()}`,
      notes: {
        itemsCount: String(normalizedItems.length)
      }
    });

    return res.status(201).json({
      message: "Payment order created",
      keyId: razorpayKeyId,
      currency: paymentOrder.currency,
      amount: paymentOrder.amount,
      subtotal,
      paymentOrderId: paymentOrder.id
    });
  } catch (err) {
    console.error("RAZORPAY ORDER ERROR:", err);
    return res.status(500).json({
      message: "Failed to create payment order",
      error: String(err.message || err)
    });
  }
});

router.post("/verify-payment", async (req, res) => {
  try {
    const { items, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpayKeySecret) {
      return res.status(500).json({ message: "Razorpay secret is not configured on the server" });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Payment verification details are required" });
    }

    const normalizedItems = await normalizeItems(items);
    const subtotal = getSubtotal(normalizedItems);
    const restaurantSummary = deriveRestaurantSummary(normalizedItems);

    const expectedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const order = await Order.create({
      ...restaurantSummary,
      items: normalizedItems,
      subtotal,
      status: "paid",
      paymentProvider: "razorpay",
      paymentOrderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      paymentSignature: razorpay_signature
    });

    return res.status(201).json({
      message: "Order created",
      orderId: String(order._id),
      subtotal
    });
  } catch (err) {
    console.error("ORDER CREATE ERROR:", err);
    return res.status(500).json({
      message: "Failed to create order",
      error: String(err.message || err)
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const normalizedItems = await normalizeItems(req.body.items);
    const subtotal = getSubtotal(normalizedItems);
    const restaurantSummary = deriveRestaurantSummary(normalizedItems);

    const order = await Order.create({
      ...restaurantSummary,
      items: normalizedItems,
      subtotal,
      status: "created",
      paymentProvider: "manual"
    });

    return res.status(201).json({
      message: "Order created",
      orderId: String(order._id),
      subtotal
    });
  } catch (err) {
    console.error("ORDER CREATE ERROR:", err);
    return res.status(500).json({
      message: "Failed to create order",
      error: String(err.message || err)
    });
  }
});

module.exports = router;
