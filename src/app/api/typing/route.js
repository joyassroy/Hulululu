import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function POST(req) {
  try {
    const { chatId, isTyping, senderEmail } = await req.json();
    await pusherServer.trigger(chatId, "typing", { isTyping, senderEmail });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Typing event failed" }, { status: 500 });
  }
}