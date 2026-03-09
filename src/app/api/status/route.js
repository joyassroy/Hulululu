import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { pusherServer } from "@/lib/pusher";

export async function POST(req) {
  try {
    await connectDB();
    const { email, isOnline } = await req.json();

    // ডাটাবেস আপডেট করা
    const updatedUser = await User.findOneAndUpdate(
      { email }, 
      { isOnline, lastSeen: new Date() }, 
      { new: true }
    );

    // গ্লোবাল চ্যানেলে সবাইকে জানিয়ে দেওয়া যে স্ট্যাটাস চেঞ্জ হয়েছে!
    await pusherServer.trigger("hulululu-global", "status-update", {
      email,
      isOnline,
      lastSeen: updatedUser.lastSeen
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Status update failed" }, { status: 500 });
  }
}