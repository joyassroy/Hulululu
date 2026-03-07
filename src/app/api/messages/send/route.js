import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Message } from "@/models/Message";
import { pusherServer } from "@/lib/pusher";

export async function POST(req) {
  try {
    await connectDB();
    const { chatId, senderEmail, senderName, text, image, time } = await req.json();

    // মডেলে যা আছে ঠিক সেই নামে ডাটা পাঠাতে হবে
    const newMessage = await Message.create({
      chatId,
      senderEmail,
      senderName,
      text,
      image,
      time
    });

    await pusherServer.trigger(chatId, "new-message", newMessage);
    return NextResponse.json(newMessage);
  } catch (error) {
    console.error("Message Save Error Detail:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}