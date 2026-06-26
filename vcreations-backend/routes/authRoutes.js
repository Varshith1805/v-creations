const express = require("express");
const router = express.Router();
const axios = require("axios");
const User = require("../models/User");
const Order = require("../models/Order");
const Otp = require("../models/Otp");

function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function sendEmailOTP(toEmail, otp) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) { console.error("Brevo: No API key"); return false; }
  try {
    const res = await axios.post("https://api.brevo.com/v3/smtp/email", {
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
    }, {
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      timeout: 8000
    });
    console.log("Brevo success:", res.status);
    return true;
  } catch (err) {
    const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    console.error("Brevo error:", detail);
    return false;
  }
}

router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const otp = generateOTP();
  const sent = await sendEmailOTP(email, otp);
  res.json({ message: sent ? "OTP sent to email" : "OTP generated", dev: otp });
});

router.post("/verify-otp", async (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  let user = await User.findOne({ email });
  if (!user) {
    user = await new User({ email, name: name || "" }).save();
  } else if (name) {
    user.name = name;
    await user.save();
  }

  res.json({ message: "Login successful", email: user.email, name: user.name || "", userId: user._id });
});

router.get("/orders/:email", async (req, res) => {
  const orders = await Order.find({ email: req.params.email }).sort({ createdAt: -1 });
  res.json(orders);
});

router.get("/check-email", async (req, res) => {
  const apiKey = process.env.BREVO_API_KEY;
  const masked = apiKey ? apiKey.slice(0, 8) + "..." + apiKey.slice(-4) : "NOT SET";
  const toEmail = req.query.to || "ravikantivarshith1@gmail.com";
  try {
    const test = await axios.post("https://api.brevo.com/v3/smtp/email", {
      sender: { name: "V Creations", email: "ravikantivarshith1@gmail.com" },
      to: [{ email: toEmail }],
      subject: "Brevo Test from V Creations",
      htmlContent: "<p>Test email from V Creations</p>"
    }, { headers: { "api-key": apiKey, "Content-Type": "application/json" } });
    res.json({ status: "OK", message: `Email sent to ${toEmail}!`, apiKey: masked });
  } catch (err) {
    res.json({ status: "FAIL", error: err.response?.data || err.message, apiKey: masked, to: toEmail });
  }
});

module.exports = router;
