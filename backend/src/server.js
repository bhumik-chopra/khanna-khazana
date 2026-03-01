require("dotenv").config();
const app = require("./app");
const { connectDB } = require("./config/db");

async function start() {
  try {
    console.log("➡️ Starting server...");
    console.log("MONGODB_URI:", process.env.MONGODB_URI ? "FOUND" : "MISSING");

    await connectDB();

    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`✅ Backend running on http://localhost:${port}`));
  } catch (err) {
    console.error("❌ Startup error:", err);
    process.exit(1);
  }
}

start();