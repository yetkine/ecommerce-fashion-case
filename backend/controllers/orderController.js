// backend/controllers/orderController.js
const Order = require("../models/Order");

// SİPARİŞ OLUŞTURMA (checkout'ta kullandığımız)
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null; // login olduysa userId, değilse null

    const {
      items,
      subtotal,
      tax,
      shipping,
      total,
      shippingName,
      shippingAddress,
      shippingCity,
      shippingZip,
      paymentName,
      cardNumber,
    } = req.body;

    // basit bir sipariş kodu
    const orderCode = "ORD-" + Date.now().toString().slice(-6);

    const order = await Order.create({
      userId,
      orderCode,
      items,
      subtotal,
      tax,
      shipping,
      total,
      shippingName,
      shippingAddress,
      shippingCity,
      shippingZip,
      paymentName,
      cardNumber,
    });

    res.status(201).json({
      message: "Order created",
      orderId: order._id,
      orderCode: order.orderCode,
    });
  } catch (err) {
    console.error("createOrder error", err);
    res.status(500).json({ message: "Server error" });
  }
};

// KULLANICININ KENDİ SİPARİŞLERİ
exports.getMyOrders = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Login required" });
    }

    const userId = req.user._id;

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ data: orders });
  } catch (err) {
    console.error("getMyOrders error", err);
    res.status(500).json({ message: "Server error" });
  }
};
