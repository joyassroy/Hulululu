import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Message } from "@/models/Message";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) return NextResponse.json({ error: "chatId required" }, { status: 400 });

    // chatId এখন String হওয়ায় CastError আর আসবে না
    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Fetch Error Detail:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}