const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Order = require("../models/Order");

// In-memory OTP store (phone -> { otp, expires })
const otpStore = new Map();
// Cleanup expired OTPs every 10 minutes
setInterval(() => {
  for (const [phone, data] of otpStore) {
    if (data.expires < Date.now()) otpStore.delete(phone);
  }
}, 600000);

function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function sendSMS(phone, message) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return false;
  try {
    const twilio = require("twilio");
    const client = twilio(accountSid, authToken);
    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      body: message,
      to: phone
    });
    return true;
  } catch (err) {
    console.error("SMS send failed:", err.message);
    return false;
  }
}

// Send OTP
router.post("/send-otp", async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ error: "Mobile number required" });

  const otp = generateOTP();
  otpStore.set(mobile, { otp, expires: Date.now() + 300000 });

  // If Twilio SMS is configured, send via SMS
  const sent = await sendSMS(mobile, `Your V Creations OTP is: ${otp}. Valid for 5 minutes.`);

  // Always return OTP in response for development (remove in production!)
  res.json({ message: sent ? "OTP sent via SMS" : "OTP sent", otp, dev: otp });
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp) return res.status(400).json({ error: "Mobile and OTP required" });

  const data = otpStore.get(mobile);
  if (!data) return res.status(400).json({ error: "No OTP requested. Please request OTP first." });
  if (data.expires < Date.now()) {
    otpStore.delete(mobile);
    return res.status(400).json({ error: "OTP expired. Please request again." });
  }
  if (data.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });

  otpStore.delete(mobile);
  let user = await User.findOne({ mobile });
  if (!user) user = await new User({ mobile }).save();

  res.json({ message: "Login successful", mobile: user.mobile, userId: user._id });
});

// Get user's past orders
router.get("/orders/:mobile", async (req, res) => {
  const orders = await Order.find({ "phone": req.params.mobile }).sort({ createdAt: -1 });
  res.json(orders);
});

module.exports = router;
