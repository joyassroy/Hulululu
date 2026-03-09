import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  chatId: String,
  senderEmail: String,
  senderName: String,
  receiverEmail: String,
  text: String,
  image: String,
  time: String,
  isRead: { type: Boolean, default: false } // এই নতুন লাইনটা অ্যাড করা হলো
}, { timestamps: true });

export const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);