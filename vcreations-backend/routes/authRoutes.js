const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Order = require("../models/Order");

const otpStore = new Map();
setInterval(() => {
  for (const [email, data] of otpStore) {
    if (data.expires < Date.now()) otpStore.delete(email);
  }
}, 600000);

function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const otp = generateOTP();
  otpStore.set(email, { otp, expires: Date.now() + 300000 });

  res.json({ message: "OTP generated", dev: otp });
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });

  const data = otpStore.get(email);
  if (!data) return res.status(400).json({ error: "No OTP requested" });
  if (data.expires < Date.now()) {
    otpStore.delete(email);
    return res.status(400).json({ error: "OTP expired" });
  }
  if (data.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });

  otpStore.delete(email);
  let user = await User.findOne({ email });
  if (!user) user = await new User({ email }).save();

  res.json({ message: "Login successful", email: user.email, userId: user._id });
});

router.get("/orders/:email", async (req, res) => {
  const orders = await Order.find({ email: req.params.email }).sort({ createdAt: -1 });
  res.json(orders);
});

module.exports = router;
