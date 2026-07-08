const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const crypto = require("crypto");
const User = require("../models/User");
const Order = require("../models/Order");

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return salt + ":" + hash;
}

function verifyPassword(password, stored) {
  const [salt, key] = stored.split(":");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return key === hash;
}

router.post("/signup", async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: "Please wait, server is starting..." });
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "All fields are required" });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already registered" });

    const hashedPassword = hashPassword(password);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "Account created successfully", email: user.email, name: user.name });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/login", async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: "Please wait, server is starting..." });
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  try {
    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(400).json({ error: "Invalid email or password" });

    const match = verifyPassword(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid email or password" });

    res.json({ message: "Login successful", email: user.email, name: user.name || "" });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/orders/:email", async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ error: "Please wait, server is starting..." });
  try {
    const orders = await Order.find({ email: req.params.email }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.json([]);
  }
});

module.exports = router;
