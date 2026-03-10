import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { connectDB } from "@/lib/db";
import { Message } from "@/models/Message";
import { User } from "@/models/User";
import { pusherServer } from "@/lib/pusher";
import { getServerSession } from "next-auth";

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(25, "1 m"), 
});

export async function POST(req) {
  try {
    const headersList = await headers(); 
    const ip = headersList.get("x-forwarded-for") || "127.0.0.1";

    const { success, limit, remaining } = await ratelimit.limit(`ratelimit_chat_${ip}`);

    if (!success) {
      console.warn(`🚨 SPAMMER BLOCKED BY REDIS! IP: ${ip} | API Bombing Stopped!`);
      return NextResponse.json(
        { error: "সার্ভার ফায়ারওয়াল অ্যাক্টিভেটেড! খুব দ্রুত রিকোয়েস্ট আসছে 🛡️⏳" },
        { 
            status: 429, 
            headers: {
                "X-RateLimit-Limit": limit.toString(),
                "X-RateLimit-Remaining": remaining.toString(),
            }
        }
      );
    }

    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized! হ্যাকিংয়ের চেষ্টা করবেন না! 🚫" }, { status: 401 });
    }

    await connectDB();
    const data = await req.json();

    if (session.user.email !== data.senderEmail) {
      return NextResponse.json({ error: "Fake identity detected! 🚨" }, { status: 403 });
    }

    // ==========================================
    // 🛡️ নতুন লেভেল: Content Bombing Detection (Text + Image)
    // ==========================================
    // একই টেক্সট বা একই ইমেজ ১০ বার পাঠালে অ্যাকাউন্ট সাসপেন্ড হবে
    const currentMsgFingerprint = `${data.text || ""}_${data.image || ""}`; // টেক্সট আর ইমেজ লিঙ্ক দিয়ে ফিঙ্গারপ্রিন্ট
    const lastMsgKey = `last_msg_fingerprint_${session.user.email}`;
    const repeatCountKey = `repeat_count_${session.user.email}`;

    const lastMsgFingerprint = await redis.get(lastMsgKey);

    if (lastMsgFingerprint === currentMsgFingerprint) {
      const count = await redis.incr(repeatCountKey);
      
      if (count >= 10) {
        // ১০ বার সেইম কন্টেন্ট হয়ে গেলে সাসপেন্ড!
        await User.findOneAndUpdate({ email: session.user.email }, { isSuspended: true });
        
        await redis.del(lastMsgKey);
        await redis.del(repeatCountKey);

        return NextResponse.json(
          { error: "স্প্যামিংয়ের জন্য আপনার অ্যাকাউন্ট সাসপেন্ড করা হলো! 🚫" }, 
          { status: 429 } // ৪২৯ দিলে ফ্রন্টএন্ডে সেই বিশেষ লাল স্ক্রিন আসবে
        );
      }
    } else {
      // যদি কন্টেন্ট আলাদা হয়, তবে ফিঙ্গারপ্রিন্ট আপডেট করো এবং কাউন্টার ১ এ রিসেট করো
      await redis.set(lastMsgKey, currentMsgFingerprint);
      await redis.set(repeatCountKey, 1);
    }
    // ==========================================

    if (data.text && data.text.length > 1000) {
      return NextResponse.json({ error: "মেসেজ অনেক বড়!" }, { status: 400 });
    }

    const sender = await User.findOne({ email: data.senderEmail });
    if (sender?.isSuspended) {
      return NextResponse.json({ error: "স্প্যামিংয়ের কারণে আপনার অ্যাকাউন্ট সাসপেন্ড করা হয়েছে! 🚫" }, { status: 429 });
    }

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentMessagesCount = await Message.countDocuments({
      senderEmail: data.senderEmail,
      createdAt: { $gte: oneMinuteAgo }
    });

    if (recentMessagesCount >= 25) {
      await User.findOneAndUpdate({ email: data.senderEmail }, { isSuspended: true });
      return NextResponse.json({ error: "অতিরিক্ত স্প্যামিং! আপনার অ্যাকাউন্ট চিরতরে সাসপেন্ড করা হলো। 🚨" }, { status: 429 });
    }

    const newMessage = await Message.create({
      chatId: data.chatId,
      senderEmail: data.senderEmail,
      senderName: data.senderName,
      receiverEmail: data.receiverEmail,
      text: data.text,
      image: data.image,
      time: data.time,
      isRead: false
    });

    await pusherServer.trigger(data.chatId, "new-message", newMessage);

    if (data.receiverEmail) {
      await pusherServer.trigger(`user-${data.receiverEmail}`, "update-sidebar", {
        senderEmail: data.senderEmail,
        senderName: data.senderName,
        text: data.text 
      });
    }

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}