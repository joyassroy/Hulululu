import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  image: { type: String, default: "" },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  blockedUsers: { type: [String], default: [] },
  // 🔴 নতুন সিকিউরিটি ফিল্ড
  isSuspended: { type: Boolean, default: false } ,
  ipAddresses: { type: [String], default: [] }, // Array, karon ekjon user phone/pc theke dhukte pare
deviceInfo: { type: [String], default: [] },
lastLocation: { type: String, default: "Unknown Location" },
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model("User", userSchema);