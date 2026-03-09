import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { pusherServer } from "@/lib/pusher";
const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // নতুন: ইমেইল/পাসওয়ার্ড প্রোভাইডার
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        await connectDB();
        
        // ইউজার খুঁজুন
        const user = await User.findOne({ email: credentials.email });
        if (!user || !user.password) {
          throw new Error("ভুল ইমেইল বা অ্যাকাউন্টটি গুগলের মাধ্যমে খোলা হয়েছে!");
        }

        // পাসওয়ার্ড মেলান
        const isValidPassword = await bcrypt.compare(credentials.password, user.password);
        if (!isValidPassword) {
          throw new Error("ভুল পাসওয়ার্ড!");
        }

        return user;
      }
    })
  ],
  // সেভ করার লজিক (আগের মতোই থাকবে)
  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === "google") {
        await connectDB();
        const existingUser = await User.findOne({ email: user.email });
        
        if (!existingUser) {
          // নতুন গুগল ইউজার তৈরি হচ্ছে
          const newUser = await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            isOnline: true // গুগল দিয়ে ঢুকলেই অনলাইন
          });
          
          // গ্লোবাল চ্যানেলে সিগন্যাল পাঠানো
          await pusherServer.trigger("hulululu-global", "new-user-joined", newUser);
        }
      }
      return true;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };