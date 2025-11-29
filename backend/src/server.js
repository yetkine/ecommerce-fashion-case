const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");




const app = express();
app.use(cors());
app.use(express.json());


app.get("/health", (req, res) => {
  console.log("GET /health hit");
  res.json({ status: "ok", message: "API is alive" });
});

app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);



const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
