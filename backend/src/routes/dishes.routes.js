const express = require("express");
const multer = require("multer");

const Dish = require("../models/Dish");
const { requireAdmin } = require("../middleware/auth");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// ✅ use memory storage (NO uploads folder)
const upload = multer({ storage: multer.memoryStorage() });

// helper: upload buffer to cloudinary
function uploadToCloudinary(buffer, folder = "khanna-khazana") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// helper: delete cloudinary by public_id
async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (e) {
    console.warn("⚠️ Cloudinary delete failed:", e?.message);
  }
}

// GET /api/dishes
router.get("/", async (req, res) => {
  try {
    const dishes = await Dish.find({}).sort({ createdAt: -1 });
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

// POST /api/dishes (admin only) multipart/form-data
router.post("/", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const { name, description, price, category, rating, prepTime, tags, isBestseller } = req.body;

    if (!name || !price || !category || !req.file) {
      return res.status(400).json({ message: "name, price, category, image are required" });
    }

    // ✅ upload image bytes to cloudinary
    const uploaded = await uploadToCloudinary(req.file.buffer);

    const dish = await Dish.create({
      name: name.trim(),
      description: (description || "").trim(),
      price: Number(price),
      category: category.trim(),

      imageUrl: uploaded.secure_url,
      // ✅ save public_id so we can delete later
      imagePublicId: uploaded.public_id,

      tags: (tags || "")
        .split(",")
        .map(t => t.trim())
        .filter(Boolean),

      rating: rating ? Number(rating) : 4.5,
      prepTime: prepTime || "25-35 min",
      isBestseller: String(isBestseller) === "true"
    });

    res.status(201).json({ ...dish.toObject(), id: String(dish._id) });
  } catch (err) {
    console.error("❌ create dish:", err);
    res.status(500).json({ message: "Failed to create dish" });
  }
});

// ✅ DELETE /api/dishes/:id (admin only)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const dish = await Dish.findById(id);
    if (!dish) return res.status(404).json({ message: "Dish not found" });

    // ✅ delete image from cloudinary (if stored)
    await deleteFromCloudinary(dish.imagePublicId);

    // ✅ delete from DB
    await Dish.findByIdAndDelete(id);

    res.json({ message: "Dish deleted", id });
  } catch (err) {
    console.error("❌ delete dish:", err);
    res.status(500).json({ message: "Failed to delete dish" });
  }
});

module.exports = router;