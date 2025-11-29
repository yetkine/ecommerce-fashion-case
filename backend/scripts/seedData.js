const categorySeed = [
  { name: "Men T-Shirts", slug: "men-tshirts", gender: "men" },
  { name: "Men Pants", slug: "men-pants", gender: "men" },
  { name: "Men Jackets", slug: "men-jackets", gender: "men" },
  { name: "Men Shoes", slug: "men-shoes", gender: "men" },
  { name: "Men Accessories", slug: "men-accessories", gender: "men" },

  { name: "Women T-Shirts", slug: "women-tshirts", gender: "women" },
  { name: "Women Pants", slug: "women-pants", gender: "women" },
  { name: "Women Jackets", slug: "women-jackets", gender: "women" },
  { name: "Women Shoes", slug: "women-shoes", gender: "women" },
  { name: "Women Accessories", slug: "women-accessories", gender: "women" },
];

const productSeed = [
  // MEN T-SHIRTS
  {
    name: "Basic Slim Fit T-Shirt",
    description: "Soft cotton slim fit black t-shirt for everyday wear.",
    price: 399.9,
    categorySlug: "men-tshirts",
    gender: "men",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Yellow", "DarkBlue"],
    images: [
      "/images/Basic Slim Fit T-Shirt Yellow Men.png",
      "/images/Basic Slim Fit T-Shirt DarkBlue Men.png",
    ],
    ratingAvg: 4.6,
    ratingCount: 124,
    stock: 120,
  },
  {
    name: "Oversize Graphic T-Shirt",
    description: "Oversize white t-shirt with minimal front print.",
    price: 449.9,
    categorySlug: "men-tshirts",
    gender: "men",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Yellow", "DarkBlue"],
    images: [
      "/images/Oversize Graphic T-Shirt Yellow Men.png",
      "/images/Oversize Graphic T-Shirt DarkBlue Men.png",
    ],
    ratingAvg: 4.3,
    ratingCount: 78,
    stock: 80,
  },

  // MEN PANTS
  {
    name: "Slim Fit Jeans",
    description: "Slim fit stretch denim jeans in dark blue wash.",
    price: 799.9,
    categorySlug: "men-pants",
    gender: "men",
    sizes: ["30", "31", "32", "33", "34"],
    colors: ["Yellow", "DarkBlue"],
    images: [
      "/images/Slim Fit Jeans Yellow Men.png",
      "/images/Slim Fit Jeans DarkBlue Men.png",
    ],
    ratingAvg: 4.7,
    ratingCount: 210,
    stock: 60,
  },
  {
    name: "Chino Pants",
    description: "Comfortable chino pants in beige for smart casual looks.",
    price: 749.9,
    categorySlug: "men-pants",
    gender: "men",
    sizes: ["30", "31", "32", "33", "34"],
    colors: ["Yellow"],
    images: [
      "/images/Chino Pants Yellow Men.png",
    ],
    ratingAvg: 4.4,
    ratingCount: 95,
    stock: 45,
  },

  // MEN JACKETS
  {
    name: "Denim Jacket",
    description: "Classic denim jacket with metal buttons and side pockets.",
    price: 1199.9,
    categorySlug: "men-jackets",
    gender: "men",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Yellow", "DarkBlue"],
    images: [
      "/images/Denim Jacket Yellow Men.webp",
      "/images/Denim Jacket DarkBlue Men.webp",
    ],
    ratingAvg: 4.5,
    ratingCount: 64,
    stock: 30,
  },

  // MEN SHOES
  {
    name: "Chunky Sneakers",
    description: "Lightweight chunky sneakers with cushioned sole.",
    price: 1299.9,
    categorySlug: "men-shoes",
    gender: "men",
    sizes: ["40", "41", "42", "43", "44"],
    colors: ["Yellow", "DarkBlue"],
    images: [
      "/images/Chunky Sneakers Yellow Men.webp",
      "/images/Chunky Sneakers DarkBlue Men.webp",
    ],
    ratingAvg: 4.8,
    ratingCount: 188,
    stock: 55,
  },

  // MEN ACCESSORIES
  {
    name: "Leather Belt",
    description: "Genuine leather belt with metal buckle.",
    price: 349.9,
    categorySlug: "men-accessories",
    gender: "men",
    sizes: ["M", "L"],
    colors: ["Yellow", "DarkBlue"],
    images: [
      "/images/Leather Belt Yellow Men.webp",
      "/images/Leather Belt DarkBlue Men.webp",
    ],
    ratingAvg: 4.2,
    ratingCount: 42,
    stock: 70,
  },

  // WOMEN T-SHIRTS
  {
    name: "Crop Top T-Shirt",
    description: "Soft cotton crop top t-shirt in lilac color.",
    price: 379.9,
    categorySlug: "women-tshirts",
    gender: "women",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Yellow", "DarkBlue"],
    images: [
      "/images/Crop Top T-Shirt Yellow Women.webp",
      "/images/Crop Top T-Shirt DarkBlue Women.webp",
    ],
    ratingAvg: 4.5,
    ratingCount: 132,
    stock: 90,
  },

  // WOMEN PANTS
  {
    name: "High Waist Mom Jeans",
    description: "High waist mom fit jeans in light blue wash.",
    price: 829.9,
    categorySlug: "women-pants",
    gender: "women",
    sizes: ["34", "36", "38", "40"],
    colors: ["Yellow", "DarkBlue"],
    images: [
      "/images/High Waist Mom Jeans Yellow Women.webp",
      "/images/High Waist Mom Jeans DarkBlue Women.webp",
    ],
    ratingAvg: 4.7,
    ratingCount: 175,
    stock: 50,
  },

  // WOMEN JACKETS
  {
    name: "Oversize Blazer",
    description: "Oversize blazer jacket with single button fastening.",
    price: 1399.9,
    categorySlug: "women-jackets",
    gender: "women",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Yellow", "DarkBlue"],
    images: [
      "/images/Oversize Blazer Yellow Women.webp",
      "/images/Oversize Blazer DarkBlue Women.webp",
    ],
    ratingAvg: 4.6,
    ratingCount: 98,
    stock: 28,
  },

  // WOMEN SHOES
  {
    name: "Block Heel Sandals",
    description: "Comfortable block heel sandals for daily & night looks.",
    price: 999.9,
    categorySlug: "women-shoes",
    gender: "women",
    sizes: ["36", "37", "38", "39", "40"],
    colors: ["Yellow", "DarkBlue"],
    images: [
      "/images/Block Heel Sandals Yellow Women.webp",
      "/images/Block Heel Sandals DarkBlue Women.webp",
    ],
    ratingAvg: 4.4,
    ratingCount: 73,
    stock: 40,
  },

  // WOMEN ACCESSORIES
  {
    name: "Minimal Hoop Earrings",
    description: "Minimal hoop earrings set.",
    price: 249.9,
    categorySlug: "women-accessories",
    gender: "women",
    sizes: [],
    colors: ["Yellow", "DarkBlue"],
    images: [
      "/images/Minimal Hoop Earrings Yellow Women.webp",
      "/images/Minimal Hoop Earrings DarkBlue Women.webp",
    ],
    ratingAvg: 4.3,
    ratingCount: 56,
    stock: 120,
  },
];


module.exports = { categorySeed, productSeed };
