const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  stock: Number,
  image: String,
  category: String,
  offers: Array
});

module.exports = mongoose.model("Product", productSchema);
