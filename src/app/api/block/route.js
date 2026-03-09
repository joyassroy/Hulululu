import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { pusherServer } from "@/lib/pusher";

export async function POST(req) {
  try {
    await connectDB();
    const { blockerEmail, targetEmail, action } = await req.json();

    let updatedUser;
    if (action === "block") {
      updatedUser = await User.findOneAndUpdate(
        { email: blockerEmail },
        { $addToSet: { blockedUsers: targetEmail } }, // লিস্টে যোগ করবে
        { new: true }
      );
    } else {
      updatedUser = await User.findOneAndUpdate(
        { email: blockerEmail },
        { $pull: { blockedUsers: targetEmail } }, // লিস্ট থেকে সরাবে
        { new: true }
      );
    }

    // পুশারের মাধ্যমে গ্লোবালি জানিয়ে দেওয়া
    await pusherServer.trigger("hulululu-global", "block-update", {
      blockerEmail,
      targetEmail,
      action
    });

    return NextResponse.json({ success: true, blockedUsers: updatedUser.blockedUsers });
  } catch (error) {
    console.error("Block API Error:", error);
    return NextResponse.json({ error: "Block action failed" }, { status: 500 });
  }
}