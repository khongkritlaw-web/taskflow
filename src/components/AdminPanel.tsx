import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Shield, 
  Megaphone, 
  MessageSquare, 
  Trash2, 
  UserCheck, 
  UserX, 
  Clock, 
  Plus, 
  Send, 
  Check, 
  Info,
  Calendar,
  Layers,
  Search,
  Bell
} from 'lucide-react';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  getDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { useDialog } from './CustomDialog';

interface AdminPanelProps {
  accentColor: string;
  darkMode: boolean;
}

interface UserProfile {
  userId: string;
  email: string;
  phone: string;
  password?: string;
  displayName?: string;
  avatarUrl?: string;
  isApproved?: boolean;
  isLocked?: boolean;
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

export default function AdminPanel({ 
  accentColor, 
  darkMode
}: AdminPanelProps) {
  const { showAlert, showConfirm } = useDialog();

  const triggerAlert = async (msg: string, type?: 'success' | 'warning' | 'error') => {
    const intent = type === 'error' ? 'danger' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info';
    const title = type === 'error' ? 'เกิดข้อผิดพลาด' : type === 'warning' ? 'คำเตือน' : type === 'success' ? 'สำเร็จ' : 'ข้อมูล';
    await showAlert(msg, title, intent);
  };

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [chatUsers, setChatUsers] = useState<{ userId: string; unreadCount: number; lastText: string; lastTime: string }[]>([]);
  
  // Announcement form state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [isPostingAnn, setIsPostingAnn] = useState(false);

  // Selected Chat Thread
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [adminReplyText, setAdminReplyText] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Search User state
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // 1. Fetch Users in Realtime
  useEffect(() => {
    const usersCol = collection(db, 'users');
    const unsubscribe = onSnapshot(usersCol, (snapshot) => {
      const uList: UserProfile[] = [];
      snapshot.forEach(docSnap => {
        const udata = docSnap.data();
        uList.push({
          userId: docSnap.id,
          email: udata.email || '',
          phone: udata.phone || '',
          password: udata.password || '',
          displayName: udata.displayName || '',
          avatarUrl: udata.avatarUrl || '',
          isApproved: udata.isApproved !== undefined ? udata.isApproved : (docSnap.id === 'admin' ? true : false),
          isLocked: udata.isLocked !== undefined ? udata.isLocked : false
        });
      });
      setUsers(uList);
    }, (error) => {
      console.error('Failed to subscribe users collection:', error);
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch Announcements in Realtime
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
      console.error('Failed to subscribe announcements collection:', error);
    });

    return () => unsubscribe();
  }, []);

  // 3. Keep Chat Users List updated with recent threads
  useEffect(() => {
    const chatsCol = collection(db, 'chats');
    const q = query(chatsCol, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const threadsMap: { [userId: string]: { lastText: string; lastTime: string } } = {};
      
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as ChatMessage;
        if (data.userId && !threadsMap[data.userId]) {
          threadsMap[data.userId] = {
            lastText: data.text || '',
            lastTime: data.createdAt || ''
          };
        }
      });

      const updatedChatUsers = Object.keys(threadsMap).map(uId => ({
        userId: uId,
        unreadCount: 0, // Simplified trigger
        lastText: threadsMap[uId].lastText,
        lastTime: threadsMap[uId].lastTime
      })).sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());

      setChatUsers(updatedChatUsers);
    });

    return () => unsubscribe();
  }, []);

  // 4. Fetch specific selected user message chain
  useEffect(() => {
    if (!selectedChatUser) {
      setChatMessages([]);
      return;
    }

    const chatsCol = collection(db, 'chats');
    const q = query(
      chatsCol, 
      where('userId', '==', selectedChatUser),
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
      setChatMessages(msgList);
      
      // Auto-scroll
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    });

    return () => unsubscribe();
  }, [selectedChatUser]);

  // Toggle user Approval
  const handleToggleApprove = async (user: UserProfile) => {
    const targetStatus = !user.isApproved;
    const actionLabel = targetStatus ? 'อนุมัติ' : 'ระงับ';

    const isConfirmed = await showConfirm(
      `คุณต้องการกดยื่นเรื่อง "${actionLabel}" สิทธิ์การเข้าใช้งาน ของคุณผู้ใช้ "${user.userId}" หรือไม่?`,
      'ยืนยันการดำเนินการ',
      targetStatus ? 'success' : 'warning'
    );
    if (!isConfirmed) return;

    try {
      const userRef = doc(db, 'users', user.userId);
      await updateDoc(userRef, {
        isApproved: targetStatus
      });
      await triggerAlert(`ดำเนินการ ${actionLabel} สิทธิ์คุณผู้ใช้งาน "${user.userId}" เรียบร้อยแล้วค่ะ`, 'success');
    } catch (err) {
      console.error('Failed to change user approval status:', err);
      // Fallback setDoc
      try {
        const userRef = doc(db, 'users', user.userId);
        await setDoc(userRef, { ...user, isApproved: targetStatus }, { merge: true });
        await triggerAlert(`ดำเนินการ ${actionLabel} สิทธิ์สำเร็จ (เรียบร้อยแบบฟอลแบ็ก)`, 'success');
      } catch (subErr) {
        await triggerAlert('ไม่สามารถดำเนินการอัพเดทได้ในขณะนี้ กรุณากรอกสิทธิ์ในคลาวด์อีกครั้ง', 'error');
      }
    }
  };

  // Toggle user Lock/Block status specifically
  const handleToggleLock = async (user: UserProfile) => {
    const targetLockStatus = !user.isLocked;
    const actionLabel = targetLockStatus ? 'ล็อกบัญชีเฉพาะเจาะจง' : 'ปลดล็อกบัญชี';

    const isConfirmed = await showConfirm(
      `คุณต้องการกดยื่นเรื่อง "${actionLabel}" บัญชีของคุณผู้ใช้ "${user.userId}" หรือไม่? (เมื่อล็อกแล้วผู้ใช้จะไม่สามารถทำกิจกรรมใดๆ ในระบบได้)`,
      'ยืนยันการดำเนินการ',
      targetLockStatus ? 'warning' : 'success'
    );
    if (!isConfirmed) return;

    try {
      const userRef = doc(db, 'users', user.userId);
      await updateDoc(userRef, {
        isLocked: targetLockStatus
      });
      await triggerAlert(`ดำเนินการ ${actionLabel} ผู้ใช้ "${user.userId}" เรียบร้อยแล้วค่ะ`, 'success');
    } catch (err) {
      console.error('Failed to change user lock status:', err);
      try {
        const userRef = doc(db, 'users', user.userId);
        await setDoc(userRef, { ...user, isLocked: targetLockStatus }, { merge: true });
        await triggerAlert(`ดำเนินการ ${actionLabel} ผู้ใช้ "${user.userId}" สำเร็จ (ฟอลแบ็ก)`, 'success');
      } catch (subErr) {
        await triggerAlert('ไม่สามารถอัปเดตสถานะการล็อกได้ในขณะนี้ กรุณาลองใหม่อีกครั้งค่ะ', 'error');
      }
    }
  };

  // Delete User Account specifically
  const handleDeleteUser = async (userId: string) => {
    if (userId === 'admin') {
      await triggerAlert('ไม่สามารถลบบัญชีผู้ดูแลระบบ (admin) ได้ค่ะ', 'error');
      return;
    }

    const isConfirmed = await showConfirm(
      `⚠️ คำเตือนถาวร: คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้งาน "${userId}" ออกจากระบบคลาวด์โดยสมบูรณ์? ข้อมูลทั้งหมดของผู้ใช้รายนี้จะถูกลบและไม่สามารถย้อนกลับได้ค่ะ`,
      'ยืนยันการลบบัญชีถาวร',
      'danger'
    );
    if (!isConfirmed) return;

    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      await triggerAlert(`ทำการลบบัญชีผู้ใช้ "${userId}" ออกจากระบบเรียบร้อยแล้วค่ะ`, 'success');
      if (selectedChatUser === userId) {
        setSelectedChatUser(null);
      }
    } catch (err) {
      console.error('Failed to delete user document:', err);
      await triggerAlert('ไม่สามารถทำการลบบัญชีนี้ได้ในขณะนี้ โปรดตรวจสอบสิทธิ์เชื่อมต่อคลาวด์อีกครั้งค่ะ', 'error');
    }
  };

  // Dispatch announcement
  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) {
      await triggerAlert('โปรดระบุหัวข้อข่าวรายละเอียดประกาศให้ครบถ้วนก่อนโพสต์ค่ะ', 'warning');
      return;
    }

    setIsPostingAnn(true);
    try {
      const docRef = await addDoc(collection(db, 'announcements'), {
        title: annTitle.trim(),
        content: annContent.trim(),
        createdAt: new Date().toISOString(),
        author: 'admin'
      });
      setAnnTitle('');
      setAnnContent('');
      await triggerAlert('ลงทะเบียนแจ้งประกาศข่าวสารบอร์ดบริหารสำเร็จเรียบร้อยค่ะ!', 'success');
    } catch (err) {
      console.error('Failed to build announcement:', err);
      await triggerAlert('เกิดปัญหาไม่สามารถโพสต์ประกาศในระบบได้ กรุณาลองใหม่อีกครั้งค่ะ', 'error');
    } finally {
      setIsPostingAnn(false);
    }
  };

  // Delete announcement
  const handleDeleteAnnouncement = async (id: string, title: string) => {
    const isConfirmed = await showConfirm(
      `ยืนยันการลบแบบถาวรข่าวประกาศหัวข้อ "${title}" หรือไม่? ข้อมูลนี้จะหายไปจากตู้ประกาศผู้ใช้ทั้งหมดทันที`,
      'ยืนยันการลบประกาศ',
      'danger'
    );
    if (!isConfirmed) return;

    try {
      await deleteDoc(doc(db, 'announcements', id));
      await triggerAlert('ลบโพสต์ข่าวสารประกาศเสร็จสิ้น', 'success');
    } catch (err) {
      await triggerAlert('ลบข่าวสารประกาศไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
    }
  };

  // Send admin chat reply
  const handleSendAdminReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!adminReplyText.trim() || !selectedChatUser) return;

    const reply = adminReplyText.trim();
    setAdminReplyText('');

    try {
      await addDoc(collection(db, 'chats'), {
        userId: selectedChatUser,
        senderId: 'admin',
        senderName: 'ผู้ดูแลระบบ (Admin)',
        text: reply,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to send admin chat reply:', err);
      await triggerAlert('เกิดปัญหาจัดส่งความแชทไม่สำเร็จ', 'error');
    }
  };

  // Computed counters
  const totalUsers = users.filter(u => u.userId !== 'admin').length;
  const pendingUsers = users.filter(u => u.userId !== 'admin' && !u.isApproved).length;
  const approvedUsers = users.filter(u => u.userId !== 'admin' && u.isApproved).length;

  const filteredUsers = users.filter(u => {
    if (u.userId === 'admin') return false;
    const term = userSearchTerm.toLowerCase();
    return (
      u.userId.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.phone.toLowerCase().includes(term) ||
      (u.displayName && u.displayName.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. Statistics Cards summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-405 font-extrabold uppercase tracking-widest block">คุณผู้สมัครทั้งหมด</span>
            <span className="text-xl font-black text-slate-800 dark:text-slate-100">{totalUsers} บัญชี</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center flex-shrink-0">
            <Info className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] text-slate-405 font-extrabold uppercase tracking-widest block">รอแอดมินยืนยัน</span>
            <span className="text-xl font-black text-amber-500">{pendingUsers} บัญชี</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-405 font-extrabold uppercase tracking-widest block">อนุมัติเข้าใช้งานแล้ว</span>
            <span className="text-xl font-black text-emerald-550">{approvedUsers} บัญชี</span>
          </div>
        </div>

      </div>

      {/* 2. Dual grid: Registered user management & Announcements creator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Registered users approvals (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
            
            {/* Header with Search */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" style={{ color: accentColor }} />
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                    👥 รายชื่อผู้สมัครและขออนุญาตสิทธิ์เข้าใช้ระบบ
                  </h3>
                  <span className="text-[10.5px] text-slate-450 block leading-tight mt-1 font-semibold">
                    ตรวจสอบประวัติความน่าเชื่อถือ สแกนไอดี ก่อนกดปลดล็อคกุญแจความปลอดภัยค่ะ
                  </span>
                </div>
              </div>

              {/* Search bar widget */}
              <div className="relative flex-shrink-0 w-full sm:w-48">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ/เบอร์..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full h-8.5 pl-8.5 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-indigo-400 font-semibold"
                />
              </div>
            </div>

            {/* List block */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-10 text-center text-slate-400 dark:text-slate-500 italic text-xs flex flex-col items-center gap-2">
                  <span className="w-12 h-12 rounded-full border bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                    <Users className="w-5 h-5 text-slate-350" />
                  </span>
                  <span>ไม่พบข้อมูลผู้ขอเปิดสิทธิ์บัญชีที่ตรงกับคำค้นหาค่ะ</span>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div 
                    key={user.userId}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-800 font-extrabold uppercase">
                        {user.userId.slice(0, 2)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                            {user.displayName || user.userId}
                          </span>
                          <span className="text-[9.5px] font-bold text-slate-400">
                            (@{user.userId})
                          </span>
                          
                          {/* Badge status */}
                          {user.isApproved ? (
                            <span className="text-[8px] font-extrabold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-sm dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/20">
                              ผ่านตรวจสอบ
                            </span>
                          ) : (
                            <span className="text-[8px] font-extrabold bg-amber-55 bg-opacity-10 text-amber-600 px-1.5 py-0.5 rounded-sm dark:text-amber-400 border border-amber-500/20">
                              รออนุมัติ
                            </span>
                          )}
                          {user.isLocked && (
                            <span className="text-[8px] font-extrabold bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-sm dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900/20">
                              🔒 บัญชีถูกล็อก
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-455 font-medium flex flex-col sm:flex-row gap-1 sm:gap-3">
                          <span className="flex items-center gap-1">✉️ {user.email}</span>
                          <span className="flex items-center gap-1">📞 {user.phone}</span>
                        </div>
                        {user.password && (
                          <div className="text-[9.5px] text-slate-400 font-mono select-all">
                            🔒 รหัสเข้า: {user.password}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {/* Chat link button */}
                      <button
                        onClick={() => setSelectedChatUser(user.userId)}
                        className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-extrabold flex items-center gap-1 transition-all ${
                          selectedChatUser === user.userId
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-400 text-indigo-600 dark:text-indigo-400 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>เปิดกล่องแชท</span>
                      </button>

                      {/* Approval switcher */}
                      <button
                        onClick={() => handleToggleApprove(user)}
                        className={`px-3 py-1.5 rounded-xl font-black text-[10px] flex items-center gap-1 transition-all text-white shadow-xs ${
                          user.isApproved 
                            ? 'bg-rose-500 hover:bg-rose-600 hover:scale-[1.02] active:scale-[0.98]' 
                            : 'bg-emerald-500 hover:bg-emerald-600 hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                      >
                        {user.isApproved ? (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>ระงับสิทธิ์</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>อนุมัติใช้งาน</span>
                          </>
                        )}
                      </button>

                      {/* Lock / Unlock Toggle Button */}
                      {user.userId !== 'admin' && (
                        <button
                          onClick={() => handleToggleLock(user)}
                          className={`px-3 py-1.5 rounded-xl font-black text-[10px] flex items-center gap-1 transition-all shadow-xs ${
                            user.isLocked
                              ? 'bg-amber-500 hover:bg-amber-600 text-white hover:scale-[1.02] active:scale-[0.98]'
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-850 dark:text-slate-200 dark:hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98]'
                          }`}
                          title={user.isLocked ? "คลิกเพื่อปลดล็อกบัญชีนี้" : "คลิกเพื่อล็อกบัญชีนี้เฉพาะเจาะจง"}
                        >
                          {user.isLocked ? "🔓 ปลดล็อก" : "🔒 ล็อกบัญชี"}
                        </button>
                      )}

                      {/* Delete User Account Button */}
                      {user.userId !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(user.userId)}
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-500 hover:text-rose-600 transition-all"
                          title="ลบบัญชีผู้ใช้งานและข้อมูลถาวร"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Announcements Publisher (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Post announcement Form */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <Megaphone className="w-5 h-5 text-indigo-500" />
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                📢 ประกาศและกระจายข่าวสารผู้จัดการใหม่
              </h3>
            </div>

            <form onSubmit={handlePublishAnnouncement} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">หัวข้อประกาศบอร์ดบริหาร</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="เช่น ประกาศปิดปรับปรุงระบบคืนค่าชำระ หรือ ดีลงานใหญ่..."
                  className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-400 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">รายละเอียดข้อความสารสนเทศ</label>
                <textarea
                  required
                  rows={4}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="พิมพ์ข้อความที่แอดมินต้องการแจ้งให้ทุกคนเห็นได้ที่นี่..."
                  className="w-full p-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-400 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-100 resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isPostingAnn}
                className="w-full h-10 rounded-xl font-bold text-xs text-white transition-all hover:brightness-105 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5 shadow-md disabled:bg-slate-350"
                style={{ backgroundColor: accentColor }}
              >
                {isPostingAnn ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>กำลังแผยแพร่...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>อัพโหลดประกาศข่าวประชาสัมพันธ์</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* 3. Realtime Interactivity: Active Customer Live Chat messaging thread & Published Announcements Feed list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Chat Thread Workspace (7 columns) */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-col h-[520px] overflow-hidden">
            
            {/* Chat header area */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 dark:bg-slate-950/40 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-500 animate-pulse" />
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-100">
                    💬 กล่องข้อความแชทคุยผู้ใช้งานในระบบ
                  </h3>
                  <span className="text-[9px] text-slate-450 block leading-none mt-1">
                    {selectedChatUser 
                      ? `กำลังพูดคุยกับคุณผู้ใช้: @${selectedChatUser}` 
                      : 'กรุณาเลือกผู้ใช้งานในตารางด้านบน เพื่อคุยแชทตอบคำถามทันที'
                    }
                  </span>
                </div>
              </div>

              {selectedChatUser && (
                <button
                  onClick={() => setSelectedChatUser(null)}
                  className="text-[9px] font-black bg-slate-205 hover:bg-slate-305 text-slate-600 px-2 py-1 rounded-lg"
                >
                  ปิดสนทนา
                </button>
              )}
            </div>

            {/* Messages box window */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/10 dark:bg-slate-950/5">
              {!selectedChatUser ? (
                <div className="h-full w-full flex flex-col items-center justify-center text-center text-slate-400 p-6 gap-2">
                  <Users className="w-10 h-10 text-slate-250 animate-bounce" />
                  <span className="text-xs font-semibold leading-relaxed text-slate-455">
                    ไม่มีไลฟ์แชทที่ถูกเลือกในขณะนี้ค่ะ <br />
                    กรุณาคลิกปุ่ม <strong className="text-indigo-500">"เปิดกล่องแชท"</strong> ที่รายชื่อผู้อื่นด้านบน <br />
                    เพื่อเริ่มส่งตอบคำถามหรือให้เอกสารอำนวยความสะดวกสบายได้ทันทีค่ะ
                  </span>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="h-full w-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 text-xs gap-1">
                  <MessageSquare className="w-8 h-8 text-slate-300" />
                  <span>ยังไม่มีข้อความคุยกันในห้องนี้ค่ะ</span>
                  <span className="text-[10px] text-slate-400">คุณสามารถเป็นคนเริ่มเปิดบทสนทนาพิมพ์ส่งคำแนะนำทักทายได้เลยค่ะ</span>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.senderId === 'admin';
                  return (
                    <div 
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <div className="text-[9.5px] font-black text-slate-400 mb-0.5 px-1 truncate">
                        {isMe ? 'คุณ (แอดมิน)' : `@${msg.userId}`}
                      </div>

                      <div 
                        className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm break-words max-w-full ${
                          isMe 
                            ? 'text-white rounded-tr-none' 
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none dark:bg-slate-850 dark:border-slate-800 dark:text-slate-100'
                        }`}
                        style={isMe ? { backgroundColor: accentColor } : {}}
                      >
                        {msg.text}
                      </div>

                      <span className="text-[8px] text-slate-400 font-medium mt-1 px-1 flex items-center gap-1 select-none">
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
              <div ref={chatScrollRef} />
            </div>

            {/* Chat Send Input Form */}
            <form onSubmit={handleSendAdminReply} className="p-3 bg-white border-t border-slate-250 dark:bg-slate-900 dark:border-slate-800 flex gap-2 flex-shrink-0">
              <input
                type="text"
                disabled={!selectedChatUser}
                value={adminReplyText}
                onChange={(e) => setAdminReplyText(e.target.value)}
                placeholder={selectedChatUser ? `ตอบกลับคุณ @${selectedChatUser}...` : "กรุณาเปิดแชทกับคุณผู้ใช้ก่อนพิมพ์ตอบค่ะ"}
                className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold focus:outline-none focus:border-indigo-400 text-slate-700 dark:bg-slate-940 dark:border-slate-840 dark:text-slate-100 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!selectedChatUser || !adminReplyText.trim()}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all hover:scale-103 active:scale-97 hover:brightness-105 disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>

          </div>
        </div>

        {/* Existing Announcements Feed list manager (5 columns) */}
        <div className="lg:col-span-5">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-col h-[520px]">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex-shrink-0">
              <Megaphone className="w-5 h-5 text-indigo-500" />
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                📊 รายการประกาศข่าวสารที่เผยแพร่อยู่
              </h3>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {announcements.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center text-slate-400 italic text-xs gap-2">
                  <Info className="w-5 h-5 text-slate-350" />
                  <span>ยังไม่มีประกาศลงบอร์ดในขณะนี้ค่ะ</span>
                </div>
              ) : (
                announcements.map((ann) => (
                  <div 
                    key={ann.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 truncate pr-2">
                          📌 {ann.title}
                        </h4>
                        <span className="text-[8.5px] font-bold text-slate-400 whitespace-nowrap flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(ann.createdAt).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-650 dark:text-slate-400 line-clamp-3 leading-relaxed font-medium whitespace-pre-wrap">
                        {ann.content}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                      className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-all flex items-center justify-center flex-shrink-0 dark:bg-rose-950/20 dark:text-rose-400"
                      title="ลบประกาศนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
