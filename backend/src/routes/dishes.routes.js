const express = require("express");
const Dish = require("../models/Dish");

const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { requireAdmin } = require("../middleware/auth");

// ✅ Make sure uploads folder exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({ storage });

// ✅ GET /api/dishes
router.get("/", async (req, res) => {
  try {
    const dishes = await Dish.find({}).sort({ createdAt: -1 });
    res.json(dishes.map(d => ({ ...d.toObject(), id: String(d._id) })));
  } catch (err) {
    console.error("❌ dishes get:", err);
    res.status(500).json({ message: "Failed to fetch dishes" });
  }
});

// ✅ GET /api/dishes/categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await Dish.distinct("category");
    const cleaned = categories.filter(Boolean).map(c => c.trim());
    res.json(["All", ...cleaned]);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

// ✅ POST /api/dishes (admin only) - multipart/form-data
router.post("/", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      rating,
      prepTime,
      tags,
      isBestseller
    } = req.body;

    if (!name || !price || !category || !req.file) {
      return res.status(400).json({ message: "name, price, category, image are required" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const tagsArray =
      typeof tags === "string"
        ? tags.split(",").map(t => t.trim()).filter(Boolean)
        : [];

    const dish = await Dish.create({
      name: name.trim(),
      description: description || "",
      price: Number(price),
      category: category.trim(),
      imageUrl,

      rating: rating ? Number(rating) : 4.5,
      prepTime: prepTime || "25-35 min",
      tags: tagsArray,
      isBestseller: String(isBestseller) === "true"
    });

    res.status(201).json({ ...dish.toObject(), id: String(dish._id) });
  } catch (err) {
    console.error("❌ create dish:", err);
    res.status(500).json({ message: "Failed to create dish" });
  }
});

module.exports = router;