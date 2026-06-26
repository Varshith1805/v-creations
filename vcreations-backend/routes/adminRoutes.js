const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
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

// Download Excel (generated live from DB)
router.get("/download-excel", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    if (!orders.length) return res.status(404).json({ error: "No orders yet" });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Orders");
    worksheet.columns = [
      { header: "Order ID", key: "_id", width: 28 },
      { header: "Date", key: "date", width: 20 },
      { header: "Customer Name", key: "customerName", width: 20 },
      { header: "Email", key: "email", width: 28 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Address", key: "address", width: 30 },
      { header: "Pincode", key: "pincode", width: 10 },
      { header: "Items", key: "items", width: 45 },
      { header: "Total Amount", key: "totalAmount", width: 14 },
      { header: "Status", key: "status", width: 12 },
    ];
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2874F0" } };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };

    orders.forEach(o => {
      const itemsStr = o.products.map(p => `${p.name} x${p.quantity} (₹${p.price})`).join(", ");
      worksheet.addRow({
        _id: o._id.toString(),
        date: new Date(o.createdAt).toLocaleString("en-IN"),
        customerName: o.customerName,
        email: o.email,
        phone: o.phone || "",
        address: o.address || "",
        pincode: o.pincode || "",
        items: itemsStr,
        totalAmount: `₹${o.totalAmount}`,
        status: o.status
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=orders.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
