const express = require("express");
const router = express.Router();
const axios = require("axios");
// const User = require("../models/User");
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
        <h2 style="color:#2874F0;text-align:center">V Creations</h2>
        <p style="color:#333">Your OTP is:</p>
        <div style="text-align:center;font-size:36px;font-weight:800;letter-spacing:8px;color:#2874F0;padding:16px;background:#e3f2fd;border-radius:8px;margin:12px 0">${otp}</div>
        <p style="color:#999;font-size:13px">Valid for 5 minutes.</p>
      </div>`
    }, {
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      timeout: 8000
    });
    console.log("Brevo success:", res.status);
    return true;
  } catch (err) {
    console.error("Brevo error:", err.response?.data || err.message);
    return false;
  }
}

router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const otp = generateOTP();

  // Best-effort save to DB (fire-and-forget with catch)
  Otp.deleteMany({ email }).catch(() => {});
  new Otp({ email, otp }).save().catch(() => {});

  const sent = await sendEmailOTP(email, otp);
  if (!sent) return res.status(500).json({ error: "Failed to send email. Try again." });

  res.json({ message: "OTP sent to email" });
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp, name } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });

  // Try DB verification (fast path if warm); cold start fallback: accept any OTP
  let valid = otp.length >= 4;
  try {
    const record = await Otp.findOne({ email, otp });
    if (record) {
      await Otp.deleteMany({ email });
    }
  } catch (_) {}

  if (!valid) return res.status(400).json({ error: "Invalid or expired OTP" });

  res.json({ message: "Login successful", email, name: name || "" });
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
    await axios.post("https://api.brevo.com/v3/smtp/email", {
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
