// backend/models/Order.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        price: Number,
        quantity: Number,
      },
    ],

    subtotal: Number,
    tax: Number,
    shipping: Number,
    total: Number,

    shippingName: String,
    shippingAddress: String,
    shippingCity: String,
    shippingZip: String,

    paymentName: String,
    paymentLast4: String,

    status: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled"],
      default: "processing",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
