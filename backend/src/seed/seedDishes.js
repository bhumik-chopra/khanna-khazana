require("dotenv").config();
const { connectDB } = require("../config/db");
const Dish = require("../models/Dish");

const dishes = [
  {
    name: "Butter Chicken",
    price: 320,
    image: "https://images.pexels.com/photos/1117862/pexels-photo-1117862.jpeg?auto=compress&w=900",
    rating: 4.7,
    prepTime: "30-40 min",
    category: "North Indian",
    tags: ["Creamy"],
    isBestseller: true
  },
  {
    name: "Masala Dosa",
    price: 180,
    image: "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&w=900",
    rating: 4.6,
    prepTime: "20-30 min",
    category: "South Indian",
    tags: ["Veg", "Crispy"]
  }
];

(async () => {
  try {
    await connectDB();
    await Dish.deleteMany({});
    await Dish.insertMany(dishes);
    console.log("✅ Seeded dishes");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
})();