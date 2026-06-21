import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  ArrowDown,
  User
} from 'lucide-react';
import { Task, Expense, AppSettings } from './types';
import { THEME_PRESETS, hexToRgb, getDarkerColor, getLighterColor } from './themePresets';

import { doc, getDoc, setDoc, getDocs, collection, deleteDoc, onSnapshot } from 'firebase/firestore';
import { updateEmail, updatePassword } from 'firebase/auth';
import { db, auth } from './firebase';
import { useDialog } from './components/CustomDialog';

const padPass = (pass: string) => {
  if (pass.length >= 6) return pass;
  return pass.padEnd(6, '0');
};

// Modules
import AuthScreen from './components/AuthScreen';
import TaskModule from './components/TaskModule';
import CalendarModule from './components/CalendarModule';
import SettingsLockScreen from './components/SettingsLockScreen';
import ExpenseModule from './components/ExpenseModule';
import { PrintReportModal } from './components/PrintReportModal';

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

// Check if a URL might fail to load in standard sandboxed iframe (such as Mixed Content or X-Frame-Options blocked sites)
function isFrameRestricted(url: string | undefined): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  
  // Mixed Content block: HTTP embedded inside HTTPS application
  if (lower.startsWith('http://')) {
    return true;
  }
  
  const restrictedKeywords = [
    'google.',
    'facebook.',
    'fb.com',
    'youtube.',
    'youtu.be',
    'wikipedia.',
    'github.',
    'twitter.',
    'x.com',
    'instagram.',
    'linkedin.',
    'pantip.',
    'shopee.',
    'lazada.',
    'netflix.',
    'yahoo.',
    'bing.',
    'apple.',
    'microsoft.'
  ];
  
  return restrictedKeywords.some(kw => lower.includes(kw));
}

