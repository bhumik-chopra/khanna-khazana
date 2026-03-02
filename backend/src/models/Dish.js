const mongoose = require("mongoose");

const dishSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    category: { type: String, required: true },

    // ✅ Cloudinary URL
    imageUrl: { type: String, required: true },

    tags: { type: [String], default: [] },
    rating: { type: Number, default: 4.5 },
    prepTime: { type: String, default: "25-35 min" },
    isBestseller: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dish", dishSchema);