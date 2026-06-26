const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");

router.get("/:email", async (req, res) => {
  try {
    const cart = await Cart.findOne({ email: req.params.email });
    res.json(cart || { email: req.params.email, items: [], appliedOffers: {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:email", async (req, res) => {
  try {
    const { items, appliedOffers } = req.body;
    const cart = await Cart.findOneAndUpdate(
      { email: req.params.email },
      { email: req.params.email, items, appliedOffers: appliedOffers || {} },
      { upsert: true, new: true }
    );
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:email", async (req, res) => {
  try {
    await Cart.findOneAndDelete({ email: req.params.email });
    res.json({ message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
