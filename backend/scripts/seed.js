// scripts/seed.js
require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../src/models/Category");
const Product = require("../src/models/Product");
const { categorySeed, productSeed } = require("./seedData");

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected for seeding");

    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log("Cleared Category & Product collections");

    const slugToId = {};

    // parentSlug'i olmayanlar (Men, Women)
    for (const cat of categorySeed.filter((c) => !c.parentSlug)) {
      const doc = await Category.create({
        name: cat.name,
        slug: cat.slug,
        parentId: null,
      });
      slugToId[cat.slug] = doc._id;
    }

    // alt kategoriler
    for (const cat of categorySeed.filter((c) => c.parentSlug)) {
      const parentId = slugToId[cat.parentSlug];
      const doc = await Category.create({
        name: cat.name,
        slug: cat.slug,
        parentId,
      });
      slugToId[cat.slug] = doc._id;
    }

    console.log("Inserted categories:", Object.keys(slugToId).length);

    // ürünler
    let productCount = 0;
    for (const p of productSeed) {
      const categoryId = slugToId[p.categorySlug];
      if (!categoryId) continue;

      await Product.create({
        name: p.name,
        description: p.description,
        price: p.price,
        categoryId,
        gender: p.gender,
        sizes: p.sizes,
        colors: p.colors,
        images: p.images,
        ratingAvg: p.ratingAvg,
        ratingCount: p.ratingCount,
        stock: p.stock,
      });

      productCount++;
    }

    console.log("Inserted products:", productCount);
    console.log("Seeding finished ✅");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

run();
