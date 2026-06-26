const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const { appendOrderToExcel } = require("../utils/excelExport");

async function sendWhatsAppNotification(order, res) {
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
    const client = twilio(accountSid, authToken, { lazyLoading: false });

    const itemsList = order.products.map(p => `${p.name} x${p.quantity} — ₹${p.price * p.quantity}`).join("\n");
    const truncatedItems = itemsList.length > 600 ? itemsList.slice(0, 600) + "\n...and more" : itemsList;

    const message = await client.messages.create({
      from: `whatsapp:${from}`,
      body: `*New Order Placed!*\n\n*Name:* ${order.customerName}\n*Phone:* ${order.phone || "—"}\n*Email:* ${order.email}\n*Address:* ${order.address || "—"}\n*Pincode:* ${order.pincode || "—"}\n\n*Items:*\n${truncatedItems}\n\n*Total:* ₹${order.totalAmount}`,
      to: `whatsapp:${to}`
    });

    console.log("WhatsApp notification sent:", message.sid);
  } catch (err) {
    console.error("WhatsApp notification failed:", err.message);
    if (err.response) console.error("Twilio response:", err.response);
  }
}

router.post("/", async (req, res) => {
  const { customerName, email, phone, address, pincode, items } = req.body;

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

  try {
    const order = new Order({ customerName, email, phone, address, pincode, products, totalAmount });
    await order.save();

    appendOrderToExcel(order).catch(err => console.error("Excel error:", err.message));

    sendWhatsAppNotification(order);

    res.status(201).json({ message: "Order placed!", order });
  } catch (err) {
    console.error("Order save error:", err.message);
    res.status(500).json({ error: "Failed to place order. Please try again." });
  }
});

router.get("/check-whatsapp", (req, res) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_NUMBER;
  const to = process.env.ADMIN_WHATSAPP_NUMBER;
  res.json({
    TWILIO_ACCOUNT_SID: accountSid ? accountSid.slice(0, 6) + "..." : "NOT SET",
    TWILIO_AUTH_TOKEN: authToken ? "SET (hidden)" : "NOT SET",
    TWILIO_WHATSAPP_NUMBER: from || "NOT SET",
    ADMIN_WHATSAPP_NUMBER: to || "NOT SET"
  });
});

module.exports = router;
