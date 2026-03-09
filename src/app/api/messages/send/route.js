import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Message } from "@/models/Message";
import { pusherServer } from "@/lib/pusher";

export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();

    // ==========================================
    // 🛡️ সিকিউরিটি লেয়ার ১: মেসেজ সাইজ লিমিট
    // ==========================================
    // কেউ যেন বিশাল বড় প্যারাগ্রাফ পাঠিয়ে ডাটাবেস ফুল না করতে পারে
    if (data.text && data.text.length > 1000) {
      return NextResponse.json({ error: "মেসেজ অনেক বড়! সর্বোচ্চ ১০০০ অক্ষর পাঠানো যাবে।" }, { status: 400 });
    }

    // ==========================================
    // 🛡️ সিকিউরিটি লেয়ার ২: রেট লিমিটিং (স্প্যাম ফিল্টার)
    // ==========================================
    // ইউজারের পাঠানো সর্বশেষ মেসেজটা ডাটাবেস থেকে খুঁজছি
    const lastMessage = await Message.findOne({ senderEmail: data.senderEmail }).sort({ createdAt: -1 });
    
    if (lastMessage) {
      const lastMessageTime = new Date(lastMessage.createdAt).getTime();
      const currentTime = Date.now();
      const timeDifference = currentTime - lastMessageTime;

      // যদি সে ২ সেকেন্ডের মধ্যে আবার মেসেজ পাঠানোর চেষ্টা করে, তবে ব্লক করে দাও (429 Too Many Requests)
      if (timeDifference < 2000) { 
        return NextResponse.json({ error: "খুব দ্রুত মেসেজ পাঠাচ্ছেন! একটু অপেক্ষা করুন।" }, { status: 429 });
      }
    }

    // ==========================================
    // অরিজিনাল মেসেজ সেন্ডিং লজিক
    // ==========================================
    const newMessage = await Message.create({
      chatId: data.chatId,
      senderEmail: data.senderEmail,
      senderName: data.senderName,
      receiverEmail: data.receiverEmail,
      text: data.text,
      image: data.image,
      time: data.time,
      isRead: false
    });

    await pusherServer.trigger(data.chatId, "new-message", newMessage);

    if (data.receiverEmail) {
      await pusherServer.trigger(`user-${data.receiverEmail}`, "update-sidebar", {
        senderEmail: data.senderEmail,
        senderName: data.senderName,
        text: data.text 
      });
    }

    return NextResponse.json(newMessage);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}