"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, LogOut, Search, MoreVertical, ArrowLeft, Smile, Paperclip, Send, X, Ban, Check, CheckCheck, Loader2, Skull } from "lucide-react"; 
import EmojiPicker from "emoji-picker-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { pusherClient } from "@/lib/pusher"; 
import toast, { Toaster } from "react-hot-toast";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [isMounted, setIsMounted] = useState(false);
  const [lang, setLang] = useState("bn");
  const [activeChat, setActiveChat] = useState(null);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [messages, setMessages] = useState([]); 
  const [inputText, setInputText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false); 
  const [isSuspended, setIsSuspended] = useState(false); // 🔴 সাসপেন্ডেড স্টেট

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const activeChatRef = useRef(activeChat);
  const inputRef = useRef(null);

  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const playNotificationSound = () => {
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3");
    audio.play().catch(() => {});
  };

  const bringUserToTop = (email) => {
    setRegisteredUsers(prev => {
      const userIndex = prev.findIndex(u => u.email === email);
      if (userIndex <= 0) return prev; 
      const newUsers = [...prev];
      const [movedUser] = newUsers.splice(userIndex, 1);
      return [movedUser, ...newUsers];
    });
  };

  const formatLastSeen = (dateString) => {
    if (!dateString) return "অফলাইন";
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return isToday ? `আজ ${time}` : `${date.toLocaleDateString()} ${time}`;
  };

  const handleChatSelect = (user) => {
    setActiveChat(user);
    localStorage.setItem("activeChatEmail", user.email);
    setRegisteredUsers(prev => prev.map(u => u.email === user.email ? { ...u, unread: 0 } : u));
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  useEffect(() => {
    if (!session?.user?.email) return;

    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        const usersList = Array.isArray(data) ? data : [];
        setRegisteredUsers(usersList);
        const savedEmail = localStorage.getItem("activeChatEmail");
        if (savedEmail) {
          const chatToRestore = usersList.find(u => u.email === savedEmail);
          if (chatToRestore) setActiveChat(chatToRestore);
        }
      });

    const updateStatus = (isOnline) => {
      fetch("/api/status", { method: "POST", body: JSON.stringify({ email: session.user.email, isOnline }) });
    };

    updateStatus(true);
    window.addEventListener("beforeunload", () => updateStatus(false));

    return () => {
      updateStatus(false);
      window.removeEventListener("beforeunload", () => updateStatus(false));
    };
  }, [session?.user?.email]);

  useEffect(() => {
    if (!session?.user?.email) return;

    const globalChannel = pusherClient.subscribe("hulululu-global");
    globalChannel.bind("status-update", (data) => {
      setRegisteredUsers(prev => prev.map(user => user.email === data.email ? { ...user, isOnline: data.isOnline, lastSeen: data.lastSeen } : user));
      setActiveChat(prev => prev?.email === data.email ? { ...prev, isOnline: data.isOnline, lastSeen: data.lastSeen } : prev);
    });

    globalChannel.bind("new-user-joined", (newUser) => {
      if (newUser.email !== session.user.email) {
        setRegisteredUsers(prev => {
          if (prev.find((u) => u.email === newUser.email)) return prev;
          return [newUser, ...prev]; 
        });
      }
    });

    globalChannel.bind("block-update", (data) => {
      setRegisteredUsers(prev => prev.map(user => {
        if (user.email === data.blockerEmail) {
          const updatedBlocked = data.action === "block" ? [...(user.blockedUsers || []), data.targetEmail] : (user.blockedUsers || []).filter(e => e !== data.targetEmail);
          return { ...user, blockedUsers: updatedBlocked };
        }
        return user;
      }));
    });

    const myChannel = pusherClient.subscribe(`user-${session.user.email}`);
    myChannel.bind("update-sidebar", (data) => {
      if (activeChatRef.current?.email !== data.senderEmail) {
        toast.success(`${data.senderName}: ${data.text || "ছবি পাঠিয়েছে"}`, { icon: '💬' });
        playNotificationSound(); 
        setRegisteredUsers(prev => prev.map(u => u.email === data.senderEmail ? { ...u, lastMessage: data.text || "📷 ছবি", unread: (u.unread || 0) + 1 } : u));
      } else {
        setRegisteredUsers(prev => prev.map(u => u.email === data.senderEmail ? { ...u, lastMessage: data.text || "📷 ছবি" } : u));
      }
      bringUserToTop(data.senderEmail);
    });

    return () => {
      pusherClient.unsubscribe("hulululu-global");
      pusherClient.unsubscribe(`user-${session.user.email}`);
    };
  }, [session?.user?.email]);

  useEffect(() => {
    if (activeChat && session) {
      const chatId = [session.user.email, activeChat.email].sort().join("--");
      fetch(`/api/messages/fetch?chatId=${chatId}`)
        .then(res => res.json())
        .then(data => {
          setMessages(Array.isArray(data) ? data : []);
          fetch("/api/messages/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatId, readerEmail: session.user.email })
          });
        });
    }
  }, [activeChat, session]);

  useEffect(() => {
    if (!activeChat || !session) return;
    const chatId = [session.user.email, activeChat.email].sort().join("--");
    const channel = pusherClient.subscribe(chatId);
    
    channel.bind("new-message", (newMessage) => {
      if (newMessage.senderEmail !== session.user.email) {
        setMessages((prev) => Array.isArray(prev) ? [...prev, newMessage] : [newMessage]);
        bringUserToTop(newMessage.senderEmail);
        playNotificationSound();
        if (activeChatRef.current?.email === newMessage.senderEmail) {
          fetch("/api/messages/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatId, readerEmail: session.user.email })
          });
        }
      }
    });

    channel.bind("messages-read", (data) => {
      if (data.readerEmail !== session.user.email) {
        setMessages(prev => prev.map(m => m.senderEmail === session.user.email ? { ...m, isRead: true } : m));
      }
    });

    channel.bind("typing", (data) => {
      if (data.senderEmail !== session.user.email) setIsTyping(data.isTyping);
    });
    
    return () => pusherClient.unsubscribe(chatId);
  }, [activeChat, session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const currentUserData = registeredUsers.find(u => u.email === session?.user?.email);
  const iBlockedThem = currentUserData?.blockedUsers?.includes(activeChat?.email);
  const targetUserData = registeredUsers.find(u => u.email === activeChat?.email);
  const theyBlockedMe = targetUserData?.blockedUsers?.includes(session?.user?.email);
  const isBlocked = iBlockedThem || theyBlockedMe;

  const handleBlockAction = async (action) => {
    if (!activeChat || !session) return;
    setRegisteredUsers(prev => prev.map(u => {
      if(u.email === session.user.email) {
        const newBlocked = action === "block" ? [...(u.blockedUsers || []), activeChat.email] : (u.blockedUsers || []).filter(e => e !== activeChat.email);
        return { ...u, blockedUsers: newBlocked };
      }
      return u;
    }));
    toast.success(action === "block" ? "ইউজারকে ব্লক করা হয়েছে 🚫" : "ইউজারকে আনব্লক করা হয়েছে ✅");
    try {
      await fetch("/api/block", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ blockerEmail: session.user.email, targetEmail: activeChat.email, action }) });
    } catch (err) { toast.error("সার্ভার এরর!"); }
  };

  const handleInputTyping = (e) => {
    setInputText(e.target.value);
    if (!activeChat || isBlocked) return;
    const chatId = [session.user.email, activeChat.email].sort().join("--");
    fetch("/api/typing", { method: "POST", body: JSON.stringify({ chatId, senderEmail: session.user.email, isTyping: true }) });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      fetch("/api/typing", { method: "POST", body: JSON.stringify({ chatId, senderEmail: session.user.email, isTyping: false }) });
    }, 2000);
  };

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
    const data = await res.json();
    return data.secure_url; 
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (isBlocked || isSending || (!inputText.trim() && !selectedImage)) return;

    setIsSending(true);

    try {
      let finalImageUrl = "";
      if (selectedImage && fileInputRef.current?.files[0]) {
        finalImageUrl = await uploadImageToCloudinary(fileInputRef.current.files[0]);
      }

      const chatId = [session.user.email, activeChat.email].sort().join("--");
      const newMessage = {
        chatId, senderEmail: session.user.email, senderName: session.user.name, receiverEmail: activeChat.email, 
        text: inputText, image: finalImageUrl, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: false 
      };

      setRegisteredUsers(prev => prev.map(u => u.email === activeChat.email ? { ...u, lastMessage: inputText || "📷 ছবি" } : u));
      setMessages((prev) => [...prev, newMessage]);
      bringUserToTop(activeChat.email);
      
      const backupText = inputText;
      setInputText("");
      setSelectedImage(null);
      setShowEmojiPicker(false);
      
      fetch("/api/typing", { method: "POST", body: JSON.stringify({ chatId, senderEmail: session.user.email, isTyping: false }) });

      const res = await fetch("/api/messages/send", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(newMessage) 
      });

      // 🔴 হ্যাকার শনাক্ত করার লজিক
      if (!res.ok) {
        if (res.status === 429) {
           setIsSuspended(true); // 🚨 অ্যাকাউন্ট সাসপেন্ডেড UI দেখাবে
           return;
        }
        const data = await res.json();
        toast.error(data.error || "Error!");
        setMessages((prev) => prev.slice(0, -1)); 
      }

    } catch (error) {
      toast.error("মেসেজ পাঠানো যায়নি!");
    } finally {
      setIsSending(false); 
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const t = {
    bn: { searchPlaceholder: "চ্যাট খুঁজুন...", selectedFriend: "বন্ধু সিলেক্ট করুন", startChatMsg: "চ্যাট শুরু করতে কাউকে সিলেক্ট করুন", inputPlaceholder: "মেসেজ লিখুন..." },
    en: { searchPlaceholder: "Search...", selectedFriend: "Select Friend", startChatMsg: "Select someone to start chatting", inputPlaceholder: "Type a message..." }
  }[lang];

  if (!isMounted || status === "loading" || !session) return <div className="h-screen flex items-center justify-center bg-[#f0f2f5]"><div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="flex h-screen bg-[#f0f2f5] md:p-6 font-sans relative">
      <Toaster position="top-right" reverseOrder={false} /> 

      {/* 🚨 সাসপেন্ডেড হ্যাকার UI (Overlay) */}
      <AnimatePresence>
        {isSuspended && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="absolute inset-0 z-[999] bg-black flex flex-col items-center justify-center text-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.5 }} 
              animate={{ scale: 1 }} 
              transition={{ type: "spring", stiffness: 200 }}
              className="bg-red-600 p-8 rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.5)] border-4 border-white/20"
            >
              <Skull size={100} className="text-white mx-auto mb-6 animate-pulse" />
              <h1 className="text-white text-3xl md:text-5xl font-black mb-4 uppercase tracking-tighter">
                Access Denied!
              </h1>
              <p className="text-white text-xl md:text-2xl font-bold italic bg-black/40 px-6 py-4 rounded-xl border border-white/10">
                "Dom he to hack karke dekhaa bokachodaaa"
              </p>
              <div className="mt-8 text-red-200 text-sm font-mono animate-bounce">
                IP Blocked by System Security 🛡️
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[1600px] mx-auto h-full bg-white md:rounded-[32px] shadow-2xl flex overflow-hidden">
        
        {/* সাইডবার */}
        <div className={`w-full md:w-[400px] border-r flex-col bg-white ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="h-20 bg-white flex items-center justify-between px-6 border-b border-gray-100">
            <img src={session.user.image || `https://ui-avatars.com/api/?name=${session.user.name}`} className="w-11 h-11 rounded-full border border-gray-200 shadow-sm object-cover" alt="Me" />
            <div className="flex items-center gap-3">
              <button onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')} className="flex items-center gap-1.5 text-[11px] font-black tracking-wider bg-gradient-to-tr from-green-50 to-emerald-100 text-green-700 px-3 py-1.5 rounded-full border border-green-200 shadow-sm hover:shadow-md hover:scale-105 transition-all uppercase">
                <Globe size={13} className="text-green-600" /> {lang === 'bn' ? 'বাংলা' : 'ENG'}
              </button>
              <button onClick={() => signOut()} className="p-2.5 text-red-500 hover:bg-red-50 rounded-full transition-all"><LogOut size={20} /></button>
            </div>
          </div>
          <div className="p-4 border-b border-gray-50">
            <div className="bg-[#f0f2f5] rounded-full px-5 py-3.5 flex items-center transition-all focus-within:ring-2 focus-within:ring-green-400/30">
              <Search size={18} className="text-gray-400 mr-3" />
              <input type="text" placeholder={t.searchPlaceholder} className="bg-transparent w-full text-sm outline-none text-black font-medium" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {registeredUsers.map(u => {
              if (u.email === session?.user?.email) return null;
              const hideOnline = u.blockedUsers?.includes(session.user.email) || currentUserData?.blockedUsers?.includes(u.email);
              return (
              <div key={u._id} onClick={() => handleChatSelect(u)} className={`flex items-center px-6 py-4 cursor-pointer border-b border-gray-50 transition-all ${activeChat?._id === u._id ? "bg-green-50/70 border-l-4 border-l-green-500" : "hover:bg-gray-50 border-l-4 border-l-transparent"}`}>
                <div className="relative">
                  <img src={u.image || `https://ui-avatars.com/api/?name=${u.name}`} className="w-12 h-12 rounded-full mr-4 border border-gray-200 object-cover" alt="User" />
                  {u.isOnline && !hideOnline && <span className="absolute bottom-0 right-4 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>}
                </div>
                <div className="flex-1 truncate">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 text-sm truncate">{u.name}</h3>
                    {u.unread > 0 && <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{u.unread}</span>}
                  </div>
                  {u.lastMessage && !hideOnline ? (
                      <p className={`text-[12px] truncate mt-0.5 ${u.unread > 0 ? "text-gray-800 font-bold" : "text-gray-500 font-medium"}`}>{u.lastMessage}</p>
                  ) : u.isOnline && !hideOnline ? (
                      <p className="text-[11px] text-green-500 font-bold flex items-center gap-1 mt-0.5">Online</p>
                  ) : (
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5 truncate">Last seen: {formatLastSeen(u.lastSeen)}</p>
                  )}
                </div>
              </div>
            )})}
          </div>
        </div>

        {/* চ্যাট এরিয়া */}
        <div className={`flex-1 bg-[#E5DDD5] relative flex-col overflow-hidden ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://i.pinimg.com/originals/ab/ab/60/abab60f0bc0006e20f20c951da3588da.jpg')] bg-repeat" />
          {activeChat ? (
            <>
              <div className="h-20 bg-white/95 backdrop-blur-md px-4 md:px-8 flex items-center justify-between border-b border-gray-200 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <button onClick={() => { setActiveChat(null); localStorage.removeItem("activeChatEmail"); }} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all"><ArrowLeft size={24} /></button>
                  <img src={activeChat.image || `https://ui-avatars.com/api/?name=${activeChat.name}`} className="w-10 h-10 rounded-full border border-gray-200 object-cover" alt="Friend" />
                  <div>
                    <h2 className="font-bold text-gray-800 text-sm tracking-tight">{activeChat.name}</h2>
                    {!isBlocked && activeChat.isOnline ? (
                        <p className="text-[11px] text-green-600 font-bold">Online</p>
                    ) : (
                        <p className="text-[11px] text-gray-500 font-medium">Last seen at {formatLastSeen(activeChat.lastSeen)}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {iBlockedThem ? (
                    <button onClick={() => handleBlockAction('unblock')} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 text-xs font-bold rounded-full transition-all border border-red-100 flex items-center gap-1 shadow-sm"><Ban size={14} /> Unblock</button>
                  ) : !theyBlockedMe ? (
                    <button onClick={() => handleBlockAction('block')} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all" title="ব্লক করুন"><Ban size={18} /></button>
                  ) : null}
                  <MoreVertical size={20} className="p-1 text-gray-400 cursor-pointer hover:text-gray-600 rounded-full" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-3 z-10 custom-scrollbar">
                {Array.isArray(messages) && messages.map((m, i) => {
                  const isMe = m.senderEmail === session.user.email;
                  const isSeen = m.isRead;
                  const isDelivered = activeChat?.isOnline && !isSeen; 
                  return (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMe ? "self-end" : "self-start"}`}>
                    <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm relative ${isMe ? "bg-[#D9FDD3] text-gray-800 rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none"}`}>
                      {m.image && <img src={m.image} className="rounded-xl mb-2 max-h-64 w-full object-cover shadow-sm border border-green-100" alt="attachment" />}
                      <p className="leading-relaxed text-black text-[15px]">{m.text}</p>
                      <span className="text-[9px] text-gray-500 mt-1 flex justify-end items-center gap-1 font-medium">
                        {m.time}
                        {isMe && (
                          isSeen ? <CheckCheck size={15} className="text-blue-500 ml-1" /> 
                          : isDelivered ? <CheckCheck size={15} className="text-gray-400 ml-1" /> 
                          : <Check size={15} className="text-gray-400 ml-1" />
                        )}
                      </span>
                    </div>
                  </motion.div>
                )})}
                <AnimatePresence>
                    {isTyping && !isBlocked && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="self-start mt-2">
                            <div className="bg-white px-4 py-3 rounded-2xl shadow-sm rounded-tl-none flex items-center gap-2">
                                <span className="text-xs text-green-600 font-bold italic">{activeChat.name} টাইপ করছে</span>
                                <div className="flex gap-1 mt-1">
                                    <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                    <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                    <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {isBlocked ? (
                <div className="p-4 md:p-6 bg-white/50 backdrop-blur-sm z-20 flex justify-center items-center border-t border-gray-100 min-h-[80px]">
                  {iBlockedThem ? (
                    <div className="bg-white px-5 py-3 rounded-full shadow-sm border border-gray-200 flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-600">আপনি এই ইউজারকে ব্লক করেছেন।</span>
                      <button onClick={() => handleBlockAction('unblock')} className="text-sm font-bold bg-red-500 text-white hover:bg-red-600 px-5 py-2 rounded-full transition-all shadow-md active:scale-95 flex items-center gap-2"><Ban size={16} /> Unblock করুন</button>
                    </div>
                  ) : (
                    <div className="bg-white px-6 py-3 rounded-full shadow-sm border border-red-100 flex items-center gap-2">
                      <Ban size={18} className="text-red-500"/><span className="text-sm font-bold text-red-500 tracking-wide">You are blocked by this user</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 md:p-5 bg-transparent z-20">
                  <AnimatePresence>
                    {selectedImage && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-4 relative inline-block bg-white p-2 rounded-2xl shadow-lg ml-2">
                        <img src={selectedImage} className="h-24 w-24 object-cover rounded-xl border border-gray-100" alt="preview" />
                        <button onClick={() => setSelectedImage(null)} className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 shadow-md text-white p-1.5 rounded-full transition-all"><X size={14} /></button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <form onSubmit={handleSendMessage} className="flex items-center gap-1 md:gap-2 bg-white pl-2 pr-2 py-1.5 md:pl-4 md:pr-2.5 md:py-2 rounded-full shadow-[0_5px_20px_rgba(0,0,0,0.05)] border border-gray-100">
                    <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-2 rounded-full transition-all flex-shrink-0 ${showEmojiPicker ? "bg-green-100 text-green-600" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}><Smile size={22} /></button>
                    <button type="button" onClick={() => fileInputRef.current.click()} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all flex-shrink-0"><Paperclip size={22} /></button>
                    <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={(e) => setSelectedImage(URL.createObjectURL(e.target.files[0]))} />
                    <input ref={inputRef} type="text" value={inputText} onChange={handleInputTyping} disabled={isSending} placeholder={isSending ? "পাঠানো হচ্ছে..." : t.inputPlaceholder} className="flex-1 bg-transparent px-2 py-2 text-[15px] outline-none text-black font-medium placeholder-gray-400 min-w-0 disabled:opacity-50" />
                    <button 
                      type="submit" 
                      disabled={isSending || (!inputText.trim() && !selectedImage)} 
                      className="w-10 h-10 md:w-11 md:h-11 flex-shrink-0 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-400"
                    >
                      {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-1 md:ml-0.5" />}
                    </button>
                  </form>
                  {showEmojiPicker && <div className="absolute bottom-24 left-4 md:left-8 z-50 shadow-2xl rounded-2xl overflow-hidden border border-gray-100"><EmojiPicker onEmojiClick={(o) => setInputText(p => p + o.emoji)} searchDisabled skinTonesDisabled /></div>}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center z-10 bg-white/30 backdrop-blur-sm">
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl border-[6px] border-green-50"><Globe size={50} className="text-green-500" /></div>
              <h2 className="text-3xl font-black text-gray-800 mb-2 tracking-tight">{t.selectedFriend}</h2>
              <p className="text-gray-500 text-[15px] max-w-sm font-medium leading-relaxed">{t.startChatMsg}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}