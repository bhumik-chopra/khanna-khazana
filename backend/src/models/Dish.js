const mongoose = require("mongoose");

const dishSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, required: true }, // URL served by backend (uploads)
    category: { type: String, default: "All" },
    tags: { type: [String], default: [] },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    prepTime: { type: String, default: "25-35 min" },
    isBestseller: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dish", dishSchema);