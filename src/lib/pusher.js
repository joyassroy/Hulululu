import PusherServer from "pusher";
import PusherClient from "pusher-js";

// সার্ভার সাইডের জন্য (ব্যাকএন্ড / API Routes)
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: "ap2", 
  useTLS: true,
});

// ক্লায়েন্ট সাইডের জন্য (ফ্রন্টএন্ড / React Components)
export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
  {
    cluster: "ap2",
  }
);