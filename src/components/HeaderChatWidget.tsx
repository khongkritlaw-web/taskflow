import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  X, 
  User, 
  ChevronLeft,
  Clock,
  MessageCircle,
  Sparkles,
  Paperclip,
  Smile,
  FileText,
  Download,
  Image as ImageIcon
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  where, 
  onSnapshot, 
  addDoc, 
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';

interface HeaderChatWidgetProps {
  sessionUser: {
    userId: string;
    displayName?: string;
    avatarUrl?: string;
  };
  accentColor: string;
  darkMode: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  isRead?: boolean;
  fileData?: string;
  fileName?: string;
  fileType?: string;
  sticker?: string;
}

const STICKERS = [
  { char: '😊', label: 'สวัสดีครับ/ค่ะ' },
  { char: '👍', label: 'เยี่ยมมาก' },
  { char: '🎉', label: 'ยินดีด้วย' },
  { char: '💖', label: 'ขอบคุณมาก' },
  { char: '👏', label: 'เก่งมากๆ' },
  { char: '😮', label: 'ว้าว!' },
  { char: '🙏', label: 'ขอบคุณครับ/ค่ะ' },
  { char: '🔥', label: 'สุดยอด' },
  { char: '💡', label: 'ไอเดียเจ๋ง' },
  { char: '🎯', label: 'สำเร็จแล้ว' },
  { char: '⭐', label: 'ยอดเยี่ยม' },
  { char: '💪', label: 'สู้ๆ นะ' },
  { char: '🥺', label: 'รบกวนด้วยนะ' },
  { char: '🥰', label: 'รักเลย' },
  { char: '✨', label: 'วิ้งค์ๆ' },
  { char: '🤣', label: 'ฮ่าๆๆ' },
];

interface UserListItem {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  lastText?: string;
  lastTime?: string;
  unread?: boolean;
}

