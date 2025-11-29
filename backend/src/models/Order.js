const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: false,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: true, unique: true },

    // 🔹 Hangi kullanıcıya ait sipariş
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // guest checkout mümkün kalsın
    },

    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    shipping: { type: Number, required: true },
    total: { type: Number, required: true },

    shippingName: String,
    shippingAddress: String,
    shippingCity: String,
    shippingZip: String,

    paymentName: String,
    paymentLast4: String,

    status: {
      type: String,
      enum: ["created", "processing", "shipped", "cancelled"],
      default: "created",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
