const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  customerName: String,
  email: String,
  address: String,
  pincode: String,
  phone: String,
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    quantity: Number,
    price: Number
  }],
  totalAmount: Number,
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);
