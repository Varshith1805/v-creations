const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

async function sendWhatsAppNotification(order) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_NUMBER;
  const to = process.env.ADMIN_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !from || !to) {
    console.log("WhatsApp notification skipped — set TWILIO_* env vars");
    return;
  }

  try {
    const twilio = require("twilio");
    const client = twilio(accountSid, authToken);

    const itemsList = order.products.map(p => `${p.name} x${p.quantity} — ₹${p.price * p.quantity}`).join("\n");

    const message = await client.messages.create({
      from: `whatsapp:${from}`,
      body: `🪢 *New Order Placed!*\n\n*Name:* ${order.customerName}\n*Phone:* ${order.phone || "—"}\n*Email:* ${order.email}\n*Address:* ${order.address || "—"}\n\n*Items:*\n${itemsList}\n\n*Total:* ₹${order.totalAmount}\n*Status:* ${order.status}`,
      to: `whatsapp:${to}`
    });

    console.log("WhatsApp notification sent:", message.sid);
  } catch (err) {
    console.error("WhatsApp notification failed:", err.message);
  }
}

router.post("/", async (req, res) => {
  const { customerName, email, phone, address, items } = req.body;

  if (!customerName || !email || !items || items.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const products = items.map(item => ({
    productId: item.productId,
    name: item.name,
    quantity: item.quantity,
    price: item.price
  }));

  const totalAmount = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

  const order = new Order({ customerName, email, phone, address, products, totalAmount });
  await order.save();

  sendWhatsAppNotification(order);

  res.status(201).json({ message: "Order placed!", order });
});

module.exports = router;
