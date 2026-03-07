import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // কোন ২ জন ইউজার চ্যাট করছে
  lastMessage: { type: String, default: "" }, // চ্যাট লিস্টে দেখানোর জন্য শেষ মেসেজ
  lastMessageAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);