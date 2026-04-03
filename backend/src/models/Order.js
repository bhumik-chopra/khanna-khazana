const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    dishId: { type: mongoose.Schema.Types.ObjectId, ref: "Dish", required: false, default: null },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    status: { type: String, default: "paid" },
    paymentProvider: { type: String, default: "razorpay" },
    paymentOrderId: { type: String, default: null },
    paymentId: { type: String, default: null },
    paymentSignature: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
