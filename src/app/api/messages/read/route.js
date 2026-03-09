import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Message } from "@/models/Message";
import { pusherServer } from "@/lib/pusher";

export async function POST(req) {
  try {
    await connectDB();
    const { chatId, readerEmail } = await req.json();

    // যে মেসেজগুলো পড়া হয়নি, সেগুলোকে 'Read' করে দেওয়া
    await Message.updateMany(
      { chatId, receiverEmail: readerEmail, isRead: false },
      { $set: { isRead: true } }
    );

    // পুশারের মাধ্যমে অন্যজনকে জানিয়ে দেওয়া যে মেসেজ দেখা হয়েছে
    await pusherServer.trigger(chatId, "messages-read", { readerEmail });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}