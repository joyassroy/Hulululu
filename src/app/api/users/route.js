import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getServerSession } from "next-auth";

export async function GET() {
  await connectDB();
  const session = await getServerSession();
  
  // নিজেকে বাদ দিয়ে বাকি সব ইউজারকে খুঁজে আনছি
  const users = await User.find({ email: { $ne: session?.user?.email } });
  return NextResponse.json(users);
}