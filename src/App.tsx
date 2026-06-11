import React, { useState, useEffect } from 'react';
import {
  Layers,
  CheckSquare,
  Calendar as CalendarIcon,
  Receipt,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Clock,
  Menu,
  ChevronsLeft,
  X,
  Plus,
  Sliders,
  Folder,
  Send,
  Mail,
  Save,
  Moon,
  Volume2,
  Trash2,
  ChevronDown,
  Link,
  Briefcase,
  Globe,
  FileText,
  BookOpen,
  ShoppingBag,
  TrendingUp,
  Video,
  Phone,
  Info,
  ExternalLink,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Task, Expense, AppSettings } from './types';
import { THEME_PRESETS, hexToRgb, getDarkerColor, getLighterColor } from './themePresets';

import { doc, getDoc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { updateEmail, updatePassword } from 'firebase/auth';
import { db, auth } from './firebase';

const padPass = (pass: string) => {
  if (pass.length >= 6) return pass;
  return pass.padEnd(6, '0');
};

// Modules
import AuthScreen from './components/AuthScreen';
import TaskModule from './components/TaskModule';
import CalendarModule from './components/CalendarModule';
import ExpenseModule from './components/ExpenseModule';

const DEFAULT_CATEGORIES = ['💼 งานทั่วไป', '🏠 ส่วนตัว', '🛒 ช้อปปิ้ง', '🔥 เร่งด่วน'];

const CUSTOM_LINK_ICONS = [
  { name: 'Link', label: 'ลิงก์ทั่วไป', component: Link },
  { name: 'Briefcase', label: 'ธุรกิจ / งาน', component: Briefcase },
  { name: 'Globe', label: 'เว็บไซต์ / แหล่งข้อมูล', component: Globe },
  { name: 'FileText', label: 'เอกสาร / รายงาน', component: FileText },
  { name: 'BookOpen', label: 'คู่มือ / ความรู้', component: BookOpen },
  { name: 'ShoppingBag', label: 'ร้านค้า / ซื้อขาย', component: ShoppingBag },
  { name: 'TrendingUp', label: 'แผนภูมิ / การเงิน', component: TrendingUp },
  { name: 'Video', label: 'วิดีโอ / ประชุม', component: Video },
  { name: 'Phone', label: 'ติดต่อ / สื่อสาร', component: Phone },
  { name: 'Info', label: 'ข่าวสาร / ประชาสัมพันธ์', component: Info },
  { name: 'Layers', label: 'ระบบอื่น / แพลตฟอร์ม', component: Layers },
  { name: 'CalendarIcon', label: 'ปฏิทินย่อย', component: CalendarIcon },
  { name: 'Receipt', label: 'บิลค่าใช้จ่าย', component: Receipt },
  { name: 'Folder', label: 'โฟลเดอร์', component: Folder },
];

function getCustomLinkIconComponent(name: string) {
  const item = CUSTOM_LINK_ICONS.find(i => i.name === name);
  return item ? item.component : Link;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionUser, setSessionUser] = useState({ userId: '', email: '', phone: '', password: '' });
  
  // App data states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    appName: 'TaskFlow Space Executive Pro',
    appDesc: 'ระบบบอร์ดงาน ปฏิทินจดจำสรุปกิจกรรม และจัดการค่าชำระส่วนบุคคลสำหรับผู้บริหาร',
    appLogoUrl: '',
    bgStyle: 'theme-custom',
    customBgUrl: '',
    darkMode: false,
    categories: DEFAULT_CATEGORIES,
    emailRecipient: '',
    emailNotificationEnabled: true,
    emailMessageTemplate: 'เรียน คุณท่าน\n\nเรื่อง รายงานสรุปรายการภารกิจคงค้างและแจ้งเตือนยอดค่าใช้จ่ายที่ครบกำหนดชำระ ประจำวันที่ {date}\n\nตามที่ระบบ {appName} ได้ทำการประเมินและคัดกรองข้อมูลรายการความก้าวหน้าของภารกิจงาน และรายการบิลค่าใช้จ่ายที่กำหนดรอบชำระประจำวันที่ {date} หรือที่เลยกำหนดเรียบร้อยแล้วนั้น\n\nทางระบบเรียนสรุปรายละเอียดงานสำคัญเรียน คุณท่าน เพื่อโปรดพิจารณาและดำเนินการตามที่สมควร ดังดีลรายงานด้านล่างนี้:\n\n📋 รายการภารกิจสำคัญ (กำหนดเสร็จสิ้นวันนี้ หรือ เลยกำหนด):\n━━━━━━━━━━━━━━━━━━━━\n{tasks}\n━━━━━━━━━━━━━━━━━━━━\n\n💰 รายการค่าใช้จ่ายค้างจัดการ (กำหนดชำระวันนี้ หรือ เลยกำหนด):\n━━━━━━━━━━━━━━━━━━━━\n{expenses}\n━━━━━━━━━━━━━━━━━━━━\n\nขอความกรุณา คุณท่าน โปรดพิจารณาตรวจสอบความเสร็จสิ้นและชำระบิลตามกำหนดการที่ระบุไว้\n\nด้วยความเคารพอย่างสูง,\nระบบจัดส่งข้อมูลอัตโนมัติ {appName}',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpSecure: false,
    smtpSenderName: '',
    autoSendEnabled: false,
    lastAutoSentDate: '',
    alertDays: [0, 1, 3],
    themePreset: 'indigo-dream',
    colorAccent: '#2563eb',
    colorAccentHover: '#1d4ed8',
    colorAccentLight: '#dbeafe',
    colorAccentText: '#ffffff',
    colorSidebarBg: '#0f172a',
    colorSidebarText: '#94a3b8',
    colorSidebarActive: '#2563eb',
    colorBgAppStart: '#f8fafc',
    colorBgAppEnd: '#e2e8f0',
    bgType: 'gradient'
  });

  // UI state controllers
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('tasks');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Custom theme settings helpers
  const [harmoniousMode, setHarmoniousMode] = useState(true);
  const [newCatInput, setNewCatInput] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkIcon, setNewLinkIcon] = useState('Link');
  
  // Email connection notifications test result
  const [emailResult, setEmailResult] = useState<{ text: string; type: 'ok' | 'err' | 'loading' | null }>({ text: '', type: null });
  const [customHolidays, setCustomHolidays] = useState<Record<string, string>>({});
  const [currentTime, setCurrentTime] = useState('');
  const [showNotificationFlyout, setShowNotificationFlyout] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Account / Security states
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ text: string; type: 'ok' | 'err' } | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // Sychronize input values with loaded session user
  useEffect(() => {
    if (sessionUser.userId) {
      setEditUsername(sessionUser.userId);
    }
    if (sessionUser.password) {
      setEditPassword(sessionUser.password);
    }
  }, [sessionUser.userId, sessionUser.password]);

  // 1. Initial configuration load upon login
  useEffect(() => {
    // Check if session exists
    const savedLogged = localStorage.getItem('isLoggedIn') === 'true';
    const savedUserId = localStorage.getItem('sess_userId') || '';
    if (savedLogged && savedUserId) {
      const email = localStorage.getItem('user_email') || '';
      const phone = localStorage.getItem('user_phone') || '';
      const uid = localStorage.getItem('sess_uid') || '';
      const password = localStorage.getItem('user_password') || '000000';
      handleLoginSuccess(savedUserId, email, phone, uid, password);
    }
  }, []);

  // Update clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1.1 Automatic Daily Email Auto-Send Evaluation
  useEffect(() => {
    if (!isLoggedIn || !dataLoaded) return;

    if (settings.autoSendEnabled && settings.emailNotificationEnabled) {
      const todayStr = getThailandTodayStr();
      
      if (settings.lastAutoSentDate !== todayStr) {
        if (settings.smtpHost && settings.smtpUser && settings.smtpPass) {
          console.log("Evaluating Auto-Send for today:", todayStr);
          
          const runAutoSend = async () => {
            const success = await sendEmailViaSMTP(true);
            if (success) {
              console.log("Auto-Send Email succeeded for", todayStr);
              const updated = { ...settings, lastAutoSentDate: todayStr };
              await syncSettings(updated);
            } else {
              console.warn("Auto-Send email failed or was skipped.");
            }
          };

          const timeoutId = setTimeout(runAutoSend, 4000);
          return () => clearTimeout(timeoutId);
        }
      }
    }
  }, [isLoggedIn, dataLoaded, settings.autoSendEnabled, settings.emailNotificationEnabled, settings.lastAutoSentDate]);

  // 2. Fetch data from mock cloud storage (localStorage)
  const handleLoginSuccess = async (userId: string, email: string, phone: string, firebaseUid?: string, password?: string) => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('sess_userId', userId);
    localStorage.setItem('user_email', email);
    localStorage.setItem('user_phone', phone);
    if (password) {
      localStorage.setItem('user_password', password);
    }
    
    let uid = firebaseUid || localStorage.getItem('sess_uid') || '';
    if (uid) {
      localStorage.setItem('sess_uid', uid);
    }
    setSessionUser({ userId, email, phone, password: password || localStorage.getItem('user_password') || '000000' });
    setIsLoggedIn(true);

    const defaultSet = {
      appName: 'TaskFlow Space Executive Pro',
      appDesc: 'ระบบบอร์ดงาน ปฏิทินจดจำสรุปกิจกรรม และจัดการค่าชำระส่วนบุคคลสำหรับผู้บริหาร',
      appLogoUrl: '',
      bgStyle: 'theme-custom' as const,
      customBgUrl: '',
      darkMode: false,
      categories: DEFAULT_CATEGORIES,
      emailRecipient: email || '',
      emailNotificationEnabled: true,
      emailMessageTemplate: 'เรียน คุณท่าน\n\nเรื่อง รายงานสรุปรายการภารกิจคงค้างและแจ้งเตือนยอดค่าใช้จ่ายที่ครบกำหนดชำระ ประจำวันที่ {date}\n\nตามที่ระบบ {appName} ได้ทำการประเมินและคัดกรองข้อมูลรายการความก้าวหน้าของภารกิจงาน และรายการบิลค่าใช้จ่ายที่กำหนดรอบชำระประจำวันที่ {date} หรือที่เลยกำหนดเรียบร้อยแล้วนั้น\n\nทางระบบเรียนสรุปรายละเอียดงานสำคัญเรียน คุณท่าน เพื่อโปรดพิจารณาและดำเนินการตามที่สมควร ดังดีลรายงานด้านล่างนี้:\n\n📋 รายการภารกิจสำคัญ (กำหนดเสร็จสิ้นวันนี้ หรือ เลยกำหนด):\n━━━━━━━━━━━━━━━━━━━━\n{tasks}\n━━━━━━━━━━━━━━━━━━━━\n\n💰 รายการค่าใช้จ่ายค้างจัดการ (กำหนดชำระวันนี้ หรือ เลยกำหนด):\n━━━━━━━━━━━━━━━━━━━━\n{expenses}\n━━━━━━━━━━━━━━━━━━━━\n\nขอความกรุณา คุณท่าน โปรดพิจารณาตรวจสอบความเสร็จสิ้นและชำระบิลตามกำหนดการที่ระบุไว้\n\nด้วยความเคารพอย่างสูง,\nระบบจัดส่งข้อมูลอัตโนมัติ {appName}',
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPass: '',
      smtpSecure: false,
      smtpSenderName: '',
      autoSendEnabled: false,
      lastAutoSentDate: '',
      alertDays: [0, 1, 3],
      themePreset: 'indigo-dream',
      colorAccent: '#2563eb',
      colorAccentHover: '#1d4ed8',
      colorAccentLight: '#dbeafe',
      colorAccentText: '#ffffff',
      colorSidebarBg: '#0f172a',
      colorSidebarText: '#94a3b8',
      colorSidebarActive: '#2563eb',
      colorBgAppStart: '#f8fafc',
      colorBgAppEnd: '#e2e8f0',
      bgType: 'gradient' as const
    };

    setCustomHolidays({
      '2026-01-01': 'วันขึ้นปีใหม่',
      '2026-04-13': 'วันมหาสงกรานต์',
      '2026-05-01': 'วันแรงงานแห่งชาติ',
      '2026-08-12': 'วันแม่แห่งชาติ'
    });

    if (!uid) {
      // Local fallback if no Firebase session logged in
      const savedTasks = localStorage.getItem(`tasks_${userId}`);
      const savedExpenses = localStorage.getItem(`expenses_${userId}`);
      const savedSettings = localStorage.getItem(`settings_${userId}`);

      if (savedTasks) setTasks(JSON.parse(savedTasks));
      else setTasks([]);

      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
      else setExpenses([]);

      if (savedSettings) setSettings(JSON.parse(savedSettings));
      else setSettings(defaultSet);
      return;
    }

    try {
      // 1. Fetch settings from Firestore
      const settingsRef = doc(db, 'users', uid, 'settings', 'app');
      const settingsSnap = await getDoc(settingsRef);

      let currentSettings = defaultSet;
      if (settingsSnap.exists()) {
        currentSettings = { ...defaultSet, ...settingsSnap.data() };
        setSettings(currentSettings);
        localStorage.setItem(`settings_${userId}`, JSON.stringify(currentSettings));
      } else {
        // Fallback or migrate existing local settings to Firestore
        const savedSettings = localStorage.getItem(`settings_${userId}`);
        if (savedSettings) {
          try { currentSettings = { ...defaultSet, ...JSON.parse(savedSettings) }; } catch (e) {}
        }
        setSettings(currentSettings);
        await setDoc(settingsRef, currentSettings);
      }

      // 2. Fetch tasks from Firestore
      const tasksCol = collection(db, 'users', uid, 'tasks');
      const tasksSnap = await getDocs(tasksCol);

      if (!tasksSnap.empty) {
        const tasksList: Task[] = [];
        tasksSnap.forEach((doc) => {
          tasksList.push(doc.data() as Task);
        });
        setTasks(tasksList);
        localStorage.setItem(`tasks_${userId}`, JSON.stringify(tasksList));
      } else {
        // Fallback or migrate existing local tasks to Firestore
        const savedTasks = localStorage.getItem(`tasks_${userId}`);
        let tasksList: Task[] = [];
        if (savedTasks) {
          try { tasksList = JSON.parse(savedTasks); } catch (e) {}
        }
        if (tasksList.length === 0) {
          tasksList = [
            { id: 't1', title: 'ประชุมวางแผนงบประมาณโครงการก่อสร้างใหม่', desc: 'สรุปงบประมาณไตรมาสที่ 3 และพิจารณาสัญญารับเหมาช่วง', category: '💼 งานทั่วไป', dueDate: getThailandTodayStr(), dueTime: '13:00', status: 'pending', userId, createdAt: new Date().toISOString() },
            { id: 't2', title: 'ชำระค่าไฟและค่าน้ำสำนักงานใหญ่', desc: 'ยอดชำระตรวจสอบจากแดชบอร์ดค่าใช้จ่าย บิลรอบเดือนพฤษภาคม', category: '🔥 เร่งด่วน', dueDate: getThailandTodayStr(), dueTime: '17:00', status: 'pending', userId, createdAt: new Date().toISOString() },
            { id: 't3', title: 'ทบทวนสไลด์นำเสนอพาร์ทเนอร์ชาวต่างชาติ', desc: 'เตรียมจุดเด่นผลิตภัณฑ์ใหม่ และนโยบายส่วนลด', category: '💼 งานทั่วไป', dueDate: getDaysFromNowStr(2), status: 'pending', userId, createdAt: new Date().toISOString() }
          ];
        }
        setTasks(tasksList);
        localStorage.setItem(`tasks_${userId}`, JSON.stringify(tasksList));
        
        // Write each migrated task to Firestore sync
        for (const task of tasksList) {
          await setDoc(doc(db, 'users', uid, 'tasks', task.id), task);
        }
      }

      // 3. Fetch expenses from Firestore
      const expensesCol = collection(db, 'users', uid, 'expenses');
      const expensesSnap = await getDocs(expensesCol);

      if (!expensesSnap.empty) {
        const expensesList: Expense[] = [];
        expensesSnap.forEach((doc) => {
          expensesList.push(doc.data() as Expense);
        });
        setExpenses(expensesList);
        localStorage.setItem(`expenses_${userId}`, JSON.stringify(expensesList));
      } else {
        // Fallback or migrate existing local expenses
        const savedExpenses = localStorage.getItem(`expenses_${userId}`);
        let expensesList: Expense[] = [];
        if (savedExpenses) {
          try { expensesList = JSON.parse(savedExpenses); } catch (e) {}
        }
        if (expensesList.length === 0) {
          expensesList = [
            { id: 'e1', name: 'ค่าเช่าอาคารสำนักงานและโกดัง', amount: 45000, cat: '🏠 ที่พัก', date: getThailandTodayStr(), dueDate: getDaysFromNowStr(5), note: 'โอนชำระภายในวันที่ 5', paid: false, userId },
            { id: 'e2', name: 'ค่าบริการคลาวด์และโฮสติ้งเซิร์ฟเวอร์', amount: 3500.50, cat: '💡 สาธารณูปโภค', date: getThailandTodayStr(), dueDate: getThailandTodayStr(), note: 'ตัดบัตรเครดิตอัตโนมัติ', paid: true, userId },
            { id: 'e3', name: 'จัดซื้อเครื่องเขียนและอุปกรณ์สำนักงานส่วนกลาง', amount: 1200, cat: '🛒 ของใช้/อาหาร', date: getDaysFromNowStr(-1), dueDate: getDaysFromNowStr(2), note: 'เบิกจ่ายจาก Petty cash', paid: false, userId }
          ];
        }
        setExpenses(expensesList);
        localStorage.setItem(`expenses_${userId}`, JSON.stringify(expensesList));

        // Write each migrated expense to Firestore
        for (const exp of expensesList) {
          await setDoc(doc(db, 'users', uid, 'expenses', exp.id), exp);
        }
      }
      setDataLoaded(true);
    } catch (err) {
      console.error('Failed to sync or migrate from Firestore on login:', err);
      setDataLoaded(true); // fall through so user doesn't get blocked
    }
  };

  const handleLogout = () => {
    if (confirm('คุณต้องการออกจากระบบ TaskFlow Space ใช่หรือไม่?')) {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('sess_userId');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_phone');
      localStorage.removeItem('sess_uid');
      setIsLoggedIn(false);
      setDataLoaded(false);
      setSessionUser({ userId: '', email: '', phone: '' });
      setTasks([]);
      setExpenses([]);
    }
  };

  // Helper date tools
  const getThailandTodayStr = () => {
    return new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  };

  const getDaysFromNowStr = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(d);
  };

  // Synchronizers of data
  const syncTasks = async (newTasks: Task[]) => {
    setTasks(newTasks);
    if (sessionUser.userId) {
      localStorage.setItem(`tasks_${sessionUser.userId}`, JSON.stringify(newTasks));
    }

    const uid = localStorage.getItem('sess_uid');
    if (uid) {
      try {
        const previousMap = new Map<string, Task>(tasks.map(t => [t.id, t]));
        const currentMap = new Map<string, Task>(newTasks.map(t => [t.id, t]));

        // Check for deleted tasks
        for (const [id, _] of previousMap) {
          if (!currentMap.has(id)) {
            await deleteDoc(doc(db, 'users', uid, 'tasks', id));
          }
        }

        // Check for added or updated tasks
        for (const [id, task] of currentMap) {
          const prev = previousMap.get(id);
          if (!prev || JSON.stringify(prev) !== JSON.stringify(task)) {
            await setDoc(doc(db, 'users', uid, 'tasks', id), task);
          }
        }
      } catch (e) {
        console.error('Failed to sync tasks to Firestore:', e);
      }
    }
  };

  const syncExpenses = async (newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    if (sessionUser.userId) {
      localStorage.setItem(`expenses_${sessionUser.userId}`, JSON.stringify(newExpenses));
    }

    const uid = localStorage.getItem('sess_uid');
    if (uid) {
      try {
        const previousMap = new Map<string, Expense>(expenses.map(e => [e.id, e]));
        const currentMap = new Map<string, Expense>(newExpenses.map(e => [e.id, e]));

        // Check for deleted expenses
        for (const [id, _] of previousMap) {
          if (!currentMap.has(id)) {
            await deleteDoc(doc(db, 'users', uid, 'expenses', id));
          }
        }

        // Check for added or updated expenses
        for (const [id, exp] of currentMap) {
          const prev = previousMap.get(id);
          if (!prev || JSON.stringify(prev) !== JSON.stringify(exp)) {
            await setDoc(doc(db, 'users', uid, 'expenses', id), exp);
          }
        }
      } catch (e) {
        console.error('Failed to sync expenses to Firestore:', e);
      }
    }
  };

  const syncSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    if (sessionUser.userId) {
      localStorage.setItem(`settings_${sessionUser.userId}`, JSON.stringify(newSettings));
    }

    const uid = localStorage.getItem('sess_uid');
    if (uid) {
      try {
        await setDoc(doc(db, 'users', uid, 'settings', 'app'), newSettings);
      } catch (e) {
        console.error('Failed to sync settings to Firestore:', e);
      }
    }
  };

  const handleUpdateAccount = async (newUserId: string, newPassword: string) => {
    if (!newUserId.trim()) {
      setProfileMessage({ text: 'กรุณากรอกไอดีผู้ใช้งาน', type: 'err' });
      return;
    }
    if (newPassword.length < 4) {
      setProfileMessage({ text: 'รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร', type: 'err' });
      return;
    }

    setProfileSaving(true);
    setProfileMessage(null);

    const uid = localStorage.getItem('sess_uid');
    const cleanId = newUserId.trim().toLowerCase().replace(/\s/g, '');

    try {
      // 1. If auth is active, update email / password in Firebase Auth
      if (auth.currentUser) {
        // If changed userId, update email
        if (cleanId !== sessionUser.userId) {
          const newEmail = `${cleanId}@taskflow.space`;
          await updateEmail(auth.currentUser, newEmail);
        }
        // Update password
        const finalPass = padPass(newPassword);
        await updatePassword(auth.currentUser, finalPass);
      }

      // 2. Update Firestore doc
      if (uid) {
        await setDoc(doc(db, 'users', uid), {
          userId: cleanId,
          password: newPassword,
        }, { merge: true });
      }

      // 3. Keep localStorage updated
      localStorage.setItem('sess_userId', cleanId);
      localStorage.setItem('user_password', newPassword);

      // Save custom settings mapping
      const savedTasks = localStorage.getItem(`tasks_${sessionUser.userId}`);
      const savedExpenses = localStorage.getItem(`expenses_${sessionUser.userId}`);
      const savedSettings = localStorage.getItem(`settings_${sessionUser.userId}`);

      if (savedTasks) localStorage.setItem(`tasks_${cleanId}`, savedTasks);
      if (savedExpenses) localStorage.setItem(`expenses_${cleanId}`, savedExpenses);
      if (savedSettings) localStorage.setItem(`settings_${cleanId}`, savedSettings);

      setSessionUser(prev => ({ ...prev, userId: cleanId, password: newPassword }));
      setProfileMessage({ text: 'อัปเดตบัญชีผู้ใช้และรหัสผ่านเรียบร้อยแล้ว!', type: 'ok' });
    } catch (e: any) {
      console.error('Failed to update account:', e);
      let errMsg = e.message || String(e);
      if (e.code === 'auth/requires-recent-login' || errMsg.includes('recent login')) {
        errMsg = 'กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่อีกครั้ง เพื่อทำการยืนยันสิทธิ์เปลี่ยนรหัสผ่านล่าสุด';
      }
      setProfileMessage({ text: 'ไม่สามารถบันทึกข้อมูลเรียลไทม์ได้: ' + errMsg, type: 'err' });
    } finally {
      setProfileSaving(false);
    }
  };

  // 3. Task Handlers
  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'createdAt'>) => {
    const created: Task = {
      ...newTaskData,
      id: 'task_' + Date.now() + '_' + Math.floor(Math.random() * 9999),
      createdAt: new Date().toISOString()
    };
    syncTasks([...tasks, created]);
  };

  const handleEditTask = (id: string, updated: Partial<Task>) => {
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, ...updated } : t);
    syncTasks(updatedTasks);
  };

  const handleDeleteTask = (id: string) => {
    const filtered = tasks.filter(t => t.id !== id);
    syncTasks(filtered);
  };

  const handleDeleteAllCompleted = () => {
    const filtered = tasks.filter(t => t.status !== 'completed');
    syncTasks(filtered);
  };

  // 4. Expense Handlers
  const handleAddExpense = (newExpData: Omit<Expense, 'id'>) => {
    const created: Expense = {
      ...newExpData,
      id: 'exp_' + Date.now() + '_' + Math.floor(Math.random() * 9999)
    };
    syncExpenses([...expenses, created]);
  };

  const handleEditExpense = (id: string, updated: Partial<Expense>) => {
    const updatedExps = expenses.map(e => e.id === id ? { ...e, ...updated } : e);
    syncExpenses(updatedExps);
  };

  const handleDeleteExpense = (id: string) => {
    const filtered = expenses.filter(e => e.id !== id);
    syncExpenses(filtered);
  };

  // 5. Settings Tab Handlers
  const handleAddNewCategory = () => {
    const cat = newCatInput.trim();
    if (!cat) return;
    if (settings.categories.includes(cat)) {
      alert('หมวดหมู่นี้ถูกสร้างแล้ว');
      return;
    }
    const updatedCats = [...settings.categories, cat];
    syncSettings({ ...settings, categories: updatedCats });
    setNewCatInput('');
  };

  const handleRemoveCategory = (index: number) => {
    if (confirm('คุณต้องการนำหมวดหมู่นี้ออกจากฟิลเตอร์ใช่หรือไม่?')) {
      const updatedCats = settings.categories.filter((_, idx) => idx !== index);
      syncSettings({ ...settings, categories: updatedCats });
    }
  };

  const handleAddMenuLink = () => {
    const title = newLinkTitle.trim();
    let url = newLinkUrl.trim();
    if (!title || !url) {
      alert('กรุณากรอกทั้งชื่อเมนูและ URL ลิงก์เชื่อมโยงให้ครบถ้วน');
      return;
    }
    
    // Auto-prepend https:// if there is no protocol
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    const newLink = {
      id: '' + Date.now() + '_' + Math.floor(Math.random() * 999),
      title,
      url,
      iconName: newLinkIcon
    };

    const updatedLinks = [...(settings.customMenuLinks || []), newLink];
    syncSettings({ ...settings, customMenuLinks: updatedLinks });
    setNewLinkTitle('');
    setNewLinkUrl('');
    setNewLinkIcon('Link');
  };

  const handleRemoveMenuLink = (id: string) => {
    if (confirm('คุณต้องการนำลิงก์เมนูนี้ออกจากแถบนำทางใช่หรือไม่?')) {
      const updatedLinks = (settings.customMenuLinks || []).filter(l => l.id !== id);
      syncSettings({ ...settings, customMenuLinks: updatedLinks });
      if (activeTab === `link_${id}`) {
        setActiveTab('tasks');
      }
    }
  };

  const moveMenuLinkUp = (index: number) => {
    if (index === 0) return;
    const links = [...(settings.customMenuLinks || [])];
    const temp = links[index];
    links[index] = links[index - 1];
    links[index - 1] = temp;
    syncSettings({ ...settings, customMenuLinks: links });
  };

  const moveMenuLinkDown = (index: number) => {
    const links = [...(settings.customMenuLinks || [])];
    if (index === links.length - 1) return;
    const temp = links[index];
    links[index] = links[index + 1];
    links[index + 1] = temp;
    syncSettings({ ...settings, customMenuLinks: links });
  };

  // 6. Harmonious Color Tuning Engine
  const applyThemePreset = (presetId: string) => {
    const preset = THEME_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const updated = {
      ...settings,
      themePreset: presetId,
      colorAccent: preset.colorAccent,
      colorAccentHover: preset.colorAccentHover,
      colorAccentLight: preset.colorAccentLight,
      colorAccentText: preset.colorAccentText,
      colorSidebarBg: preset.colorSidebarBg,
      colorSidebarText: preset.colorSidebarText,
      colorSidebarActive: preset.colorSidebarActive,
      colorBgAppStart: preset.colorBgAppStart,
      colorBgAppEnd: preset.colorBgAppEnd,
      bgType: preset.bgType
    };
    syncSettings(updated);
  };

  const handleAccentColorChangeInput = (color: string) => {
    if (harmoniousMode) {
      // Auto-compute harmonious sub colors
      const hover = getDarkerColor(color, 12);
      const light = getLighterColor(color, 85);
      
      const updated = {
        ...settings,
        colorAccent: color,
        colorAccentHover: hover,
        colorAccentLight: light,
        // Match sidebar values dynamically to look cohesive
        colorSidebarActive: color
      };
      syncSettings(updated);
    } else {
      syncSettings({ ...settings, colorAccent: color });
    }
  };

  // Email notifications module
  const generateEmailContent = () => {
    const todayStr = getThailandTodayStr();
    
    // Filter pending tasks due today or overdue
    const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.dueDate <= todayStr);
    
    // Filter unpaid expenses due today, overdue or issued today (บิลวันนี้ ยอดชำระวันนี้ หรือเกินกำหนดชำระ)
    const unpaidExpenses = expenses.filter(e => {
      if (e.paid) return false;
      const isBillToday = e.date === todayStr;
      const isDueToday = e.dueDate === todayStr;
      const isOverdue = e.dueDate < todayStr;
      return isBillToday || isDueToday || isOverdue;
    });

    const taskText = pendingTasks.length > 0 
      ? pendingTasks.map((t, idx) => {
          const statusTxt = t.dueDate === todayStr ? '⚠️ ครบกำหนดวันนี้' : '🚨 เกินกำหนดส่ง';
          return `${idx + 1}. [${statusTxt}] หมวดหมู่: ${t.category}\n   ภารกิจ: ${t.title}\n   (กำหนดเวลา: ${t.dueDate} ${t.dueTime || 'ไม่ระบุเวลา'})`;
        }).join('\n\n')
      : 'ไม่มีภารกิจสำคัญครบกำหนดส่งวันนี้หรือสะสมค้างคาดำเนินงาน';
      
    const expenseText = unpaidExpenses.length > 0
      ? unpaidExpenses.map((e, idx) => {
          const isBillToday = e.date === todayStr;
          const isDueToday = e.dueDate === todayStr;
          const isOverdue = e.dueDate < todayStr;
          let statusTxt = '📝 บิลออกวันนี้';
          if (isOverdue) statusTxt = '🚨 เกินกำหนดชำระ';
          else if (isDueToday) statusTxt = '⚠️ ต้องชำระวันนี้';

          return `${idx + 1}. [${statusTxt}] หมวดหมู่: ${e.cat}\n   รายการจ่าย: ${e.name}\n   ยอดเงิน: ${Number(e.amount).toLocaleString('th-TH')} บาท\n   (กำหนดชำระ: ${e.dueDate})`;
        }).join('\n\n')
      : 'ไม่มีรายการหนี้สินหรือค่าใช้จ่ายครบกำหนดชำระสะสมในวันนี้';

    const defaultFormalTemplate = 'เรียน คุณท่าน\n\nเรื่อง รายงานสรุปรายการภารกิจคงค้างและแจ้งเตือนยอดค่าใช้จ่ายที่ครบกำหนดชำระ ประจำวันที่ {date}\n\nตามที่ระบบ {appName} ได้ทำการประเมินและคัดกรองข้อมูลรายการความก้าวหน้าของภารกิจงาน และรายการบิลค่าใช้จ่ายที่กำหนดรอบชำระประจำวันที่ {date} หรือที่เลยกำหนดเรียบร้อยแล้วนั้น\n\nทางระบบเรียนสรุปรายละเอียดงานสำคัญเรียน คุณท่าน เพื่อโปรดพิจารณาและดำเนินการตามที่สมควร ดังดีลรายงานด้านล่างนี้:\n\n📋 รายการภารกิจสำคัญ (กำหนดเสร็จสิ้นวันนี้ หรือ เลยกำหนด):\n━━━━━━━━━━━━━━━━━━━━\n{tasks}\n━━━━━━━━━━━━━━━━━━━━\n\n💰 รายการค่าใช้จ่ายค้างจัดการ (กำหนดชำระวันนี้ หรือ เลยกำหนด):\n━━━━━━━━━━━━━━━━━━━━\n{expenses}\n━━━━━━━━━━━━━━━━━━━━\n\nขอความกรุณา คุณท่าน โปรดพิจารณาตรวจสอบความเสร็จสิ้นและชำระบิลตามกำหนดการที่ระบุไว้\n\nด้วยความเคารพอย่างสูง,\nระบบจัดส่งข้อมูลอัตโนมัติ {appName}';

    const rawTemplate = settings.emailMessageTemplate || defaultFormalTemplate;

    return rawTemplate
      .replace(/{date}/g, todayStr)
      .replace(/{tasks}/g, taskText)
      .replace(/{expenses}/g, expenseText)
      .replace(/{appName}/g, settings.appName);
  };

  const sendEmailViaClient = () => {
    const recipient = settings.emailRecipient || sessionUser.email;
    if (!recipient) {
      setEmailResult({ text: '⚠️ กรุณาระบุที่อยู่อีเมลผู้รับสรุปรายงานก่อนทำรายการ', type: 'err' });
      return;
    }
    
    setEmailResult({ text: '⌛ กำลังจัดเตรียมและรวบรวมเนื้อหาอีเมล...', type: 'loading' });
    try {
      const emailBody = generateEmailContent();
      const subject = `📢 รายงานสถานะภารกิจและการเงินด่วน - ${getThailandTodayStr()}`;
      
      // We will perform mailto delivery
      const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      window.location.href = mailtoUrl;
      
      setTimeout(() => {
        setEmailResult({ 
          text: `✅ เปิดการส่งอีเมลไปยัง ${recipient} สำเร็จ! กรุณาตรวจสอบแท็บหรือแอปเมลที่เปิดขึ้นของท่านเพื่อกดส่งขั้นสุดท้าย`, 
          type: 'ok' 
        });
      }, 1000);
    } catch (err) {
      setEmailResult({ text: '❌ เกิดความล้มเหลวในการจัดทำเนื้อหารูปภาพ/ตัวคัดกรองอีเมล', type: 'err' });
    }
  };

  const sendEmailViaSMTP = async (isAuto = false) => {
    const recipient = settings.emailRecipient || sessionUser.email;
    if (!recipient) {
      if (!isAuto) {
        setEmailResult({ text: '⚠️ กรุณาระบุที่อยู่อีเมลผู้รับสรุปรายงานก่อนทำรายการ', type: 'err' });
      }
      return false;
    }

    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
      if (!isAuto) {
        setEmailResult({ text: '⚠️ กรุณาตั้งค่าเซิร์ฟเวอร์ SMTP (Host, User, Password) ด้านล่างให้ครบถ้วนเพื่อส่งอีเมลจริง', type: 'err' });
      }
      return false;
    }

    if (!isAuto) {
      setEmailResult({ text: '⌛ กำลังดำเนินการส่งอีเมลจริงผ่านระบบเซิร์ฟเวอร์ SMTP...', type: 'loading' });
    }

    try {
      const emailBody = generateEmailContent();
      const subject = `📢 รายงานสรุปสถานะภารกิจและการเงินผู้บริหาร - ${getThailandTodayStr()}`;

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipient,
          subject: subject,
          body: emailBody,
          smtpHost: settings.smtpHost,
          smtpPort: Number(settings.smtpPort) || 587,
          smtpUser: settings.smtpUser,
          smtpPass: settings.smtpPass,
          smtpSecure: settings.smtpSecure || false,
          smtpSenderName: settings.smtpSenderName || settings.appName,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        if (!isAuto) {
          setEmailResult({ 
            text: `✅ [ส่ง SMTP สำเร็จ] ส่งอีเมลรายงานสรุปไปยัง ${recipient} ผ่านเซิร์ฟเวอร์เรียบร้อยแล้ว!`, 
            type: 'ok' 
          });
        }
        return true;
      } else {
        if (!isAuto) {
          setEmailResult({ 
            text: `❌ ล้มเหลวส่ง SMTP: ${data.error || 'กรุณาตรวจสอบการตั้งค่า SMTP ให้ถูกต้อง'}`, 
            type: 'err' 
          });
        }
        return false;
      }
    } catch (err: any) {
      console.error(err);
      if (!isAuto) {
        setEmailResult({ 
          text: `❌ ล้มเหลวในการเชื่อมต่อ API ส่งอีเมล: ${err.message || 'เครือข่ายขัดข้อง'}`, 
          type: 'err' 
        });
      }
      return false;
    }
  };

  const testEmailNotification = () => {
    const recipient = settings.emailRecipient || sessionUser.email;
    if (!recipient) {
      setEmailResult({ text: '⚠️ กรุณาระบุกำหนดอีเมลผู้รับทดสอบ', type: 'err' });
      return;
    }
    
    setEmailResult({ text: '⌛ กำลังส่งอีเมลจำลองการตั้งค่าระบบ...', type: 'loading' });
    setTimeout(() => {
      setEmailResult({ 
        text: `✅ [ทดสอบเซิร์ฟเวอร์ยิงสำเร็จ] ระบบเครือข่ายส่งอีเมลจำลอง (Mock SMTP) ส่งข้อมูลไปยัง ${recipient} สำเร็จ!`, 
        type: 'ok' 
      });
    }, 1200);
  };

  // Convert settings custom variables to document styles to power Tailwind v4 variables dynamically
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', settings.colorAccent);
    root.style.setProperty('--accent-hover', settings.colorAccentHover);
    root.style.setProperty('--accent-light', settings.colorAccentLight);
    root.style.setProperty('--accent-text', settings.colorAccentText);
    root.style.setProperty('--sidebar-bg', settings.colorSidebarBg);
    root.style.setProperty('--sidebar-text', settings.colorSidebarText);
    root.style.setProperty('--sidebar-active', settings.colorSidebarActive);
  }, [settings]);

  // Handle application applet background styles
  const getAppStyleBackground = (): React.CSSProperties => {
    if (settings.bgStyle === 'indigo') {
      return { background: 'linear-gradient(135deg, #f0f4ff 0%, #e8edff 50%, #f0e8ff 100%)' };
    } else if (settings.bgStyle === 'slate') {
      return { background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' };
    } else if (settings.bgStyle === 'custom' && settings.customBgUrl) {
      return {
        backgroundImage: `url('${settings.customBgUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      };
    } else if (settings.bgStyle === 'theme-custom') {
      if (settings.bgType === 'gradient') {
        return { background: `linear-gradient(135deg, ${settings.colorBgAppStart} 0%, ${settings.colorBgAppEnd} 100%)` };
      } else {
        return { backgroundColor: settings.colorBgAppStart };
      }
    }
    return { backgroundColor: '#f8fafc' };
  };

  // Render application notifications indicators summary
  const todayStr = getThailandTodayStr();
  
  // Pending tasks due today or overdue
  const notificationTasks = tasks.filter(t => t.status !== 'completed' && t.dueDate <= todayStr);
  
  // Expenses that are not paid yet and meet one of the criteria:
  // 1. "บิลวันนี้" (expense.date === today)
  // 2. "ยอดที่ต้องชำระวันนี้" (expense.dueDate === today)
  // 3. "ยอดเลยกำหนด" (expense.dueDate < today)
  const notificationExpenses = expenses.filter(e => {
    if (e.paid) return false;
    const isBillToday = e.date === todayStr;
    const isDueToday = e.dueDate === todayStr;
    const isOverdue = e.dueDate < todayStr;
    return isBillToday || isDueToday || isOverdue;
  });

  const notificationCount = notificationTasks.length + notificationExpenses.length;

  if (!isLoggedIn) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} accentColor={settings.colorAccent} />;
  }

  return (
    <div
      className={`min-h-screen flex text-slate-800 transition-colors duration-200 ${settings.darkMode ? 'dark text-slate-200' : ''}`}
      style={getAppStyleBackground()}
    >
      {/* Dynamic Style Tags to handle theme variables seamlessly across elements */}
      <style>{`
        .bg-accent { background-color: var(--accent) !important; }
        .text-accent { color: var(--accent) !important; }
        .border-accent { border-color: var(--accent) !important; }
        .hover\\:bg-accent-hover:hover { background-color: var(--accent-hover) !important; }
        .bg-accent-light { background-color: var(--accent-light) !important; }
        .text-accent-text { color: var(--accent-text) !important; }
        
        .bg-sidebar-bg { background-color: var(--sidebar-bg) !important; }
        .text-sidebar-text { color: var(--sidebar-text) !important; }
        .bg-sidebar-active { background-color: var(--sidebar-active) !important; }
      `}</style>

      {/* MOBILE HEADER BUTTON OVERLAY */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* LEFT SIDEBAR AREA */}
      <aside
        className={`fixed top-0 bottom-0 left-0 h-screen bg-sidebar-bg text-sidebar-text z-40 flex flex-col overflow-hidden shadow-xl border-r border-slate-800 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Core application brand area */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {settings.appLogoUrl ? (
              <img
                src={settings.appLogoUrl}
                alt="Logo"
                className="w-8 h-8 rounded-lg object-contain bg-white dark:bg-slate-900 border border-slate-700/50 flex-shrink-0"
                style={{ imageRendering: 'auto' }}
              />
            ) : (
              <div
                className="w-8 h-8 text-white rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: settings.colorAccent }}
              >
                <Layers className="w-4 h-4" />
              </div>
            )}
            
            {!sidebarCollapsed && (
              <span className="font-extrabold text-sm text-slate-100 truncate tracking-tight">
                {settings.appName.split(' ')[0]}
              </span>
            )}
          </div>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex w-7 h-7 hover:bg-slate-800 text-slate-500 hover:text-slate-200 rounded-md items-center justify-center transition-all"
            title="พับเก็บหรือกางเมนู"
          >
            <ChevronsLeft className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation Menus tabs */}
        <nav className="flex-1 p-2 space-y-1 py-4 overflow-y-auto">
          {!sidebarCollapsed && (
            <div className="px-3 text-[9.5px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
              ระบบวางแผนหลัก
            </div>
          )}

          <button
            onClick={() => { setActiveTab('tasks'); setMobileMenuOpen(false); }}
            className={`w-full h-11 px-3 rounded-xl flex items-center gap-3 font-semibold text-xs transition-all ${
              activeTab === 'tasks'
                ? 'bg-slate-800 text-white border-l-[3px]'
                : 'hover:bg-slate-800'
            }`}
            style={activeTab === 'tasks' ? { borderLeftColor: settings.colorAccent } : {}}
          >
            <CheckSquare className="w-4.5 h-4.5 flex-shrink-0" />
            {!sidebarCollapsed && <span>รายการบอร์ดคณะงาน</span>}
          </button>

          <button
            onClick={() => { setActiveTab('calendar'); setMobileMenuOpen(false); }}
            className={`w-full h-11 px-3 rounded-xl flex items-center gap-3 font-semibold text-xs transition-all ${
              activeTab === 'calendar'
                ? 'bg-slate-800 text-white border-l-[3px]'
                : 'hover:bg-slate-800'
            }`}
            style={activeTab === 'calendar' ? { borderLeftColor: settings.colorAccent } : {}}
          >
            <CalendarIcon className="w-4.5 h-4.5 flex-shrink-0" />
            {!sidebarCollapsed && <span>แผนผังปฏิทินกิจการ</span>}
          </button>

          <button
            onClick={() => { setActiveTab('expenses'); setMobileMenuOpen(false); }}
            className={`w-full h-11 px-3 rounded-xl flex items-center gap-3 font-semibold text-xs transition-all ${
              activeTab === 'expenses'
                ? 'bg-slate-800 text-white border-l-[3px]'
                : 'hover:bg-slate-800'
            }`}
            style={activeTab === 'expenses' ? { borderLeftColor: settings.colorAccent } : {}}
          >
            <Receipt className="w-4.5 h-4.5 flex-shrink-0" />
            {!sidebarCollapsed && <span>จัดการเงินค่าใช้จ่าย</span>}
          </button>

          {/* Inline custom menu links */}
          {settings.customMenuLinks && settings.customMenuLinks.map((link) => {
            const IconComponent = getCustomLinkIconComponent(link.iconName || 'Link');
            return (
              <button
                key={link.id}
                onClick={() => { setActiveTab(`link_${link.id}`); setMobileMenuOpen(false); }}
                className={`w-full h-11 px-3 rounded-xl flex items-center gap-3 font-semibold text-xs transition-all ${
                  activeTab === `link_${link.id}`
                    ? 'bg-slate-800 text-white border-l-[3px]'
                    : 'hover:bg-slate-800'
                }`}
                style={activeTab === `link_${link.id}` ? { borderLeftColor: settings.colorAccent } : {}}
                title={link.title}
              >
                <IconComponent className="w-4.5 h-4.5 flex-shrink-0" style={{ color: activeTab === `link_${link.id}` ? settings.colorAccent : undefined }} />
                {!sidebarCollapsed && <span className="truncate">{link.title}</span>}
              </button>
            );
          })}

          {!sidebarCollapsed && (
            <div className="px-3 pt-6 text-[9.5px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
              การจัดการระบบ
            </div>
          )}

          <button
            onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
            className={`w-full h-11 px-3 rounded-xl flex items-center gap-3 font-semibold text-xs transition-all ${
              activeTab === 'settings'
                ? 'bg-slate-800 text-white border-l-[3px]'
                : 'hover:bg-slate-800'
            }`}
            style={activeTab === 'settings' ? { borderLeftColor: settings.colorAccent } : {}}
          >
            <SettingsIcon className="w-4.5 h-4.5 flex-shrink-0" />
            {!sidebarCollapsed && <span>ตกแต่ง & ตั้งค่ารวม</span>}
          </button>
        </nav>

        {/* Sidebar Footer account section */}
        <div className="p-2 border-t border-slate-800 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full h-11 px-3 rounded-xl hover:bg-rose-950/40 text-rose-450 hover:text-rose-400 font-semibold text-xs transition-all flex items-center gap-3"
          >
            <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
            {!sidebarCollapsed && <span>ออกสู่ระบบ</span>}
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN APP BODY CONTAINER */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-60'
        }`}
      >
        {/* UPPER RESPONSIVE APP HEADER */}
        <header className="h-16 border-b border-slate-200/85 px-4 lg:px-8 flex items-center justify-between bg-white/70 backdrop-blur-md sticky top-0 z-30 dark:bg-slate-900/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>

            {settings.appLogoUrl && (
              <img
                src={settings.appLogoUrl}
                alt="Logo"
                className="w-8 h-8 rounded-lg border border-slate-200 object-contain dark:border-slate-800 hidden lg:block bg-white dark:bg-slate-900"
                style={{ imageRendering: 'auto' }}
              />
            )}

            <div>
              <h1 className="text-[13px] font-black text-slate-800 dark:text-white truncate max-w-[180px] sm:max-w-xs leading-none">
                {settings.appName}
              </h1>
              <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[180px] sm:max-w-xs leading-none">
                {settings.appDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Clock Widget */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-3.5 py-1.5 font-mono text-[10.5px] font-bold text-slate-500 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5" style={{ color: settings.colorAccent }} />
              <span>{currentTime || '00:00:00'}</span>
            </div>

            {/* Notification center */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationFlyout(!showNotificationFlyout)}
                className="w-10 h-10 border border-slate-200 text-slate-500 bg-white rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all relative dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400"
                title="การแจ้งเตือนระบบ"
              >
                <Bell className="w-4.5 h-4.5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950 animate-pulse">
                    {notificationCount}
                  </span>
                )}
              </button>

              {/* Dropdown list */}
              {showNotificationFlyout && (
                <>
                  {/* Backdrop overlay to close when clicking outside */}
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setShowNotificationFlyout(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden dark:bg-slate-900 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                    {/* Header */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4" style={{ color: settings.colorAccent }} />
                        <span className="text-xs font-black text-slate-800 dark:text-white">รายการแจ้งเตือนค้างจัดการ ({notificationCount})</span>
                      </div>
                      <button 
                        onClick={() => setShowNotificationFlyout(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Scrollable list content */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
                      {notificationCount === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 font-medium space-y-2">
                          <CheckSquare className="w-8 h-8 mx-auto text-slate-300" />
                          <p>คุ้มครองเรียบร้อย! ไม่มีรายการแจ้งเตือนที่หลังชนฝาขณะนี้</p>
                        </div>
                      ) : (
                        <>
                          {/* 1. Pending Tasks */}
                          {notificationTasks.map(task => (
                            <div key={task.id} className="p-3.5 flex items-start gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 group transition-all">
                              <button
                                onClick={() => {
                                  handleEditTask(task.id, { status: 'completed' });
                                }}
                                className="w-5 h-5 flex-shrink-0 mt-0.5 border-2 border-slate-300 rounded hover:border-emerald-500 hover:bg-emerald-50 flex items-center justify-center transition-all dark:border-slate-700 dark:hover:bg-emerald-950"
                                title="ทำเครื่องหมายเสร็จสิ้น"
                              >
                                <span className="text-transparent group-hover:text-emerald-500 text-[10px] font-black">✓</span>
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md dark:bg-slate-800 dark:text-slate-400">
                                    {task.category}
                                  </span>
                                  {task.dueDate === todayStr ? (
                                    <span className="text-[9px] font-extrabold text-amber-600">⚡ กำหนดวันนี้</span>
                                  ) : (
                                    <span className="text-[9px] font-extrabold text-rose-500">🚨 เลยกำหนด</span>
                                  )}
                                </div>
                                <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-1 truncate">
                                  {task.title}
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                                  กำหนด: {task.dueDate} {task.dueTime || ''}
                                </p>
                              </div>
                            </div>
                          ))}

                          {/* 2. Expenses matching criteria */}
                          {notificationExpenses.map(exp => {
                            const isBillToday = exp.date === todayStr;
                            const isDueToday = exp.dueDate === todayStr;
                            const isOverdue = exp.dueDate < todayStr;
                            return (
                              <div key={exp.id} className="p-3.5 flex items-start gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 group transition-all">
                                <button
                                  onClick={() => {
                                    handleEditExpense(exp.id, { paid: true });
                                  }}
                                  className="w-5 h-5 flex-shrink-0 mt-0.5 border-2 border-slate-300 rounded-full hover:border-emerald-500 hover:bg-emerald-50 flex items-center justify-center transition-all dark:border-slate-700 dark:hover:bg-emerald-950"
                                  title="ทำเครื่องหมายชำระแล้ว"
                                >
                                  <span className="text-transparent group-hover:text-emerald-500 text-[10px] font-black">✓</span>
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded-md dark:bg-teal-950/30 dark:text-teal-400">
                                      {exp.cat}
                                    </span>
                                    {isOverdue && (
                                      <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 animate-pulse dark:bg-rose-950/30 dark:border-rose-900">
                                        🚨 เลยกำหนดชำระ
                                      </span>
                                    )}
                                    {isDueToday && (
                                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900">
                                        ⚡ ต้องชำระวันนี้
                                      </span>
                                    )}
                                    {isBillToday && !isDueToday && !isOverdue && (
                                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900">
                                        📝 บิลออกวันนี้
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-1 truncate">
                                    {exp.name}
                                  </h4>
                                  <div className="flex items-center justify-between mt-1 text-[10px]">
                                    <span className="font-extrabold text-rose-600 dark:text-rose-450 font-mono">
                                      ยอด: {Number(exp.amount).toLocaleString('th-TH')} บาท
                                    </span>
                                    <span className="text-slate-400 font-semibold">
                                      ครบกำหนด: {exp.dueDate}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>

                    {/* Footer navigate buttons */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/30 flex gap-2">
                      <button
                        onClick={() => {
                          setActiveTab('tasks');
                          setShowNotificationFlyout(false);
                        }}
                        className="flex-1 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-600 transition-all dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
                      >
                        📊 จัดการภารกิจ
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('expenses');
                          setShowNotificationFlyout(false);
                        }}
                        className="flex-1 h-8 rounded-lg text-[10px] font-bold text-white shadow-sm hover:brightness-105 transition-all"
                        style={{ backgroundColor: settings.colorAccent }}
                      >
                        💸 จัดการค่าใช้จ่าย
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="h-10 px-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl flex items-center gap-1.5 text-xs font-bold hover:bg-rose-100 transition-all dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-450"
            >
              <LogOut className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden sm:inline">ออก</span>
            </button>
          </div>
        </header>

        {/* PRIMARY WINDOW CONTENT VIEW */}
        <main className={activeTab.startsWith('link_') ? "flex-1 w-full h-[calc(100vh-4rem)] overflow-hidden" : "p-4 lg:p-8 flex-1 max-w-7xl w-full mx-auto pb-16"}>
          {activeTab.startsWith('link_') && (() => {
            const linkId = activeTab.replace('link_', '');
            const targetLink = settings.customMenuLinks?.find(l => l.id === linkId);
            if (!targetLink) {
              return (
                <div className="p-8 text-center">
                  <p className="text-xs text-slate-500 font-bold">ไม่พบหน้าเว็บลิงก์เชื่อมโยงที่กำหนด</p>
                </div>
              );
            }
            return (
              <div 
                className="flex flex-col w-full h-full overflow-hidden"
                id="custom-link-viewport"
              >
                <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex-shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Link className="w-4 h-4 flex-shrink-0" style={{ color: settings.colorAccent }} />
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{targetLink.title}</span>
                  </div>
                  <button 
                    onClick={() => {
                      const iframe = document.getElementById('link-iframe') as HTMLIFrameElement;
                      if (iframe) iframe.src = targetLink.url;
                    }}
                    className="hover:underline text-[10px] font-black flex items-center gap-1 flex-shrink-0"
                    style={{ color: settings.colorAccent }}
                  >
                    🔄 โหลดใหม่
                  </button>
                </div>

                <div className="flex-1 w-full bg-slate-50 dark:bg-slate-950">
                  <iframe 
                    id="link-iframe"
                    src={targetLink.url} 
                    className="w-full h-full border-0 bg-white dark:bg-slate-900" 
                    title={targetLink.title}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            );
          })()}

          {activeTab === 'tasks' && (
            <TaskModule
              tasks={tasks}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onDeleteAllCompleted={handleDeleteAllCompleted}
              categories={settings.categories}
              accentColor={settings.colorAccent}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarModule
              tasks={tasks}
              holidays={customHolidays}
              onAddTaskOnDate={(dt) => {
                setActiveTab('tasks');
                // Auto trigger new modal via micro timeout
                setTimeout(() => {
                  const ev = new CustomEvent('trigger-add-modal', { detail: dt });
                  window.dispatchEvent(ev);
                }, 200);
              }}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              accentColor={settings.colorAccent}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpenseModule
              expenses={expenses}
              onAddExpense={handleAddExpense}
              onEditExpense={handleEditExpense}
              onDeleteExpense={handleDeleteExpense}
              accentColor={settings.colorAccent}
            />
          )}

          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              
              {/* ส่วนความปลอดภัย & แก้ไขรหัสผ่านก่อนเข้าใช้งาน */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 dark:bg-slate-900 dark:border-slate-800 xl:col-span-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400 font-bold text-sm">
                    🔐
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">ข้อมูลบัญชีและความปลอดภัยก่อนเข้าใช้งาน (System Security & Access)</span>
                    <span className="text-[10px] text-slate-400 font-medium">จัดการชื่อผู้ใช้งานเริ่มต้นและรหัสผ่านลับก่อนเปิดเข้าเว็บใช้งานแอปพลิเคชัน</span>
                  </div>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-450 mb-1.5">
                      👤 ชื่อผู้ใช้งานเข้าใช้ระบบหลัก (Username / ID)
                    </label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="เช่น admin"
                      className="w-full h-11 px-3 border border-slate-200 bg-slate-50 focus:bg-white dark:focus:bg-slate-900 rounded-lg text-sm text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 font-medium font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">ใช้พิมพ์ในช่องยูเซอร์เนมเข้าสู่เว็บไซต์ในครั้งถัดไป</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-450 mb-1.5">
                      🔑 รหัสผ่านลับก่อนเข้าเว็บคัดกรอง (Password)
                    </label>
                    <input
                      type="text"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="เช่น 000000"
                      className="w-full h-11 px-3 border border-slate-200 bg-slate-50 focus:bg-white dark:focus:bg-slate-900 rounded-lg text-sm text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 font-medium font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">รหัสผ่านลับพื้นฐานเริ่มต้นถูกกำหนดไว้ที่ <span className="font-bold underline text-amber-500">000000</span></p>
                  </div>
                </div>

                {profileMessage && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    profileMessage.type === 'ok' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900' 
                      : 'bg-rose-50 text-rose-800 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900'
                  }`}>
                    <span className="text-sm">{profileMessage.type === 'ok' ? '✅' : '⚠️'}</span>
                    <span className="font-semibold">{profileMessage.text}</span>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={profileSaving}
                    onClick={() => handleUpdateAccount(editUsername, editPassword)}
                    className="flex items-center gap-2 px-5 h-11 rounded-lg text-xs font-black text-white hover:opacity-95 active:scale-95 transition-all cursor-pointer shadow-md shadow-accent/15"
                    style={{ backgroundColor: settings.colorAccent }}
                  >
                    {profileSaving ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        กำลังประมวลผลข้อมูลบัญชี...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        บันทึกเปลี่ยนรหัสผ่านและยูเซอร์ใหม่
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Branding and style customizers */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 dark:bg-slate-900 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <Sliders className="w-4.5 h-4.5 text-accent" style={{ color: settings.colorAccent }} />
                  การตั้งค่าทั่วไปของแอปพลิเคชัน
                </h3>

                <div className="space-y-4 text-xs font-semibold text-slate-650">
                  <div>
                    <label className="block text-slate-600 mb-1 dark:text-slate-450">ชื่อระบบงานแอปพลิเคชัน</label>
                    <input
                      type="text"
                      value={settings.appName}
                      onChange={(e) => syncSettings({ ...settings, appName: e.target.value })}
                      className="w-full h-11 px-3 border border-slate-200 bg-slate-50 focus:bg-white dark:focus:bg-slate-900 rounded-lg text-sm text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 dark:text-slate-450">คำนิยามหรือคำอธิบายระบบ</label>
                    <input
                      type="text"
                      value={settings.appDesc}
                      onChange={(e) => syncSettings({ ...settings, appDesc: e.target.value })}
                      className="w-full h-11 px-3 border border-slate-200 bg-slate-50 focus:bg-white dark:focus:bg-slate-900 rounded-lg text-sm text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-650 mb-1.5 dark:text-slate-450 font-bold">อัปโหลดรูปภาพโลโก้ หรือป้อนประเภทลิงก์ URL (Logo Image File / URL)</label>
                    <div className="space-y-2">
                      {/* Drag & Drop File Upload Field & Preview */}
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const file = e.dataTransfer.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                syncSettings({ ...settings, appLogoUrl: event.target.result as string });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="border border-dashed border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 rounded-xl p-4 bg-slate-100/50 dark:bg-slate-950/25 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer relative"
                        onClick={() => {
                          const fileInput = document.getElementById('logo-file-input');
                          if (fileInput) fileInput.click();
                        }}
                      >
                        <input
                          id="logo-file-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  syncSettings({ ...settings, appLogoUrl: event.target.result as string });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        {settings.appLogoUrl ? (
                          <div className="flex items-center gap-3 w-full">
                            <div className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 flex items-center justify-center flex-shrink-0 shadow-sm">
                              <img
                                src={settings.appLogoUrl}
                                alt="Uploaded Logo Preview"
                                className="max-w-full max-h-full object-contain rounded-md animate-fade-in"
                                style={{ imageRendering: 'auto' }}
                              />
                            </div>
                            <div className="min-w-0 flex-1 text-left">
                              <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">มีไฟล์โลโก้ติดตั้งอยู่</p>
                              <p className="text-[10px] text-slate-400 font-medium truncate">คลิกที่นี่หรือลากรูปใหม่ เพื่อแทนที่โลโก้เดิม</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                syncSettings({ ...settings, appLogoUrl: '' });
                              }}
                              className="text-[10px] font-black text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
                            >
                              ลบโลโก้ออก
                            </button>
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <div className="mx-auto w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-350 text-sm mb-1.5">
                              🖼️
                            </div>
                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">คลิกเพื่อเลือกไฟล์ หรือ ลากไฟล์รูปวางตรงนี้</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">รองรับไฟล์ชนิด PNG, JPG, SVG, WebP</p>
                          </div>
                        )}
                      </div>

                      {/* Text Input for URL option */}
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-[10px] text-slate-400 font-bold font-mono">URL:</span>
                        </div>
                        <input
                          type="text"
                          placeholder="หรือวาง URL ลิงก์รูปภาพโดยตรงที่นี่..."
                          value={settings.appLogoUrl || ''}
                          onChange={(e) => syncSettings({ ...settings, appLogoUrl: e.target.value })}
                          className="w-full h-10 pl-11 pr-3 border border-slate-200 bg-slate-50 focus:bg-white dark:focus:bg-slate-900 rounded-lg text-xs text-slate-850 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-250 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-slate-600 mb-1 dark:text-slate-450">สไตล์พื้นหลังหน้าต่าง</label>
                      <select
                        value={settings.bgStyle}
                        onChange={(e) => syncSettings({ ...settings, bgStyle: e.target.value as any })}
                        className="w-full h-11 px-3 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                      >
                        <option value="theme-custom">ปรับสีกรมหมุนตามธีม (Recommended)</option>
                        <option value="default">สีเทา Minimal ปกติ</option>
                        <option value="indigo">เฉดฟ้าม่วงออโรร่า (Indigo)</option>
                        <option value="slate">เฉดเทากระเบื้อง (Slate)</option>
                        <option value="custom">รูปภาพจากเว็บ URL</option>
                      </select>
                    </div>

                    {settings.bgStyle === 'custom' && (
                      <div>
                        <label className="block text-slate-600 mb-1 dark:text-slate-450">ลิงก์ภาพพื้นหลัง URL *</label>
                        <input
                          type="text"
                          value={settings.customBgUrl || ''}
                          onChange={(e) => syncSettings({ ...settings, customBgUrl: e.target.value })}
                          placeholder="https://..."
                          className="w-full h-11 px-3 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                        />
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl flex items-center justify-between dark:bg-slate-950 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-2">
                      <Moon className="w-4 h-4 text-slate-400" />
                      โหมดธีมมืด (Dark Mode)
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.darkMode}
                      onChange={(e) => syncSettings({ ...settings, darkMode: e.target.checked })}
                      className="w-4.5 h-4.5 cursor-pointer accent-accent"
                      style={{ '--accent': settings.colorAccent } as React.CSSProperties}
                    />
                  </div>
                </div>
              </div>

              {/* HARMONIOUS COLOR CUSTOMIZER (THE CORE FEATURE TO EDIT SYSTEM COLORS HARMONIOUSLY) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 dark:bg-slate-900 dark:border-slate-800">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ backgroundColor: settings.colorAccent }}></span>
                    จานสีกำหนดเองทั้งหน้าต่าง (Harmonious Theme Customizer)
                  </h3>
                  
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full dark:bg-emerald-950/40 dark:text-emerald-400">
                    Harmonious 100%
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Presets List */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-450 mb-2">1. เลือกชุดจานสีพรีเซ็ตหลัก ( harmonious presets )</label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {THEME_PRESETS.map(preset => {
                        const isActive = settings.themePreset === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => applyThemePreset(preset.id)}
                            className={`p-2.5 rounded-xl border text-left text-[11px] font-bold transition-all relative overflow-hidden ${
                              isActive 
                                ? 'border-accent bg-accent/5 ring-1 ring-accent' 
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950'
                            }`}
                            style={isActive ? { '--accent': settings.colorAccent } as React.CSSProperties : {}}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: preset.colorAccent }} />
                              <span className="truncate text-slate-700 dark:text-slate-300">{preset.name}</span>
                            </div>
                            <div className="mt-1 text-[10px] font-medium text-slate-400 truncate">
                              {preset.nameTh}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Harmonious calculation toggle */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between dark:bg-blue-950/20 dark:border-blue-900">
                    <div>
                      <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400">โหมดคำนวณสีอัตโนมัติ (Harmonious Mode)</h4>
                      <p className="text-[10px] text-blue-600/80 mt-0.5 dark:text-blue-400/70">เลือกเพื่อปรับแต่ง Accent หลัก แล้วสี Hover / บอร์เดอร์จะปรับสมดุลตามเองอย่างกลมกลืน</p>
                    </div>
                    
                    <input
                      type="checkbox"
                      checked={harmoniousMode}
                      onChange={(e) => setHarmoniousMode(e.target.checked)}
                      className="w-4.5 h-4.5 cursor-pointer accent-blue-600"
                    />
                  </div>

                  {/* Hex Color Pickers Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Primary Accent Color Selector */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-950 dark:border-slate-800">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5">สีเน้นหลักระบบ (Primary Accent)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.colorAccent}
                          onChange={(e) => handleAccentColorChangeInput(e.target.value)}
                          className="w-10 h-10 border border-slate-300 rounded cursor-pointer p-0 overflow-hidden"
                        />
                        <div className="min-w-0">
                          <input
                            type="text"
                            maxLength={7}
                            value={settings.colorAccent}
                            onChange={(e) => handleAccentColorChangeInput(e.target.value)}
                            className="w-20 font-mono text-xs text-slate-700 bg-white border border-slate-200 p-1.5 rounded focus:outline-none dark:bg-slate-900 dark:border-slate-800"
                          />
                          <p className="text-[9px] text-slate-400 mt-1">ใช้กับกลุ่มปุ่มและเช็กมาร์ก</p>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Accent (Advanced only) */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-950 dark:border-slate-800">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5">ปุ่มโฮเวอร์ (Hover Accent)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.colorAccentHover}
                          onChange={(e) => syncSettings({ ...settings, colorAccentHover: e.target.value })}
                          disabled={harmoniousMode}
                          className={`w-10 h-10 border border-slate-300 rounded p-0 overflow-hidden ${harmoniousMode ? 'cursor-not-allowed opacity-45' : 'cursor-pointer'}`}
                        />
                        <div className="min-w-0">
                          <input
                            type="text"
                            maxLength={7}
                            value={settings.colorAccentHover}
                            onChange={(e) => syncSettings({ ...settings, colorAccentHover: e.target.value })}
                            disabled={harmoniousMode}
                            className={`w-20 font-mono text-xs text-slate-700 bg-white border border-slate-200 p-1.5 rounded focus:outline-none dark:bg-slate-900 dark:border-slate-800 ${harmoniousMode ? 'bg-slate-100 text-slate-400' : ''}`}
                          />
                          <p className="text-[9px] text-slate-400 mt-1">{harmoniousMode ? 'โหมดออโต้ล็อคไว้' : 'ปรับเปลี่ยนสีได้อิสระ'}</p>
                        </div>
                      </div>
                    </div>

                    {/* App background gradients / solids customize config */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-950 dark:border-slate-800">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5">พื้นหลังเพลท 1 (App Background)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.colorBgAppStart}
                          onChange={(e) => syncSettings({ ...settings, colorBgAppStart: e.target.value })}
                          className="w-10 h-10 border border-slate-300 rounded cursor-pointer p-0 overflow-hidden"
                        />
                        <div className="min-w-0">
                          <input
                            type="text"
                            maxLength={7}
                            value={settings.colorBgAppStart}
                            onChange={(e) => syncSettings({ ...settings, colorBgAppStart: e.target.value })}
                            className="w-20 font-mono text-xs text-slate-700 bg-white border border-slate-200 p-1.5 rounded focus:outline-none dark:bg-slate-900 dark:border-slate-800"
                          />
                          <p className="text-[9px] text-slate-400 mt-1">ใช้เมื่อสไตล์เป็นสีกำหนดธีม</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-950 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-slate-500">สีท้ายไล่โทน (Gradient End)</label>
                        <select
                          value={settings.bgType}
                          onChange={(e) => syncSettings({ ...settings, bgType: e.target.value as any })}
                          className="text-[10px] font-bold text-slate-450 border border-slate-200 rounded p-0.5 bg-white dark:bg-slate-900 dark:border-slate-800"
                        >
                          <option value="gradient">แบบไล่เฉด</option>
                          <option value="solid">สีพื้นนิ่ง</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.colorBgAppEnd}
                          onChange={(e) => syncSettings({ ...settings, colorBgAppEnd: e.target.value })}
                          disabled={settings.bgType === 'solid'}
                          className={`w-10 h-10 border border-slate-300 rounded p-0 overflow-hidden ${settings.bgType === 'solid' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                        />
                        <div className="min-w-0">
                          <input
                            type="text"
                            maxLength={7}
                            value={settings.colorBgAppEnd}
                            onChange={(e) => syncSettings({ ...settings, colorBgAppEnd: e.target.value })}
                            disabled={settings.bgType === 'solid'}
                            className={`w-20 font-mono text-xs text-slate-700 bg-white border border-slate-200 p-1.5 rounded focus:outline-none dark:bg-slate-900 dark:border-slate-800 ${settings.bgType === 'solid' ? 'bg-slate-100 text-slate-400' : ''}`}
                          />
                          <p className="text-[9px] text-slate-400 mt-1">
                            {settings.bgType === 'solid' ? 'ปิดการใช้งาน' : 'ไล่ระดับสีจากซ้ายไปขวา'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Sidebar Colors Selector panel */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-950 dark:border-slate-800">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5">พื้นด้านหลังเมนูด้านซ้าย (Sidebar Background)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.colorSidebarBg}
                          onChange={(e) => syncSettings({ ...settings, colorSidebarBg: e.target.value })}
                          className="w-10 h-10 border border-slate-300 rounded cursor-pointer p-0 overflow-hidden"
                        />
                        <div className="min-w-0">
                          <input
                            type="text"
                            maxLength={7}
                            value={settings.colorSidebarBg}
                            onChange={(e) => syncSettings({ ...settings, colorSidebarBg: e.target.value })}
                            className="w-20 font-mono text-xs text-slate-700 bg-white border border-slate-200 p-1.5 rounded focus:outline-none dark:bg-slate-900 dark:border-slate-800"
                          />
                          <p className="text-[9px] text-slate-400 mt-1">ใช้กับสไตล์ไซด์บาร์ส่วนซ้าย</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-950 dark:border-slate-800">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5">ตัวหนังสือและไอคอนไซด์บาร์ (Sidebar Text)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settings.colorSidebarText}
                          onChange={(e) => syncSettings({ ...settings, colorSidebarText: e.target.value })}
                          className="w-10 h-10 border border-slate-300 rounded cursor-pointer p-0 overflow-hidden"
                        />
                        <div className="min-w-0">
                          <input
                            type="text"
                            maxLength={7}
                            value={settings.colorSidebarText}
                            onChange={(e) => syncSettings({ ...settings, colorSidebarText: e.target.value })}
                            className="w-20 font-mono text-xs text-slate-700 bg-white border border-slate-200 p-1.5 rounded focus:outline-none dark:bg-slate-900 dark:border-slate-800"
                          />
                          <p className="text-[9px] text-slate-400 mt-1">สีฟอนต์ปกติในเมนูด้านข้าง</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Tag Categories list manager */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 dark:bg-slate-900 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <Folder className="w-4.5 h-4.5 text-accent" style={{ color: settings.colorAccent }} />
                  การจัดการหมวดหมู่งานคัดกรอง
                </h3>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ป้อนชื่อกิจกรรมใหม่..."
                      value={newCatInput}
                      onChange={(e) => setNewCatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddNewCategory(); }}
                      className="flex-1 h-11 px-3 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-accent dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                      style={{ '--accent': settings.colorAccent } as React.CSSProperties}
                    />
                    <button
                      type="button"
                      onClick={handleAddNewCategory}
                      className="h-11 px-5 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center hover:opacity-90 active:scale-95 flex-shrink-0"
                      style={{ backgroundColor: settings.colorAccent }}
                    >
                      เพิ่มหมวดหมู่
                    </button>
                  </div>

                  <div className="border border-slate-100 rounded-xl p-3 flex flex-col gap-1.5 max-h-40 overflow-y-auto bg-slate-50 dark:bg-slate-950 dark:border-slate-800">
                    {settings.categories.map((c, idx) => (
                      <div key={idx} className="bg-white p-2 border border-slate-200 rounded-lg flex items-center justify-between shadow-xs dark:bg-slate-900 dark:border-slate-800 text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{c}</span>
                        {settings.categories.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCategory(idx)}
                            className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-md transition-all dark:hover:bg-slate-950"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

                            {/* Email Messaging integration panel */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 dark:bg-slate-900 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 dark:text-slate-100">
                  <Mail className="w-4.5 h-4.5 text-accent" style={{ color: settings.colorAccent }} />
                  การแจ้งเตือนและการจัดส่งรายงานทางอีเมล (System Report Mailer)
                </h3>
                <p className="text-xs text-slate-400 font-semibold dark:text-slate-450">
                  ตั้งค่าให้ระบบสามารถนำเสนอและแจ้งเตือนรายงานภารกิจผ่านทางอีเมลจำลอง หรือส่งตรงผ่านเซิร์ฟเวอร์ SMTP ของท่านจริงเป็นประจำวันโดยอัตโนมัติ
                </p>

                <div className="space-y-4 text-xs font-semibold text-slate-650">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl dark:bg-slate-950">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">เปิดใช้งานระบบส่งรายงานทางอีเมล</h4>
                      <p className="text-[10px] text-slate-400 font-normal">อนุญาตให้ประเมินผลและแจ้งเตือนผ่านช่องทางอีเมลเมลจำลอง/จริง</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => syncSettings({ ...settings, emailNotificationEnabled: !settings.emailNotificationEnabled })}
                      className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                        settings.emailNotificationEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${settings.emailNotificationEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 dark:text-slate-450">อีเมลปลายทางผู้รับรายงานด่วน (Executive Recipient)</label>
                    <input
                      type="email"
                      placeholder="เช่น executive@company.com..."
                      value={settings.emailRecipient || ''}
                      onChange={(e) => syncSettings({ ...settings, emailRecipient: e.target.value })}
                      className="w-full h-11 px-3 border border-slate-200 bg-slate-50 focus:bg-white dark:focus:bg-slate-900 rounded-lg text-sm text-slate-850 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-250"
                    />
                  </div>

                  {/* SMTP Server Configuration block */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800 space-y-3.5">
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-250 border-b border-slate-100 pb-1.5 dark:border-slate-800 flex items-center justify-between">
                      <span>⚙️ ข้อมูลเซิร์ฟเวอร์ส่งเมลจริง (SMTP Server Credentials)</span>
                      <span className="text-[10px] font-normal text-slate-400">(สนับสนุน Gmail, SendGrid, Outlook, ฯลฯ)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-[11px]">
                      <div>
                        <label className="block text-slate-650 dark:text-slate-450 mb-1 font-bold">SMTP Host / Server Address</label>
                        <input
                          type="text"
                          placeholder="เช่น smtp.gmail.com"
                          value={settings.smtpHost || ''}
                          onChange={(e) => syncSettings({ ...settings, smtpHost: e.target.value })}
                          className="w-full h-10 px-2.5 border border-slate-200 bg-white focus:bg-white dark:focus:bg-slate-950 rounded-lg text-xs text-slate-850 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-650 dark:text-slate-450 mb-1 font-bold">SMTP Port</label>
                          <input
                            type="number"
                            placeholder="587"
                            value={settings.smtpPort || ''}
                            onChange={(e) => syncSettings({ ...settings, smtpPort: parseInt(e.target.value) || 587 })}
                            className="w-full h-10 px-2.5 border border-slate-200 bg-white focus:bg-white dark:focus:bg-slate-950 rounded-lg text-xs text-slate-850 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-650 dark:text-slate-450 mb-1 font-bold">ระบบยิงเชื่อมต่อ</label>
                          <select
                            value={settings.smtpSecure ? 'true' : 'false'}
                            onChange={(e) => syncSettings({ ...settings, smtpSecure: e.target.value === 'true' })}
                            className="w-full h-10 px-2.5 border border-slate-200 bg-white focus:bg-white dark:focus:bg-slate-950 rounded-lg text-xs text-slate-850 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 font-bold"
                          >
                            <option value="false">STARTTLS (587)</option>
                            <option value="true">SSL/TLS (465)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-650 dark:text-slate-450 mb-1 font-bold">SMTP User / Username</label>
                        <input
                          type="text"
                          placeholder="เช่น executive@gmail.com"
                          value={settings.smtpUser || ''}
                          onChange={(e) => syncSettings({ ...settings, smtpUser: e.target.value })}
                          className="w-full h-10 px-2.5 border border-slate-200 bg-white focus:bg-white dark:focus:bg-slate-950 rounded-lg text-xs text-slate-850 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-650 dark:text-slate-450 mb-1 font-bold">SMTP Password / App Password</label>
                        <input
                          type="password"
                          placeholder="รหัสผ่านเชื่อม SMTP..."
                          value={settings.smtpPass || ''}
                          onChange={(e) => syncSettings({ ...settings, smtpPass: e.target.value })}
                          className="w-full h-10 px-2.5 border border-slate-200 bg-white focus:bg-white dark:focus:bg-slate-950 rounded-lg text-xs text-slate-850 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-650 dark:text-slate-450 mb-1 font-bold">ชื่อ Display ผู้จัดส่ง (Sender Name)</label>
                        <input
                          type="text"
                          placeholder="เช่น TaskFlow System"
                          value={settings.smtpSenderName || ''}
                          onChange={(e) => syncSettings({ ...settings, smtpSenderName: e.target.value })}
                          className="w-full h-10 px-2.5 border border-slate-200 bg-white focus:bg-white dark:focus:bg-slate-950 rounded-lg text-xs text-slate-850 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-655 dark:text-slate-450 mb-1 font-bold">ส่งอีเมลโดยอัตโนมัติรายวัน (Auto-Send)</label>
                        <div className="flex items-center justify-between h-10 px-3 bg-white border border-slate-200 rounded-lg dark:bg-slate-900 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400 font-normal">แอบส่งอัตโนมัติเมื่อล็อคอินเข้าครั้งแรกของวัน</span>
                          <button
                            type="button"
                            onClick={() => syncSettings({ ...settings, autoSendEnabled: !settings.autoSendEnabled })}
                            className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                              settings.autoSendEnabled ? 'bg-emerald-500' : 'bg-slate-350 dark:bg-slate-750'
                            }`}
                          >
                            <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform duration-200 ${settings.autoSendEnabled ? 'translate-x-4.5' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-slate-600 dark:text-slate-450">รูปแบบโครงสร้างเทมเพลตเนื้อหารายงานสรุป</label>
                      <button
                        type="button"
                        onClick={() => {
                          const defaultFormalTemplate = 'เรียน คุณท่าน\n\nเรื่อง รายงานสรุปรายการภารกิจคงค้างและแจ้งเตือนยอดค่าใช้จ่ายที่ครบกำหนดชำระ ประจำวันที่ {date}\n\nตามที่ระบบ {appName} ได้ทำการประเมินและคัดกรองข้อมูลรายการความก้าวหน้าของภารกิจงาน และรายการบิลค่าใช้จ่ายที่กำหนดรอบชำระประจำวันที่ {date} หรือที่เลยกำหนดเรียบร้อยแล้วนั้น\n\nทางระบบเรียนสรุปรายละเอียดงานสำคัญเรียน คุณท่าน เพื่อโปรดพิจารณาและดำเนินการตามที่สมควร ดังดีลรายงานด้านล่างนี้:\n\n📋 รายการภารกิจสำคัญ (กำหนดเสร็จสิ้นวันนี้ หรือ เลยกำหนด):\n━━━━━━━━━━━━━━━━━━━━\n{tasks}\n━━━━━━━━━━━━━━━━━━━━\n\n💰 รายการค่าใช้จ่ายค้างจัดการ (กำหนดชำระวันนี้ หรือ เลยกำหนด):\n━━━━━━━━━━━━━━━━━━━━\n{expenses}\n━━━━━━━━━━━━━━━━━━━━\n\nขอความกรุณา คุณท่าน โปรดพิจารณาตรวจสอบความเสร็จสิ้นและชำระบิลตามกำหนดการที่ระบุไว้\n\nด้วยความเคารพอย่างสูง,\nระบบจัดส่งข้อมูลอัตโนมัติ {appName}';
                          syncSettings({ ...settings, emailMessageTemplate: defaultFormalTemplate });
                        }}
                        className="text-[10px] font-bold text-accent hover:underline"
                        style={{ color: settings.colorAccent }}
                      >
                        🔄 รีเซ็ตเป็นค่าเริ่มต้น
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      value={settings.emailMessageTemplate || ''}
                      onChange={(e) => syncSettings({ ...settings, emailMessageTemplate: e.target.value })}
                      placeholder="ใช้รูปแบบ {date} ({tasks} สำหรับภารกิจ, {expenses} สำหรับบิลจ่าย, {appName} สำหรับชื่อระบบ)..."
                      className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white dark:focus:bg-slate-900 rounded-lg text-xs font-mono text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                    />
                    <div className="flex gap-2 text-[10px] text-slate-400 font-normal mt-1">
                      <span>🏷️ คีย์เวิร์ดที่ใช้งานได้:</span>
                      <code className="text-slate-500 bg-slate-100 px-1 rounded dark:bg-slate-950">{'{date}'}</code>
                      <code className="text-slate-500 bg-slate-100 px-1 rounded dark:bg-slate-950">{'{tasks}'}</code>
                      <code className="text-slate-500 bg-slate-100 px-1 rounded dark:bg-slate-950">{'{expenses}'}</code>
                      <code className="text-slate-500 bg-slate-100 px-1 rounded dark:bg-slate-950">{'{appName}'}</code>
                    </div>
                  </div>

                  {/* LIVE Email Preview */}
                  <div className="border border-dashed border-slate-250 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/20 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold border-b border-slate-100 pb-2 dark:border-slate-800">
                      <span>👁️ ตัวอย่างเนื้อหาอีเมลจริง (Live Responsive Preview)</span>
                      <span className="text-accent underline" style={{ color: settings.colorAccent }}>To: {settings.emailRecipient || sessionUser.email || '(ระบุเพื่อเข้าถึง)'}</span>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-inner max-h-48 overflow-y-auto font-mono text-[11px] text-slate-700 whitespace-pre-wrap dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
                      {generateEmailContent()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={testEmailNotification}
                      className="h-11 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all dark:border-slate-850 dark:text-slate-300 flex items-center justify-center gap-1.5"
                    >
                      🧪 ทดสอบส่งจำลอง
                    </button>
                    
                    <button
                      type="button"
                      onClick={sendEmailViaClient}
                      className="h-11 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all dark:border-slate-850 dark:text-slate-300 flex items-center justify-center gap-1.5"
                    >
                      ✉️ ส่งทาง Mail Client
                    </button>

                    <button
                      type="button"
                      onClick={() => sendEmailViaSMTP(false)}
                      className="h-11 text-white font-heavy text-xs rounded-xl shadow-md hover:brightness-95 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: settings.colorAccent }}
                    >
                      🚀 ยิงส่งด่วนผ่าน SMTP
                    </button>
                  </div>

                  {emailResult.text && (
                    <div className={`p-3 border rounded-xl text-center text-xs font-semibold animate-fade-in ${
                      emailResult.type === 'ok' 
                        ? 'bg-emerald-50 border-emerald-250 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/60 dark:text-emerald-450' 
                        : emailResult.type === 'err'
                          ? 'bg-rose-50 border-rose-250 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/60 dark:text-rose-450' 
                          : 'bg-amber-50 border-amber-250 text-amber-800 animate-pulse dark:bg-amber-950/20 dark:border-amber-900/60 dark:text-amber-400'
                    }`}>
                      {emailResult.text}
                    </div>
                  )}

                </div>
              </div>

              {/* Custom Menu Links integration panel */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 dark:bg-slate-900 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 dark:text-slate-100">
                  <Link className="w-4.5 h-4.5 text-accent" style={{ color: settings.colorAccent }} />
                  การจัดการเมนูแถบสไลด์และลิงก์ภายนอก (Custom Navigation Links)
                </h3>
                <p className="text-xs text-slate-500 font-semibold dark:text-slate-400">
                  คุณท่านสามารถเพิ่มปุ่มลิงก์เมนูย่อยเพื่อเชื่อมโยงไปยังหน้าเว็บภายนอกที่ต้องการใช้งานบ่อย ๆ ซึ่งจะปรากฏบนแถบด้านข้าง (3 ขีด) โดยอัตโนมัติ เพื่อให้เข้าถึงระบบงานอื่นได้โดยไม่ต้องละสายตาไปจากเบราว์เซอร์
                </p>

                <div className="space-y-4 text-xs font-semibold text-slate-650">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1 dark:text-slate-450">ชื่อเมนูแสดงผล (เช่น ระเบียบการ, ระบบหลังบ้าน)</label>
                      <input
                        type="text"
                        placeholder="ป้อนชื่อปุ่มเมนู..."
                        value={newLinkTitle}
                        onChange={(e) => setNewLinkTitle(e.target.value)}
                        className="w-full h-11 px-3 border border-slate-200 bg-slate-50 focus:bg-white dark:focus:bg-slate-900 rounded-lg text-sm text-slate-850 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-250"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1 dark:text-slate-450">URL ลิงก์เชื่อมโยงไปยังหน้าเว็บ</label>
                      <input
                        type="text"
                        placeholder="เช่น en.wikipedia.org หรือ thairath.co.th..."
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddMenuLink(); }}
                        className="w-full h-11 px-3 border border-slate-200 bg-slate-50 focus:bg-white dark:focus:bg-slate-900 rounded-lg text-sm text-slate-850 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-250"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-slate-600 dark:text-slate-450">เลือกไอคอนสัญลักษณ์ของเมนู (Icon Preset)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                      {CUSTOM_LINK_ICONS.map((ico) => {
                        const IconComp = ico.component;
                        const isSelected = newLinkIcon === ico.name;
                        return (
                          <button
                            key={ico.name}
                            type="button"
                            onClick={() => setNewLinkIcon(ico.name)}
                            className={`h-11 px-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all text-[10px] font-bold ${
                              isSelected 
                                ? 'bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-900 shadow-sm' 
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-150 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400'
                            }`}
                            style={isSelected ? { borderColor: settings.colorAccent, backgroundColor: settings.bgType === 'solid' ? settings.colorAccent : undefined } : {}}
                          >
                            <IconComp className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate max-w-full text-[9px]">{ico.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddMenuLink}
                      className="h-10 px-5 text-white font-bold text-xs rounded-lg shadow-md hover:brightness-95 transition-all flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: settings.colorAccent }}
                    >
                      <Plus className="w-3.5 h-3.5" /> เพิ่มลิงก์เมนูเชื่อมระบบ
                    </button>
                  </div>

                  {/* Links List */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-slate-600 dark:text-slate-450">รายการลิงก์เมนูที่ติดตั้งในระบบขณะนี้ ({(settings.customMenuLinks || []).length})</label>
                    
                    {(settings.customMenuLinks || []).length === 0 ? (
                      <div className="p-6 border border-dashed border-slate-200 bg-slate-50/50 rounded-xl text-center text-slate-400 dark:bg-slate-950/20 dark:border-slate-800">
                        ไม่มีลิงก์เมนูเพิ่มเติมชั่วคราว คุณท่านสามารถเลือกสัญลักษณ์ ป้อนหัวข้อและลิงก์เพื่อติดตั้งด้านบน
                      </div>
                    ) : (
                      <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 dark:border-slate-800 dark:divide-slate-800 max-h-72 overflow-y-auto">
                        {(settings.customMenuLinks || []).map((link, idx) => {
                          const LinkIconComp = getCustomLinkIconComponent(link.iconName || 'Link');
                          return (
                            <div key={link.id} className="p-3 bg-slate-50/40 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 dark:bg-slate-950/20 dark:hover:bg-slate-950/40 font-mono">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0 dark:bg-slate-900 dark:border-slate-800 shadow-xs">
                                  <LinkIconComp className="w-4 h-4" style={{ color: settings.colorAccent }} />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{link.title}</h4>
                                  <p className="text-[10px] text-slate-400 font-mono truncate max-w-sm">{link.url}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-end gap-2">
                                {/* Sorting Arrows */}
                                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 dark:bg-slate-900 dark:border-slate-800 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => moveMenuLinkUp(idx)}
                                    disabled={idx === 0}
                                    className={`p-1.5 rounded-md transition-all ${
                                      idx === 0 
                                        ? 'opacity-30 cursor-not-allowed text-slate-300 dark:text-slate-700' 
                                        : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800 dark:hover:bg-slate-950 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                    title="จัดลำดับขึ้น (เลื่อนขึ้น)"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="text-[10px] font-mono text-slate-400 px-1 dark:text-slate-500">{idx + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() => moveMenuLinkDown(idx)}
                                    disabled={idx === (settings.customMenuLinks || []).length - 1}
                                    className={`p-1.5 rounded-md transition-all ${
                                      idx === (settings.customMenuLinks || []).length - 1
                                        ? 'opacity-30 cursor-not-allowed text-slate-300 dark:text-slate-700' 
                                        : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800 dark:hover:bg-slate-950 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                    title="จัดลำดับลง (เลื่อนลง)"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => { setActiveTab(`link_${link.id}`); }}
                                  className="h-7 px-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-[10px] font-bold text-slate-500 transition-all dark:hover:bg-slate-900 dark:border-slate-800 dark:text-slate-400 flex items-center gap-1 flex-shrink-0 bg-white dark:bg-slate-900"
                                >
                                  ดูบอร์ดลิงก์
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMenuLink(link.id)}
                                  className="p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded-lg transition-all dark:hover:bg-rose-950/40"
                                  title="ลบลิงก์"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>

    </div>
  );
}
