import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Message } from "@/models/Message";
import { User } from "@/models/User";
import { pusherServer } from "@/lib/pusher";

export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();

    // ১. সাইজ লিমিট (১০০০ অক্ষরের বেশি হলে ব্লক)
    if (data.text && data.text.length > 10000) {
      return NextResponse.json({ error: "মেসেজ অনেক বড়!" }, { status: 400 });
    }

    // ২. চেক করা হচ্ছে ইউজার আগেই সাসপেন্ডেড কি না
    const sender = await User.findOne({ email: data.senderEmail });
    if (sender?.isSuspended) {
      return NextResponse.json({ error: "স্প্যামিংয়ের কারণে আপনার অ্যাকাউন্ট সাসপেন্ড করা হয়েছে! 🚫" }, { status: 403 });
    }

    // ৩. দ্য অটো-সাসপেন্ড ম্যাজিক (১ মিনিটে কতগুলো মেসেজ পাঠিয়েছে তার হিসাব)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000); // ঠিক ১ মিনিট আগের সময়
    const recentMessagesCount = await Message.countDocuments({
      senderEmail: data.senderEmail,
      createdAt: { $gte: oneMinuteAgo } // গত ১ মিনিটে পাঠানো মেসেজ
    });

    // যদি কেউ ১ মিনিটে ১৫টার বেশি মেসেজ পাঠায়, তাকে স্প্যামার হিসেবে সাসপেন্ড করো!
    if (recentMessagesCount >= 400) {
      await User.findOneAndUpdate({ email: data.senderEmail }, { isSuspended: true });
      return NextResponse.json({ error: "অতিরিক্ত স্প্যামিং! আপনার অ্যাকাউন্ট চিরতরে সাসপেন্ড করা হলো। 🚨" }, { status: 429 });
    }

    // ৪. মেসেজ সেভ এবং পুশ করা
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