import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/lib/db"; // যদি পাথ কাজ না করে, তবে "@/lib/db" দিতে পারো
import { User } from "@/models/User"; // অথবা "@/models/User"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    // যখন কেউ লগইন করার চেষ্টা করবে, তখন এই ফাংশনটি রান হবে
    async signIn({ user, account }) {
      if (account.provider === "google") {
        try {
          await connectDB(); // ডাটাবেস কানেক্ট করা
          
          // চেক করছি এই ইমেইল দিয়ে আগে কোনো অ্যাকাউন্ট খোলা হয়েছে কিনা
          const existingUser = await User.findOne({ email: user.email });
          
          // যদি না থাকে, তাহলে নতুন ইউজার হিসেবে ডাটাবেসে সেভ করব
          if (!existingUser) {
            await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
            });
          }
          return true; // লগইন সাকসেসফুল
        } catch (error) {
          console.log("Error saving user", error);
          return false; // কোনো এরর হলে লগইন ক্যানসেল
        }
      }
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };