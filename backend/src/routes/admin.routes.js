const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.json({ token });
  }

  return res.status(401).json({ message: "Invalid credentials" });
});

module.exports = router;