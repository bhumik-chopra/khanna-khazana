const express = require("express");
const Dish = require("../models/Dish");

const router = express.Router();

// GET /api/dishes
router.get("/", async (req, res) => {
  try {
    const dishes = await Dish.find({}).sort({ createdAt: -1 });
    // return "id" for frontend
    res.json(dishes.map(d => ({ ...d.toObject(), id: String(d._id) })));
  } catch (err) {
    console.error("❌ dishes get:", err);
    res.status(500).json({ message: "Failed to fetch dishes" });
  }
});

// GET /api/dishes/categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await Dish.distinct("category");
    res.json(["All", ...categories.filter(Boolean)]);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

module.exports = router;