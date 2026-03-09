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

    await pusherServer.trigger(data.chatId, "new-message", newMessage);

    if (data.receiverEmail) {
      await pusherServer.trigger(`user-${data.receiverEmail}`, "update-sidebar", {
        senderEmail: data.senderEmail,
        senderName: data.senderName,
        text: data.text // নতুন লাইন: সাইডবারে দেখানোর জন্য মেসেজ পাঠানো হচ্ছে
      });
    }

    return NextResponse.json(newMessage);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}