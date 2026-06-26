const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });
otpSchema.index({ email: 1 });

module.exports = mongoose.model("Otp", otpSchema);
