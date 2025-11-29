const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    gender: {
      type: String,
      enum: ["men", "women", "unisex"],
      required: true,
    },

    sizes: [{ type: String }],
    colors: [{ type: String }],
    images: [{ type: String }],

    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
