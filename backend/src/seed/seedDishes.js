require("dotenv").config();
const { connectDB } = require("../config/db");
const Dish = require("../models/Dish");

const sample = [
  {
    name: "Butter Chicken",
    description: "Creamy tomato gravy with tender chicken.",
    price: 320,
    imageUrl: "https://images.pexels.com/photos/1117862/pexels-photo-1117862.jpeg?auto=compress&w=900",
    category: "North Indian",
    tags: ["Creamy", "Rich"],
    rating: 4.7,
    prepTime: "35 min",
    isBestseller: true
  }
];

(async () => {
  await connectDB();
  await Dish.deleteMany({});
  await Dish.insertMany(sample);
  console.log("✅ dishes seeded");
  process.exit(0);
})();