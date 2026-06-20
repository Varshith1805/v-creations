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
    const offer = product.offers.find(o => o.quantity === quantity);
    if (offer) {
      totalPrice = offer.price;
      discountMessage = `🎉 Special Offer! Buy ${offer.quantity} ${product.name}s for ₹${offer.price}`;
    }
  }

  res.json({ totalPrice, discountMessage });
});

module.exports = router;
