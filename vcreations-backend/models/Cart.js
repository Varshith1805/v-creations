const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: {
    _id: String,
    name: String,
    price: Number,
    image: String,
    description: String,
    category: String,
    offers: Array
  },
  quantity: { type: Number, default: 1 }
});

const cartSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  items: [cartItemSchema],
  appliedOffers: { type: Map, of: new mongoose.Schema({
    quantity: Number,
    price: Number
  }, { _id: false }), default: new Map() }
});

module.exports = mongoose.model("Cart", cartSchema);
