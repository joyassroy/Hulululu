import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  // এটি String দিতে হবে কারণ আমরা ইমেইল দিয়ে আইডি বানাচ্ছি
  chatId: { type: String, required: true }, 
  senderEmail: { type: String, required: true },
  senderName: { type: String, required: true },
  text: { type: String, default: "" },
  image: { type: String, default: "" },
  time: { type: String, required: true }
}, { timestamps: true });

export const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);