import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export const dynamic = 'force-dynamic'; // সবসময় লেটেস্ট ডাটা আনার জন্য

export async function GET() {
  try {
    await connectDB();
    // পাসওয়ার্ড বাদে সব ফিল্ড (isOnline, blockedUsers সহ) নিয়ে আসবে
    const users = await User.find().select("-password").sort({ updatedAt: -1 });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}