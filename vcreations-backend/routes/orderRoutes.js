const express = require("express");
const router = express.Router();
const axios = require("axios");
const Order = require("../models/Order");

const ADMIN_EMAIL = "ravikantivarshith1@gmail.com";

async function sendEmailNotification(order) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) { console.log("Email notification skipped — no BREVO_API_KEY"); return; }

  const itemsList = order.products.map(p =>
    `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${p.name}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center">${p.quantity}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">₹${p.price * p.quantity}</td></tr>`
  ).join("");

  try {
    await axios.post("https://api.brevo.com/v3/smtp/email", {
      sender: { name: "V Creations", email: ADMIN_EMAIL },
      to: [{ email: ADMIN_EMAIL }],
      subject: `New Order — ${order.customerName}`,
      htmlContent: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e8e8e8;border-radius:8px">
        <h2 style="color:#2874F0;text-align:center;margin:0 0 16px">🪢 New Order Placed!</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <tr><td style="padding:4px 0;color:#666">Name</td><td style="padding:4px 0;font-weight:600">${order.customerName}</td></tr>
          <tr><td style="padding:4px 0;color:#666">Phone</td><td style="padding:4px 0;font-weight:600">${order.phone || "—"}</td></tr>
          <tr><td style="padding:4px 0;color:#666">Email</td><td style="padding:4px 0;font-weight:600">${order.email}</td></tr>
          <tr><td style="padding:4px 0;color:#666">Address</td><td style="padding:4px 0;font-weight:600">${order.address || "—"}</td></tr>
          <tr><td style="padding:4px 0;color:#666">Pincode</td><td style="padding:4px 0;font-weight:600">${order.pincode || "—"}</td></tr>
        </table>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <tr style="background:#f5f5f5"><th style="padding:8px 10px;text-align:left;font-size:13px">Item</th><th style="padding:8px 10px;text-align:center;font-size:13px">Qty</th><th style="padding:8px 10px;text-align:right;font-size:13px">Price</th></tr>
          ${itemsList}
        </table>
        <div style="text-align:right;font-size:22px;font-weight:800;color:#2874F0;padding-top:12px;border-top:2px solid #2874F0">Total: ₹${order.totalAmount}</div>
      </div>`
    }, {
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      timeout: 8000
    });
    console.log("Order notification email sent");
  } catch (err) {
    console.error("Order notification email failed:", err.response?.data || err.message);
  }
}

router.post("/", async (req, res) => {
  const { customerName, email, phone, address, pincode, items } = req.body;

  if (!customerName || !email || !phone || !address || !pincode || !items || items.length === 0) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const products = items.map(item => ({
    productId: item.productId,
    name: item.name,
    quantity: item.quantity,
    price: item.price
  }));

  const totalAmount = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

  try {
    const order = new Order({ customerName, email, phone, address, pincode, products, totalAmount });
    await order.save();

    sendEmailNotification(order);

    res.status(201).json({ message: "Order placed!", order });
  } catch (err) {
    console.error("Order save error:", err.message);
    res.status(500).json({ error: "Failed to place order. Please try again." });
  }
});

module.exports = router;
