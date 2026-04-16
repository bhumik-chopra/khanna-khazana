const express = require("express");
const multer = require("multer");

const Dish = require("../models/Dish");
const Restaurant = require("../models/Restaurant");
const { requireAdmin } = require("../middleware/auth");
const cloudinary = require("../config/cloudinary");
const {
  ensureDefaultRestaurant,
  enrichRestaurantForResponse
} = require("../services/restaurantSafety.service");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

function uploadToCloudinary(buffer, folder = "khanna-khazana") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}

async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (e) {
    console.warn("Cloudinary delete failed:", e?.message);
  }
}

router.get("/", async (req, res) => {
  try {
    const defaultRestaurant = await ensureDefaultRestaurant();
    const dishes = await Dish.find({}).populate("restaurantId").sort({ createdAt: -1 });

    res.json(
      dishes.map((dish) => {
        const restaurant = dish.restaurantId || defaultRestaurant;
        return {
          ...dish.toObject(),
          id: String(dish._id),
          restaurantId: String(restaurant?._id || defaultRestaurant._id),
          restaurant: enrichRestaurantForResponse(restaurant)
        };
      })
    );
  } catch (err) {
    console.error("dishes get:", err);
    res.status(500).json({ message: "Failed to fetch dishes" });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const categories = await Dish.distinct("category");
    res.json(["All", ...categories.filter(Boolean)]);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

router.post("/", requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      prepTime,
      tags,
      isBestseller,
      restaurantId
    } = req.body;

    if (!name || !price || !category || !req.file) {
      return res.status(400).json({ message: "name, price, category, image are required" });
    }

    const defaultRestaurant = await ensureDefaultRestaurant();
    const restaurant = restaurantId ? await Restaurant.findById(restaurantId) : defaultRestaurant;
    if (!restaurant) return res.status(400).json({ message: "Valid restaurant is required" });

    const uploaded = await uploadToCloudinary(req.file.buffer);

    const dish = await Dish.create({
      name: name.trim(),
      description: (description || "").trim(),
      price: Number(price),
      category: category.trim(),
      restaurantId: restaurant._id,
      imageUrl: uploaded.secure_url,
      imagePublicId: uploaded.public_id,
      tags: (tags || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      rating: 3,
      prepTime: prepTime || "25-35 min",
      isBestseller: String(isBestseller) === "true"
    });

    res.status(201).json({
      ...dish.toObject(),
      id: String(dish._id),
      restaurantId: String(restaurant._id),
      restaurant: enrichRestaurantForResponse(restaurant)
    });
  } catch (err) {
    console.error("create dish:", err);
    res.status(500).json({ message: "Failed to create dish" });
  }
});

router.put("/:id", requireAdmin, upload.single("image"), async (req, res) => {
  let uploaded = null;

  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      category,
      prepTime,
      tags,
      isBestseller,
      restaurantId
    } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ message: "name, price and category are required" });
    }

    const dish = await Dish.findById(id);
    if (!dish) return res.status(404).json({ message: "Dish not found" });

    const restaurant = restaurantId
      ? await Restaurant.findById(restaurantId)
      : await ensureDefaultRestaurant();

    if (!restaurant) return res.status(400).json({ message: "Valid restaurant is required" });

    const previousImagePublicId = dish.imagePublicId;

    if (req.file) {
      uploaded = await uploadToCloudinary(req.file.buffer);
      dish.imageUrl = uploaded.secure_url;
      dish.imagePublicId = uploaded.public_id;
    }

    dish.name = name.trim();
    dish.description = (description || "").trim();
    dish.price = Number(price);
    dish.category = category.trim();
    dish.restaurantId = restaurant._id;
    dish.tags = (tags || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    dish.prepTime = prepTime || "25-35 min";
    dish.isBestseller = String(isBestseller) === "true";

    await dish.save();

    if (req.file && previousImagePublicId && previousImagePublicId !== dish.imagePublicId) {
      await deleteFromCloudinary(previousImagePublicId);
    }

    res.json({
      ...dish.toObject(),
      id: String(dish._id),
      restaurantId: String(restaurant._id),
      restaurant: enrichRestaurantForResponse(restaurant)
    });
  } catch (err) {
    if (uploaded?.public_id) {
      await deleteFromCloudinary(uploaded.public_id);
    }

    console.error("update dish:", err);
    res.status(500).json({ message: "Failed to update dish" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const dish = await Dish.findById(id);
    if (!dish) return res.status(404).json({ message: "Dish not found" });

    await deleteFromCloudinary(dish.imagePublicId);
    await Dish.findByIdAndDelete(id);

    res.json({ message: "Dish deleted", id });
  } catch (err) {
    console.error("delete dish:", err);
    res.status(500).json({ message: "Failed to delete dish" });
  }
});

module.exports = router;
