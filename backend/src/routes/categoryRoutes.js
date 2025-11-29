const express = require("express");
const jwt = require("jsonwebtoken");
const Category = require("../models/Category");

const router = express.Router();

// Basit auth + admin middleware
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
    ); // { id, email, name, role, isAdmin }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Admin only" });
    }
    next();
  });
}

// GET /api/categories  -> tüm kategoriler
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ data: categories });
  } catch (err) {
    console.error("GET /api/categories error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ADMIN: yeni kategori
// POST /api/categories/admin
router.post("/admin", adminMiddleware, async (req, res) => {
  try {
    const { name, slug, parentSlug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ message: "Name and slug are required" });
    }

    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: "Slug already in use" });
    }

    let parentCategoryId = null;
    if (parentSlug) {
      const parent = await Category.findOne({ slug: parentSlug });
      if (!parent) {
        return res.status(400).json({ message: "Invalid parentSlug" });
      }
      parentCategoryId = parent._id;
    }

    const category = await Category.create({
      name,
      slug,
      parentSlug: parentSlug || null,
      parentCategoryId,
    });

    res.status(201).json({ message: "Category created", category });
  } catch (err) {
    console.error("POST /api/categories/admin error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ADMIN: kategori güncelle
// PATCH /api/categories/admin/:id
router.patch("/admin/:id", adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };

    // parentSlug değiştiyse parentCategoryId'yi güncelle
    if (update.parentSlug) {
      const parent = await Category.findOne({ slug: update.parentSlug });
      if (!parent) {
        return res.status(400).json({ message: "Invalid parentSlug" });
      }
      update.parentCategoryId = parent._id;
    }

    const category = await Category.findByIdAndUpdate(id, update, {
      new: true,
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category updated", category });
  } catch (err) {
    console.error("PATCH /api/categories/admin/:id error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ADMIN: kategori sil
// DELETE /api/categories/admin/:id
router.delete("/admin/:id", adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category deleted" });
  } catch (err) {
    console.error("DELETE /api/categories/admin/:id error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
