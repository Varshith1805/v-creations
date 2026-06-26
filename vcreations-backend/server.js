const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const app = express();

app.use(cors());
app.use(express.json());

// Healthcheck endpoint — responds immediately even before DB is ready
app.get("/health", (req, res) => {
  console.log("Health check pinged");
  res.status(200).json({ status: "ok" });
});

async function connectDB() {
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("MongoDB connected:", process.env.MONGO_URI);
    } else {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log("MongoDB connected (in-memory)");
    }
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    console.log("Server will continue without database - API routes will return errors");
  }
}

const productRoutes = require("./routes/productRoutes");
const adminRoutes = require("./routes/adminRoutes");
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");

app.use("/products", productRoutes);
app.use("/admin", adminRoutes);
app.use("/orders", orderRoutes);
app.use("/auth", authRoutes);

const frontendBuild = path.join(__dirname, "..", "vcreations-frontend", "build");
app.use(express.static(frontendBuild));
app.use((req, res) => {
  res.sendFile(path.join(frontendBuild, "index.html"));
});

process.on("uncaughtException", err => console.error("UNCAUGHT:", err));
process.on("unhandledRejection", err => console.error("UNHANDLED:", err));

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    connectDB();
  });
} else {
  connectDB();
}

module.exports = app;
