const express = require("express");
const jwt = require("jsonwebtoken");
const Order = require("../models/Order");

const router = express.Router();

// JWT'den kullanıcı okumak için helper
function tryGetUserFromHeader(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev_secret"
    );
    // payload: { id, email, name, role, isAdmin }
    return payload;
  } catch (err) {
    return null;
  }
}

// Sıkı auth (profil / siparişlerim / iptal / admin için)
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev_secret"
    );
    // { id, email, name, role, isAdmin }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Sipariş kodu üretici
function generateOrderCode() {
  const now = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${now}-${rand}`;
}

// POST /api/orders
// login zorunlu değil; varsa userId kaydediyoruz
router.post("/", async (req, res) => {
  try {
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

    if (
      !items ||
      !items.length ||
      subtotal == null ||
      tax == null ||
      shipping == null ||
      total == null
    ) {
      return res.status(400).json({ message: "Invalid order data" });
    }

    const userPayload = tryGetUserFromHeader(req);
    const userId = userPayload ? userPayload.id : null;

    const last4 = cardNumber ? cardNumber.slice(-4) : "0000";
    const orderCode = generateOrderCode();

    const order = await Order.create({
      orderCode,
      userId,
      items: items.map((it) => ({
        productId: it.productId,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
      })),
      subtotal,
      tax,
      shipping,
      total,
      shippingName,
      shippingAddress,
      shippingCity,
      shippingZip,
      paymentName,
      paymentLast4: last4,
      status: "created",
    });

    res.status(201).json({
      message: "Order created",
      orderCode: order.orderCode,
      orderId: order._id,
      status: order.status,
    });
  } catch (err) {
    console.error("POST /api/orders error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/orders/my  -> kullanıcının kendi siparişleri
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ orders });
  } catch (err) {
    console.error("GET /api/orders/my error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/orders  -> ADMIN: tüm kullanıcıların siparişleri
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Admin only" });
    }

    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    res.json({ orders });
  } catch (err) {
    console.error("GET /api/orders (admin) error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PATCH /api/orders/:id/cancel
// -> sahibi iptal edebilir
// -> admin HERKESİN siparişini iptal edebilir
router.patch("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isOwner =
      order.userId && order.userId.toString() === req.user.id;

    // ne sahibi, ne admin
    if (!isOwner && !req.user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Not allowed to cancel this order" });
    }

    if (!["created", "processing"].includes(order.status)) {
      return res
        .status(400)
        .json({ message: "This order cannot be cancelled" });
    }

    order.status = "cancelled";
    await order.save();

    res.json({
      message: "Order cancelled",
      order,
    });
  } catch (err) {
    console.error("PATCH /api/orders/:id/cancel error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
