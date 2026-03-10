import { NextResponse } from "next/server";

const BLOCKED_IPS = []; 

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'Unknown IP';
  const userAgent = req.headers.get('user-agent') || 'Unknown Device';
  const origin = req.headers.get('origin') || "";

  // 🟢 ১. গুগল অথেনটিকেশন এবং পাবলিক ফাইলগুলোকে ছেড়ে দাও (যাতে লগইন কাজ করে)
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // আগের ব্লকলিস্ট লজিক (অক্ষত আছে)
  if (BLOCKED_IPS.includes(ip)) {
    return new NextResponse(
      JSON.stringify({ message: "Parle hack koreee dekhaa 😎🔥", ip }),
      { status: 403, headers: { 'content-type': 'application/json' } }
    );
  }

  // ==========================================
  // 🛡️ স্মার্ট API বর্ডার কন্ট্রোল
  // ==========================================
  
  // চেক ১: Postman বা cURL ব্লক করা
  if (userAgent.toLowerCase().includes("postman") || userAgent.toLowerCase().includes("curl")) {
    return new NextResponse(
      JSON.stringify({ error: "Postman strictly blocked! 🛑" }),
      { status: 403, headers: { 'content-type': 'application/json' } }
    );
  }

  // চেক ২: স্মার্ট অরিজিন চেক (CORS)
  // যদি রিকোয়েস্ট একই ওয়েবসাইট থেকে আসে (origin খালি বা vercel.app দিয়ে শেষ হয়), তবে অ্যালাউ করো
  const isAllowedOrigin = 
    !origin || 
    origin.includes("localhost") || 
    origin.endsWith(".vercel.app") || 
    origin.includes("hulululu"); // তোমার ডোমেইন নাম এখানে থাকলে ভালো

  if (!isAllowedOrigin) {
    console.warn(`🚨 CORS Blocked! Unauthorized origin: ${origin}`);
    return new NextResponse(
      JSON.stringify({ error: "Access Denied! API can only be accessed from the official app. 🛑" }),
      { status: 403, headers: { 'content-type': 'application/json' } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*', 
};