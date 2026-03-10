"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User as UserIcon } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Turnstile } from "@marsidev/react-turnstile"; 

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  
  const [turnstileToken, setTurnstileToken] = useState(""); 

  useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError(""); 
    setAuthLoading(true);

    if (isLogin) {
      const res = await signIn("credentials", { redirect: false, email: authForm.email, password: authForm.password });
      if (res?.error) {
          setAuthError(res.error);
          setAuthLoading(false);
      } else {
          router.push("/");
      }
    } else {
      if (!turnstileToken) {
        setAuthError("দয়া করে সিকিউরিটি চেক (Cloudflare) পূরণ করুন! 🤖🚫");
        setAuthLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/register", { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ ...authForm, turnstileToken }) 
        });
        const data = await res.json();
        
        if (!res.ok) {
            // 🔴 ব্যাকএন্ড থেকে আইপি ব্লকের মেসেজ আসলে সেটা এখানে শো করবে
            setAuthError(data.error || "রেজিস্ট্রেশন ব্যর্থ হয়েছে");
            setAuthLoading(false);
            return;
        } 
        
        // রেজিস্ট্রেশন সফল হলে সাথে সাথে লগইন করিয়ে দেওয়া
        await signIn("credentials", { redirect: false, email: authForm.email, password: authForm.password });
        router.push("/");
        
      } catch (err) { 
          setAuthError("সার্ভারে সমস্যা হয়েছে!"); 
          setAuthLoading(false);
      }
    }
  };

  if (status === "loading") return <div className="h-screen flex items-center justify-center bg-[#f0f2f5]"><div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (session) return null; 

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-[900px] min-h-[550px] md:h-[600px] rounded-[30px] shadow-2xl flex overflow-hidden font-sans">
        <div className="hidden md:flex w-1/2 bg-green-600 p-10 flex-col justify-center text-white relative">
          <h2 className="text-4xl font-black mb-4 tracking-tighter z-10">Hulululu.</h2>
          <p className="text-green-100 font-light z-10">রিয়েল-টাইম চ্যাটিংয়ের সেরা অভিজ্ঞতা।</p>
          <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-green-500 rounded-full blur-3xl opacity-50" />
        </div>
        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
          <h1 className="text-2xl font-bold mb-2 text-gray-800 tracking-tight">{isLogin ? "লগইন করুন" : "নতুন অ্যাকাউন্ট খুলুন"}</h1>
          {authError && <p className="text-red-500 text-sm mb-4 font-bold bg-red-50 p-3 rounded-xl border border-red-100">{authError}</p>}
          
          <form onSubmit={handleAuthSubmit} className="space-y-4 mt-4">
            {!isLogin && (
              <div className="relative group">
                <UserIcon className="absolute left-4 top-4 text-gray-400 group-focus-within:text-green-500 transition-colors" size={18} />
                <input type="text" placeholder="আপনার নাম" required value={authForm.name} onChange={(e) => setAuthForm({...authForm, name: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 border rounded-2xl outline-none text-sm text-black focus:ring-2 focus:ring-green-400 transition-all" />
              </div>
            )}
            <div className="relative group">
              <Mail className="absolute left-4 top-4 text-gray-400 group-focus-within:text-green-500 transition-colors" size={18} />
              <input type="email" placeholder="ইমেইল অ্যাড্রেস" required value={authForm.email} onChange={(e) => setAuthForm({...authForm, email: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 border rounded-2xl outline-none text-sm text-black focus:ring-2 focus:ring-green-400 transition-all" />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-4 text-gray-400 group-focus-within:text-green-500 transition-colors" size={18} />
              <input type="password" placeholder="পাসওয়ার্ড" required minLength={6} value={authForm.password} onChange={(e) => setAuthForm({...authForm, password: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-gray-50 border rounded-2xl outline-none text-sm text-black focus:ring-2 focus:ring-green-400 transition-all" />
            </div>

            {!isLogin && (
              <div className="flex justify-center py-2">
                <Turnstile 
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} 
                  onSuccess={(token) => setTurnstileToken(token)} 
                />
              </div>
            )}

            <button type="submit" disabled={authLoading || (!isLogin && !turnstileToken)} className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-200 transition-all disabled:opacity-50 active:scale-95">
              {authLoading ? "অপেক্ষা করুন..." : (isLogin ? "লগইন করুন" : "রেজিস্ট্রেশন করুন")}
            </button>
          </form>

          <div className="relative py-5 flex items-center">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="px-3 text-gray-400 text-[10px] font-bold uppercase tracking-widest">অথবা</span>
              <div className="flex-grow border-t border-gray-100"></div>
          </div>

          <button onClick={() => signIn("google", { callbackUrl: "/" })} className="w-full py-4 border border-gray-200 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all font-semibold text-gray-700 active:scale-95">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" /> গুগল দিয়ে লগইন
          </button>
          
          <button type="button" onClick={() => { setIsLogin(!isLogin); setAuthError(""); setAuthForm({ name: "", email: "", password: "" }); setTurnstileToken(""); }} className="mt-6 text-sm text-green-600 hover:underline text-center font-medium w-full">
              {isLogin ? "অ্যাকাউন্ট নেই? সাইন-আপ করুন" : "অ্যাকাউন্ট আছে? লগইন করুন"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}