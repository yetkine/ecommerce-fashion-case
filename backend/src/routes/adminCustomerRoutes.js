// backend/src/routes/adminCustomerRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Order = require("../models/Order");

const router = express.Router();

// Sıkı auth (admin için)
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

// GET /api/admin/customers
// -> Admin: tüm müşterileri listele + arama + basic istatistik
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Admin only" });
    }

    const { search } = req.query;

    const filter = {
      // Admin kullanıcıları listelemek istemiyorsan:
      // isAdmin: { $ne: true },
    };

    if (search && String(search).trim() !== "") {
      const regex = new RegExp(String(search).trim(), "i");
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const userIds = users.map((u) => u._id);

    const orderAgg = await Order.aggregate([
      {
        $match: {
          userId: { $in: userIds },
        },
      },
      {
        $group: {
          _id: "$userId",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$total" },
        },
      },
    ]);

    const statsMap = new Map();
    for (const row of orderAgg) {
      statsMap.set(String(row._id), {
        orderCount: row.orderCount,
        totalSpent: row.totalSpent,
      });
    }

    const customers = users.map((u) => {
      const stats = statsMap.get(String(u._id)) || {
        orderCount: 0,
        totalSpent: 0,
      };
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        isAdmin: !!u.isAdmin,
        createdAt: u.createdAt,
        orderCount: stats.orderCount,
        totalSpent: stats.totalSpent,
      };
    });

    res.json({ customers });
  } catch (err) {
    console.error("GET /api/admin/customers error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/admin/customers/:id
// -> Admin: tek müşteri detayı + sipariş geçmişi
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Admin only" });
    }

    const userId = req.params.id;

    const customer = await User.findById(userId).lean();
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        isAdmin: !!customer.isAdmin,
        createdAt: customer.createdAt,
      },
      orders,
    });
  } catch (err) {
    console.error("GET /api/admin/customers/:id error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
