import { NextResponse } from "next/server";

export function middleware(req) {
  // কেউ সাইটে বা API-তে ঢোকার চেষ্টা করলেই এই মেসেজ দেখিয়ে ব্লক করে দেবে!
  return new NextResponse(
    "🚨 Security Upgrade in Progress! Hulululu is currently offline for maintenance. Please check back later. 🚨",
    { status: 503 }
  );
}

// এই কনফিগারেশনটা সাইটের সমস্ত পেজ এবং সমস্ত API রিকোয়েস্ট ব্লক করে দেবে
export const config = {
  matcher: '/:path*', 
};