import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await connectDB();
    const { name, email, password } = await req.json();
    const newUser = await User.create({
      name, email, password: hashedPassword,
      image: `https://ui-avatars.com/api/?name=${name.replace(" ", "+")}&background=random`
    });
    // চেক করা হচ্ছে ইউজার আগে থেকেই আছে কি না
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "এই ইমেইল দিয়ে আগে থেকেই একটি অ্যাকাউন্ট আছে!" }, { status: 400 });
    }

    // পাসওয়ার্ড হ্যাশ (এনক্রিপ্ট) করা
    const hashedPassword = await bcrypt.hash(password, 10);

    // নতুন ইউজার তৈরি
    
    await pusherServer.trigger("hulululu-global", "new-user-joined", newUser);

    return NextResponse.json({ message: "অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!", user: newUser });
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "সার্ভারে সমস্যা হয়েছে!" }, { status: 500 });
  }
}