export default function HeaderChatWidget({
  sessionUser,
  accentColor,
  darkMode
}: HeaderChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'threads' | 'chat'>(
    sessionUser.userId === 'admin' ? 'threads' : 'chat'
  );
  
  // All active chat messages for the currently selected user thread
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Users threads (for Admin view)
  const [threads, setThreads] = useState<UserListItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserListItem[]>([]);
  
  // Notification badge logic
  const [hasUnread, setHasUnread] = useState(false);
  const [lastOpenedTime, setLastOpenedTime] = useState<number>(() => {
    const saved = localStorage.getItem(`chat_last_opened_${sessionUser.userId}`);
    return saved ? parseInt(saved, 10) : Date.now();
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showStickers, setShowStickers] = useState(false);

  // Auto-delete chat messages older than 15 days automatically
  useEffect(() => {
    const deleteOldChats = async () => {
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
      const cutoffStr = fifteenDaysAgo.toISOString();

      const chatsCol = collection(db, 'chats');
      const q = query(chatsCol, where('createdAt', '<', cutoffStr));
      try {
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const deletePromises = snapshot.docs.map(docSnap => 
            deleteDoc(doc(db, 'chats', docSnap.id))
          );
          await Promise.all(deletePromises);
          console.log(`Auto-deleted ${deletePromises.length} chat documents older than 15 days.`);
        }
      } catch (err) {
        console.error('Failed to auto-delete old chats:', err);
      }
    };

    deleteOldChats();
  }, []);

  // Mark incoming messages as read when the thread is open and viewed
  useEffect(() => {
    if (!isOpen || !selectedUser || messages.length === 0) return;

    const unreadReceivedMsgs = messages.filter(
      m => m.senderId !== sessionUser.userId && !m.isRead
    );

    if (unreadReceivedMsgs.length > 0) {
      unreadReceivedMsgs.forEach(async (msg) => {
        try {
          const msgRef = doc(db, 'chats', msg.id);
          await updateDoc(msgRef, { isRead: true });
        } catch (err) {
          console.error('Failed to mark message as read:', err);
        }
      });
    }
  }, [isOpen, selectedUser, messages, sessionUser.userId]);

  // Auto scroll to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // If user is NOT admin, pre-set selectedUser to 'admin'
  useEffect(() => {
    if (sessionUser.userId !== 'admin') {
      setSelectedUser({
        userId: 'admin',
        displayName: 'ผู้ดูแลระบบ (Admin)'
      });
      setActiveTab('chat');
    } else {
      setSelectedUser(null);
      setActiveTab('threads');
    }
  }, [sessionUser.userId]);

  // Load all system users once so admin can see display names even for inactive threads
  useEffect(() => {
    if (sessionUser.userId !== 'admin') return;
    
    const usersCol = collection(db, 'users');
    const unsubscribe = onSnapshot(usersCol, (snapshot) => {
      const uList: UserListItem[] = [];
      snapshot.forEach(docSnap => {
        if (docSnap.id !== 'admin') {
          const data = docSnap.data();
          uList.push({
            userId: docSnap.id,
            displayName: data.displayName || data.userId || docSnap.id,
            avatarUrl: data.avatarUrl || ''
          });
        }
      });
      setAllUsers(uList);
    });

    return () => unsubscribe();
  }, [sessionUser.userId]);

  // Real-time Chat Threads (For admin) or Chat notification checks (For users)
  useEffect(() => {
    const chatsCol = collection(db, 'chats');
    const q = query(chatsCol, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMsgs: ChatMessage[] = [];
      const threadsMap: { [userId: string]: { lastText: string; lastTime: string; lastSenderId: string } } = {};

      snapshot.forEach(docSnap => {
        const data = docSnap.data() as ChatMessage;
        const msg = { id: docSnap.id, ...data };
        allMsgs.push(msg);

        if (data.userId && !threadsMap[data.userId]) {
          threadsMap[data.userId] = {
            lastText: data.text || '',
            lastTime: data.createdAt || '',
            lastSenderId: data.senderId
          };
        }
      });

      // Check for unread notification badge
      if (sessionUser.userId === 'admin') {
        // Admin: Unread if any last message is NOT from admin and created after lastOpenedTime
        const unreadExists = allMsgs.some(
          m => m.senderId !== 'admin' && new Date(m.createdAt).getTime() > lastOpenedTime
        );
        setHasUnread(unreadExists);

        // Build active thread list
        const activeThreads = Object.keys(threadsMap).map(uId => {
          const userMeta = allUsers.find(u => u.userId === uId);
          const lastMsgTime = new Date(threadsMap[uId].lastTime).getTime();
          return {
            userId: uId,
            displayName: userMeta?.displayName || uId,
            avatarUrl: userMeta?.avatarUrl || '',
            lastText: threadsMap[uId].lastText,
            lastTime: threadsMap[uId].lastTime,
            unread: threadsMap[uId].lastSenderId !== 'admin' && lastMsgTime > lastOpenedTime
          };
        });

        // Add any users that haven't chatted yet but exist in the system to the bottom
        const idleUsers = allUsers.filter(u => !threadsMap[u.userId]);
        const combined = [...activeThreads, ...idleUsers.map(u => ({
          ...u,
          lastText: 'ยังไม่มีข้อความสนทนา',
          lastTime: '',
          unread: false
        }))];

        setThreads(combined);
      } else {
        // Regular User: Unread if last message is from admin and after lastOpenedTime
        const userThreadMsgs = allMsgs.filter(m => m.userId === sessionUser.userId);
        if (userThreadMsgs.length > 0) {
          const lastMsg = userThreadMsgs[0];
          const isFromAdmin = lastMsg.senderId === 'admin';
          const isNewer = new Date(lastMsg.createdAt).getTime() > lastOpenedTime;
          setHasUnread(isFromAdmin && isNewer);
        } else {
          setHasUnread(false);
        }
      }
    });

    return () => unsubscribe();
  }, [sessionUser.userId, allUsers, lastOpenedTime]);

  // Read message chain for currently selected user
  useEffect(() => {
    if (!selectedUser) {
      setMessages([]);
      return;
    }

    // Determine target userId for messaging
    const threadUserId = sessionUser.userId === 'admin' ? selectedUser.userId : sessionUser.userId;

    const chatsCol = collection(db, 'chats');
    const q = query(
      chatsCol,
      where('userId', '==', threadUserId),
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
    });

    return () => unsubscribe();
  }, [selectedUser, sessionUser.userId]);

  const handleOpenToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      // Set opened timestamp to clear badge
      const now = Date.now();
      setLastOpenedTime(now);
      localStorage.setItem(`chat_last_opened_${sessionUser.userId}`, now.toString());
      setHasUnread(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedUser) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);

    const threadUserId = sessionUser.userId === 'admin' ? selectedUser.userId : sessionUser.userId;
    const senderName = sessionUser.displayName || sessionUser.userId;

    try {
      await addDoc(collection(db, 'chats'), {
        userId: threadUserId,
        senderId: sessionUser.userId,
        senderName: senderName,
        text: textToSend,
        createdAt: new Date().toISOString()
      });
      
      // Update local lastOpenedTime so we don't trigger self-unread flags
      const now = Date.now();
      setLastOpenedTime(now);
      localStorage.setItem(`chat_last_opened_${sessionUser.userId}`, now.toString());
    } catch (err) {
      console.error('Failed to dispatch message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const sendAttachment = async (base64Data: string, fileName: string, fileType: string) => {
    if (!selectedUser) return;
    setIsSending(true);

    const threadUserId = sessionUser.userId === 'admin' ? selectedUser.userId : sessionUser.userId;
    const senderName = sessionUser.displayName || sessionUser.userId;

    try {
      await addDoc(collection(db, 'chats'), {
        userId: threadUserId,
        senderId: sessionUser.userId,
        senderName: senderName,
        text: fileType.startsWith('image/') ? `🖼️ ส่งรูปภาพ: ${fileName}` : `📁 ส่งไฟล์: ${fileName}`,
        fileData: base64Data,
        fileName: fileName,
        fileType: fileType,
        createdAt: new Date().toISOString(),
        isRead: false
      });
      
      const now = Date.now();
      setLastOpenedTime(now);
      localStorage.setItem(`chat_last_opened_${sessionUser.userId}`, now.toString());
    } catch (err) {
      console.error('Failed to send attachment:', err);
      alert('ส่งไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้งค่ะ');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 1MB to fit Firestore's document size limit)
    if (file.size > 1024 * 1024) {
      alert('ไฟล์มีขนาดใหญ่เกิน 1MB ค่ะ กรุณาเลือกไฟล์ที่มีขนาดเล็กกว่านี้');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      await sendAttachment(base64Data, file.name, file.type);
    };
    reader.readAsDataURL(file);
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleSendSticker = async (stickerChar: string, label: string) => {
    if (!selectedUser) return;
    setIsSending(true);
    setShowStickers(false);

    const threadUserId = sessionUser.userId === 'admin' ? selectedUser.userId : sessionUser.userId;
    const senderName = sessionUser.displayName || sessionUser.userId;

    try {
      await addDoc(collection(db, 'chats'), {
        userId: threadUserId,
        senderId: sessionUser.userId,
        senderName: senderName,
        text: `[สติกเกอร์] ${label}`,
        sticker: stickerChar,
        createdAt: new Date().toISOString(),
        isRead: false
      });
      
      const now = Date.now();
      setLastOpenedTime(now);
      localStorage.setItem(`chat_last_opened_${sessionUser.userId}`, now.toString());
    } catch (err) {
      console.error('Failed to send sticker:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="relative font-sans">
      {/* Trigger Button */}
      <button
        onClick={handleOpenToggle}
        className={`w-10 h-10 border border-slate-200 text-slate-500 bg-white rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all relative dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 ${
          isOpen ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-950' : ''
        }`}
        title={sessionUser.userId === 'admin' ? "แชทช่วยเหลือและดูแลผู้ใช้" : "พูดคุยติดต่อผู้ดูแลระบบ"}
      >
        <MessageSquare className={`w-4.5 h-4.5 ${hasUnread ? 'text-indigo-500 animate-pulse' : ''}`} />
        
        {hasUnread && (
          <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950 animate-bounce shadow-md">
            !
          </span>
        )}
      </button>

      {/* Popover container */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop layer */}
            <div 
              className="fixed inset-0 z-40 bg-transparent" 
              onClick={() => setIsOpen(false)} 
            />

            {/* Float panel */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 mt-2 w-80 sm:w-96 h-[480px] rounded-3xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden dark:bg-slate-900 dark:border-slate-800 flex flex-col"
            >
              {/* HEADER */}
              <div className="p-4 bg-slate-50/90 dark:bg-slate-900/90 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  {activeTab === 'chat' && sessionUser.userId === 'admin' && (
                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        setActiveTab('threads');
                      }}
                      className="p-1 -ml-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  <div className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-black text-slate-800 dark:text-white truncate max-w-[180px]">
                      {sessionUser.userId === 'admin' 
                        ? (selectedUser ? `คุยกับ: ${selectedUser.displayName}` : 'กล่องแชทดูแลสมาชิก') 
                        : 'ส่งข้อความคุยกับแอดมิน'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {sessionUser.userId === 'admin' && !selectedUser && (
                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> แอดมินหลัก
                    </span>
                  )}
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* BODY - SWITCH TABS */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-950/10">
                {activeTab === 'threads' && sessionUser.userId === 'admin' ? (
                  /* Threads list for Admin */
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
                    {threads.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 italic text-xs gap-2 py-20">
                        <User className="w-8 h-8 text-slate-300 dark:text-slate-700 animate-pulse" />
                        <span>ยังไม่มีผู้ใช้งานอื่นสมัครสมาชิกในระบบค่ะ</span>
                      </div>
                    ) : (
                      threads.map((t) => (
                        <button
                          key={t.userId}
                          onClick={() => {
                            setSelectedUser(t);
                            setActiveTab('chat');
                          }}
                          className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all gap-3 hover:bg-white dark:hover:bg-slate-900 border ${
                            t.unread 
                              ? 'bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/30' 
                              : 'bg-transparent border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Avatar */}
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300 overflow-hidden border border-slate-300/40">
                              {t.avatarUrl ? (
                                <img src={t.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <span>{t.displayName.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            
                            {/* User details */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 justify-between">
                                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                                  {t.displayName}
                                </h4>
                                {t.unread && (
                                  <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-[10px] text-slate-450 dark:text-slate-550 truncate mt-0.5">
                                {t.lastText || 'เปิดแชทแรกได้เลยค่ะ'}
                              </p>
                            </div>
                          </div>

                          {/* Time */}
                          {t.lastTime && (
                            <span className="text-[8.5px] font-semibold text-slate-400 font-mono flex-shrink-0">
                              {new Date(t.lastTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  /* Message loop panel (User thread or specific active Admin thread) */
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* Message Log */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 text-xs gap-2 py-10">
                          <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                          <span>ยังไม่มีประวัติการส่งข้อความค่ะ</span>
                          <span className="text-[10px] text-slate-400 max-w-[240px]">
                            {sessionUser.userId === 'admin' 
                              ? 'คุณสามารถเริ่มส่งทักทายหรือให้คำแนะแนะนำก่อนได้เลยค่ะ' 
                              : 'พิมพ์เพื่อยื่นข้อสอบถาม สอบถามข้อมูล หรือแจ้งปัญหาการใช้งานได้ทันทีค่ะ'}
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
                              {/* Sender metadata name */}
                              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mb-0.5 px-1 flex items-center gap-1">
                                {!isMe && msg.senderName}
                                <span className="text-[8px] font-mono text-slate-350 dark:text-slate-600 font-normal">
                                  {new Date(msg.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </span>

                              {/* Chat bubble */}
                              <div
                                className={msg.sticker ? "p-1" : `p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-xs ${
                                  isMe
                                    ? 'rounded-tr-none'
                                    : 'bg-slate-100 text-slate-850 dark:bg-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/60 dark:border-slate-700'
                                }`}
                                style={isMe && !msg.sticker ? { backgroundColor: accentColor || '#4f46e5', color: 'var(--accent-text, #ffffff)' } : {}}
                              >
                                {msg.sticker ? (
                                  <div className="flex flex-col items-center">
                                    <span className="text-5xl my-1 animate-pulse select-none" style={{ animationDuration: '2s' }}>{msg.sticker}</span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold bg-slate-100/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-full mt-1">
                                      {msg.text.replace('[สติกเกอร์] ', '')}
                                    </span>
                                  </div>
                                ) : msg.fileData ? (
                                  <div className="space-y-2">
                                    {msg.fileType?.startsWith('image/') ? (
                                      <div className="relative rounded-lg overflow-hidden border border-slate-200/50 dark:border-slate-700/50 max-w-[200px] cursor-pointer group bg-slate-50 dark:bg-slate-950">
                                        <img 
                                          src={msg.fileData} 
                                          alt={msg.fileName} 
                                          className="w-full h-auto object-cover max-h-[160px] group-hover:scale-102 transition-transform duration-200" 
                                          onClick={() => {
                                            const w = window.open();
                                            if (w) {
                                              w.document.write(`<img src="${msg.fileData}" style="max-width:100%; height:auto;" />`);
                                            }
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px] font-bold">
                                          ดูรูปขนาดเต็ม
                                        </div>
                                      </div>
                                    ) : (
                                      <a
                                        href={msg.fileData}
                                        download={msg.fileName}
                                        className="flex items-center gap-2 p-2 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors text-left text-slate-800 dark:text-slate-200 min-w-[150px] max-w-[240px]"
                                      >
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500 flex-shrink-0">
                                          <FileText className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[10px] font-bold truncate text-slate-700 dark:text-slate-200">{msg.fileName}</p>
                                          <p className="text-[8px] text-slate-400">ดาวน์โหลด</p>
                                        </div>
                                        <Download className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  msg.text
                                )}
                              </div>

                              {/* Read Receipts Status */}
                              {isMe && (
                                <span className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5 px-1 self-end font-medium">
                                  {msg.isRead ? 'อ่านแล้ว ✓' : 'ส่งแล้ว'}
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Stickers Panel */}
                    <AnimatePresence>
                      {showStickers && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="p-2 bg-slate-50 border-t border-slate-200/60 dark:bg-slate-950 dark:border-slate-800 grid grid-cols-4 gap-1.5 max-h-[140px] overflow-y-auto flex-shrink-0"
                        >
                          {STICKERS.map((st) => (
                            <button
                              key={st.char}
                              type="button"
                              onClick={() => handleSendSticker(st.char, st.label)}
                              className="flex flex-col items-center p-1.5 rounded-xl bg-white hover:bg-indigo-50/40 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-100 dark:border-slate-800 transition-all hover:scale-105 active:scale-95"
                              title={st.label}
                            >
                              <span className="text-xl select-none">{st.char}</span>
                              <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold mt-0.5 truncate max-w-full">
                                {st.label}
                              </span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Chat Input form */}
                    <form 
                      onSubmit={handleSendMessage}
                      className="p-3 bg-white border-t border-slate-100 dark:bg-slate-900 dark:border-slate-800 flex items-center gap-1.5 flex-shrink-0"
                    >
                      {/* Hidden File Input */}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                        className="hidden" 
                        accept="image/*, .pdf, .doc, .docx, .xls, .xlsx, .txt, .zip, .rar"
                      />

                      {/* File Upload Button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-indigo-500 transition-all flex-shrink-0"
                        title="ส่งรูปภาพ/ไฟล์"
                        disabled={isSending}
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                      </button>

                      {/* Sticker Selector Toggle Button */}
                      <button
                        type="button"
                        onClick={() => setShowStickers(!showStickers)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center border text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-indigo-500 transition-all flex-shrink-0 ${
                          showStickers ? 'border-indigo-500 bg-indigo-50/40 text-indigo-500' : 'border-slate-200 dark:border-slate-800'
                        }`}
                        title="ส่งสติกเกอร์"
                        disabled={isSending}
                      >
                        <Smile className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={sessionUser.userId === 'admin' ? "พิมพ์ข้อความตอบกลับ..." : "ส่งแชทถามแอดมิน..."}
                        className="flex-1 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-150"
                        maxLength={500}
                        disabled={isSending}
                      />
                      <button
                        type="submit"
                        disabled={!inputText.trim() || isSending}
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white disabled:opacity-40 disabled:hover:bg-slate-800 dark:disabled:hover:bg-slate-200 transition-all flex-shrink-0"
                        style={inputText.trim() && !isSending ? { backgroundColor: accentColor } : {}}
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
