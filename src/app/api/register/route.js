import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { pusherServer } from "@/lib/pusher";
import { headers } from "next/headers";

export async function POST(req) {
  try {
    await connectDB();
    // 🔴 ফ্রন্টএন্ড থেকে turnstileToken রিসিভ করা হচ্ছে
    const { name, email, password, turnstileToken } = await req.json();

    // ==========================================
    // 🛡️ লেভেল ১: Cloudflare Turnstile ভেরিফিকেশন
    // ==========================================
    if (!turnstileToken) {
      return NextResponse.json({ error: "ক্যাপচা পূরণ করুন!" }, { status: 400 });
    }

    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${turnstileToken}`
    });

    const verifyData = await verifyRes.json();
    
    if (!verifyData.success) {
      return NextResponse.json({ error: "বট ডিটেক্টেড! সিকিউরিটি চেক ব্যর্থ হয়েছে 🤖🚫" }, { status: 403 });
    }

    // ==========================================
    // 🕵️‍♂️ লেভেল ২: স্পাই সিস্টেম (IP, Device, Location)
    // ==========================================
    const headersList =await headers();
    const ip = headersList.get("x-forwarded-for") || "Unknown IP";
    const userAgent = headersList.get("user-agent") || "Unknown Device";
    const city = headersList.get("x-vercel-ip-city") || "Unknown City";
    const country = headersList.get("x-vercel-ip-country") || "Unknown Country";
    const location = `${city}, ${country}`;

    // চেক করা হচ্ছে ইউজার আগে থেকেই আছে কি না
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "এই ইমেইল দিয়ে আগে থেকেই একটি অ্যাকাউন্ট আছে!" }, { status: 400 });
    }

    // পাসওয়ার্ড হ্যাশ (এনক্রিপ্ট) করা
    const hashedPassword = await bcrypt.hash(password, 10);
    const safeName = name ? name.replace(" ", "+") : "User";

    // নতুন ইউজার তৈরি এবং ট্র্যাক করা ডেটা সেভ
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      image: `https://ui-avatars.com/api/?name=${safeName}&background=random`,
      ipAddresses: [ip],
      deviceInfo: [userAgent],
      lastLocation: location
    });

    // গ্লোবাল চ্যানেলে নতুন ইউজারের সিগন্যাল পাঠানো
    await pusherServer.trigger("hulululu-global", "new-user-joined", newUser);

    return NextResponse.json({ message: "অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!", user: newUser });
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "সার্ভারে সমস্যা হয়েছে!" }, { status: 500 });
  }
}