export default function App() {
  const { showAlert, showConfirm } = useDialog();
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
    bgType: 'gradient',
    settingsPassword: '0000'
  });

  // UI state controllers
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(() => {
    try {
      return localStorage.getItem('header_collapsed') === 'true';
    } catch (e) {
      return false;
    }
  });

  const handleSetHeaderCollapsed = (val: boolean) => {
    setHeaderCollapsed(val);
    try {
      localStorage.setItem('header_collapsed', String(val));
    } catch (e) {}
  };
  const [activeTab, setActiveTab] = useState<string>('tasks');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false);

  // Admin and Multi-profile states
  const [allUsersList, setAllUsersList] = useState<{ userId: string; email: string; phone: string; uid: string }[]>([]);
  const [currentViewUid, setCurrentViewUid] = useState<string>('');
  const [currentViewUserId, setCurrentViewUserId] = useState<string>('');

  useEffect(() => {
    if (activeTab !== 'settings') {
      setIsSettingsUnlocked(false);
    }
  }, [activeTab]);

  // Print modal state and listener
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  useEffect(() => {
    const handleOpenPrint = () => {
      setIsPrintModalOpen(true);
    };
    window.addEventListener('open-print-modal', handleOpenPrint);
    return () => {
      window.removeEventListener('open-print-modal', handleOpenPrint);
    };
  }, []);
  
  // Custom theme settings helpers
  const [harmoniousMode, setHarmoniousMode] = useState(true);
  const [newCatInput, setNewCatInput] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkIcon, setNewLinkIcon] = useState('Link');
  const [linkHintVisible, setLinkHintVisible] = useState(false);

  // Manage visibility of iframe frame security guidelines banner (shows for 5 seconds when switching custom links)
  useEffect(() => {
    if (activeTab.startsWith('link_')) {
      setLinkHintVisible(true);
      const timer = setTimeout(() => {
        setLinkHintVisible(false);
      }, 5000); // Hide after exactly 5 seconds
      return () => clearTimeout(timer);
    } else {
      setLinkHintVisible(false);
    }
  }, [activeTab]);
  
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

  // DB Unsubscribe pointers for real-time Firestore sync
  const dbUnsubscribersRef = useRef<{ settings?: () => void; tasks?: () => void; expenses?: () => void }>({});

  const cleanupSubscriptions = () => {
    if (dbUnsubscribersRef.current.settings) {
      dbUnsubscribersRef.current.settings();
      delete dbUnsubscribersRef.current.settings;
    }
    if (dbUnsubscribersRef.current.tasks) {
      dbUnsubscribersRef.current.tasks();
      delete dbUnsubscribersRef.current.tasks;
    }
    if (dbUnsubscribersRef.current.expenses) {
      dbUnsubscribersRef.current.expenses();
      delete dbUnsubscribersRef.current.expenses;
    }
  };

  // Clean subscriptions on unmount
  useEffect(() => {
    return () => {
      cleanupSubscriptions();
    };
  }, []);

  // Cloud Sync & Network Resiliency states
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Force push local localStorage state up to Firestore on boot/reconnect
  const forcePushLocalToCloud = async (userId: string, uid: string) => {
    try {
      console.log('🔄 forcePushLocalToCloud: Detected internet reconnection, validating local backup...');
      const localTasksStr = localStorage.getItem(`tasks_${userId}`);
      if (localTasksStr) {
        const localTasksList = JSON.parse(localTasksStr) as Task[];
        for (const task of localTasksList) {
          await setDoc(doc(db, 'users', uid, 'tasks', task.id), task);
        }
      }
      
      const localExpensesStr = localStorage.getItem(`expenses_${userId}`);
      if (localExpensesStr) {
        const localExpensesList = JSON.parse(localExpensesStr) as Expense[];
        for (const exp of localExpensesList) {
          await setDoc(doc(db, 'users', uid, 'expenses', exp.id), exp);
        }
      }
      
      const localSettingsStr = localStorage.getItem(`settings_${userId}`);
      if (localSettingsStr) {
        const localSettingsObj = JSON.parse(localSettingsStr) as AppSettings;
        await setDoc(doc(db, 'users', uid, 'settings', 'app'), localSettingsObj);
      }
      console.log('✅ forcePushLocalToCloud: Local caches securely published to Firebase.');
    } catch (e) {
      console.error('❌ forcePushLocalToCloud: Failed to auto synchronization to Firestore:', e);
    }
  };

  // Listen to network online / offline events
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sessionUser.userId]);

  // Listen for storage event to sync settings across multiple tabs in the same browser instantly
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('settings_')) {
        const targetUser = e.key.replace('settings_', '');
        if (targetUser === currentViewUserId && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            setSettings(parsed);
          } catch (err) {}
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentViewUserId]);

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

  // ----------------------------------------------------
  // IDLE TIMEOUT AUTO-LOGOUT ENGINE (1 HOUR INACTIVITY DETECTOR)
  // ----------------------------------------------------
  useEffect(() => {
    if (!isLoggedIn) return;

    // Use a user-specific id to calculate inactivity so cross-user interactions don't collide
    const activityKey = `sys_last_activity_${sessionUser.userId || 'generic'}`;
    const IDLE_TIMEOUT = 1 * 60 * 60 * 1000; // 1 Hour in milliseconds
    const checkIntervalTime = 10000; // Check every 10 seconds

    // Update active user interaction / physical engagement timestamp
    const updateActivity = () => {
      try {
        localStorage.setItem(activityKey, String(Date.now()));
      } catch (e) {}
    };

    // Initialize/reset timestamp upon initial trigger
    updateActivity();

    // Specific user input events indicating active engagement on client
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    // Throttle timestamp writes to protect execution speed and local storage state from lagging
    let lastRegisterTime = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastRegisterTime > 2000) { // Throttle interval: 2 seconds
        lastRegisterTime = now;
        updateActivity();
      }
    };

    // Attach passive listeners to avoid main-thread scroll blocks
    events.forEach((ev) => {
      window.addEventListener(ev, handleUserActivity, { passive: true });
    });

    const checkIdleStatus = () => {
      try {
        const lastActivityStr = localStorage.getItem(activityKey);
        if (lastActivityStr) {
          const lastActivity = parseInt(lastActivityStr, 10);
          const diff = Date.now() - lastActivity;
          if (diff >= IDLE_TIMEOUT) {
            console.log('🚪 Inactivity timeout triggered. Auto logging out user.');
            
            // Perform automatic silent logout steps
            cleanupSubscriptions();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('sess_userId');
            localStorage.removeItem('user_email');
            localStorage.removeItem('user_phone');
            localStorage.removeItem('user_password');
            localStorage.removeItem('sess_uid');
            
            setIsLoggedIn(false);
            setDataLoaded(false);
            setSessionUser({ userId: '', email: '', phone: '', password: '' });
            setTasks([]);
            setExpenses([]);

            // Trigger beautiful native-design dialog warning of connection timeout
            showAlert(
              'คุณถูกออกจากระบบโดยอัตโนมัติเพื่อความปลอดภัย เนื่องจากไม่มีความเคลื่อนไหวทางหน้าจอหรือปิดหน้าเว็บค้างไว้นานเกิน 1 ชั่วโมง',
              'หมดเวลารอบเซสชัน (Session Expired)',
              'warning'
            ).catch(() => {});
          }
        }
      } catch (e) {}
    };

    // Periodically verify remaining time limit
    const intervalTimer = setInterval(checkIdleStatus, checkIntervalTime);

    // Immediate check on focusing window back, or when the tab becomes active/visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkIdleStatus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkIdleStatus);

    return () => {
      events.forEach((ev) => {
        window.removeEventListener(ev, handleUserActivity);
      });
      clearInterval(intervalTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkIdleStatus);
    };
  }, [isLoggedIn, sessionUser.userId]);

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
      bgType: 'gradient' as const,
      settingsPassword: '0000'
    };

    setCustomHolidays({
      '2026-01-01': 'วันขึ้นปีใหม่',
      '2026-04-13': 'วันมหาสงกรานต์',
      '2026-05-01': 'วันแรงงานแห่งชาติ',
      '2026-08-12': 'วันแม่แห่งชาติ'
    });

    // Default viewing profile set to self
    setCurrentViewUid(uid);
    setCurrentViewUserId(userId);

    // Fetch registered profiles for multi-profile administrative management if user is 'admin'
    if (userId === 'admin' && uid) {
      try {
        const usersCol = collection(db, 'users');
        const usersSnap = await getDocs(usersCol);
        const usersList: any[] = [];
        usersSnap.forEach((docRef) => {
          usersList.push(docRef.data());
        });
        setAllUsersList(usersList);
      } catch (e) {
        console.error('Failed to fetch user profiles for administration:', e);
      }
    }

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
      setDataLoaded(true);
      return;
    }
  };

  // Reactive Effect to handle loading and setting real-time observers whenever currentViewUid changes
  useEffect(() => {
    if (!isLoggedIn || !currentViewUid) return;

    let active = true;
    setDataLoaded(false);

    const defaultSet = {
      appName: 'TaskFlow Space Executive Pro',
      appDesc: 'ระบบบอร์ดงาน ปฏิทินจดจำสรุปกิจกรรม และจัดการค่าชำระส่วนบุคคลสำหรับผู้บริหาร',
      appLogoUrl: '',
      bgStyle: 'theme-custom' as const,
      customBgUrl: '',
      darkMode: false,
      categories: DEFAULT_CATEGORIES,
      emailRecipient: sessionUser.email || '',
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
      bgType: 'gradient' as const,
      settingsPassword: '0000'
    };

    const loadAndSetupProfile = async () => {
      const uid = currentViewUid;
      const targetUserId = currentViewUserId;

      try {
        // 1. Fetch settings from Firestore
        const settingsRef = doc(db, 'users', uid, 'settings', 'app');
        const settingsSnap = await getDoc(settingsRef);

        let currentSettings = defaultSet;
        if (settingsSnap.exists()) {
          currentSettings = { ...defaultSet, ...settingsSnap.data() };
          if (active) setSettings(currentSettings);
          localStorage.setItem(`settings_${targetUserId}`, JSON.stringify(currentSettings));
        } else {
          const savedSettings = localStorage.getItem(`settings_${targetUserId}`);
          if (savedSettings) {
            try { currentSettings = { ...defaultSet, ...JSON.parse(savedSettings) }; } catch (e) {}
          }
          if (active) setSettings(currentSettings);
          await setDoc(settingsRef, currentSettings);
        }

        // 2. Fetch tasks from Firestore
        const tasksCol = collection(db, 'users', uid, 'tasks');
        const tasksSnap = await getDocs(tasksCol);
        const isExistingUser = settingsSnap.exists();

        if (!tasksSnap.empty) {
          const tasksList: Task[] = [];
          tasksSnap.forEach((doc) => {
            tasksList.push(doc.data() as Task);
          });
          if (active) setTasks(tasksList);
          localStorage.setItem(`tasks_${targetUserId}`, JSON.stringify(tasksList));
        } else if (isExistingUser) {
          if (active) setTasks([]);
          localStorage.setItem(`tasks_${targetUserId}`, JSON.stringify([]));
        } else {
          const savedTasks = localStorage.getItem(`tasks_${targetUserId}`);
          let tasksList: Task[] = [];
          if (savedTasks) {
            try { tasksList = JSON.parse(savedTasks); } catch (e) {}
          }
          if (tasksList.length === 0) {
            tasksList = [
              { id: 't1', title: 'ประชุมวางแผนงบประมาณโครงการก่อสร้างใหม่', desc: 'สรุปงบประมาณไตรมาสที่ 3 และพิจารณาสัญญารับเหมาช่วง', category: '💼 งานทั่วไป', dueDate: getThailandTodayStr(), dueTime: '13:00', status: 'pending', userId: targetUserId, createdAt: new Date().toISOString() },
              { id: 't2', title: 'ชำระค่าไฟและค่าน้ำสำนักงานใหญ่', desc: 'ยอดชำระตรวจสอบจากแดชบอร์ดค่าใช้จ่าย บิลรอบเดือนพฤษภาคม', category: '🔥 เร่งด่วน', dueDate: getThailandTodayStr(), dueTime: '17:00', status: 'pending', userId: targetUserId, createdAt: new Date().toISOString() },
              { id: 't3', title: 'ทบทวนสไลด์นำเสนอพาร์ทเนอร์ชาวต่างชาติ', desc: 'เตรียมจุดเด่นผลิตภัณฑ์ใหม่ และนโยบายส่วนลด', category: '💼 งานทั่วไป', dueDate: getDaysFromNowStr(2), status: 'pending', userId: targetUserId, createdAt: new Date().toISOString() }
            ];
          }
          if (active) setTasks(tasksList);
          localStorage.setItem(`tasks_${targetUserId}`, JSON.stringify(tasksList));
          
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
          if (active) setExpenses(expensesList);
          localStorage.setItem(`expenses_${targetUserId}`, JSON.stringify(expensesList));
        } else if (isExistingUser) {
          if (active) setExpenses([]);
          localStorage.setItem(`expenses_${targetUserId}`, JSON.stringify([]));
        } else {
          const savedExpenses = localStorage.getItem(`expenses_${targetUserId}`);
          let expensesList: Expense[] = [];
          if (savedExpenses) {
            try { expensesList = JSON.parse(savedExpenses); } catch (e) {}
          }
          if (expensesList.length === 0) {
            expensesList = [
              { id: 'e1', name: 'ค่าเช่าอาคารสำนักงานและโกดัง', amount: 45000, cat: '🏠 ที่พัก', date: getThailandTodayStr(), dueDate: getDaysFromNowStr(5), note: 'โอนชำระภายในวันที่ 5', paid: false, userId: targetUserId },
              { id: 'e2', name: 'ค่าบริการคลาวด์และโฮสติ้งเซิร์ฟเวอร์', amount: 3500.50, cat: '💡 สาธารณูปโภค', date: getThailandTodayStr(), dueDate: getThailandTodayStr(), note: 'ตัดบัตรเครดิตอัตโนมัติ', paid: true, userId: targetUserId },
              { id: 'e3', name: 'จัดซื้อเครื่องเขียนและอุปกรณ์สำนักงานส่วนกลาง', amount: 1200, cat: '🛒 ของใช้/อาหาร', date: getDaysFromNowStr(-1), dueDate: getDaysFromNowStr(2), note: 'เบิกจ่ายจาก Petty cash', paid: false, userId: targetUserId }
            ];
          }
          if (active) setExpenses(expensesList);
          localStorage.setItem(`expenses_${targetUserId}`, JSON.stringify(expensesList));

          for (const exp of expensesList) {
            await setDoc(doc(db, 'users', uid, 'expenses', exp.id), exp);
          }
        }

        if (!active) return;

        // 4. Hook up real-time sync subscribers to Firestore for multi-device sync
        cleanupSubscriptions();

        dbUnsubscribersRef.current.settings = onSnapshot(settingsRef, (docSnap) => {
          if (docSnap.exists() && active) {
            const syncedSettings = { ...defaultSet, ...docSnap.data() };
            setSettings(syncedSettings);
            localStorage.setItem(`settings_${targetUserId}`, JSON.stringify(syncedSettings));
          }
        }, (error) => {
          console.error('Firestore real-time settings sync error:', error);
        });

        dbUnsubscribersRef.current.tasks = onSnapshot(tasksCol, (querySnap) => {
          if (!active) return;
          const tasksList: Task[] = [];
          querySnap.forEach((docSnap) => {
            tasksList.push(docSnap.data() as Task);
          });
          setTasks(tasksList);
          localStorage.setItem(`tasks_${targetUserId}`, JSON.stringify(tasksList));
        }, (error) => {
          console.error('Firestore real-time tasks sync error:', error);
        });

        dbUnsubscribersRef.current.expenses = onSnapshot(expensesCol, (querySnap) => {
          if (!active) return;
          const expensesList: Expense[] = [];
          querySnap.forEach((docSnap) => {
            expensesList.push(docSnap.data() as Expense);
          });
          setExpenses(expensesList);
          localStorage.setItem(`expenses_${targetUserId}`, JSON.stringify(expensesList));
        }, (error) => {
          console.error('Firestore real-time expenses sync error:', error);
        });

        if (active) setDataLoaded(true);
      } catch (err) {
        console.error('Failed to sync or migrate from Firestore on login:', err);
        
        // Fail-safe load from localStorage when Firestore is offline or disconnected
        const savedTasks = localStorage.getItem(`tasks_${targetUserId}`);
        if (savedTasks && active) {
          try { setTasks(JSON.parse(savedTasks)); } catch (e) {}
        }
        
        const savedExpenses = localStorage.getItem(`expenses_${targetUserId}`);
        if (savedExpenses && active) {
          try { setExpenses(JSON.parse(savedExpenses)); } catch (e) {}
        }
        
        const savedSettings = localStorage.getItem(`settings_${targetUserId}`);
        if (savedSettings && active) {
          try { setSettings({ ...defaultSet, ...JSON.parse(savedSettings) }); } catch (e) {}
        } else {
          if (active) setSettings(defaultSet);
        }
        
        if (active) setDataLoaded(true);
      }
    };

    loadAndSetupProfile();

    return () => {
      active = false;
      cleanupSubscriptions();
    };
  }, [isLoggedIn, currentViewUid, currentViewUserId]);

  const handleLogout = async () => {
    const isConfirmed = await showConfirm(
      'คุณต้องการออกจากระบบ TaskFlow Space ใช่หรือไม่?',
      'ยืนยันการออกจากระบบ',
      'danger'
    );
    if (isConfirmed) {
      cleanupSubscriptions();
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('sess_userId');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_phone');
      localStorage.removeItem('user_password');
      localStorage.removeItem('sess_uid');
      setIsLoggedIn(false);
      setDataLoaded(false);
      setSessionUser({ userId: '', email: '', phone: '', password: '' });
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
    if (currentViewUserId) {
      localStorage.setItem(`tasks_${currentViewUserId}`, JSON.stringify(newTasks));
    }
    if (sessionUser.userId) {
      localStorage.setItem(`tasks_${sessionUser.userId}`, JSON.stringify(newTasks));
    }

    const uid = currentViewUid || localStorage.getItem('sess_uid');
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
    if (currentViewUserId) {
      localStorage.setItem(`expenses_${currentViewUserId}`, JSON.stringify(newExpenses));
    }
    if (sessionUser.userId) {
      localStorage.setItem(`expenses_${sessionUser.userId}`, JSON.stringify(newExpenses));
    }

    const uid = currentViewUid || localStorage.getItem('sess_uid');
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
    if (currentViewUserId) {
      localStorage.setItem(`settings_${currentViewUserId}`, JSON.stringify(newSettings));
    }
    if (sessionUser.userId) {
      localStorage.setItem(`settings_${sessionUser.userId}`, JSON.stringify(newSettings));
    }

    const uid = currentViewUid || localStorage.getItem('sess_uid');
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
    if (newPassword.length !== 6) {
      setProfileMessage({ text: 'รหัสผ่านใหม่ต้องมีความยาว 6 หลักเท่านั้นเพื่อความเป็นระเบียบ', type: 'err' });
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

      // Update in our localized profiles cache
      const profileData = {
        userId: cleanId,
        email: sessionUser.email || `${cleanId}@taskflow.space`,
        phone: sessionUser.phone || '0812345678',
        password: newPassword,
        uid: uid
      };
      localStorage.setItem(`user_profile_${profileData.email.toLowerCase()}`, JSON.stringify(profileData));
      localStorage.setItem(`user_profile_${cleanId.toLowerCase()}`, JSON.stringify(profileData));

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
  const handleAddNewCategory = async () => {
    const cat = newCatInput.trim();
    if (!cat) return;
    if (settings.categories.includes(cat)) {
      await showAlert('หมวดหมู่กิจกรรมนี้มีอยู่แล้วในระบบ', 'ไม่สำเร็จ', 'warning');
      return;
    }
    const updatedCats = [...settings.categories, cat];
    syncSettings({ ...settings, categories: updatedCats });
    setNewCatInput('');
  };

  const handleRemoveCategory = async (index: number) => {
    const isConfirmed = await showConfirm(
      'คุณต้องการนำหมวดหมู่นี้ออกจากตัวกรองกิจกรรมใช่หรือไม่?',
      'ลบหมวดหมู่',
      'danger'
    );
    if (isConfirmed) {
      const updatedCats = settings.categories.filter((_, idx) => idx !== index);
      syncSettings({ ...settings, categories: updatedCats });
    }
  };

  const handleAddMenuLink = async () => {
    const title = newLinkTitle.trim();
    let url = newLinkUrl.trim();
    if (!title || !url) {
      await showAlert('กรุณากรอกทั้งชื่อเมนูและ URL ลิงก์เชื่อมโยงให้ครบถ้วนถูกต้อง', 'ข้อมูลไม่ครบ', 'warning');
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

  const handleRemoveMenuLink = async (id: string) => {
    const isConfirmed = await showConfirm(
      'คุณต้องการนำลิงก์เมนูนี้ออกจากรายการนำทางของแถบเครื่องมือด้านข้างใช่หรือไม่?',
      'ลบลิงก์ภายนอก',
      'danger'
    );
    if (isConfirmed) {
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
        <div className="p-2 border-t border-slate-800 flex-shrink-0 bg-slate-900/30">
          {/* User Profile visual badge */}
          <div className={`p-2 rounded-xl mb-2 flex items-center gap-2.5 bg-slate-900/60 border border-slate-800/40 overflow-hidden ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs text-white select-none flex-shrink-0 shadow-inner"
              style={{ backgroundColor: settings.colorAccent }}
              title={sessionUser.userId}
            >
              {sessionUser.userId ? sessionUser.userId.charAt(0).toUpperCase() : 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-black text-slate-100 truncate flex items-center gap-1" title={sessionUser.userId}>
                  <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{sessionUser.userId}</span>
                </div>
                <div className="text-[9px] text-slate-500 font-medium truncate" title={sessionUser.email || sessionUser.phone || 'บัญชีผู้ใช้'}>
                  {sessionUser.email || sessionUser.phone || 'บัญชีระยะไกล'}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full h-11 px-3 rounded-xl hover:bg-rose-950/40 text-rose-400 hover:text-rose-350 font-bold text-xs transition-all flex items-center gap-3 border border-transparent hover:border-rose-950/40"
          >
            <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
            {!sidebarCollapsed && <span>ออกจากระบบ</span>}
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
        <header className={`border-b border-slate-200/85 px-4 lg:px-8 flex items-center justify-between bg-white/70 backdrop-blur-md sticky top-0 z-30 dark:bg-slate-900/80 dark:border-slate-800 transition-all duration-300 ${
          headerCollapsed ? 'h-0 py-0 border-b-0 opacity-0 pointer-events-none overflow-hidden' : 'h-16'
        }`}>
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
            {/* Connection Status Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-extrabold shadow-sm transition-all duration-300 ${
              isOnline 
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/60 dark:text-emerald-400' 
                : 'bg-amber-50/80 border-amber-200 text-amber-850 dark:bg-amber-950/20 dark:border-amber-900/60 dark:text-amber-400 animate-pulse'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
              <span className="hidden xs:inline">
                {isOnline ? 'เชื่อมต่อคลาวด์' : 'เซฟในเครื่องปลอดภัย'}
              </span>
              <span className="inline xs:hidden">
                {isOnline ? 'คลาวด์' : 'ออฟไลน์'}
              </span>
            </div>

            {/* Clock Widget */}
             <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-3.5 py-1.5 font-mono text-[10.5px] font-bold text-slate-500 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400">
               <Clock className="w-3.5 h-3.5" style={{ color: settings.colorAccent }} />
               <span>{currentTime || '00:00:00'}</span>
             </div>

             {/* Admin multi-profile dropdown switch */}
             {sessionUser.userId === 'admin' && allUsersList.length > 0 && (
               <div className="flex items-center gap-1.5 bg-indigo-50/90 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900/40 rounded-full px-3 py-1 font-sans text-[11px] font-bold text-indigo-800 dark:text-indigo-400">
                 <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                 <span className="hidden select-none sm:inline">สลับดูหลังบ้านโปรไฟล์:</span>
                 <select
                   value={currentViewUid}
                   onChange={(e) => {
                     const selectedUid = e.target.value;
                     const selectedUser = allUsersList.find(u => u.uid === selectedUid);
                     if (selectedUser) {
                       setCurrentViewUid(selectedUser.uid);
                       setCurrentViewUserId(selectedUser.userId);
                     }
                   }}
                   className="bg-transparent border-none text-[11px] font-black focus:ring-0 cursor-pointer text-indigo-700 dark:text-indigo-300 py-0 pl-1 pr-5"
                 >
                   {allUsersList.map((usr) => (
                     <option key={usr.uid} value={usr.uid} className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">
                       {usr.userId === 'admin' ? 'แอดมิน (ตัวเอง)' : usr.userId}
                     </option>
                   ))}
                 </select>
               </div>
             )}

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

            {/* Header User Profile Badge */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-2.5 py-1">
              <div 
                className="w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs text-white select-none shadow-sm flex-shrink-0"
                style={{ backgroundColor: settings.colorAccent }}
                title={sessionUser.userId}
              >
                {sessionUser.userId ? sessionUser.userId.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left min-w-0 pr-1.5">
                <span className="block text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 leading-tight">
                  {sessionUser.userId}
                </span>
                <span className="block text-[9px] text-slate-400 font-medium leading-none truncate max-w-[100px]">
                  {sessionUser.email || sessionUser.phone || 'บัญชีผู้ใช้'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="h-10 px-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl flex items-center gap-1.5 text-xs font-bold hover:bg-rose-100 transition-all dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-450 flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden sm:inline">ออก</span>
            </button>

            {/* Collapse/Hide Header Trigger button */}
            <button
              onClick={() => handleSetHeaderCollapsed(true)}
              className="w-10 h-10 border border-slate-200 text-slate-500 bg-white rounded-xl flex items-center justify-center hover:bg-slate-50 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all flex-shrink-0"
              title="ซ่อนแถบเมนูหลักด้านบน"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Small floating restore / expand trigger when header is collapsed */}
        {headerCollapsed && (
          <div className="sticky top-0 z-50 h-0 w-full flex justify-center">
            <button
              onClick={() => handleSetHeaderCollapsed(false)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-b-2xl shadow-xl text-[10.5px] font-extrabold hover:brightness-110 active:scale-95 transition-all border border-t-0 border-slate-700/50"
              title="แสดงแถบเมนูหลักด้านบน"
            >
              <ArrowDown className="w-3.5 h-3.5 animate-bounce" style={{ color: settings.colorAccent }} />
              <span>แสดงแถบเมนูหลัก (TaskFlow Space Executive Pro)</span>
            </button>
          </div>
        )}

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
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 gap-2 flex-shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Link className="w-4 h-4 flex-shrink-0" style={{ color: settings.colorAccent }} />
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{targetLink.title}</span>
                    <span className="text-[10px] font-mono text-slate-400 truncate max-w-[150px] sm:max-w-xs">{targetLink.url}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    <button 
                      onClick={() => {
                        try {
                          const iframe = document.getElementById('link-iframe') as HTMLIFrameElement;
                          if (iframe && iframe.contentWindow) {
                            iframe.contentWindow.history.back();
                          }
                        } catch (err) {
                          console.warn('Cannot navigate iframe history due to cross-origin security:', err);
                        }
                      }}
                      className="hover:underline text-[10px] font-black flex items-center gap-1 flex-shrink-0"
                      style={{ color: settings.colorAccent }}
                      title="ย้อนกลับ"
                    >
                      ⬅️ ย้อนกลับ
                    </button>
                    <button 
                      onClick={() => {
                        try {
                          const iframe = document.getElementById('link-iframe') as HTMLIFrameElement;
                          if (iframe && iframe.contentWindow) {
                            iframe.contentWindow.history.forward();
                          }
                        } catch (err) {
                          console.warn('Cannot navigate iframe history due to cross-origin security:', err);
                        }
                      }}
                      className="hover:underline text-[10px] font-black flex items-center gap-1 flex-shrink-0"
                      style={{ color: settings.colorAccent }}
                      title="ถัดไป"
                    >
                      ➡️ ถัดไป
                    </button>
                    <button 
                      onClick={() => {
                        const iframe = document.getElementById('link-iframe') as HTMLIFrameElement;
                        if (iframe) iframe.src = targetLink.url;
                      }}
                      className="hover:underline text-[10px] font-black flex items-center gap-1 flex-shrink-0"
                      style={{ color: settings.colorAccent }}
                      title="เริ่มใหม่"
                    >
                      🔄 เริ่มใหม่
                    </button>

                    <button 
                      onClick={() => {
                        // Standardize the URL before opening
                        const fullUrl = targetLink.url.match(/^[a-zA-Z]+:\/\//) ? targetLink.url : 'https://' + targetLink.url;
                        window.open(fullUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className="hover:scale-105 active:scale-95 transition-all px-3 py-1 bg-white hover:text-white rounded-lg text-[10px] font-black flex items-center gap-1 flex-shrink-0 shadow-sm border"
                      style={{ 
                        color: settings.colorAccent, 
                        borderColor: settings.colorAccent,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = settings.colorAccent;
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff';
                        e.currentTarget.style.color = settings.colorAccent;
                      }}
                      title="เปิดหน้าต่างภายนอก / แก้ปัญหาเปิดบางเว็บไม่ได้"
                    >
                      🚀 เปิดลิงก์ตรง (แก้ปัญหาเปิดหน้าเว็บไม่ได้)
                    </button>
                  </div>
                </div>

                {/* HELP BANNER FOR IFRAME SECURITY POLICIES */}
                {linkHintVisible && isFrameRestricted(targetLink.url) && (
                  <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 flex items-center gap-2 text-slate-600 dark:text-slate-350 flex-shrink-0 transition-opacity duration-350 animate-fade-in">
                    <span className="text-[11px] font-medium leading-relaxed">
                      💡 <strong>คำแนะนำระบบ:</strong> บางเว็บไซต์ที่มีความปลอดภัยสูง (เช่น Google, Facebook, Youtube, Wikipedia) อาจถูกบล็อกไม่ให้แสดงผลในเฟรม (แซนด์บ็อกซ์ปกติของเบราว์เซอร์) ท่านสามารถคลิกปุ่ม <strong>"🚀 เปิดลิงก์ตรง"</strong> ด้านบนขวา เพื่อเข้าชมเว็บไซต์โดยตรงและเปิดใช้ได้ทันทีทุกที่เชื่อมโยง
                    </span>
                  </div>
                )}

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

          {/* Admin warning banner */}
          {sessionUser.userId === 'admin' && currentViewUserId !== 'admin' && (
            <div className="mb-6 p-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl shadow-lg border border-indigo-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black text-lg flex-shrink-0">
                  🛡️
                </div>
                <div>
                  <h3 className="text-sm font-black text-white leading-tight">โหมดผู้ดูแลระบบหลังบ้านระดับสูง (Super Admin Backend Control)</h3>
                  <p className="text-[11px] text-indigo-100 font-medium mt-0.5 leading-relaxed">
                    คุณกำลังดูและจัดการข้อมูลภารกิจ, งบประมาณ, และการตั้งค่าทั้งหมดของผู้ใช้: <strong className="underline decoration-wavy text-white font-bold">{currentViewUserId}</strong> (การเปลี่ยนแปลงทั้งหมดจะถูกบันทึกขึ้นระบบคลาวด์แบบเรียลไทม์ทันที)
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCurrentViewUid(localStorage.getItem('sess_uid') || '');
                  setCurrentViewUserId('admin');
                }}
                className="px-3.5 py-1.5 bg-white text-indigo-600 hover:bg-indigo-50 font-extrabold text-[11px] rounded-xl transition-all shadow-sm flex-shrink-0"
              >
                หมุนกลับสู่บัญชีตนเอง
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'tasks' && (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 140, damping: 16 }}
              >
                <TaskModule
                  tasks={tasks}
                  onAddTask={handleAddTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onDeleteAllCompleted={handleDeleteAllCompleted}
                  categories={settings.categories}
                  accentColor={settings.colorAccent}
                />
              </motion.div>
            )}

            {activeTab === 'calendar' && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 140, damping: 16 }}
              >
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
              </motion.div>
            )}

            {activeTab === 'expenses' && (
              <motion.div
                key="expenses"
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 140, damping: 16 }}
              >
                <ExpenseModule
                  expenses={expenses}
                  onAddExpense={handleAddExpense}
                  onEditExpense={handleEditExpense}
                  onDeleteExpense={handleDeleteExpense}
                  accentColor={settings.colorAccent}
                />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 140, damping: 16 }}
                className="w-full"
              >
                {!isSettingsUnlocked ? (
                  <SettingsLockScreen
                    correctPassword={settings.settingsPassword || '0000'}
                    onUnlock={() => setIsSettingsUnlocked(true)}
                    accentColor={settings.colorAccent}
                  />
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              
              {/* STATUS ACTION BANNER */}
              <div className="xl:col-span-2 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 p-4 border border-emerald-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-blue-950/20 dark:border-emerald-800/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500 text-white animate-pulse">
                    ⚡
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-400">ระบบซิงก์ข้อมูลคลาวด์แบบเรียลไทม์สมบูรณ์แบบ (Cloud & Cross-Device Live Sync Enabled)</h4>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold">การแก้ไขการตั้งค่าใดๆ ในบัญชีเดียวกันบนอุปกรณ์/เบราว์เซอร์นี้ จะเปลี่ยนตามทั้งหมดบนหน้าจอของอุปกรณ์อื่นทันที</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-750 dark:text-emerald-400 px-3 py-1.5 rounded-full text-[10px] font-black">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  ระบบเชื่อมต่ออยู่ (Cloud Live)
                </div>
              </div>
              
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
                      🔑 รหัสผ่านเข้าใช้งานระบบ (Password ยาว 6 หลักเท่านั้น)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="เช่น 123456"
                      className="w-full h-11 px-3 border border-slate-200 bg-slate-50 focus:bg-white dark:focus:bg-slate-900 rounded-lg text-sm text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 font-medium font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">รหัสผ่านใหม่ต้องมีความยาว <span className="font-bold text-amber-500">6 หลักเท่านั้น</span> เพื่อความปลอดภัยในการเข้าใช้งานในครั้งถัดไป</p>
                  </div>
                </div>

                {/* Settings Menu PIN Lock Password Section */}
                <div className="border-t border-slate-100 pt-5 mt-4 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
                    <span>🔒</span> รหัสผ่านปลดล็อกเมนูตั้งค่ารวม (Settings Menu Tab Lock PIN)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-450 mb-1.5">
                        🔑 รหัสล็อกปัจจุบันหรือตั้งค่าใหม่ (ค่าเริ่มต้นคือ 0000)
                      </label>
                      <input
                        type="text"
                        maxLength={12}
                        value={settings.settingsPassword || '0000'}
                        onChange={(e) => syncSettings({ ...settings, settingsPassword: e.target.value.trim() })}
                        placeholder="เช่น 0000"
                        className="w-full h-11 px-3 border border-slate-200 bg-slate-50 focus:bg-white dark:focus:bg-slate-900 rounded-lg text-sm text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 font-medium font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        เมื่อคุณท่านเปลี่ยนรหัสตรงส่วนนี้ รหัสความปลอดภัยจะอัปเดตแบบเรียลไทม์ และจะซิงค์ไปยังระบบคลาวด์อัตโนมัติ
                      </p>
                    </div>
                    <div className="flex items-center bg-amber-50/50 p-4 border border-amber-100 rounded-xl dark:bg-amber-950/10 dark:border-amber-900/30">
                      <div className="text-amber-800 dark:text-amber-400 text-[11px] leading-relaxed font-semibold">
                        💡 <strong>คำแนะนำเพิ่มเติม:</strong> รหัสนี้นอกจากป้องกันมือไม่พึงประสงค์สวิตช์และแก้ไขหน้าเว็บแล้ว ยังถูกอัปโหลดขึ้นระดับเซิร์ฟเวอร์คลาวด์เพื่อให้ทุกอุปกรณ์ของท่านซิงค์เข้าหากันอย่างปลอดภัย หากตั้งค่าแล้วโปรดจดจำไว้ให้ดี
                      </div>
                    </div>
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

              {/* PDF & Print Settings Panel */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 dark:bg-slate-900 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 dark:text-slate-100">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400 font-bold text-sm">🖨️</span>
                  <span>ตั้งค่าการจัดรูปแบบรายงาน PDF & การสั่งพิมพ์ (Print & PDF Customizer)</span>
                </h3>
                <p className="text-xs text-slate-500 font-semibold dark:text-slate-400 text-left">
                  คุณท่านสามารถกำหนดหัวข้อรายงาน ย่อยของชื่อเรื่อง เลือกดีไซน์/แพทเทิร์น และเปิด-ปิดส่วนท้าย เพื่อให้เอกสารที่ได้ออกมาเป็นระบบ อ่านง่าย เข้าใจอย่างมีประสิทธิภาพ และเป็นทางการสูงสุด
                </p>

                <div className="space-y-4 text-xs font-semibold text-slate-650">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-600 mb-1.5 dark:text-slate-450 text-left">หัวข้อรายงานหลัก (Report Title)</label>
                      <input
                        type="text"
                        placeholder="เช่น รายงานสรุปงานและบันทึกค่าใช้จ่าย"
                        value={settings.printTitle || ''}
                        onChange={(e) => syncSettings({ ...settings, printTitle: e.target.value })}
                        className="w-full h-11 px-3 border border-slate-200 bg-slate-50 focus:bg-white dark:focus:bg-slate-900 rounded-lg text-xs text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1.5 dark:text-slate-450 text-left">คำจ่าหน้าย่อย/สโลแกน (Report Subtitle/Header)</label>
                      <input
                        type="text"
                        placeholder="เช่น ระบบบัญชีและบันทึกติดตามงานเพื่อสุขภาพทางการเงิน"
                        value={settings.printSubtitle || ''}
                        onChange={(e) => syncSettings({ ...settings, printSubtitle: e.target.value })}
                        className="w-full h-11 px-3 border border-slate-200 bg-slate-50 focus:bg-white dark:focus:bg-slate-900 rounded-lg text-xs text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-600 mb-1.5 dark:text-slate-450 text-left">แพทเทิร์น/เทมเพลตรูปแบบ Layout (Report Pattern)</label>
                      <select
                        value={settings.printTemplatePattern || 'formal'}
                        onChange={(e) => syncSettings({ ...settings, printTemplatePattern: e.target.value as any })}
                        className="w-full h-11 px-3 border border-slate-200 bg-slate-50 focus:bg-white dark:focus:bg-slate-900 rounded-lg text-xs text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 font-bold"
                      >
                        <option value="formal">👔 ทางการ (Formal Document Layout - มีตราประทับและกรอบเส้นตาราง)</option>
                        <option value="standard">📊 มาตรฐาน (Modern Slate - มีเสาไฮไลต์หัวข้อและสีสันสดใส)</option>
                        <option value="compact">📄 ประหยัดกระดาษป้อน (Compact Spacing - ตัวหนังสือกะทัดรัด สรุปสั้น)</option>
                        <option value="creative">🎨 สร้างสรรค์ (Creative Pastel Theme - ขอบโค้งมน ตารางแบบอบอุ่น)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1.5 dark:text-slate-450 text-left">รายละเอียดหมายเหตุระบุด้านล่าง (Footer Memo Text)</label>
                      <input
                        type="text"
                        placeholder="เช่น เอกสารสรุปส่วนบุคคลสร้างขึ้นด้วยความเคารพอย่างสูง"
                        value={settings.printFooterText || ''}
                        onChange={(e) => syncSettings({ ...settings, printFooterText: e.target.value })}
                        className="w-full h-11 px-3 border border-slate-200 bg-slate-50 focus:bg-white dark:focus:bg-slate-900 rounded-lg text-xs text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                    <div className="text-left">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">แสดงกล่องช่องเซ็นชื่อท้ายรายงาน (Signature Blocks)</h4>
                      <p className="text-[10px] text-slate-400 font-normal">เพิ่มตารางและเส้นประสำหรับการลงชื่อกำกับอย่างเป็นทางการที่ท้ายหน้า PDF</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => syncSettings({ ...settings, printShowSignatures: settings.printShowSignatures === false ? true : false })}
                      className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                        settings.printShowSignatures !== false ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${settings.printShowSignatures !== false ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
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
        </motion.div>
      )}
    </AnimatePresence>
        </main>
      </div>

      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        tasks={tasks}
        expenses={expenses}
        settings={settings}
      />
    </div>
  );
}
