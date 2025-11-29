const express = require("express");
const jwt = require("jsonwebtoken");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Review = require("../models/Review");

const router = express.Router();

// JWT'den user çekmek için
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

// GET /api/products
// query: gender, categorySlug, minPrice, maxPrice, minRating, q, sort, page, limit
router.get("/", async (req, res) => {
  try {
    const {
      gender,
      categorySlug,
      minPrice,
      maxPrice,
      minRating,
      q,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {};

    // Müşteri tarafında sadece stokta olan ve aktif ürünleri göster
    filter.stock = { $gt: 0 };
    filter.isActive = { $ne: false };

    if (gender) {
      filter.gender = gender; // "men" | "women" | "unisex"
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (minRating) {
      filter.ratingAvg = { $gte: Number(minRating) };
    }

    // kategori slug üzerinden filtre
    if (categorySlug) {
      const cat = await Category.findOne({ slug: categorySlug });
      if (cat) {
        filter.categoryId = cat._id;
      } else {
        return res.json({
          data: [],
          page: Number(page),
          total: 0,
          pageSize: Number(limit),
        });
      }
    }

    // text search (ad + açıklama)
    let searchCondition = {};
    if (q && q.trim().length > 0) {
      const regex = new RegExp(q.trim(), "i");
      searchCondition = {
        $or: [{ name: regex }, { description: regex }],
      };
    }

    // sıralama
    let sortOption = {};

    console.log("sort query:", sort); // terminalde ne geliyor göreceğiz

    switch (sort) {
      case "price_asc":
        sortOption = { price: 1 };
        break;
      case "price_desc":
        sortOption = { price: -1 };
        break;
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      case "popularity":
      case "rating_desc":
        sortOption = { ratingAvg: -1 };
        break;
      default:
        // default: popülerliğe göre
        sortOption = { ratingAvg: -1 };
    }

    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 12;

    const baseQuery = Product.find({
      ...filter,
      ...searchCondition,
    });

    const total = await baseQuery.clone().countDocuments();

    const products = await baseQuery
      .sort(sortOption)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .populate("categoryId", "name slug");

    res.json({
      data: products,
      page: pageNumber,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error("GET /api/products error:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/products/:id  -> ürün detayı
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate(
      "categoryId",
      "name slug"
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const reviews = await Review.find({ productId: id })
      .sort({ createdAt: -1 }) // son yorumlar üstte
      .lean();

    res.json({ data: product, reviews });
  } catch (err) {
    console.error("GET /api/products/:id error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/products/:id/reviews  -> yeni yorum & rating ekle
router.post("/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;
    const { userName, rating, comment } = req.body;

    if (!userName || !rating || !comment) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const review = await Review.create({
      productId: id,
      userName,
      rating: numericRating,
      comment,
    });

    // ratingAvg ve ratingCount güncelle
    const oldCount = product.ratingCount || 0;
    const oldAvg = product.ratingAvg || 0;

    const newCount = oldCount + 1;
    const newAvg = (oldAvg * oldCount + numericRating) / newCount;

    product.ratingCount = newCount;
    product.ratingAvg = newAvg;
    await product.save();

    res.status(201).json({
      review,
      product: {
        ratingAvg: product.ratingAvg,
        ratingCount: product.ratingCount,
      },
    });
  } catch (err) {
    console.error("POST /api/products/:id/reviews error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ====================== ADMIN PRODUCT MANAGEMENT ======================

// POST /api/products/admin  -> yeni ürün ekle
router.post("/admin", adminMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      gender,
      categorySlug,
      sizes,
      colors,
      images,
      stock,
      isActive,
    } = req.body;

    if (!name || !price || !gender || !categorySlug) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // categorySlug'tan categoryId bul
    const category = await Category.findOne({ slug: categorySlug });
    if (!category) {
      return res.status(400).json({ message: "Invalid categorySlug" });
    }

    const product = await Product.create({
      name,
      description: description || "",
      price,
      gender,
      categoryId: category._id,
      sizes: sizes || [],
      colors: colors || [],
      images: images || [],
      stock: stock ?? 0,
      isActive: isActive ?? true,
    });

    res.status(201).json({ message: "Product created", product });
  } catch (err) {
    console.error("POST /api/products/admin error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PATCH /api/products/admin/:id  -> ürünü güncelle
router.patch("/admin/:id", adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };

    // categorySlug güncelleniyorsa onu categoryId'ye çevir
    if (update.categorySlug) {
      const category = await Category.findOne({ slug: update.categorySlug });
      if (!category) {
        return res.status(400).json({ message: "Invalid categorySlug" });
      }
      update.categoryId = category._id;
      delete update.categorySlug;
    }

    const product = await Product.findByIdAndUpdate(id, update, {
      new: true,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product updated", product });
  } catch (err) {
    console.error("PATCH /api/products/admin/:id error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /api/products/admin/:id  -> soft delete (isActive = false)
router.delete("/admin/:id", adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deactivated", product });
  } catch (err) {
    console.error("DELETE /api/products/admin/:id error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /api/products/admin/bulk-status
// body: { ids: string[], isActive: boolean }
router.post("/admin/bulk-status", adminMiddleware, async (req, res) => {
  try {
    const { ids, isActive } = req.body;

    if (!Array.isArray(ids) || typeof isActive !== "boolean") {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const result = await Product.updateMany(
      { _id: { $in: ids } },
      { $set: { isActive } }
    );

    res.json({
      message: "Bulk status updated",
      matchedCount: result.matchedCount ?? result.n,
      modifiedCount: result.modifiedCount ?? result.nModified,
    });
  } catch (err) {
    console.error(
      "POST /api/products/admin/bulk-status error:",
      err
    );
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/products/admin/all  -> ADMIN: tüm ürünleri listele (aktif/pasif, stoklu/stoksuz)
router.get("/admin/all", adminMiddleware, async (req, res) => {
  try {
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .populate("categoryId", "name slug");

    res.json({ data: products });
  } catch (err) {
    console.error("GET /api/products/admin/all error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


module.exports = router;
