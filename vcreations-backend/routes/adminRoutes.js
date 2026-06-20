const express = require("express");
const router = express.Router();
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

module.exports = router;
