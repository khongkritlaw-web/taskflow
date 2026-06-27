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
  Bell,
  UploadCloud,
  File,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw
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
import { Task, TaskAttachment } from '../types';

interface AdminPanelProps {
  accentColor: string;
  darkMode: boolean;
  categories?: string[];
  onAddCategory?: (category: string) => void;
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
  darkMode,
  categories = ['💼 งานทั่วไป'],
  onAddCategory
}: AdminPanelProps) {
  const { showAlert, showConfirm } = useDialog();

  // Custom category creation on-the-fly
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  const triggerAlert = async (msg: string, type?: 'success' | 'warning' | 'error') => {
    const intent = type === 'error' ? 'danger' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info';
    const title = type === 'error' ? 'เกิดข้อผิดพลาด' : type === 'warning' ? 'คำเตือน' : type === 'success' ? 'สำเร็จ' : 'ข้อมูล';
    await showAlert(msg, title, intent);
  };

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [chatUsers, setChatUsers] = useState<{ userId: string; unreadCount: number; lastText: string; lastTime: string }[]>([]);
  
  // Admin Panel Tab Navigation State
  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'tasks'>('users');

  // Real-time user tasks map
  const [allUsersTasks, setAllUsersTasks] = useState<{ [userId: string]: Task[] }>({});

  // Helper to get Thailand today
  const getThailandTodayStr = () => {
    return new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  };

  // Admin Task Assignment Form State
  const [assigneeId, setAssigneeId] = useState<string>('all'); // 'all' or specific userId
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskCategory, setTaskCategory] = useState(categories[0] || '💼 งานทั่วไป');
  const [taskDueDate, setTaskDueDate] = useState(getThailandTodayStr());
  const [taskDueTime, setTaskDueTime] = useState('');
  const [taskAttachments, setTaskAttachments] = useState<TaskAttachment[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // Feedback/Revision modal or state
  const [revisingTask, setRevisingTask] = useState<{ userId: string; taskId: string; title: string } | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [viewingAttachment, setViewingAttachment] = useState<TaskAttachment | null>(null);

  // Fetch tasks for all users in real-time
  useEffect(() => {
    if (users.length === 0) return;
    const unsubscribers: (() => void)[] = [];

    users.forEach(u => {
      if (u.userId === 'admin') return;
      const tasksCol = collection(db, 'users', u.userId, 'tasks');
      const unsub = onSnapshot(tasksCol, (snapshot) => {
        const taskList: Task[] = [];
        snapshot.forEach(docSnap => {
          taskList.push({
            id: docSnap.id,
            ...docSnap.data()
          } as Task);
        });
        setAllUsersTasks(prev => ({
          ...prev,
          [u.userId]: taskList
        }));
      }, (err) => {
        console.error(`Failed to subscribe tasks for ${u.userId}:`, err);
      });
      unsubscribers.push(unsub);
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [users]);

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

  // 4. Admin Task Operations
  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      await showAlert('กรุณากรอกหัวชื่องานที่ต้องการมอบหมาย', 'ข้อมูลไม่สมบูรณ์', 'warning');
      return;
    }

    setIsAssigning(true);
    try {
      const activeUsers = users.filter(u => u.userId !== 'admin');
      const targetUsers = assigneeId === 'all' ? activeUsers : activeUsers.filter(u => u.userId === assigneeId);

      if (targetUsers.length === 0) {
        await showAlert('ไม่พบผู้ใช้งานเพื่อรับมอบหมายงาน', 'ไม่มีผู้รับมอบหมาย', 'warning');
        setIsAssigning(false);
        return;
      }

      for (const u of targetUsers) {
        const taskId = 'task_admin_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
        const taskRef = doc(db, 'users', u.userId, 'tasks', taskId);
        const taskData: Task = {
          id: taskId,
          title: taskTitle.trim(),
          desc: taskDesc.trim(),
          category: taskCategory,
          dueDate: taskDueDate || getThailandTodayStr(),
          dueTime: taskDueTime || '',
          status: 'pending',
          userId: u.userId,
          createdAt: new Date().toISOString(),
          attachments: taskAttachments,
          assignedByAdmin: true,
          approvalStatus: 'assigned'
        };
        await setDoc(taskRef, taskData);
      }

      await showAlert(`มอบหมายงาน "${taskTitle}" ให้กับผู้ใช้งานที่เลือก (${targetUsers.length} รายการ) สำเร็จเรียบร้อยแล้ว`, 'มอบหมายงานสำเร็จ', 'success');
      
      // Clear form
      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate(getThailandTodayStr());
      setTaskDueTime('');
      setTaskAttachments([]);
    } catch (err) {
      console.error('Failed to assign task:', err);
      await showAlert('เกิดข้อผิดพลาดในการมอบหมายงาน', 'ข้อผิดพลาด', 'danger');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleApproveTask = async (userId: string, taskId: string) => {
    const isConfirmed = await showConfirm('คุณต้องการอนุมัติผ่านงานชิ้นนี้ว่าตรวจแล้วเรียบร้อยใช่หรือไม่?', 'ยืนยันผลการตรวจงาน', 'success');
    if (!isConfirmed) return;

    try {
      const taskRef = doc(db, 'users', userId, 'tasks', taskId);
      await updateDoc(taskRef, {
        approvalStatus: 'approved',
        status: 'completed',
        adminFeedback: '' // clear feedback
      });
      await showAlert('ยืนยันสถานะ "ตรวจงานผ่านเสร็จสมบูรณ์" ไปยังผู้ใช้งานแล้วค่ะ', 'อนุมัติเรียบร้อย', 'success');
    } catch (err) {
      console.error('Failed to approve task:', err);
      await showAlert('เกิดข้อผิดพลาดในการตรวจสอบอนุมัติงาน', 'ข้อผิดพลาด', 'danger');
    }
  };

  const handleSendBackRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisingTask) return;
    if (!feedbackText.trim()) {
      await showAlert('กรุณากรอกข้อความสั่งชี้แจงหรือระบุจุดที่ต้องการให้แก้ไขก่อนส่งกลับ', 'กรุณาระบุคำสั่งชี้แจง', 'warning');
      return;
    }

    try {
      const taskRef = doc(db, 'users', revisingTask.userId, 'tasks', revisingTask.taskId);
      await updateDoc(taskRef, {
        approvalStatus: 'needs_revision',
        status: 'pending', // Reset to pending so they can fix and complete again
        adminFeedback: feedbackText.trim()
      });
      await showAlert('ส่งงานกลับไปที่บัญชีผู้ใช้เพื่อรอให้ผู้ใช้แก้ไขเรียบร้อยแล้วค่ะ', 'ส่งกลับแก้ไขสำเร็จ', 'success');
      setRevisingTask(null);
      setFeedbackText('');
    } catch (err) {
      console.error('Failed to send back revision:', err);
      await showAlert('เกิดข้อผิดพลาดในการส่งกลับแก้ไข', 'ข้อผิดพลาด', 'danger');
    }
  };

  const handleDeleteAssignedTask = async (userId: string, taskId: string, taskTitle: string) => {
    const isConfirmed = await showConfirm(`คุณต้องการยืนยันการลบและเพิกถอนงานมอบหมาย "${taskTitle}" จากประวัติผู้ใช้ใช่หรือไม่? การกระทำนี้ลบข้อมูลถาวร`, 'ลบงานมอบหมาย', 'danger');
    if (!isConfirmed) return;

    try {
      await deleteDoc(doc(db, 'users', userId, 'tasks', taskId));
      await showAlert('ลบงานมอบหมายเรียบร้อยแล้วค่ะ', 'ลบสำเร็จ', 'success');
    } catch (err) {
      console.error('Failed to delete assigned task:', err);
      await showAlert('เกิดข้อผิดพลาดในการลบงานมอบหมาย', 'ข้อผิดพลาด', 'danger');
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

  // Compute assigned task counters in real-time
  let totalAssignedTasks = 0;
  let totalPendingReviews = 0;
  let totalApprovedAssigned = 0;
  let totalNeedsRevision = 0;

  const assignedTasksList: { userId: string; userProfile?: UserProfile; task: Task }[] = [];

  Object.entries(allUsersTasks).forEach(([userId, uTasks]) => {
    const userProfile = users.find(u => u.userId === userId);
    const tasksArray = uTasks as Task[];
    tasksArray.forEach(task => {
      if (task.assignedByAdmin) {
        totalAssignedTasks++;
        if (task.approvalStatus === 'pending_review') {
          totalPendingReviews++;
        } else if (task.approvalStatus === 'approved') {
          totalApprovedAssigned++;
        } else if (task.approvalStatus === 'needs_revision') {
          totalNeedsRevision++;
        }
        assignedTasksList.push({
          userId,
          userProfile,
          task
        });
      }
    });
  });

  // Sort assigned tasks: newest first
  assignedTasksList.sort((a, b) => new Date(b.task.createdAt).getTime() - new Date(a.task.createdAt).getTime());

  // Filter out pending reviews
  const pendingReviewsList = assignedTasksList.filter(item => item.task.approvalStatus === 'pending_review');

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Tab Switcher at the very top */}
      <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl w-full max-w-lg mx-auto border border-slate-200/80 dark:border-slate-800/80 shadow-inner">
        <button
          onClick={() => setActiveAdminTab('users')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeAdminTab === 'users'
              ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-md scale-[1.02] border border-slate-200/50 dark:border-slate-800'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350 hover:bg-slate-50/50 dark:hover:bg-slate-900/40'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-500" />
          ระบบจัดการผู้ใช้และประกาศ
        </button>
        <button
          onClick={() => setActiveAdminTab('tasks')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 relative ${
            activeAdminTab === 'tasks'
              ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-md scale-[1.02] border border-slate-200/50 dark:border-slate-800'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-350 hover:bg-slate-50/50 dark:hover:bg-slate-900/40'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-500" />
          ระบบงานมอบหมายและตรวจการบ้าน
          {totalPendingReviews > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[8px] font-black text-white items-center justify-center">
                {totalPendingReviews}
              </span>
            </span>
          )}
        </button>
      </div>

      {/* ----------------- TAB 1: USERS & CHAT ----------------- */}
      {activeAdminTab === 'users' && (
        <div className="space-y-6">
          {/* Statistics Cards summary row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">คุณผู้สมัครทั้งหมด</span>
                <span className="text-xl font-black text-slate-800 dark:text-slate-100">{totalUsers} บัญชี</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center flex-shrink-0">
                <Info className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">รอแอดมินยืนยัน</span>
                <span className="text-xl font-black text-amber-500">{pendingUsers} บัญชี</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">อนุมัติเข้าใช้งานแล้ว</span>
                <span className="text-xl font-black text-emerald-500">{approvedUsers} บัญชี</span>
              </div>
            </div>
          </div>

          {/* Dual grid: Registered user management & Announcements creator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Registered users approvals */}
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
                      <span className="text-[10.5px] text-slate-400 block leading-tight mt-1 font-semibold">
                        ตรวจสอบประวัติความน่าเชื่อถือ สแกนไอดี ก่อนกดปลดล็อคกุญแจความปลอดภัยค่ะ
                      </span>
                    </div>
                  </div>

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

                {/* Users list rows */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[300px] overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <div className="p-12 text-center text-xs text-slate-450 italic">
                      ไม่พบข้อมูลบัญชีผู้ใช้ใดๆ ตามคำค้นหา 🔍
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div 
                        key={user.userId} 
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} className="w-10 h-10 rounded-2xl object-cover border border-slate-100 flex-shrink-0" alt="Avatar" />
                          ) : (
                            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200 flex-shrink-0">
                              {(user.displayName || user.userId).substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 truncate max-w-[150px]">
                                {user.displayName || user.userId}
                              </h4>
                              <span className="text-[9px] text-slate-400 font-mono">
                                (@{user.userId})
                              </span>
                              {user.isLocked && (
                                <span className="text-[8px] font-extrabold px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded-md dark:bg-rose-950/30 dark:text-rose-450">
                                  🔒 โดนระงับ
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-455 leading-normal font-medium truncate mt-0.5">
                              ✉️ {user.email || 'ไม่มีอีเมล'} | 📞 {user.phone || 'ไม่มีเบอร์'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Live Chat launch */}
                          <button
                            type="button"
                            onClick={() => setSelectedChatUser(user.userId)}
                            className={`h-8 px-2.5 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1 border ${
                              selectedChatUser === user.userId
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30'
                            }`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>เปิดกล่องแชท</span>
                          </button>

                          {/* Approved toggler */}
                          <button
                            type="button"
                            onClick={() => handleToggleApprove(user)}
                            className={`h-8 px-2.5 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1 border ${
                              user.isApproved 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' 
                                : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100 animate-pulse'
                            }`}
                          >
                            {user.isApproved ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                            <span>{user.isApproved ? 'อนุมัติแล้ว' : 'กดยืนยัน'}</span>
                          </button>

                          {/* Lock toggler */}
                          <button
                            type="button"
                            onClick={() => handleToggleLock(user)}
                            className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-850 border border-slate-200 flex items-center justify-center transition-all dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700"
                            title={user.isLocked ? "ปลดล็อกบัญชี" : "ล็อกบัญชี"}
                          >
                            <Shield className={`w-3.5 h-3.5 ${user.isLocked ? 'text-rose-500 animate-bounce' : 'text-slate-450'}`} />
                          </button>

                          {/* Delete Account */}
                          {user.userId !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user.userId)}
                              className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center transition-all dark:bg-rose-950/20 dark:text-rose-450"
                              title="ลบบัญชีผู้ใช้งานและข้อมูลถาวร"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Announcements Creator */}
            <div className="lg:col-span-5">
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
                        <span>กำลังเผยแพร่...</span>
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

          {/* Chat and Announcements feed List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chat Thread Workspace */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-col h-[480px] overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 dark:bg-slate-950/40 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-500 animate-pulse" />
                    <div>
                      <h3 className="text-xs font-black text-slate-800 dark:text-slate-100">
                        💬 กล่องข้อความแชทคุยผู้ใช้งานในระบบ
                      </h3>
                      <span className="text-[9px] text-slate-400 block leading-none mt-1 font-semibold">
                        {selectedChatUser 
                          ? `กำลังพูดคุยกับคุณผู้ใช้: @${selectedChatUser}` 
                          : 'กรุณาเลือกผู้ใช้งานในตารางด้านบน เพื่อคุยแชทตอบคำถามทันที'
                        }
                      </span>
                    </div>
                  </div>

                  {selectedChatUser && (
                    <button
                      type="button"
                      onClick={() => setSelectedChatUser(null)}
                      className="text-[9px] font-black bg-slate-200 hover:bg-slate-300 text-slate-600 px-2 py-1 rounded-lg dark:bg-slate-800 dark:text-slate-300"
                    >
                      ปิดสนทนา
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/10 dark:bg-slate-950/5">
                  {!selectedChatUser ? (
                    <div className="h-full w-full flex flex-col items-center justify-center text-center text-slate-400 p-6 gap-2">
                      <Users className="w-10 h-10 text-slate-300 animate-bounce" />
                      <span className="text-xs font-semibold leading-relaxed text-slate-400">
                        ไม่มีไลฟ์แชทที่ถูกเลือกในขณะนี้ค่ะ <br />
                        กรุณาคลิกปุ่ม <strong className="text-indigo-500">"เปิดกล่องแชท"</strong> ที่รายชื่อผู้อื่นด้านบน <br />
                        เพื่อเริ่มส่งตอบคำถามหรือแนบข้อมูลอำนวยความสะดวกสบายได้ทันทีค่ะ
                      </span>
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="h-full w-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 text-xs gap-1">
                      <MessageSquare className="w-8 h-8 text-slate-350" />
                      <span>ยังไม่มีข้อความคุยกันในห้องนี้ค่ะ</span>
                      <span className="text-[10px] text-slate-400">คุณสามารถเป็นคนเริ่มเปิดบทสนทนาทักทายได้เลยค่ะ</span>
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

                <form onSubmit={handleSendAdminReply} className="p-3 bg-white border-t border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex gap-2 flex-shrink-0">
                  <input
                    type="text"
                    disabled={!selectedChatUser}
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    placeholder={selectedChatUser ? `ตอบกลับคุณ @${selectedChatUser}...` : "กรุณาเปิดแชทกับคุณผู้ใช้ก่อนพิมพ์ตอบค่ะ"}
                    className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold focus:outline-none focus:border-indigo-400 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 disabled:opacity-50"
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

            {/* Published announcements List */}
            <div className="lg:col-span-5">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-col h-[480px]">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex-shrink-0">
                  <Megaphone className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                    📊 รายการประกาศข่าวสารที่เผยแพร่อยู่
                  </h3>
                </div>

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
                          type="button"
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
      )}

      {/* ----------------- TAB 2: TASK ASSIGNMENTS & REVIEW ----------------- */}
      {activeAdminTab === 'tasks' && (
        <div className="space-y-6">
          
          {/* Task Statistics row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950/30 text-slate-600 dark:text-slate-400 flex items-center justify-center flex-shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold block">มอบหมายทั้งหมด</span>
                <span className="text-base font-black text-slate-800 dark:text-slate-100">{totalAssignedTasks} งาน</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold block">รอตรวจผลงาน</span>
                <span className="text-base font-black text-amber-500">{totalPendingReviews} งาน</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold block">ตรวจผ่านแล้ว</span>
                <span className="text-base font-black text-emerald-500">{totalApprovedAssigned} งาน</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold block">ส่งกลับไปแก้ไข</span>
                <span className="text-base font-black text-rose-500">{totalNeedsRevision} งาน</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: New Assignment Form (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <Layers className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                    🎯 มอบหมายงานเป้าหมายใหม่ไปยังบัญชีผู้ใช้
                  </h3>
                </div>

                <form onSubmit={handleAssignTask} className="space-y-4">
                  {/* Select Assignee */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">เลือกผู้รับมอบหมายงาน (Assignee)</label>
                    <select
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-100"
                    >
                      <option value="all">👥 ทั้งหมด (ส่งให้บัญชีผู้ใช้ที่ผ่านอนุมัติทุกคน)</option>
                      {users.filter(u => u.userId !== 'admin' && u.isApproved).map(user => (
                        <option key={user.userId} value={user.userId}>
                          👤 {user.displayName || user.userId} (@{user.userId})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">หัวชื่องาน / ภารกิจหลัก</label>
                    <input
                      type="text"
                      required
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="เช่น รายงานสรุปผลยอดขายสัปดาห์ หรือ ตรวจสอบเอกสาร..."
                      className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-100"
                    />
                  </div>

                  {/* Category, Due Date, Due Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">หมวดหมู่ภารกิจ</label>
                        <button
                          type="button"
                          onClick={() => setIsAddingCustomCategory(!isAddingCustomCategory)}
                          className="text-[9px] font-black hover:underline text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5"
                        >
                          {isAddingCustomCategory ? '❌ ยกเลิก' : '➕ เพิ่ม'}
                        </button>
                      </div>

                      {isAddingCustomCategory ? (
                        <div className="flex gap-1">
                          <input
                            type="text"
                            placeholder="หมวดหมู่ใหม่..."
                            value={customCategoryName}
                            onChange={(e) => setCustomCategoryName(e.target.value)}
                            className="flex-1 h-10 px-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const name = customCategoryName.trim();
                              if (!name) return;
                              if (categories.includes(name)) {
                                triggerAlert('หมวดหมู่นี้มีอยู่แล้ว', 'warning');
                                setTaskCategory(name);
                                setIsAddingCustomCategory(false);
                                setCustomCategoryName('');
                                return;
                              }
                              if (onAddCategory) {
                                onAddCategory(name);
                              }
                              setTaskCategory(name);
                              setIsAddingCustomCategory(false);
                              setCustomCategoryName('');
                            }}
                            className="px-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black shadow-xs active:scale-95 transition-all flex items-center justify-center"
                          >
                            บันทึก
                          </button>
                        </div>
                      ) : (
                        <select
                          value={taskCategory}
                          onChange={(e) => setTaskCategory(e.target.value)}
                          className="w-full h-10 px-2.5 text-xs font-bold rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-100"
                        >
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">กำหนดส่ง (Due Date)</label>
                      <input
                        type="date"
                        required
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">เวลาส่ง (Due Time)</label>
                      <input
                        type="time"
                        value={taskDueTime}
                        onChange={(e) => setTaskDueTime(e.target.value)}
                        placeholder="ไม่มีระบุเวลา"
                        className="w-full h-10 px-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">รายละเอียดภารกิจ / คำสั่งชี้แจงเพิ่ม</label>
                    <textarea
                      rows={3}
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      placeholder="พิมพ์ชี้แจงความต้องการในการตรวจ หรือเกณฑ์การทำงานที่นี่..."
                      className="w-full p-3 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-100 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Attachments for Assignment */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">เอกสารอ้างอิงแนบประกอบภารกิจ (ถ้ามี)</label>
                    <div className="relative border border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-emerald-500 transition-all p-3 text-center bg-slate-50/50 dark:bg-slate-950/20 cursor-pointer">
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files) {
                            Array.from(files).forEach((file: any) => {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const newAttachment: TaskAttachment = {
                                  name: file.name,
                                  type: file.type.startsWith('image/') ? 'image' : 'file',
                                  base64: reader.result as string
                                };
                                setTaskAttachments(prev => [...prev, newAttachment]);
                              };
                              reader.readAsDataURL(file);
                            });
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
                        <UploadCloud className="w-5 h-5 text-emerald-500" />
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-350">อัปโหลดภาพหรือไฟล์คำสั่งแนบประกอบ</span>
                        <span className="text-[9px] text-slate-400">ระบุเป็นตัวอย่างให้ผู้ใช้นำไปใช้อ้างอิงได้ค่ะ</span>
                      </div>
                    </div>

                    {taskAttachments.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-950/30 rounded-lg">
                        {taskAttachments.map((file, idx) => (
                          <div key={idx} className="p-1 border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md flex items-center justify-between gap-1.5 min-w-0">
                            <div className="flex items-center gap-1 min-w-0 flex-1">
                              {file.type === 'image' ? (
                                <img src={file.base64} className="w-4 h-4 rounded object-cover flex-shrink-0" alt="Preview" />
                              ) : (
                                <File className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                              )}
                              <span className="text-[9.5px] truncate text-slate-600 dark:text-slate-400">{file.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setTaskAttachments(prev => prev.filter((_, i) => i !== idx))}
                              className="text-slate-400 hover:text-rose-500 font-bold px-1"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isAssigning}
                    className="w-full h-10 rounded-xl font-bold text-xs text-white transition-all hover:brightness-105 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5 shadow-md disabled:bg-slate-300"
                    style={{ backgroundColor: accentColor }}
                  >
                    {isAssigning ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>กำลังสั่งการมอบหมาย...</span>
                      </>
                    ) : (
                      <>
                        <Layers className="w-4 h-4" />
                        <span>🚀 ทำการส่งมอบหมายภารกิจงาน</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Tracking & Review (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Review Queue List */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <CheckCircle className="w-5 h-5 text-emerald-500 animate-pulse" />
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex-1">
                    📥 รายการส่งผลงานที่รอดำเนินการกดตรวจ ({pendingReviewsList.length})
                  </h3>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {pendingReviewsList.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 italic flex flex-col items-center justify-center gap-2">
                      <CheckCircle className="w-8 h-8 text-slate-200" />
                      <span>ยังไม่มีรายงานส่งการบ้านหรือรอตรวจใดๆ ในขณะนี้ค่ะ 🎉</span>
                      <span className="text-[10px] text-slate-400">เมื่อผู้ใช้ทำเครื่องหมายเสร็จงานเป้าหมาย งานเหล่านั้นจะปรากฏตรงนี้เพื่อให้แอดมินตรวจทันทีค่ะ</span>
                    </div>
                  ) : (
                    pendingReviewsList.map(({ userId, userProfile, task }) => {
                      const isInlineRevising = revisingTask?.userId === userId && revisingTask?.taskId === task.id;
                      return (
                        <div 
                          key={task.id} 
                          className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all dark:bg-slate-950 dark:border-slate-850 space-y-3 text-xs"
                        >
                          {/* User Header */}
                          <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-[10px] flex items-center justify-center dark:bg-emerald-950/20">
                                {(userProfile?.displayName || userId).substring(0, 1).toUpperCase()}
                              </div>
                              <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate">
                                {userProfile?.displayName || userId}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">(@{userId})</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 px-2 py-0.5 bg-slate-200/50 rounded-md dark:bg-slate-800 dark:text-slate-400">
                              {task.category}
                            </span>
                          </div>

                          {/* Task details */}
                          <div className="space-y-1.5 text-xs">
                            <div className="font-extrabold text-slate-800 dark:text-slate-100">
                              📌 {task.title}
                            </div>
                            {task.desc && (
                              <p className="text-[11px] text-slate-500 leading-normal line-clamp-2 dark:text-slate-400">
                                {task.desc}
                              </p>
                            )}

                            {/* Submitted Notes & Files */}
                            <div className="mt-3 p-3 bg-white border border-slate-150 rounded-xl space-y-2.5 dark:bg-slate-900 dark:border-slate-800">
                              {task.completedAt && (
                                <span className="block text-[9px] text-slate-400 font-mono">
                                  📅 ส่งเมื่อ: {new Date(task.completedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} น.
                                </span>
                              )}

                              {/* User completion notes if any */}
                              {task.completionNotes && (
                                <div className="space-y-1">
                                  <span className="block text-[9.5px] font-extrabold text-slate-500 dark:text-slate-400">📝 ข้อความแนบจากผู้ใช้:</span>
                                  <p className="p-2 bg-slate-50 dark:bg-slate-950/40 rounded-lg text-[10.5px] font-semibold text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap border border-slate-100 dark:border-slate-850">
                                    {task.completionNotes}
                                  </p>
                                </div>
                              )}

                              {/* Files */}
                              {task.completedAttachments && task.completedAttachments.length > 0 && (
                                <div className="space-y-1">
                                  <span className="block text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400">📎 เอกสารที่ส่งแนบมาด้วย ({task.completedAttachments.length}):</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {task.completedAttachments.map((file, fidx) => (
                                      <button
                                        key={fidx}
                                        type="button"
                                        onClick={() => setViewingAttachment(file)}
                                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/40 border border-emerald-100 dark:border-emerald-900/40 rounded-md text-[10px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1 max-w-[130px] truncate"
                                      >
                                        {file.type === 'image' ? <ImageIcon className="w-3 h-3" /> : <File className="w-3 h-3 text-indigo-500" />}
                                        <span className="truncate">{file.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {!isInlineRevising ? (
                            <div className="flex gap-2 justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setRevisingTask({ userId, taskId: task.id, title: task.title });
                                  setFeedbackText('');
                                }}
                                className="h-8 px-3 border border-amber-300 hover:bg-amber-50 text-amber-600 font-bold text-[10.5px] rounded-lg transition-all dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-950/20"
                              >
                                ⚠️ ส่งกลับแก้ไข
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApproveTask(userId, task.id)}
                                className="h-8 px-4 text-white bg-emerald-600 hover:bg-emerald-750 font-bold text-[10.5px] rounded-lg transition-all flex items-center gap-1 shadow-xs"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                ผ่านการตรวจ (ตรวจแล้ว)
                              </button>
                            </div>
                          ) : (
                            <form onSubmit={handleSendBackRevision} className="space-y-2 border-t border-slate-200/60 pt-2 dark:border-slate-800/60 animate-in slide-in-from-top duration-150">
                              <label className="block text-[10px] font-bold text-amber-600">📝 ระบุรายละเอียด/คำสั่งที่ต้องการให้ผู้ใช้งานแก้ไขปรับปรุง:</label>
                              <textarea
                                required
                                rows={2}
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="เช่น ขอให้เพิ่มหน้าลายเซ็นต์ หรือภาพถ่ายขาดความคมชัด..."
                                className="w-full p-2 border border-slate-200 focus:outline-none focus:border-amber-500 rounded-lg text-xs dark:bg-slate-900 dark:border-slate-800 dark:text-slate-150"
                              />
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  type="button"
                                  onClick={() => setRevisingTask(null)}
                                  className="h-7 px-2.5 border border-slate-200 bg-white text-[10px] font-bold rounded-md hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
                                >
                                  ยกเลิก
                                </button>
                                <button
                                  type="submit"
                                  className="h-7 px-3 text-white bg-amber-500 hover:bg-amber-600 text-[10px] font-bold rounded-md flex items-center gap-1"
                                >
                                  <Send className="w-3 h-3" />
                                  ยืนยันการส่งกลับแก้ไข
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* All Assignments Tracking & Status Tracker */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex-shrink-0">
                  <Layers className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight flex-1">
                    🔍 ติดตามความคืบหน้าสถานะงานมอบหมายทั้งหมด
                  </h3>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {assignedTasksList.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 italic">
                      ยังไม่มีรายการมอบหมายงานในประวัติฐานข้อมูลค่ะ 🔍
                    </div>
                  ) : (
                    assignedTasksList.map(({ userId, userProfile, task }) => {
                      let statusBadge = {
                        bg: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-850 dark:text-slate-400 dark:border-slate-800',
                        label: '📌 มอบหมายแล้ว'
                      };

                      if (task.approvalStatus === 'pending_review') {
                        statusBadge = {
                          bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-450 dark:border-blue-900/30',
                          label: '⏳ ส่งงานรอตรวจ'
                        };
                      } else if (task.approvalStatus === 'approved') {
                        statusBadge = {
                          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30',
                          label: '✓ ตรวจแล้วผ่าน'
                        };
                      } else if (task.approvalStatus === 'needs_revision') {
                        statusBadge = {
                          bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30',
                          label: '⚠️ รอแก้ไขปรับปรุง'
                        };
                      }

                      return (
                        <div 
                          key={task.id} 
                          className="p-3 bg-slate-50 border border-slate-150 hover:bg-slate-100/40 transition-colors rounded-xl dark:bg-slate-950 dark:border-slate-850 flex items-center justify-between gap-4 text-xs"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-[10.5px] text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                                {userProfile?.displayName || userId}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">(@{userId})</span>
                            </div>
                            <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-100 truncate pr-2">
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[9.5px] text-slate-400 flex-wrap">
                              <span>📅 กำหนด: {task.dueDate || '-'} {task.dueTime ? `${task.dueTime} น.` : ''}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.bg}`}>
                              {statusBadge.label}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleDeleteAssignedTask(userId, task.id, task.title)}
                              className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-all flex items-center justify-center dark:bg-rose-950/20 dark:text-rose-400"
                              title="เพิกถอนงานชิ้นนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ----------------- FULLSCREEN ATTACHMENT VIEWER MODAL ----------------- */}
      <AnimatePresence>
        {viewingAttachment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/90 flex flex-col items-center justify-center p-4 backdrop-blur-md"
          >
            {/* Modal Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden max-w-4xl w-full flex flex-col max-h-[85vh] relative shadow-2xl animate-in zoom-in duration-150 text-left">
              
              {/* Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  {viewingAttachment.type === 'image' ? <ImageIcon className="w-5 h-5 text-emerald-500" /> : <File className="w-5 h-5 text-indigo-500" />}
                  <span className="text-xs font-bold truncate max-w-md">{viewingAttachment.name}</span>
                </div>
                <button
                  onClick={() => setViewingAttachment(null)}
                  className="w-8 h-8 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Content body */}
              <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-900">
                {viewingAttachment.type === 'image' ? (
                  <img
                    src={viewingAttachment.base64}
                    alt={viewingAttachment.name}
                    referrerPolicy="no-referrer"
                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg border border-slate-800"
                  />
                ) : (
                  <div className="text-center p-10 space-y-4 max-w-sm">
                    <div className="w-16 h-16 rounded-3xl bg-slate-950 flex items-center justify-center text-indigo-500 mx-auto border border-slate-800 shadow-inner">
                      <File className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">ระบบแนบไฟล์เอกสารอ้างอิง</h4>
                      <p className="text-xs text-slate-400">ไฟล์แนบประเภทอื่นๆ ที่ไม่สามารถพรีวิวรูปภาพได้โดยตรง</p>
                    </div>
                    <a
                      href={viewingAttachment.base64}
                      download={viewingAttachment.name}
                      className="inline-flex h-10 px-6 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl shadow-md items-center gap-2 transition-transform active:scale-95"
                    >
                      <UploadCloud className="w-4 h-4" />
                      ดาวน์โหลดไฟล์เอกสารเพื่อเปิดอ่าน
                    </a>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-2">
                {viewingAttachment.type === 'image' && (
                  <a
                    href={viewingAttachment.base64}
                    download={viewingAttachment.name}
                    className="h-9 px-4 bg-emerald-600 hover:bg-emerald-750 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md"
                  >
                    <UploadCloud className="w-4 h-4" />
                    ดาวน์โหลดภาพถ่าย
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setViewingAttachment(null)}
                  className="h-9 px-4 border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 text-xs font-bold rounded-lg"
                >
                  ปิดหน้าต่างนี้
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
