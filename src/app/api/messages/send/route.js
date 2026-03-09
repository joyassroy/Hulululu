import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Message } from "@/models/Message";
import { User } from "@/models/User";
import { pusherServer } from "@/lib/pusher";
import { getServerSession } from "next-auth"; // 🔴 সব হ্যাকারের যম!

export async function POST(req) {
  try {
    // ==========================================
    // 🛡️ লেভেল ১: সেশন ভেরিফিকেশন (The Ultimate Block)
    // ==========================================
    // চেক করা হচ্ছে রিকোয়েস্টটা আসলেই কোনো লগইন করা ইউজারের ব্রাউজার থেকে আসছে কি না
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized! হ্যাকিংয়ের চেষ্টা করবেন না! 🚫" }, { status: 401 });
    }

    await connectDB();
    const data = await req.json();

    // ==========================================
    // 🛡️ লেভেল ২: আইডেন্টিটি থেফট প্রোটেকশন
    // ==========================================
    // হ্যাকার যদি অন্য কারও ইমেইল বসিয়ে মেসেজ পাঠাতে চায়, তবে সেটা ব্লক করবে
    if (session.user.email !== data.senderEmail) {
      return NextResponse.json({ error: "Fake identity detected! 🚨" }, { status: 403 });
    }

    // ==========================================
    // 🛡️ লেভেল ৩: সাইজ লিমিট
    // ==========================================
    if (data.text && data.text.length > 1000) {
      return NextResponse.json({ error: "মেসেজ অনেক বড়!" }, { status: 400 });
    }

    // ==========================================
    // 🛡️ লেভেল ৪: অটো-সাসপেন্ড (ডাটাবেস ভিত্তিক চেক)
    // ==========================================
    const sender = await User.findOne({ email: data.senderEmail });
    if (sender?.isSuspended) {
      return NextResponse.json({ error: "স্প্যামিংয়ের কারণে আপনার অ্যাকাউন্ট সাসপেন্ড করা হয়েছে! 🚫" }, { status: 403 });
    }

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentMessagesCount = await Message.countDocuments({
      senderEmail: data.senderEmail,
      createdAt: { $gte: oneMinuteAgo }
    });

    if (recentMessagesCount >= 15) {
      await User.findOneAndUpdate({ email: data.senderEmail }, { isSuspended: true });
      return NextResponse.json({ error: "অতিরিক্ত স্প্যামিং! আপনার অ্যাকাউন্ট চিরতরে সাসপেন্ড করা হলো। 🚨" }, { status: 429 });
    }

    // মেসেজ সেভ এবং পুশ করা
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