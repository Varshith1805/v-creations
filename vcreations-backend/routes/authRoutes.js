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

async function sendEmailOTP(toEmail, otp) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return false;
  console.log("Fetch available:", typeof fetch);
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sender: { name: "V Creations", email: "ravikantivarshith1@gmail.com" },
        to: [{ email: toEmail }],
        subject: "Your OTP for V Creations",
        htmlContent: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e8e8e8;border-radius:8px">
          <h2 style="color:#7B1818;text-align:center">V Creations</h2>
          <p style="color:#333">Your OTP is:</p>
          <div style="text-align:center;font-size:36px;font-weight:800;letter-spacing:8px;color:#7B1818;padding:16px;background:#fef5e7;border-radius:8px;margin:12px 0">${otp}</div>
          <p style="color:#999;font-size:13px">Valid for 5 minutes.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
          <p style="color:#999;font-size:12px;text-align:center">V Creations - Rakshabandhan Collection</p>
        </div>`
      })
    });
    if (res.ok) return true;
    const errBody = await res.text();
    console.error("Brevo error:", errBody);
    return false;
  } catch (err) {
    console.error("Brevo failed:", err.message);
    return false;
  }
}

router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const otp = generateOTP();
  otpStore.set(email, { otp, expires: Date.now() + 300000 });

  console.log("Send OTP requested for:", email);
  const sent = await sendEmailOTP(email, otp);
  console.log("Email send result:", sent);
  res.json({ message: sent ? "OTP sent to email" : "OTP generated", dev: otp });
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
