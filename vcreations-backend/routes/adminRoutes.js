const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { generateCatalog, CATALOG_PATH } = require("../utils/generateCatalog");

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
  const excelPath = path.join(__dirname, "..", "..", "orders.xlsx");
  res.download(excelPath, "orders.xlsx", err => {
    if (err) res.status(404).json({ error: "No orders yet" });
  });
});

// Generate & Download Catalog PDF
router.get("/download-catalog", async (req, res) => {
  try {
    await generateCatalog();
    res.download(CATALOG_PATH, "V_Creations_Catalog.pdf", err => {
      if (err) res.status(500).json({ error: "Failed to download catalog" });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
