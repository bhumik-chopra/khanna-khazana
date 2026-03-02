const mongoose = require("mongoose");

const DishSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },
    category: { type: String, required: true },

    imageUrl: { type: String, required: true },

    rating: { type: Number, default: 4.5 },
    prepTime: { type: String, default: "25-35 min" },
    tags: { type: [String], default: [] },
    isBestseller: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dish", DishSchema);