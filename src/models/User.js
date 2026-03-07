import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  image: { type: String, default: "" },
  password: { type: String }, // ইমেইল লগইনের জন্য
}, { timestamps: true }); // timestamps অটোমেটিক অ্যাকাউন্ট খোলার সময় সেভ করে রাখবে

export const User = mongoose.models.User || mongoose.model("User", userSchema);