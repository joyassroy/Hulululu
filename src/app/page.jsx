"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, LogOut, Search, MoreVertical, Mail, Lock, ArrowLeft, Smile, Paperclip, Send, X } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { pusherClient } from "@/lib/pusher"; 

export default function Home() {
  const { data: session, status } = useSession();
  
  const [lang, setLang] = useState("bn");
  const [activeChat, setActiveChat] = useState(null);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [messages, setMessages] = useState([]); 
  const [inputText, setInputText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLogin, setIsLogin] = useState(true);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (session) {
      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => setRegisteredUsers(Array.isArray(data) ? data : []))
        .catch(err => console.error("ইউজার লোড এরর:", err));
    }
  }, [session]);

  const fetchMessages = async (chatId) => {
    try {
      const res = await fetch(`/api/messages/fetch?chatId=${chatId}`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("মেসেজ ফেচ এরর:", error);
      setMessages([]);
    }
  };

  useEffect(() => {
    if (activeChat && session) {
      const chatId = [session.user.email, activeChat.email].sort().join("--");
      fetchMessages(chatId);
    }
  }, [activeChat, session]);

  useEffect(() => {
    if (!activeChat || !session) return;
    const chatId = [session.user.email, activeChat.email].sort().join("--");
    const channel = pusherClient.subscribe(chatId);
    channel.bind("new-message", (newMessage) => {
      if (newMessage.senderEmail !== session.user.email) {
        setMessages((prev) => Array.isArray(prev) ? [...prev, newMessage] : [newMessage]);
      }
    });
    return () => pusherClient.unsubscribe(chatId);
  }, [activeChat, session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return data.secure_url; 
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    let finalImageUrl = "";

    if (selectedImage && fileInputRef.current?.files[0]) {
      try {
        finalImageUrl = await uploadImageToCloudinary(fileInputRef.current.files[0]);
      } catch (err) {
        console.error("ইমেজ আপলোড ফেইল:", err);
        return;
      }
    }

    const chatId = [session.user.email, activeChat.email].sort().join("--");
    const newMessage = {
      chatId,
      senderEmail: session.user.email,
      senderName: session.user.name,
      text: inputText,
      image: finalImageUrl, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newMessage]);
    const backupText = inputText;
    setInputText("");
    setSelectedImage(null);
    setShowEmojiPicker(false);

    try {
      await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMessage),
      });
    } catch (error) {
      console.error("সেন্ড এরর:", error);
      setInputText(backupText);
    }
  };

  const t = {
    bn: { title: "Hulululu", searchPlaceholder: "চ্যাট খুঁজুন...", selectedFriend: "বন্ধু সিলেক্ট করুন", startChatMsg: "চ্যাট শুরু করতে কাউকে সিলেক্ট করুন", inputPlaceholder: "মেসেজ লিখুন..." },
    en: { title: "Hulululu", searchPlaceholder: "Search...", selectedFriend: "Select Friend", startChatMsg: "Select someone to start chatting", inputPlaceholder: "Type a message..." }
  }[lang];

  if (status === "loading") return <div className="h-screen flex items-center justify-center bg-[#f0f2f5]"><div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (!session) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-[900px] min-h-[500px] md:h-[600px] rounded-[30px] shadow-2xl flex overflow-hidden font-sans">
          <div className="hidden md:flex w-1/2 bg-green-600 p-10 flex-col justify-center text-white">
            <h2 className="text-4xl font-black mb-4 tracking-tighter">Hulululu.</h2>
            <p className="text-green-100 font-light">রিয়েল-টাইম চ্যাটিংয়ের সেরা অভিজ্ঞতা।</p>
          </div>
          <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 tracking-tight">{isLogin ? "লগইন" : "রেজিস্ট্রেশন"}</h1>
            <div className="space-y-4">
              <input type="email" placeholder="ইমেইল" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none text-sm text-black" />
              <input type="password" placeholder="পাসওয়ার্ড" className="w-full p-4 bg-gray-50 border rounded-2xl outline-none text-sm text-black" />
              <button className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-200">এগিয়ে যান</button>
              <button onClick={() => signIn("google")} className="w-full py-4 border rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all font-semibold text-gray-700">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" /> গুগল দিয়ে লগইন
              </button>
            </div>
            <button onClick={() => setIsLogin(!isLogin)} className="mt-6 text-sm text-green-600 underline text-center font-medium">অ্যাকাউন্ট নেই? সাইন-আপ</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f0f2f5] md:p-6 font-sans">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[1600px] mx-auto h-full bg-white md:rounded-[32px] shadow-2xl flex overflow-hidden">
        
        {/* সাইডবার (মোবাইলে চ্যাট ওপেন থাকলে লুকানো থাকবে) */}
        <div className={`w-full md:w-[400px] border-r flex-col bg-white ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="h-20 bg-[#f0f2f5] flex items-center justify-between px-6 border-b">
            <img src={session.user.image} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="Me" />
            <div className="flex gap-2">
              <button onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')} className="text-[10px] font-bold bg-white px-2 py-1 rounded-full border">{lang.toUpperCase()}</button>
              <button onClick={() => signOut()} className="p-2 text-red-500 hover:bg-red-50 rounded-full"><LogOut size={20} /></button>
            </div>
          </div>
          <div className="p-4"><div className="bg-[#f0f2f5] rounded-2xl px-4 py-3 flex items-center"><Search size={18} className="text-gray-400 mr-2" /><input type="text" placeholder={t.searchPlaceholder} className="bg-transparent w-full text-sm outline-none text-black" /></div></div>
          <div className="flex-1 overflow-y-auto">
            {registeredUsers.map(u => (
              <div key={u._id} onClick={() => setActiveChat(u)} className={`flex items-center px-6 py-4 cursor-pointer border-b border-gray-50 transition-all ${activeChat?._id === u._id ? "bg-green-50" : "hover:bg-gray-50"}`}>
                <img src={u.image || `https://ui-avatars.com/api/?name=${u.name}`} className="w-12 h-12 rounded-full mr-4 border" alt="User" />
                <div className="flex-1 truncate"><h3 className="font-bold text-gray-800 text-sm truncate">{u.name}</h3><p className="text-[10px] text-green-500 font-bold uppercase">Online</p></div>
              </div>
            ))}
          </div>
        </div>

        {/* চ্যাট এরিয়া (মোবাইলে চ্যাট ওপেন না থাকলে লুকানো থাকবে) */}
        <div className={`flex-1 bg-[#E5DDD5] relative flex-col overflow-hidden ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://i.pinimg.com/originals/ab/ab/60/abab60f0bc0006e20f20c951da3588da.jpg')] bg-repeat" />
          
          {activeChat ? (
            <>
              <div className="h-20 bg-[#f0f2f5] px-4 md:px-8 flex items-center justify-between border-b z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  {/* মোবাইলের ব্যাক বাটন */}
                  <button onClick={() => setActiveChat(null)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-200 rounded-full transition-all">
                    <ArrowLeft size={24} />
                  </button>
                  <img src={activeChat.image || `https://ui-avatars.com/api/?name=${activeChat.name}`} className="w-10 h-10 rounded-full border" alt="Friend" />
                  <h2 className="font-bold text-gray-800 text-sm tracking-tight">{activeChat.name}</h2>
                </div>
                <MoreVertical size={20} className="text-gray-400 cursor-pointer" />
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-3 z-10 custom-scrollbar">
                {Array.isArray(messages) && messages.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`flex flex-col max-w-[85%] md:max-w-[70%] ${m.senderEmail === session.user.email ? "self-end" : "self-start"}`}>
                    <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm relative ${m.senderEmail === session.user.email ? "bg-[#D9FDD3] text-gray-800 rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none"}`}>
                      {m.image && <img src={m.image} className="rounded-xl mb-2 max-h-64 w-full object-cover shadow-sm border" alt="attachment" />}
                      <p className="leading-relaxed">{m.text}</p>
                      <span className="text-[9px] text-gray-400 mt-1 block text-right font-medium">{m.time}</span>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 md:p-6 bg-[#f0f2f5] z-20 shadow-lg">
                <AnimatePresence>
                  {selectedImage && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="mb-4 relative inline-block">
                      <img src={selectedImage} className="h-24 w-24 object-cover rounded-2xl border-4 border-white shadow-xl" alt="preview" />
                      <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"><X size={12} /></button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-3">
                  <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-2.5 md:p-3 rounded-full transition-all ${showEmojiPicker ? "bg-green-100 text-green-600" : "text-gray-500 hover:bg-white"}`}><Smile size={24} /></button>
                  <button type="button" onClick={() => fileInputRef.current.click()} className="p-2.5 md:p-3 text-gray-500 hover:bg-white rounded-full"><Paperclip size={24} /></button>
                  <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={(e) => setSelectedImage(URL.createObjectURL(e.target.files[0]))} />
                  <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder={t.inputPlaceholder} className="flex-1 bg-white px-4 md:px-6 py-3.5 md:py-4 rounded-2xl text-sm outline-none shadow-sm focus:ring-2 focus:ring-green-400/50 transition-all text-black font-medium" />
                  <button type="submit" disabled={!inputText.trim() && !selectedImage} className="w-12 h-12 md:w-14 md:h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all disabled:bg-gray-300"><Send size={20} className="ml-1" /></button>
                </form>
                {showEmojiPicker && <div className="absolute bottom-24 left-4 md:left-8 z-50 shadow-2xl rounded-2xl overflow-hidden"><EmojiPicker onEmojiClick={(o) => setInputText(p => p + o.emoji)} /></div>}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center z-10">
              <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl"><Globe size={50} className="text-green-500 animate-pulse" /></div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">{t.selectedFriend}</h2>
              <p className="text-gray-400 text-sm max-w-xs">{t.startChatMsg}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}