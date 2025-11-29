const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    // customer vs admin ayrımı
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
  },
  { timestamps: true }
);

// şifre kontrolü
userSchema.methods.checkPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

// hash helper
userSchema.statics.hashPassword = async function (password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

// isAdmin bilgisi için küçük bir helper (opsiyonel ama kullanışlı)
userSchema.methods.isAdmin = function () {
  return this.role === "admin";
};

module.exports = mongoose.model("User", userSchema);
