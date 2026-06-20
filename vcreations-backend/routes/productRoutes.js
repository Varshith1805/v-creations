const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// Add product
router.post("/add", async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.send("Product added!");
});

// View products
router.get("/", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// Edit product
router.put("/edit/:id", async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, req.body);
  res.send("Product updated!");
});

// Delete product
router.delete("/delete/:id", async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.send("Product deleted!");
});

// Calculate price with offers
router.post("/calculate-price", async (req, res) => {
  const { productId, quantity } = req.body;
  const product = await Product.findById(productId);

  let totalPrice = product.price * quantity;
  let discountMessage = null;

  if (product.offers && product.offers.length > 0) {
    for (const offer of product.offers) {
      let qty, price;
      if (typeof offer === "string") {
        const parts = offer.split("for");
        if (parts.length === 2) { qty = parseInt(parts[0].trim()); price = parseInt(parts[1].trim()); }
      } else {
        qty = offer.quantity; price = offer.price;
      }
      if (qty === quantity) {
        totalPrice = price;
        discountMessage = `Buy ${qty} for ₹${price} only!`;
      }
    }
  }

  res.json({ totalPrice, discountMessage });
});

module.exports = router;
