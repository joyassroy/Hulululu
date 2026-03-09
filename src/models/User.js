import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  image: { type: String, default: "" },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  // নতুন ফিল্ড: ব্লক করা ইউজারদের ইমেইল লিস্ট
  blockedUsers: { type: [String], default: [] } 
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model("User", userSchema);