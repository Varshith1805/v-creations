const express = require("express");
const router = express.Router();
const path = require("path");
const Product = require("../models/Product");
const Order = require("../models/Order");

// View all products
router.get("/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// View all orders
router.get("/orders", async (req, res) => {
  const orders = await Order.find();
  res.json(orders);
});

// Track sales
router.get("/sales", async (req, res) => {
  const orders = await Order.find();
  const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  res.json({ totalSales });
});

// Download Excel
router.get("/download-excel", (req, res) => {
  const filePath = path.join(__dirname, "..", "..", "orders.xlsx");
  res.download(filePath, "orders.xlsx", err => {
    if (err) res.status(404).json({ error: "No orders yet" });
  });
});

module.exports = router;
