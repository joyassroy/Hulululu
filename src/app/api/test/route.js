import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db"; // Path ta thik na thakle "@/lib/db" dite paro

export async function GET() {
  try {
    await connectDB(); // Database connection test korche
    return NextResponse.json({ 
      success: true, 
      message: "Hulululu App er MongoDB Database perfectly connect hoyeche! 🎉" 
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ 
      success: false, 
      message: "Database connection e jhamela hoyeche." 
    }, { status: 500 });
  }
}