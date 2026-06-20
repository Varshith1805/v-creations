const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const app = express();

app.use(cors());
app.use(express.json());

async function connectDB() {
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
}

connectDB().catch(err => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});

const productRoutes = require("./routes/productRoutes");
const adminRoutes = require("./routes/adminRoutes");
const orderRoutes = require("./routes/orderRoutes");

app.use("/products", productRoutes);
app.use("/admin", adminRoutes);
app.use("/orders", orderRoutes);

// Serve frontend build in production
const frontendBuild = path.join(__dirname, "..", "vcreations-frontend", "build");
app.use(express.static(frontendBuild));
app.use((req, res) => {
  res.sendFile(path.join(frontendBuild, "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
