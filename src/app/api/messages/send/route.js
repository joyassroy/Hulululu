import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Message } from "@/models/Message";
import { pusherServer } from "@/lib/pusher";

export async function POST(req) {
  try {
    await connectDB();
    const data = await req.json();

    const newMessage = await Message.create({
      chatId: data.chatId,
      senderEmail: data.senderEmail,
      senderName: data.senderName,
      text: data.text,
      image: data.image,
      time: data.time
    });

    // ১. রানিং চ্যাট উইন্ডোর জন্য পুশার ট্রিগার
    await pusherServer.trigger(data.chatId, "new-message", newMessage);

    // ২. রিসিভারের পার্সোনাল চ্যানেলে নোটিফিকেশন পাঠানো (যাতে চ্যাট লিস্টের ওপরে চলে আসে)
    await pusherServer.trigger(`user-${data.receiverEmail}`, "update-sidebar", { 
        senderEmail: data.senderEmail 
    });

    return NextResponse.json(newMessage);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}