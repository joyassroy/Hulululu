import { NextResponse } from "next/server";

const BLOCKED_IPS = []; 

// 🟢 নতুন লজিক: শুধুমাত্র এই লিংকগুলো থেকেই API তে ঢোকা যাবে!
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://hulululu.vercel.app/", // ⚠️ এখানে তোমার আসল Vercel ডোমেইনটা বসাবে
  "https://www.hulululu.vercel.app"
];

export function middleware(req) {

  const ip = req.ip || req.headers.get('x-forwarded-for') || 'Unknown IP';
  const userAgent = req.headers.get('user-agent') || 'Unknown Device';
  // 🟢 নতুন লজিক: রিকোয়েস্ট কোথা থেকে আসছে সেটা বের করা
  const origin = req.headers.get('origin') || "";

  // তোমার আগের লগিং লজিক একদম অক্ষত আছে
  console.log(`👀 Visitor Info -> IP: ${ip} | Device: ${userAgent} | Path: ${req.nextUrl.pathname}`);

  // তোমার আগের ব্লকলিস্ট লজিক একদম অক্ষত আছে
  if (BLOCKED_IPS.includes(ip)) {
    return new NextResponse(
      JSON.stringify({ 
        message: "Parle hack koreee dekhaa 😎🔥",
        your_ip_tracked: ip,
        your_device_tracked: userAgent
      }),
      { 
        status: 403, 
        headers: { 'content-type': 'application/json' }
      }
    );
  }

  // ==========================================
  // 🛡️ নতুন লজিক: API বর্ডার কন্ট্রোল (Anti-Postman & CORS)
  // ==========================================
  
  // চেক ১: রিকোয়েস্ট যদি Postman বা cURL থেকে আসে, ডাইরেক্ট ব্লক!
  if (userAgent.toLowerCase().includes("postman") || userAgent.toLowerCase().includes("curl")) {
    console.warn(`🚨 API Blocked! Someone tried to use Postman/cURL. IP: ${ip}`);
    return new NextResponse(
      JSON.stringify({ error: "Nice try Hacker! Postman and cURL are strictly blocked! 🛑" }),
      { status: 403, headers: { 'content-type': 'application/json' } }
    );
  }

  // চেক ২: রিকোয়েস্ট যদি বাইরের কোনো ওয়েবসাইট থেকে আসে (CORS Block)
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    console.warn(`🚨 CORS Blocked! Unauthorized origin: ${origin} | IP: ${ip}`);
    return new NextResponse(
      JSON.stringify({ error: "Access Denied! API can only be accessed from the official Hulululu app. 🛑" }),
      { status: 403, headers: { 'content-type': 'application/json' } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*', // তোমার ওয়েবসাইটের সব API রিকোয়েস্টে এটা পাহারাদারের মতো বসে থাকবে
};