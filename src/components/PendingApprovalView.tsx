import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Megaphone, 
  MessageSquare, 
  LogOut, 
  Send, 
  Clock, 
  User, 
  Info,
  Calendar,
  Lock,
  Mail,
  Phone
} from 'lucide-react';
import { 
  collection, 
  doc, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../firebase';

interface PendingApprovalViewProps {
  sessionUser: {
    userId: string;
    email: string;
    phone: string;
    displayName?: string;
    avatarUrl?: string;
  };
  accentColor: string;
  darkMode: boolean;
  onLogout: () => void;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export default function PendingApprovalView({ 
  sessionUser, 
  accentColor, 
  darkMode, 
  onLogout 
}: PendingApprovalViewProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Subscribe to Announcements
  useEffect(() => {
    const annCol = collection(db, 'announcements');
    const q = query(annCol, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const annList: Announcement[] = [];
      snapshot.forEach(docSnap => {
        annList.push({
          id: docSnap.id,
          ...docSnap.data()
        } as Announcement);
      });
      setAnnouncements(annList);
    }, (error) => {
      console.error('Failed to subscribe to announcements:', error);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to User-Admin Live Chat Thread
  useEffect(() => {
    const chatsCol = collection(db, 'chats');
    const q = query(
      chatsCol, 
      where('userId', '==', sessionUser.userId),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList: ChatMessage[] = [];
      snapshot.forEach(docSnap => {
        msgList.push({
          id: docSnap.id,
          ...docSnap.data()
        } as ChatMessage);
      });
      setMessages(msgList);
      setIsLoadingMessages(false);
      
      // Auto-scroll to bottom of chat
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }, (error) => {
      console.error('Failed to subscribe to chat thread:', error);
      setIsLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [sessionUser.userId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!typedMessage.trim()) return;

    const textToSend = typedMessage.trim();
    setTypedMessage('');

    try {
      const newMessage = {
        userId: sessionUser.userId,
        senderId: sessionUser.userId,
        senderName: sessionUser.displayName || sessionUser.userId,
        text: textToSend,
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'chats'), newMessage);
    } catch (err) {
      console.error('Failed to dispatch user message to admin:', err);
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100 dark' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Upper Navigation bar */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md animate-pulse" style={{ backgroundColor: accentColor }}>
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight leading-tight uppercase">
              TaskFlow Space
            </h1>
            <span className="text-[10px] text-amber-500 font-extrabold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              รอพิจารณาอนุมัติเข้าระบบผู้บริหาร
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden xs:flex flex-col text-right">
            <span className="text-xs font-black text-slate-700 dark:text-slate-200 leading-none">
              {sessionUser.displayName || sessionUser.userId}
            </span>
            <span className="text-[10px] text-slate-450 leading-none mt-1">
              {sessionUser.email}
            </span>
          </div>
          
          <button
            onClick={onLogout}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 text-xs font-bold text-rose-600 transition-all hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </header>

      {/* Main Grid container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:grid lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Status and Announcements (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Status info card */}
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-base font-black text-slate-800 dark:text-slate-100">
                สวัสดีค่ะคุณ {sessionUser.displayName || sessionUser.userId} 👋
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                บัญชีไอดีใหม่ของคุณได้รับการลงทะเบียนเรียบร้อยแล้วค่ะ แต่ด้วยเหตุผลความปลอดภัยสูงสุดของข้อมูลผู้บริหาร 
                <span className="text-amber-500 font-extrabold mx-1">จำเป็นต้องได้รับการตรวจสอบและกดยืนยันตัวตนสิทธิ์การเข้าใช้งานจากผู้ดูแลระบบ (Admin) ก่อนใช้งานบอร์ดงานค่ะ</span>
              </p>
              <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
                <span className="text-[10px] font-extrabold bg-slate-100 dark:bg-slate-950 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" style={{ color: accentColor }} />
                  {sessionUser.email}
                </span>
                <span className="text-[10px] font-extrabold bg-slate-100 dark:bg-slate-950 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" style={{ color: accentColor }} />
                  {sessionUser.phone}
                </span>
              </div>
            </div>
          </section>

          {/* Announcements block (แจ้งประกาศต่างๆ) */}
          <section className="flex-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-col">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 flex-shrink-0">
              <Megaphone className="w-5 h-5 text-indigo-500 animate-pulse" />
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                📢 ประกาศและข่าวสารสำคัญจากผู้ดูแลระบบ
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 max-h-[420px] lg:max-h-none space-y-4">
              <AnimatePresence initial={false}>
                {announcements.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 italic text-xs gap-2">
                    <Info className="w-5 h-5 text-slate-350" />
                    <span>ยังไม่มีเอกสารประกาศประกาศในขณะนี้ค่ะ</span>
                  </div>
                ) : (
                  announcements.map((ann, idx) => (
                    <motion.div
                      key={ann.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-150 border-l-4 dark:bg-slate-950 dark:border-slate-850 hover:shadow-sm hover:border-slate-200 transition-all"
                      style={{ borderLeftColor: accentColor }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 leading-tight">
                          {ann.title}
                        </h4>
                        <span className="text-[9px] font-bold text-slate-400 no-wrap flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(ann.createdAt).toLocaleDateString('th-TH', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 whitespace-pre-wrap leading-relaxed font-semibold">
                        {ann.content}
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-900 flex items-center gap-1.5 text-[9px] text-slate-400 font-extrabold uppercase">
                        <User className="w-3 h-3" />
                        <span>เขียนโดย: {ann.author === 'admin' ? 'ฝ่ายประชาสัมพันธ์ผู้ดูแลระบบ (Admin)' : ann.author}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: Real-time Chat with Admin (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-[520px] lg:h-auto min-h-[480px]">
          <section className="h-full bg-white rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-col overflow-hidden">
            
            {/* Chat header */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 dark:bg-slate-950/40 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8.5 h-8.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 flex items-center justify-center animate-pulse">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-100">
                    💬 ไลฟ์แชทสนับสนุนทางเทคนิค
                  </h3>
                  <span className="text-[9px] text-slate-450 font-bold block leading-none mt-1">
                    ส่งข้อความหาแอดมิน เพื่อส่งเอกสารขอสิทธิ์ได้ทันทีค่ะ
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-extrabold text-emerald-500 uppercase tracking-widest">
                  เชื่อมคลาวด์สด
                </span>
              </div>
            </div>

            {/* Chat message flow container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/30 dark:bg-slate-950/10">
              {isLoadingMessages ? (
                <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs italic gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  <span>กำลังโหลดบทสนทนา...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full w-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 text-xs p-6 gap-2">
                  <MessageSquare className="w-7 h-7 text-slate-300" />
                  <span className="font-semibold text-slate-550 leading-relaxed">
                    ยังไม่มีข้อความส่งหากันในปัจจุบันค่ะ <br />
                    คุณสามารถพิมพ์ทักทายแอดมินด้านล่างนี้ได้เลยค่ะ!
                  </span>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === sessionUser.userId;
                  return (
                    <div 
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <div className="text-[9px] font-black text-slate-400 mb-0.5 px-1 truncate max-w-full">
                        {isMe ? 'คุณ' : 'ผู้ดูแลระบบ (Admin)'}
                      </div>
                      
                      <div 
                        className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm break-words max-w-full ${
                          isMe 
                            ? 'rounded-tr-sm' 
                            : 'bg-slate-100 text-slate-850 border border-slate-200 rounded-tl-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100'
                        }`}
                        style={isMe ? { backgroundColor: accentColor || '#4f46e5', color: 'var(--accent-text, #ffffff)' } : {}}
                      >
                        {msg.text}
                      </div>

                      <span className="text-[8px] text-slate-400 font-medium mt-1 px-1 flex items-center gap-1.5 select-none animate-fade-in">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(msg.createdAt).toLocaleTimeString('th-TH', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={scrollRef} />
            </div>

            {/* Chat Send Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-250 dark:bg-slate-900 dark:border-slate-800 flex gap-2 flex-shrink-0">
              <input
                type="text"
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                placeholder="พิมพ์ข้อความคุยกับแอดมินที่นี่..."
                className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold focus:outline-none focus:border-accent text-slate-700 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-100"
                style={{ '--accent': accentColor } as React.CSSProperties}
              />
              <button
                type="submit"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all hover:scale-103 active:scale-97 hover:brightness-105"
                style={{ backgroundColor: accentColor }}
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>

          </section>
        </div>

      </main>

    </div>
  );
}
