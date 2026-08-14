import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Home,
  ArrowLeft,
  Moon,
  Sun,
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
  User,
  Shield,
  Megaphone,
  MessageSquare,
  Check,
  UserCheck,
  UserX,
  Edit,
  FolderOpen,
  Scale,
  Download,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { Task, Expense, AppSettings, CustomMenuLink, Announcement } from './types';
import { THEME_PRESETS, hexToRgb, getDarkerColor, getLighterColor, getDarkToneFromColor } from './themePresets';

import { doc, getDoc, setDoc, getDocs, collection, deleteDoc, onSnapshot } from 'firebase/firestore';
import { updateEmail, updatePassword } from 'firebase/auth';
import { db, auth } from './firebase';
import { useDialog } from './components/CustomDialog';
import { playNotificationSound } from './lib/soundUtils';
import AiAssistant from './components/AiAssistant';
import { AppInstallModal, AppInstallButton } from './components/AppInstallModal';

const padPass = (pass: string) => {
  if (pass.length >= 6) return pass;
  return pass.padEnd(6, '0');
};

// Modules
import AuthScreen from './components/AuthScreen';
import PendingApprovalView from './components/PendingApprovalView';
import LockedUserView from './components/LockedUserView';
import AdminPanel from './components/AdminPanel';
import HeaderChatWidget from './components/HeaderChatWidget';
import TaskModule from './components/TaskModule';
import CalendarModule from './components/CalendarModule';
import SettingsLockScreen from './components/SettingsLockScreen';
import ExpenseModule from './components/ExpenseModule';
import LocalFileExplorer from './components/LocalFileExplorer';
import DekaSearchModule from './components/DekaSearchModule';
import { PrintReportModal } from './components/PrintReportModal';
import { EditProfileModal } from './components/EditProfileModal';
import NotesWidget from './components/NotesWidget';
import BackupModule from './components/BackupModule';
import FormDocumentModule from './components/FormDocumentModule';
import { ReceiptModule } from './components/ReceiptModule';
import { ColorWheelPicker } from './components/ColorWheelPicker';

const DEFAULT_CATEGORIES = ['💼 งานทั่วไป', '🏠 ส่วนตัว', '🛒 ช้อปปิ้ง', '🔥 เร่งด่วน'];
const DEFAULT_EXPENSE_CATEGORIES = ['🏠 ที่พัก', '💡 สาธารณูปโภค', '🛒 ของใช้/อาหาร', '🚗 การเดินทาง', '💊 สุขภาพ', '📱 สื่อสาร', '🎓 การศึกษา', '🎉 บันเทิง', '📦 อื่นๆ'];

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
function sanitizeUrl(url: string | undefined): string {
  if (!url) return '';
  let trimmed = url.trim();
  if (!/^[a-zA-Z]+:\/\//.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }
  return trimmed;
}

function isFrameRestricted(url: string | undefined): boolean {
  if (!url) return false;
  const sanitized = sanitizeUrl(url);
  const lower = sanitized.toLowerCase();
  
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
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return localStorage.getItem('isLoggedIn') === 'true' && !!localStorage.getItem('sess_userId');
    } catch {
      return false;
    }
  });
  const [sessionUser, setSessionUser] = useState(() => {
    try {
      const savedUserId = localStorage.getItem('sess_userId') || '';
      const localSessProfileStr = savedUserId ? localStorage.getItem(`profile_${savedUserId}`) : null;
      let loadedDisplayName = '';
      let loadedAvatarUrl = '';
      if (localSessProfileStr) {
        try {
          const parsed = JSON.parse(localSessProfileStr);
          loadedDisplayName = parsed.displayName || '';
          loadedAvatarUrl = parsed.avatarUrl || '';
        } catch (e) {}
      }
      return { 
        userId: savedUserId, 
        email: localStorage.getItem('user_email') || '', 
        phone: localStorage.getItem('user_phone') || '', 
        password: localStorage.getItem('user_password') || '000000', 
        displayName: loadedDisplayName, 
        avatarUrl: loadedAvatarUrl, 
        isApproved: localStorage.getItem('user_approved') === 'true' || savedUserId === 'admin', 
        isLocked: localStorage.getItem('user_locked') === 'true', 
        isAssistant: localStorage.getItem('user_assistant') === 'true' 
      };
    } catch {
      return { 
        userId: '', 
        email: '', 
        phone: '', 
        password: '', 
        displayName: '', 
        avatarUrl: '', 
        isApproved: false, 
        isLocked: false, 
        isAssistant: false 
      };
    }
  });
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(() => {
    try {
      return localStorage.getItem('isLoggedIn') === 'true' && !!localStorage.getItem('sess_userId');
    } catch {
      return false;
    }
  });
  const [showNotificationFlyout, setShowNotificationFlyout] = useState(false);
  
  // Settings Page States
  const [tempSettings, setTempSettings] = useState<AppSettings | null>(null);
  const [settingsSubTab, setSettingsSubTab] = useState<string>('branding');
  const [settingsSaveSuccess, setSettingsSaveSuccess] = useState<boolean>(false);

  // App data states (Pre-loaded from local cache for 0ms instant display)
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const savedUserId = localStorage.getItem('sess_userId');
      if (savedUserId) {
        const saved = localStorage.getItem(`tasks_${savedUserId}`);
        if (saved) return JSON.parse(saved);
      }
    } catch {}
    return [];
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const savedUserId = localStorage.getItem('sess_userId');
      if (savedUserId) {
        const saved = localStorage.getItem(`expenses_${savedUserId}`);
        if (saved) return JSON.parse(saved);
      }
    } catch {}
    return [];
  });
  const [settings, setSettings] = useState<AppSettings>(() => {
    const defaultInit = {
      appName: 'TaskFlow Space Executive Pro',
      appDesc: 'ระบบบอร์ดงาน ปฏิทินจดจำสรุปกิจกรรม และจัดการค่าชำระส่วนบุคคลสำหรับผู้บริหาร',
      appLogoUrl: '',
      bgStyle: 'theme-custom' as const,
      customBgUrl: '',
      darkMode: false,
      categories: DEFAULT_CATEGORIES,
      expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
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
      bgType: 'gradient' as const,
      settingsPassword: '0000',
      soundEnabled: true,
      soundType: 'chime' as const,
      soundVolume: 80,
      soundOnComplete: true,
      soundOnAdd: true,
      aiAssistantEnabled: true,
      customMenuLinks: []
    };
    try {
      const savedUserId = localStorage.getItem('sess_userId');
      if (savedUserId) {
        const saved = localStorage.getItem(`settings_${savedUserId}`);
        if (saved) return { ...defaultInit, ...JSON.parse(saved) };
      }
    } catch {}
    return defaultInit;
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
  const [showInstallAppModal, setShowInstallAppModal] = useState<boolean>(false);
  const [linkPopupData, setLinkPopupData] = useState<{ url: string; title: string; visible: boolean }>({ url: '', title: '', visible: false });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false);

  useEffect(() => {
    if (activeTab === 'settings' && isSettingsUnlocked) {
      if (!tempSettings) {
        setTempSettings(settings);
      }
    } else {
      setTempSettings(null);
      setSettingsSaveSuccess(false);
    }
  }, [activeTab, isSettingsUnlocked, settings, tempSettings]);

  // Admin and Multi-profile states
  const [allUsersList, setAllUsersList] = useState<{ userId: string; email: string; phone: string; uid: string }[]>([]);
  const [currentViewUid, setCurrentViewUid] = useState<string>(() => {
    try {
      return localStorage.getItem('sess_uid') || localStorage.getItem('sess_userId') || '';
    } catch {
      return '';
    }
  });
  const [currentViewUserId, setCurrentViewUserId] = useState<string>(() => {
    try {
      return localStorage.getItem('sess_userId') || '';
    } catch {
      return '';
    }
  });
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(true);

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
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkIcon, setNewLinkIcon] = useState('Link');
  const [newLinkVisibility, setNewLinkVisibility] = useState<'all' | 'specific'>('all');
  const [newLinkAllowedUsers, setNewLinkAllowedUsers] = useState<string[]>([]);
  const [newLinkOpenDirectly, setNewLinkOpenDirectly] = useState(false);
  const [adminCustomLinks, setAdminCustomLinks] = useState<CustomMenuLink[]>([]);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkHintVisible, setLinkHintVisible] = useState(false);

  // Announcement states
  const [adminAnnouncements, setAdminAnnouncements] = useState<Announcement[]>([]);
  const [dbAnnouncements, setDbAnnouncements] = useState<Announcement[]>([]);
  const [newAnnounceTitle, setNewAnnounceTitle] = useState('');
  const [newAnnounceContent, setNewAnnounceContent] = useState('');
  const [newAnnounceImage, setNewAnnounceImage] = useState('');
  const [newAnnounceVisibility, setNewAnnounceVisibility] = useState<'all' | 'specific'>('all');
  const [newAnnounceAllowedUsers, setNewAnnounceAllowedUsers] = useState<string[]>([]);
  const [editingAnnounceId, setEditingAnnounceId] = useState<string | null>(null);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);
  const [showAnnounceModalId, setShowAnnounceModalId] = useState<string | null>(null);
  const [presetCategoryFilter, setPresetCategoryFilter] = useState<string>('all');

  // Manage visibility of iframe frame security guidelines banner and handle auto-popup for restricted sites
  useEffect(() => {
    if (activeTab.startsWith('link_')) {
      setLinkHintVisible(true);
      const linkId = activeTab.replace('link_', '');
      const allLinks = [...(settings.customMenuLinks || []), ...(adminCustomLinks || [])];
      const targetLink = allLinks.find(l => l.id === linkId);
      if (targetLink) {
        const sanitized = sanitizeUrl(targetLink.url);
        if (isFrameRestricted(sanitized) || targetLink.openDirectly) {
          setLinkPopupData({
            url: sanitized,
            title: targetLink.title,
            visible: true
          });
          try {
            window.open(sanitized, '_blank', 'noopener,noreferrer');
          } catch (e) {
            console.error('Failed to auto-open link window:', e);
          }
        }
      }
      const timer = setTimeout(() => {
        setLinkHintVisible(false);
      }, 5000); // Hide after exactly 5 seconds
      return () => clearTimeout(timer);
    } else {
      setLinkHintVisible(false);
      setLinkPopupData({ url: '', title: '', visible: false });
    }
  }, [activeTab, settings.customMenuLinks, adminCustomLinks]);
  
  // Email connection notifications test result
  const [emailResult, setEmailResult] = useState<{ text: string; type: 'ok' | 'err' | 'loading' | null }>({ text: '', type: null });
  const [customHolidays, setCustomHolidays] = useState<Record<string, string>>({});
  const [currentTime, setCurrentTime] = useState('');
  const [activeAlarms, setActiveAlarms] = useState<Task[]>([]);
  const alarmedTaskIds = useRef<Set<string>>(new Set());
  const expensesRef = useRef<Expense[]>([]);
  const tasksRef = useRef<Task[]>([]);

  useEffect(() => {
    expensesRef.current = expenses;
  }, [expenses]);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Web Notification Permission State & Handlers
  const [browserPermission, setBrowserPermission] = useState<string>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  const handleRequestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('เบราว์เซอร์หรืออุปกรณ์ของคุณไม่สนับสนุนระบบแจ้งเตือน Web Notifications');
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      if (permission === 'granted') {
        const updated = {
          ...settings,
          nativeNotificationsEnabled: true
        };
        syncSettings(updated);
        
        try {
          new Notification('🎉 เชื่อมต่อแจ้งเตือนสำเร็จ!', {
            body: 'อุปกรณ์และเบราว์เซอร์นี้พร้อมรับการแจ้งเตือนงานค้างส่ง และรายจ่ายจาก TaskFlow Space แล้วครับ!',
            icon: settings.appLogoUrl || '/icon.png'
          });
        } catch (e) {
          console.warn('Notification constructor failed inside this scope (sandboxed)', e);
        }
      }
    } catch (err) {
      console.error('Failed to request notification permission:', err);
    }
  };

  const handleTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('🔔 ทดสอบระบบแจ้งเตือน!', {
          body: 'นี่คือข้อความพุชจำลองจากอุปกรณ์ที่ใช้งานอยู่ของท่าน ระบบสื่อสารทำงานปกติเรียบร้อยดี!',
          icon: settings.appLogoUrl || '/icon.png'
        });
      } catch (e) {
        alert('ระบบพยายามส่งแจ้งเตือนแล้ว แต่เบราว์เซอร์ล้มเหลวเนื่องจากการบล็อก sandbox ของ iFrame พรีวิว แนะนำให้กดเปิดแอปในแท็บใหม่ (Open in a new tab) เพื่อทดสอบได้แบบสมบูรณ์ 100%!');
      }
    } else {
      alert('กรุณากดยืนยันสิทธิ์อนุญาตแจ้งเตือนบนอุปกรณ์นี้ก่อนทำการทดสอบครับ');
    }
  };

  // Background Real-time Task Due Alert Engine
  useEffect(() => {
    if (!isLoggedIn || !dataLoaded || !tasks || tasks.length === 0) return;

    // Get current local time
    const now = new Date();
    const currentHHMM = now.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Bangkok'
    });
    
    const todayStr = getThailandTodayStr();

    tasks.forEach(task => {
      if (
        task.status === 'pending' &&
        task.dueDate === todayStr &&
        task.dueTime
      ) {
        const taskHHMM = task.dueTime.trim();
        if (currentHHMM === taskHHMM) {
          if (!alarmedTaskIds.current.has(task.id)) {
            alarmedTaskIds.current.add(task.id);
            setActiveAlarms(prev => {
              if (prev.some(a => a.id === task.id)) return prev;
              return [...prev, task];
            });

            if (settings.soundEnabled !== false) {
              playNotificationSound(settings.soundType || 'alert', settings.soundVolume ?? 80);
            }

            if (settings.nativeNotificationsEnabled !== false && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(`⏰ แจ้งเตือนงานด่วน: ${task.title}`, {
                  body: `ถึงเวลาที่กำหนดส่งแล้ว: ${task.dueTime} น. [หมวดหมู่: ${task.category || 'ทั่วไป'}]\n${task.desc || ''}`,
                  icon: settings.appLogoUrl || '/icon.png'
                });
              } catch (e) {
                console.warn('Failed to construct alert notification:', e);
              }
            }
          }
        }
      }
    });
  }, [currentTime, isLoggedIn, dataLoaded, tasks, settings]);

  // Account / Security states
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ text: string; type: 'ok' | 'err' } | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // DB Unsubscribe pointers for real-time Firestore sync
  const dbUnsubscribersRef = useRef<{ settings?: () => void; tasks?: () => void; expenses?: () => void; profile?: () => void }>({});

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
    if (dbUnsubscribersRef.current.profile) {
      dbUnsubscribersRef.current.profile();
      delete dbUnsubscribersRef.current.profile;
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
      const uid = currentViewUserId || localStorage.getItem('sess_userId');
      if (uid) {
        await forcePushLocalToCloud(currentViewUserId, uid);
        setIsCloudSynced(true);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsCloudSynced(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sessionUser.userId, currentViewUserId]);

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

  // Subscribe to Admin Custom Menu Links & Announcements to display to normal users
  useEffect(() => {
    if (!isLoggedIn) {
      setAdminCustomLinks([]);
      setAdminAnnouncements([]);
      setDbAnnouncements([]);
      return;
    }

    const adminSettingsRef = doc(db, 'users', 'admin', 'settings', 'app');
    const unsubscribeSettings = onSnapshot(adminSettingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const adminData = docSnap.data();
        const links = adminData.customMenuLinks || [];
        setAdminCustomLinks(links);
        const announcements = adminData.announcements || [];
        setAdminAnnouncements(announcements);
      } else {
        setAdminCustomLinks([]);
        setAdminAnnouncements([]);
      }
    }, (err) => {
      console.error('Failed to subscribe to admin settings:', err);
    });

    const announcementsRef = collection(db, 'announcements');
    const unsubscribeAnn = onSnapshot(announcementsRef, (snapshot) => {
      const items: Announcement[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          title: d.title || '',
          content: d.content || '',
          imageUrl: d.imageUrl || '',
          visibility: d.visibility || 'all',
          allowedUsers: d.allowedUsers || [],
          createdAt: d.createdAt || new Date().toISOString(),
          author: d.author || 'admin',
          isActive: d.isActive ?? true
        });
      });
      setDbAnnouncements(items);
    }, (err) => {
      console.error('Failed to subscribe to announcements collection:', err);
    });

    return () => {
      unsubscribeSettings();
      unsubscribeAnn();
    };
  }, [isLoggedIn]);

  // Load dismissed announcements on login/load
  useEffect(() => {
    if (sessionUser.userId) {
      const saved = localStorage.getItem(`dismissed_announcements_${sessionUser.userId}`);
      if (saved) {
        try {
          setDismissedAnnouncements(JSON.parse(saved));
        } catch (e) {}
      } else {
        setDismissedAnnouncements([]);
      }
    }
  }, [sessionUser.userId]);

  // Fetch all user profiles for custom links user assignment dropdown (for admin & everyone)
  useEffect(() => {
    if (!isLoggedIn) return;
    const usersCol = collection(db, 'users');
    const unsubscribe = onSnapshot(usersCol, (snapshot) => {
      const usersList: any[] = [];
      snapshot.forEach((docRef) => {
        usersList.push(docRef.data());
      });
      setAllUsersList(usersList);
    }, (err) => {
      console.error('Failed to fetch user profiles for custom link targeting:', err);
    });
    return () => unsubscribe();
  }, [isLoggedIn]);

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
    
    let uid = firebaseUid || localStorage.getItem('sess_uid') || userId || '';
    if (uid) {
      localStorage.setItem('sess_uid', uid);
    }
    
    let userIsApproved = userId === 'admin' || localStorage.getItem('user_approved') === 'true';
    let userIsLocked = localStorage.getItem('user_locked') === 'true';
    let userIsAssistant = localStorage.getItem('user_assistant') === 'true';

    const localSessProfileStr = localStorage.getItem(`profile_${userId}`);
    let loadedDisplayName = '';
    let loadedAvatarUrl = '';
    if (localSessProfileStr) {
      try {
        const parsed = JSON.parse(localSessProfileStr);
        loadedDisplayName = parsed.displayName || '';
        loadedAvatarUrl = parsed.avatarUrl || '';
      } catch (e) {}
    }

    // Immediately activate session with zero-latency
    setSessionUser({ 
      userId, 
      email, 
      phone, 
      password: password || localStorage.getItem('user_password') || '000000', 
      displayName: loadedDisplayName, 
      avatarUrl: loadedAvatarUrl, 
      isApproved: userIsApproved,
      isLocked: userIsLocked,
      isAssistant: userIsAssistant
    });
    setIsLoggedIn(true);

    // Instant local state prefill
    try {
      const savedTasks = localStorage.getItem(`tasks_${userId}`);
      if (savedTasks) setTasks(JSON.parse(savedTasks));

      const savedExpenses = localStorage.getItem(`expenses_${userId}`);
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));

      const savedSettings = localStorage.getItem(`settings_${userId}`);
      if (savedSettings) setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
    } catch (_) {}

    setCurrentViewUid(uid);
    setCurrentViewUserId(userId);
    setDataLoaded(true);

    // Asynchronously fetch approval/lock in background without blocking UI
    (async () => {
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const udata = userDocSnap.data();
          const uApproved = udata.isApproved !== undefined ? udata.isApproved : (userId === 'admin');
          const uLocked = udata.isLocked !== undefined ? udata.isLocked : false;
          const uAssistant = udata.isAssistant !== undefined ? udata.isAssistant : false;
          localStorage.setItem('user_approved', uApproved ? 'true' : 'false');
          localStorage.setItem('user_locked', uLocked ? 'true' : 'false');
          localStorage.setItem('user_assistant', uAssistant ? 'true' : 'false');
          setSessionUser(prev => ({
            ...prev,
            isApproved: uApproved,
            isLocked: uLocked,
            isAssistant: uAssistant,
            displayName: udata.displayName || prev.displayName,
            avatarUrl: udata.avatarUrl || prev.avatarUrl
          }));
        }
      } catch (e) {
        console.warn('Background profile verification:', e);
      }
    })();

    // Background fetch registered profiles if admin
    if (userId === 'admin' && uid) {
      (async () => {
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
      })();
    }
  };

  // Reactive Effect to handle loading and setting real-time observers whenever currentViewUid changes
  useEffect(() => {
    if (!isLoggedIn || !currentViewUid) return;

    let active = true;

    const defaultSet = {
      appName: 'TaskFlow Space Executive Pro',
      appDesc: 'ระบบบอร์ดงาน ปฏิทินจดจำสรุปกิจกรรม และจัดการค่าชำระส่วนบุคคลสำหรับผู้บริหาร',
      appLogoUrl: '',
      bgStyle: 'theme-custom' as const,
      customBgUrl: '',
      darkMode: false,
      categories: DEFAULT_CATEGORIES,
      expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
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
      settingsPassword: '0000',
      soundEnabled: true,
      soundType: 'chime' as const,
      soundVolume: 80,
      soundOnComplete: true,
      soundOnAdd: true,
      aiAssistantEnabled: true,
      customMenuLinks: []
    };

    const loadAndSetupProfile = async () => {
      const targetUserId = currentViewUserId;
      const uid = targetUserId;

      // 1. Instantly ensure cached data is visible
      try {
        const savedSettings = localStorage.getItem(`settings_${targetUserId}`);
        if (savedSettings && active) {
          setSettings({ ...defaultSet, ...JSON.parse(savedSettings) });
        }
        const savedTasks = localStorage.getItem(`tasks_${targetUserId}`);
        if (savedTasks && active) {
          setTasks(JSON.parse(savedTasks));
        }
        const savedExpenses = localStorage.getItem(`expenses_${targetUserId}`);
        if (savedExpenses && active) {
          setExpenses(JSON.parse(savedExpenses));
        }
        if (active) setDataLoaded(true);
      } catch (_) {}

      try {
        const userDocRef = doc(db, 'users', targetUserId);
        const settingsRef = doc(db, 'users', uid, 'settings', 'app');
        const tasksCol = collection(db, 'users', uid, 'tasks');
        const expensesCol = collection(db, 'users', uid, 'expenses');

        // Parallel Concurrent Firestore Fetching
        const [profileRes, settingsRes, tasksRes, expensesRes] = await Promise.allSettled([
          getDoc(userDocRef),
          getDoc(settingsRef),
          getDocs(tasksCol),
          getDocs(expensesCol)
        ]);

        if (!active) return;

        // Process Profile Result
        if (profileRes.status === 'fulfilled' && profileRes.value.exists()) {
          const userData = profileRes.value.data();
          setSessionUser(prev => {
            const uApproved = userData.isApproved !== undefined ? userData.isApproved : (targetUserId === 'admin' ? true : false);
            localStorage.setItem('user_approved', uApproved ? 'true' : 'false');
            const uLocked = userData.isLocked !== undefined ? userData.isLocked : false;
            localStorage.setItem('user_locked', uLocked ? 'true' : 'false');
            const uAssistant = userData.isAssistant !== undefined ? userData.isAssistant : false;
            localStorage.setItem('user_assistant', uAssistant ? 'true' : 'false');
            const updated = {
              ...prev,
              displayName: userData.displayName || '',
              avatarUrl: userData.avatarUrl || '',
              email: userData.email || prev.email,
              phone: userData.phone || prev.phone,
              password: userData.password || prev.password,
              isApproved: uApproved,
              isLocked: uLocked,
              isAssistant: uAssistant
            };
            localStorage.setItem(`profile_${targetUserId}`, JSON.stringify(updated));
            return updated;
          });
        }

        // Process Settings Result
        let currentSettings = defaultSet;
        if (settingsRes.status === 'fulfilled' && settingsRes.value.exists()) {
          currentSettings = { ...defaultSet, ...settingsRes.value.data() };
          setSettings(currentSettings);
          localStorage.setItem(`settings_${targetUserId}`, JSON.stringify(currentSettings));
        } else {
          const savedSettings = localStorage.getItem(`settings_${targetUserId}`);
          if (savedSettings) {
            try { currentSettings = { ...defaultSet, ...JSON.parse(savedSettings) }; } catch (e) {}
          }
          setSettings(currentSettings);
          setDoc(settingsRef, currentSettings).catch(() => {});
        }

        // Process Tasks Result
        if (tasksRes.status === 'fulfilled' && !tasksRes.value.empty) {
          const tasksList: Task[] = [];
          tasksRes.value.forEach((d) => {
            tasksList.push(d.data() as Task);
          });
          setTasks(tasksList);
          localStorage.setItem(`tasks_${targetUserId}`, JSON.stringify(tasksList));
        }

        // Process Expenses Result
        if (expensesRes.status === 'fulfilled' && !expensesRes.value.empty) {
          const expensesList: Expense[] = [];
          expensesRes.value.forEach((d) => {
            expensesList.push(d.data() as Expense);
          });
          setExpenses(expensesList);
          localStorage.setItem(`expenses_${targetUserId}`, JSON.stringify(expensesList));
        }

        // Hook up real-time sync subscribers to Firestore for multi-device sync
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
          tasksRef.current = tasksList;
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
          expensesRef.current = expensesList;
          localStorage.setItem(`expenses_${targetUserId}`, JSON.stringify(expensesList));
        }, (error) => {
          console.error('Firestore real-time expenses sync error:', error);
        });

        dbUnsubscribersRef.current.profile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists() && active) {
            const userData = docSnap.data();
            setSessionUser(prev => {
              const uApproved = userData.isApproved !== undefined ? userData.isApproved : (targetUserId === 'admin' ? true : false);
              localStorage.setItem('user_approved', uApproved ? 'true' : 'false');
              const uLocked = userData.isLocked !== undefined ? userData.isLocked : false;
              localStorage.setItem('user_locked', uLocked ? 'true' : 'false');
              const uAssistant = userData.isAssistant !== undefined ? userData.isAssistant : false;
              localStorage.setItem('user_assistant', uAssistant ? 'true' : 'false');
              const updated = {
                ...prev,
                displayName: userData.displayName || '',
                avatarUrl: userData.avatarUrl || '',
                email: userData.email || prev.email,
                phone: userData.phone || prev.phone,
                password: userData.password || prev.password,
                isApproved: uApproved,
                isLocked: uLocked,
                isAssistant: uAssistant
              };
              localStorage.setItem(`profile_${targetUserId}`, JSON.stringify(updated));
              return updated;
            });
          }
        }, (error) => {
          console.error('Firestore real-time profile snapshot sync error:', error);
        });

        if (active) {
          setIsCloudSynced(true);
          setDataLoaded(true);
        }
      } catch (err) {
        console.error('Failed to sync from Firestore on login:', err);
        if (active) {
          setIsCloudSynced(false);
          setDataLoaded(true);
        }
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
    const oldTasks = tasksRef.current;
    setTasks(newTasks);
    tasksRef.current = newTasks;
    if (currentViewUserId) {
      localStorage.setItem(`tasks_${currentViewUserId}`, JSON.stringify(newTasks));
    }
    if (sessionUser.userId) {
      localStorage.setItem(`tasks_${sessionUser.userId}`, JSON.stringify(newTasks));
    }

    const uid = currentViewUserId || localStorage.getItem('sess_userId');
    if (uid) {
      try {
        const previousMap = new Map<string, Task>(oldTasks.map(t => [t.id, t]));
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
    const oldExpenses = expensesRef.current;
    setExpenses(newExpenses);
    expensesRef.current = newExpenses;
    if (currentViewUserId) {
      localStorage.setItem(`expenses_${currentViewUserId}`, JSON.stringify(newExpenses));
    }
    if (sessionUser.userId) {
      localStorage.setItem(`expenses_${sessionUser.userId}`, JSON.stringify(newExpenses));
    }

    const uid = currentViewUserId || localStorage.getItem('sess_userId');
    if (uid) {
      try {
        const previousMap = new Map<string, Expense>(oldExpenses.map(e => [e.id, e]));
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

    const uid = currentViewUserId || localStorage.getItem('sess_userId');
    if (uid) {
      try {
        await setDoc(doc(db, 'users', uid, 'settings', 'app'), newSettings);
      } catch (e) {
        console.error('Failed to sync settings to Firestore:', e);
      }
    }
  };

  const handleCloudRestore = async (data: { tasks?: Task[]; expenses?: Expense[]; settings?: AppSettings }) => {
    try {
      if (data.tasks) {
        await syncTasks(data.tasks);
      }
      if (data.expenses) {
        await syncExpenses(data.expenses);
      }
      if (data.settings) {
        await syncSettings(data.settings);
      }
      await showAlert('กู้คืนข้อมูลสำรองเรียบร้อยแล้วค่ะ ระบบกำลังโหลดและอัปเดตหน้าต่างทั้งหมด', 'กู้คืนข้อมูลสำเร็จ', 'success');
    } catch (e: any) {
      console.error('Restore error:', e);
      await showAlert('ไม่สามารถกู้คืนข้อมูลสำรองได้: ' + (e.message || ''), 'เกิดข้อผิดพลาด', 'danger');
    }
  };

  const handleSaveAllSettings = async () => {
    if (!tempSettings) return;
    const isConfirmed = await showConfirm(
      'คุณต้องการบันทึกและยืนยันการเปลี่ยนแปลงการตั้งค่าทั้งหมดใช่หรือไม่?',
      'ยืนยันการบันทึกการตั้งค่า',
      'info'
    );
    if (!isConfirmed) return;

    try {
      await syncSettings(tempSettings);
      setSettingsSaveSuccess(true);
      setTimeout(() => setSettingsSaveSuccess(false), 3000);
      await showAlert('บันทึกและยืนยันการตั้งค่าทั้งหมดเรียบร้อยแล้วค่ะ', 'สำเร็จ', 'success');
    } catch (e) {
      console.error(e);
      await showAlert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า', 'เกิดข้อผิดพลาด', 'danger');
    }
  };

  const handleResetAllSettings = async () => {
    const isConfirmed = await showConfirm(
      'คุณต้องการยกเลิกการเปลี่ยนแปลงทั้งหมดและย้อนกลับไปใช้ค่าเดิมที่บันทึกล่าสุดใช่หรือไม่?',
      'ยกเลิกการเปลี่ยนแปลง',
      'warning'
    );
    if (isConfirmed) {
      setTempSettings(settings);
      await showAlert('คืนค่าการตั้งค่าเดิมเรียบร้อยแล้วค่ะ', 'คืนค่าสำเร็จ', 'success');
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

    const isConfirmed = await showConfirm(
      'คุณต้องการยืนยันอัปเดตไอดีผู้ใช้และรหัสผ่านใหม่ใช่หรือไม่?',
      'ยืนยันการอัปเดตบัญชี',
      'warning'
    );
    if (!isConfirmed) return;

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
    syncTasks([...tasksRef.current, created]);
    if (settings.soundEnabled !== false && settings.soundOnAdd !== false) {
      playNotificationSound(settings.soundType || 'chime', settings.soundVolume ?? 80);
    }
    if (settings.nativeNotificationsEnabled !== false && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('📝 เพิ่มเป้าหมายภารกิจใหม่', {
          body: `ชื่องาน: "${created.title}"\nกำหนดส่ง: ${created.dueDate} ${created.dueTime || ''} (${created.category || 'ทั่วไป'})`,
          icon: settings.appLogoUrl || '/icon.png'
        });
      } catch (e) {
        console.warn('Native notification blocked or failed:', e);
      }
    }
  };

  const handleEditTask = (id: string, updated: Partial<Task>) => {
    const oldTask = tasksRef.current.find(t => t.id === id);
    if (updated.status === 'completed' && oldTask?.status !== 'completed') {
      if (settings.soundEnabled !== false && settings.soundOnComplete !== false) {
        playNotificationSound('success', settings.soundVolume ?? 80);
      }
      if (settings.nativeNotificationsEnabled !== false && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('✅ มรดกความสำเร็จ! งานเสร็จสิ้น', {
            body: `งาน: "${oldTask?.title || ''}" ได้รับทำเครื่องหมายว่าเสร็จสมบูรณ์เรียบร้อย ยอดเยี่ยมมากครับ!`,
            icon: settings.appLogoUrl || '/icon.png'
          });
        } catch (e) {
          console.warn('Native notification blocked or failed:', e);
        }
      }
    }
    const updatedTasks = tasksRef.current.map(t => t.id === id ? { ...t, ...updated } : t);
    syncTasks(updatedTasks);
  };

  const handleDeleteTask = (id: string) => {
    const filtered = tasksRef.current.filter(t => t.id !== id);
    syncTasks(filtered);
  };

  const handleDeleteTasks = (ids: string[]) => {
    const filtered = tasksRef.current.filter(t => !ids.includes(t.id));
    syncTasks(filtered);
  };

  const handleDeleteAllCompleted = () => {
    const filtered = tasksRef.current.filter(t => t.status !== 'completed');
    syncTasks(filtered);
  };

  // 4. Expense Handlers
  const handleAddExpense = (newExpData: Omit<Expense, 'id'>) => {
    const created: Expense = {
      ...newExpData,
      id: 'exp_' + Date.now() + '_' + Math.floor(Math.random() * 9999)
    };
    syncExpenses([...expensesRef.current, created]);
    if (settings.soundEnabled !== false && settings.soundOnAdd !== false) {
      playNotificationSound('pop', settings.soundVolume ?? 80);
    }
    if (settings.nativeNotificationsEnabled !== false && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('💰 บันทึกบัญชีรายจ่ายใหม่', {
          body: `รายการ: "${created.name}"\nจำนวนเงิน: ${created.amount.toLocaleString('th-TH')} บาท [หมวดหมู่: ${created.cat || 'ทั่วไป'}]`,
          icon: settings.appLogoUrl || '/icon.png'
        });
      } catch (e) {
        console.warn('Native notification blocked or failed:', e);
      }
    }
  };

  const handleEditExpense = (id: string, updated: Partial<Expense>) => {
    const oldExp = expensesRef.current.find(e => e.id === id);
    if (updated.paid === true && oldExp?.paid !== true) {
      if (settings.soundEnabled !== false && settings.soundOnComplete !== false) {
        playNotificationSound('success', settings.soundVolume ?? 80);
      }
      if (settings.nativeNotificationsEnabled !== false && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('💵 ชำระเงินค่าใช้จ่ายสำเร็จ', {
            body: `รายการ: "${oldExp?.name || ''}" ได้รับการบันทึกสถานะว่าชำระแล้ว ยอดรวม ${oldExp?.amount.toLocaleString('th-TH')} บาท`,
            icon: settings.appLogoUrl || '/icon.png'
          });
        } catch (e) {
          console.warn('Native notification blocked or failed:', e);
        }
      }
    }
    const updatedExps = expensesRef.current.map(e => e.id === id ? { ...e, ...updated } : e);
    syncExpenses(updatedExps);
  };

  const handleDeleteExpense = (id: string) => {
    const filtered = expensesRef.current.filter(e => e.id !== id);
    syncExpenses(filtered);
  };

  // AI Actions dispatcher
  const handleExecuteAiActions = (actions: any[]) => {
    if (!actions || !Array.isArray(actions)) return;

    actions.forEach(action => {
      try {
        const { type, payload } = action;
        if (!payload) return;

        switch (type) {
          case 'add_task': {
            handleAddTask({
              title: payload.title || 'งานด่วนจากเลขา AI',
              desc: payload.desc || '',
              category: payload.category || settings.categories[0] || '💼 งานทั่วไป',
              dueDate: payload.dueDate || getThailandTodayStr(),
              dueTime: payload.dueTime || '',
              status: 'pending',
              userId: sessionUser.userId
            });
            break;
          }
          case 'delete_task': {
            if (payload.id) {
              handleDeleteTask(payload.id);
            }
            break;
          }
          case 'update_task': {
            if (payload.id) {
              const { id, ...rest } = payload;
              handleEditTask(id, rest);
            }
            break;
          }
          case 'add_expense': {
            handleAddExpense({
              name: payload.name || 'ค่าใช้จ่ายจดโดยเลขา AI',
              amount: Number(payload.amount) || 0,
              cat: payload.cat || '🍔 อาหาร',
              date: payload.date || getThailandTodayStr(),
              dueDate: payload.dueDate || getThailandTodayStr(),
              note: payload.note || '',
              paid: payload.paid === true,
              userId: sessionUser.userId
            });
            break;
          }
          case 'delete_expense': {
            if (payload.id) {
              handleDeleteExpense(payload.id);
            }
            break;
          }
          case 'update_expense': {
            if (payload.id) {
              const { id, ...rest } = payload;
              handleEditExpense(id, rest);
            }
            break;
          }
          case 'update_settings': {
            const updatedSettings = {
              ...settings,
              ...payload
            };
            syncSettings(updatedSettings);
            break;
          }
          default:
            console.warn('Unknown AI Action Type:', type);
        }
      } catch (e) {
        console.error('Error executing AI action:', e, action);
      }
    });
  };

  // 5. Settings Tab Handlers
  const handleAddCategoryOnTheFly = (cat: string) => {
    const trimmed = cat.trim();
    if (!trimmed) return;
    if (settings.categories.includes(trimmed)) return;
    const updatedCats = [...settings.categories, trimmed];
    syncSettings({ ...settings, categories: updatedCats });
  };

  const handleAddExpenseCategoryOnTheFly = (cat: string) => {
    const trimmed = cat.trim();
    if (!trimmed) return;
    const currentExpenseCats = settings.expenseCategories || DEFAULT_EXPENSE_CATEGORIES;
    if (currentExpenseCats.includes(trimmed)) return;
    const updatedCats = [...currentExpenseCats, trimmed];
    syncSettings({ ...settings, expenseCategories: updatedCats });
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

    const baseToUse = tempSettings || settings;
    const currentCustomLinks = baseToUse.customMenuLinks || [];
    let updatedLinks = [];

    if (editingLinkId) {
      // Edit mode
      updatedLinks = currentCustomLinks.map(link => {
        if (link.id === editingLinkId) {
          return {
            ...link,
            title,
            url,
            iconName: newLinkIcon,
            visibility: newLinkVisibility,
            allowedUsers: newLinkVisibility === 'specific' ? newLinkAllowedUsers : [],
            openDirectly: newLinkOpenDirectly
          };
        }
        return link;
      });
      setEditingLinkId(null);
      await showAlert('แก้ไขลิงก์เมนูเชื่อมระบบเรียบร้อยแล้วค่ะ', 'สำเร็จ', 'success');
    } else {
      // Add mode
      const newLink = {
        id: '' + Date.now() + '_' + Math.floor(Math.random() * 999),
        title,
        url,
        iconName: newLinkIcon,
        visibility: newLinkVisibility,
        allowedUsers: newLinkVisibility === 'specific' ? newLinkAllowedUsers : [],
        openDirectly: newLinkOpenDirectly
      };
      updatedLinks = [...currentCustomLinks, newLink];
    }

    if (tempSettings) {
      setTempSettings({ ...tempSettings, customMenuLinks: updatedLinks });
    } else {
      syncSettings({ ...settings, customMenuLinks: updatedLinks });
    }

    setNewLinkTitle('');
    setNewLinkUrl('');
    setNewLinkIcon('Link');
    setNewLinkVisibility('all');
    setNewLinkAllowedUsers([]);
    setNewLinkOpenDirectly(false);
  };

  const handleEditMenuLinkStart = (id: string) => {
    const baseToUse = tempSettings || settings;
    const link = (baseToUse.customMenuLinks || []).find(l => l.id === id);
    if (link) {
      setEditingLinkId(id);
      setNewLinkTitle(link.title);
      setNewLinkUrl(link.url);
      setNewLinkIcon(link.iconName || 'Link');
      setNewLinkVisibility(link.visibility || 'all');
      setNewLinkAllowedUsers(link.allowedUsers || []);
      setNewLinkOpenDirectly(!!link.openDirectly);
    }
  };

  const handleCancelEditMenuLink = () => {
    setEditingLinkId(null);
    setNewLinkTitle('');
    setNewLinkUrl('');
    setNewLinkIcon('Link');
    setNewLinkVisibility('all');
    setNewLinkAllowedUsers([]);
    setNewLinkOpenDirectly(false);
  };

  const handleRemoveMenuLink = async (id: string) => {
    const isConfirmed = await showConfirm(
      'คุณต้องการนำลิงก์เมนูนี้ออกจากรายการนำทางของแถบเครื่องมือด้านข้างใช่หรือไม่?',
      'ลบลิงก์ภายนอก',
      'danger'
    );
    if (isConfirmed) {
      const baseToUse = tempSettings || settings;
      const updatedLinks = (baseToUse.customMenuLinks || []).filter(l => l.id !== id);
      if (tempSettings) {
        setTempSettings({ ...tempSettings, customMenuLinks: updatedLinks });
      } else {
        syncSettings({ ...settings, customMenuLinks: updatedLinks });
        if (activeTab === `link_${id}`) {
          setActiveTab('tasks');
        }
      }
    }
  };

  const moveMenuLinkUp = (index: number) => {
    if (index === 0) return;
    const baseToUse = tempSettings || settings;
    const links = [...(baseToUse.customMenuLinks || [])];
    const temp = links[index];
    links[index] = links[index - 1];
    links[index - 1] = temp;
    if (tempSettings) {
      setTempSettings({ ...tempSettings, customMenuLinks: links });
    } else {
      syncSettings({ ...settings, customMenuLinks: links });
    }
  };

  const moveMenuLinkDown = (index: number) => {
    const baseToUse = tempSettings || settings;
    const links = [...(baseToUse.customMenuLinks || [])];
    if (index === links.length - 1) return;
    const temp = links[index];
    links[index] = links[index + 1];
    links[index + 1] = temp;
    if (tempSettings) {
      setTempSettings({ ...tempSettings, customMenuLinks: links });
    } else {
      syncSettings({ ...settings, customMenuLinks: links });
    }
  };

  // Announcement Helpers
  const handleSaveAnnouncement = async () => {
    const title = newAnnounceTitle.trim();
    const content = newAnnounceContent.trim();
    let imageUrl = newAnnounceImage.trim();

    if (!title || !content) {
      await showAlert('กรุณากรอกหัวข้อและเนื้อหาประกาศที่ต้องการสื่อสารให้ครบถ้วน', 'ข้อมูลไม่ครบ', 'warning');
      return;
    }

    const currentAnnouncements = settings.announcements || [];

    if (editingAnnounceId) {
      // Edit mode
      const updated = currentAnnouncements.map(ann => {
        if (ann.id === editingAnnounceId) {
          return {
            ...ann,
            title,
            content,
            imageUrl: imageUrl || undefined,
            visibility: newAnnounceVisibility,
            allowedUsers: newAnnounceVisibility === 'specific' ? newAnnounceAllowedUsers : [],
            isActive: ann.isActive
          };
        }
        return ann;
      });
      await syncSettings({ ...settings, announcements: updated });
      setEditingAnnounceId(null);
      await showAlert('แก้ไขประกาศข่าวสารเรียบร้อยแล้วค่ะ', 'สำเร็จ', 'success');
    } else {
      // Add mode
      const newAnn: Announcement = {
        id: 'ann_' + Date.now() + '_' + Math.floor(Math.random() * 999),
        title,
        content,
        imageUrl: imageUrl || undefined,
        visibility: newAnnounceVisibility,
        allowedUsers: newAnnounceVisibility === 'specific' ? newAnnounceAllowedUsers : [],
        createdAt: new Date().toISOString(),
        isActive: true
      };
      const updated = [...currentAnnouncements, newAnn];
      await syncSettings({ ...settings, announcements: updated });
      await showAlert('เพิ่มประกาศข่าวสารใหม่เรียบร้อยแล้วค่ะ', 'สำเร็จ', 'success');
    }

    setNewAnnounceTitle('');
    setNewAnnounceContent('');
    setNewAnnounceImage('');
    setNewAnnounceVisibility('all');
    setNewAnnounceAllowedUsers([]);
  };

  const handleEditAnnounceStart = (id: string) => {
    const currentAnnouncements = settings.announcements || [];
    const ann = currentAnnouncements.find(a => a.id === id);
    if (ann) {
      setEditingAnnounceId(id);
      setNewAnnounceTitle(ann.title);
      setNewAnnounceContent(ann.content);
      setNewAnnounceImage(ann.imageUrl || '');
      setNewAnnounceVisibility(ann.visibility || 'all');
      setNewAnnounceAllowedUsers(ann.allowedUsers || []);
    }
  };

  const handleToggleAnnounceActive = async (id: string) => {
    const currentAnnouncements = settings.announcements || [];
    const updated = currentAnnouncements.map(ann => {
      if (ann.id === id) {
        return { ...ann, isActive: !ann.isActive };
      }
      return ann;
    });
    await syncSettings({ ...settings, announcements: updated });
  };

  const handleCancelEditAnnounce = () => {
    setEditingAnnounceId(null);
    setNewAnnounceTitle('');
    setNewAnnounceContent('');
    setNewAnnounceImage('');
    setNewAnnounceVisibility('all');
    setNewAnnounceAllowedUsers([]);
  };

  const handleRemoveAnnouncement = async (id: string) => {
    const isConfirmed = await showConfirm(
      'คุณต้องการลบประกาศข่าวสารสำคัญนี้ออกจากระบบแบบถาวรใช่หรือไม่?',
      'ยืนยันการลบประกาศ',
      'danger'
    );
    if (isConfirmed) {
      const currentAnnouncements = settings.announcements || [];
      const updated = currentAnnouncements.filter(ann => ann.id !== id);
      await syncSettings({ ...settings, announcements: updated });
    }
  };

  const handleDismissAnnouncement = (id: string) => {
    const updated = [...dismissedAnnouncements, id];
    setDismissedAnnouncements(updated);
    if (sessionUser.userId) {
      localStorage.setItem(`dismissed_announcements_${sessionUser.userId}`, JSON.stringify(updated));
    }
  };

  // 6. Harmonious Color Tuning Engine
  const applyThemePreset = (presetId: string) => {
    const preset = THEME_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    const baseToUse = tempSettings || settings;
    const updated = {
      ...baseToUse,
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
      darkColorBgAppStart: preset.darkColorBgAppStart || '#0f172a',
      darkColorBgAppEnd: preset.darkColorBgAppEnd || '#020617',
      darkColorSidebarBg: preset.darkColorSidebarBg || '#0b0f19',
      bgType: preset.bgType
    };
    if (tempSettings) {
      setTempSettings(updated);
    } else {
      syncSettings(updated);
    }
  };

  const handleAccentColorChangeInput = (color: string) => {
    const baseToUse = tempSettings || settings;
    if (harmoniousMode) {
      // Auto-compute harmonious sub colors
      const hover = getDarkerColor(color, 12);
      const light = getLighterColor(color, 85);
      const darkStart = getDarkToneFromColor(color, 90);
      const darkEnd = getDarkToneFromColor(color, 96);
      
      const updated = {
        ...baseToUse,
        colorAccent: color,
        colorAccentHover: hover,
        colorAccentLight: light,
        colorSidebarActive: color,
        darkColorBgAppStart: darkStart,
        darkColorBgAppEnd: darkEnd,
      };
      if (tempSettings) {
        setTempSettings(updated);
      } else {
        syncSettings(updated);
      }
    } else {
      const updated = { ...baseToUse, colorAccent: color };
      if (tempSettings) {
        setTempSettings(updated);
      } else {
        syncSettings(updated);
      }
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
    const curSettings = (activeTab === 'settings' && tempSettings) ? tempSettings : settings;
    const root = document.documentElement;

    if (curSettings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    root.style.setProperty('--accent', curSettings.colorAccent);
    root.style.setProperty('--accent-hover', curSettings.colorAccentHover);
    root.style.setProperty('--accent-light', curSettings.colorAccentLight);
    root.style.setProperty('--accent-text', curSettings.colorAccentText);
    
    if (curSettings.darkMode && curSettings.darkColorSidebarBg) {
      root.style.setProperty('--sidebar-bg', curSettings.darkColorSidebarBg);
    } else {
      root.style.setProperty('--sidebar-bg', curSettings.colorSidebarBg);
    }

    root.style.setProperty('--sidebar-text', curSettings.colorSidebarText);
    root.style.setProperty('--sidebar-active', curSettings.colorSidebarActive);
  }, [settings, tempSettings, activeTab]);

  // Handle application applet background styles
  const getAppStyleBackground = (): React.CSSProperties => {
    const curSettings = (activeTab === 'settings' && tempSettings) ? tempSettings : settings;
    const isDark = curSettings.darkMode;

    if (curSettings.bgStyle === 'indigo') {
      if (isDark) {
        return { background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #020617 100%)' };
      }
      return { background: 'linear-gradient(135deg, #f0f4ff 0%, #e8edff 50%, #f0e8ff 100%)' };
    } else if (curSettings.bgStyle === 'slate') {
      if (isDark) {
        return { background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)' };
      }
      return { background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' };
    } else if (curSettings.bgStyle === 'custom' && curSettings.customBgUrl) {
      if (isDark) {
        return {
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.85), rgba(2, 6, 23, 0.9)), url('${curSettings.customBgUrl}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        };
      }
      return {
        backgroundImage: `url('${curSettings.customBgUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      };
    } else if (curSettings.bgStyle === 'theme-custom' || !curSettings.bgStyle) {
      if (isDark) {
        const darkStart = curSettings.darkColorBgAppStart || '#0f172a';
        const darkEnd = curSettings.darkColorBgAppEnd || '#020617';
        if (curSettings.bgType === 'gradient') {
          return { background: `linear-gradient(135deg, ${darkStart} 0%, ${darkEnd} 100%)` };
        } else {
          return { backgroundColor: darkStart };
        }
      } else {
        const lightStart = curSettings.colorBgAppStart || '#f8fafc';
        const lightEnd = curSettings.colorBgAppEnd || '#e2e8f0';
        if (curSettings.bgType === 'gradient') {
          return { background: `linear-gradient(135deg, ${lightStart} 0%, ${lightEnd} 100%)` };
        } else {
          return { backgroundColor: lightStart };
        }
      }
    }
    return isDark ? { backgroundColor: '#0f172a' } : { backgroundColor: '#f8fafc' };
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

  // Filter custom links according to targeted user or all users
  const visibleCustomLinks = useMemo(() => {
    const currentUserId = sessionUser.userId;
    if (!currentUserId) return [];

    const sourceLinks = currentUserId === 'admin' 
      ? (settings.customMenuLinks || [])
      : adminCustomLinks;

    return sourceLinks.filter(link => {
      if (currentUserId === 'admin') return true;

      if (!link.visibility || link.visibility === 'all') {
        return true;
      }

      if (link.visibility === 'specific') {
        return link.allowedUsers && link.allowedUsers.includes(currentUserId);
      }

      return false;
    });
  }, [settings.customMenuLinks, adminCustomLinks, sessionUser.userId]);

  // Filter announcements according to targeted user or all users
  const visibleAnnouncements = useMemo(() => {
    const currentUserId = sessionUser.userId;
    if (!currentUserId) return [];

    const sourceAnnouncements = [
      ...(settings.announcements || []),
      ...(adminAnnouncements || []),
      ...(dbAnnouncements || [])
    ];

    const map = new Map<string, Announcement>();
    sourceAnnouncements.forEach(ann => {
      if (ann && ann.id && !map.has(ann.id)) {
        map.set(ann.id, ann);
      }
    });

    const allAnn = Array.from(map.values());

    return allAnn.filter(ann => {
      if (ann.isActive === false) return false;
      if (currentUserId === 'admin') return true;

      if (!ann.visibility || ann.visibility === 'all') {
        return true;
      }
      if (ann.visibility === 'specific') {
        return ann.allowedUsers && ann.allowedUsers.includes(currentUserId);
      }
      return false;
    }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [settings.announcements, adminAnnouncements, dbAnnouncements, sessionUser.userId]);

  const notificationAnnouncements = useMemo(() => {
    return visibleAnnouncements.filter(ann => !dismissedAnnouncements.includes(ann.id));
  }, [visibleAnnouncements, dismissedAnnouncements]);

  const notificationCount = notificationTasks.length + notificationExpenses.length + notificationAnnouncements.length;

  // Auto show announcement modal for any visible active announcement that has not been dismissed
  useEffect(() => {
    if (!isLoggedIn) return;
    const pendingModal = visibleAnnouncements.find(ann => !dismissedAnnouncements.includes(ann.id));
    if (pendingModal) {
      setShowAnnounceModalId(pendingModal.id);
    } else {
      setShowAnnounceModalId(null);
    }
  }, [visibleAnnouncements, dismissedAnnouncements, isLoggedIn]);

  if (!isLoggedIn) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} accentColor={settings.colorAccent} />;
  }

  if (sessionUser.isLocked === true && sessionUser.userId !== 'admin') {
    return (
      <LockedUserView 
        sessionUser={sessionUser}
        accentColor={settings.colorAccent}
        darkMode={settings.darkMode}
        onLogout={handleLogout}
      />
    );
  }

  if (sessionUser.isApproved === false && sessionUser.userId !== 'admin') {
    return (
      <PendingApprovalView 
        sessionUser={sessionUser}
        accentColor={settings.colorAccent}
        darkMode={settings.darkMode}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex text-slate-800 transition-colors duration-200 ${
        ((activeTab === 'settings' && tempSettings) ? tempSettings.darkMode : settings.darkMode) ? 'dark text-slate-200' : ''
      }`}
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
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* LEFT SIDEBAR AREA */}
      <aside
        className={`fixed top-0 bottom-0 left-0 h-screen bg-sidebar-bg text-sidebar-text z-50 flex flex-col overflow-hidden shadow-2xl border-r border-slate-800 transition-all duration-300 ${
          mobileMenuOpen
            ? 'w-[82vw] max-w-[280px] translate-x-0'
            : (sidebarCollapsed ? 'w-16 -translate-x-full lg:translate-x-0' : 'w-60 -translate-x-full lg:translate-x-0')
        }`}
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
            
            {(!sidebarCollapsed || mobileMenuOpen) && (
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="font-extrabold text-[11px] text-slate-100 truncate tracking-tight">
                  {settings.appName}
                </span>
                <span className="text-[9.5px] text-slate-400 truncate mt-0.5 font-medium">
                  {settings.appDesc}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex w-7 h-7 hover:bg-slate-800 text-slate-500 hover:text-slate-200 rounded-md items-center justify-center transition-all cursor-pointer"
            title="พับเก็บหรือกางเมนู"
          >
            <ChevronsLeft className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden w-8 h-8 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg flex items-center justify-center transition-all cursor-pointer"
            title="ปิดเมนู"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menus tabs */}
        <nav className="flex-1 p-2 space-y-1 py-4 overflow-y-auto">
          {(!sidebarCollapsed || mobileMenuOpen) && (
            <div className="px-3 text-[9.5px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
              ระบบวางแผนหลัก
            </div>
          )}

          <button
            onClick={() => { setActiveTab('tasks'); setMobileMenuOpen(false); }}
            className={`w-full h-11 px-3 rounded-xl flex items-center gap-3 font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-slate-800 text-white border-l-[3px]'
                : 'hover:bg-slate-800'
            }`}
            style={activeTab === 'tasks' ? { borderLeftColor: settings.colorAccent } : {}}
          >
            <CheckSquare className="w-4.5 h-4.5 flex-shrink-0" />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>รายการงานทั้งหมด</span>}
          </button>

          <button
            onClick={() => { setActiveTab('expenses'); setMobileMenuOpen(false); }}
            className={`w-full h-11 px-3 rounded-xl flex items-center gap-3 font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-slate-800 text-white border-l-[3px]'
                : 'hover:bg-slate-800'
            }`}
            style={activeTab === 'expenses' ? { borderLeftColor: settings.colorAccent } : {}}
          >
            <Receipt className="w-4.5 h-4.5 flex-shrink-0" />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>จัดการเงินค่าใช้จ่าย</span>}
          </button>

          <button
            onClick={() => { setActiveTab('localFiles'); setMobileMenuOpen(false); }}
            className={`w-full h-11 px-3 rounded-xl flex items-center gap-3 font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'localFiles'
                ? 'bg-slate-800 text-white border-l-[3px]'
                : 'hover:bg-slate-800'
            }`}
            style={activeTab === 'localFiles' ? { borderLeftColor: settings.colorAccent } : {}}
          >
            <FolderOpen className="w-4.5 h-4.5 flex-shrink-0" />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>เปิดไฟล์ & มีเดียท้องถิ่น</span>}
          </button>

          <button
            onClick={() => { setActiveTab('dekaSearch'); setMobileMenuOpen(false); }}
            className={`w-full h-11 px-3 rounded-xl flex items-center gap-3 font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'dekaSearch'
                ? 'bg-slate-800 text-white border-l-[3px]'
                : 'hover:bg-slate-800'
            }`}
            style={activeTab === 'dekaSearch' ? { borderLeftColor: settings.colorAccent } : {}}
          >
            <Scale className="w-4.5 h-4.5 flex-shrink-0 text-amber-500" />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>สืบค้นฎีกา</span>}
          </button>

          <button
            onClick={() => { setActiveTab('formDocument'); setMobileMenuOpen(false); }}
            className={`w-full h-11 px-3 rounded-xl flex items-center gap-3 font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'formDocument'
                ? 'bg-slate-800 text-white border-l-[3px]'
                : 'hover:bg-slate-800'
            }`}
            style={activeTab === 'formDocument' ? { borderLeftColor: settings.colorAccent } : {}}
          >
            <FileText className="w-4.5 h-4.5 flex-shrink-0 text-amber-500" />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>ออกเอกสารแบบฟอร์ม</span>}
          </button>

          <button
            onClick={() => { setActiveTab('receipt'); setMobileMenuOpen(false); }}
            className={`w-full h-11 px-3 rounded-xl flex items-center gap-3 font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'receipt'
                ? 'bg-slate-800 text-white border-l-[3px]'
                : 'hover:bg-slate-800'
            }`}
            style={activeTab === 'receipt' ? { borderLeftColor: settings.colorAccent } : {}}
          >
            <Receipt className="w-4.5 h-4.5 flex-shrink-0 text-emerald-400" />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>ออกใบเสร็จรับเงิน</span>}
          </button>

          {/* Inline custom menu links - Opens directly in a new tab */}
          {visibleCustomLinks.map((link) => {
            const IconComponent = getCustomLinkIconComponent(link.iconName || 'Link');
            return (
              <button
                key={link.id}
                onClick={() => { 
                  const sanitizedUrl = sanitizeUrl(link.url);
                  window.open(sanitizedUrl, '_blank', 'noopener,noreferrer');
                  setMobileMenuOpen(false); 
                }}
                className="w-full h-11 px-3 rounded-xl flex items-center gap-3 font-semibold text-xs transition-all text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
                title={`${link.title} (เปิดในแท็บใหม่)`}
              >
                <IconComponent className="w-4.5 h-4.5 flex-shrink-0 text-slate-400 group-hover:text-white" />
                {(!sidebarCollapsed || mobileMenuOpen) && <span className="truncate">{link.title}</span>}
                {(!sidebarCollapsed || mobileMenuOpen) && <ExternalLink className="w-3.5 h-3.5 ml-auto text-slate-500 opacity-60 flex-shrink-0" />}
              </button>
            );
          })}

          {(!sidebarCollapsed || mobileMenuOpen) && (
            <div className="px-3 pt-6 text-[9.5px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
              การจัดการระบบ
            </div>
          )}

          {(sessionUser.userId === 'admin' || sessionUser.isAssistant === true) && (
            <button
              onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
              className={`w-full h-11 px-3 rounded-xl flex items-center gap-3 font-semibold text-xs transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-slate-800 text-white border-l-[3px]'
                  : 'hover:bg-slate-800'
              }`}
              style={activeTab === 'admin' ? { borderLeftColor: settings.colorAccent } : {}}
            >
              <Shield className="w-4.5 h-4.5 flex-shrink-0 text-amber-500" />
              {(!sidebarCollapsed || mobileMenuOpen) && (
                <span>
                  {sessionUser.userId === 'admin' ? '👑 แดชบอร์ดแอดมิน' : '🛡️ แดชบอร์ดผู้ช่วย'}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
            className={`w-full h-11 px-3 rounded-xl flex items-center gap-3 font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-slate-800 text-white border-l-[3px]'
                : 'hover:bg-slate-800'
            }`}
            style={activeTab === 'settings' ? { borderLeftColor: settings.colorAccent } : {}}
          >
            <SettingsIcon className="w-4.5 h-4.5 flex-shrink-0" />
            {(!sidebarCollapsed || mobileMenuOpen) && <span>ตกแต่ง & ตั้งค่ารวม</span>}
          </button>

          {/* Quick PWA App Installation button in sidebar */}
          <button
            onClick={() => { setShowInstallAppModal(true); setMobileMenuOpen(false); }}
            className="w-full h-11 px-3 rounded-xl flex items-center gap-3 font-semibold text-xs transition-all text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 cursor-pointer group"
            title="ติดตั้ง TaskFlow Pro เป็นแอปพลิเคชัน (Add to Home Screen / PWA)"
          >
            <Smartphone className="w-4.5 h-4.5 flex-shrink-0 text-indigo-400 group-hover:scale-110 transition-transform" />
            {(!sidebarCollapsed || mobileMenuOpen) && (
              <span className="flex items-center gap-1.5">
                <span>ติดตั้งเป็นแอป</span>
                <span className="text-[9px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded-md font-bold uppercase">PWA</span>
              </span>
            )}
          </button>
        </nav>

        {/* Sidebar Footer account section */}
        <div className="p-2 border-t border-slate-800 flex-shrink-0 bg-slate-900/30">
          {/* User Profile visual badge */}
          <div 
            onClick={() => setShowEditProfileModal(true)}
            className={`p-2 rounded-xl mb-2 flex items-center gap-2.5 bg-slate-900/60 hover:bg-slate-850 cursor-pointer border border-slate-800/40 overflow-hidden active:scale-[0.98] transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}
            title="คลิกเพื่อแก้ไขข้อมูลส่วนตัว & รูปโปรไฟล์"
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs text-white select-none flex-shrink-0 shadow-inner overflow-hidden bg-slate-705 relative group"
              style={!sessionUser.avatarUrl ? { backgroundColor: settings.colorAccent } : {}}
            >
              {sessionUser.avatarUrl ? (
                <img src={sessionUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover animate-fade-in" referrerPolicy="no-referrer" />
              ) : (
                <span>{sessionUser.displayName ? sessionUser.displayName.charAt(0).toUpperCase() : (sessionUser.userId ? sessionUser.userId.charAt(0).toUpperCase() : 'U')}</span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] transition-opacity font-bold">
                แก้ไข
              </div>
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-black text-slate-100 truncate flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{sessionUser.displayName || sessionUser.userId}</span>
                </div>
                <div className="text-[9px] text-slate-500 font-medium truncate" title={sessionUser.email || sessionUser.phone || 'บัญชีผู้ใช้'}>
                  {sessionUser.email || sessionUser.phone || 'บัญชีระยะไกล'}
                </div>
                <div 
                  className="flex items-center gap-1 mt-0.5 select-none leading-none cursor-pointer hover:opacity-80 inline-flex"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!isCloudSynced) {
                      showAlert("ระบบกำลังตรวจสอบการซิงก์ผลลัพธ์ในเครื่องขึ้นเซิร์ฟเวอร์ออนไลน์โดยตรงให้ทันทีค่ะ...", "ประสานระบบข้อมูลออนไลน์", "info");
                      try {
                        const uid = currentViewUserId || localStorage.getItem('sess_userId');
                        if (uid) {
                          await forcePushLocalToCloud(currentViewUserId, uid);
                          setIsCloudSynced(true);
                          showAlert("🚀 เชื่อมโยงและบันทึกประวัติไปยังเซิร์ฟเวอร์แบบออนไลน์ 100% เรียบร้อยแล้วค่ะ! ข้อมูลของคุณจะเข้าสู่ระบบออนไลน์แบบเรียลไทม์ทันที", "ระบบออนไลน์ 100%", "success");
                        }
                      } catch (e: any) {
                        showAlert("ไม่สามารถเชื่อมต่อประสานระบบแมนนวลได้ในขณะนี้: " + (e.message || String(e)), "ผิดพลาด", "error");
                      }
                    } else {
                      showAlert("ระบบฐานข้อมูลทำงานได้สมบูรณ์แบบ 100% เชื่อมต่อและบันทึกข้อมูลออนไลน์โดยตรงแบบเรียลไทม์แล้วค่ะ", "บันทึกออนไลน์ 100%", "success");
                    }
                  }}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isCloudSynced ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
                  <span className={`text-[8px] font-extrabold ${isCloudSynced ? 'text-emerald-400' : 'text-amber-500'}`}>
                    {isCloudSynced ? '☁️ บันทึกออนไลน์ 100%' : '🔄 กำลังเชื่อมต่อระบบ...'}
                  </span>
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
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 relative ${
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-60'
        }`}
      >
        {headerCollapsed && (
          <div className="sticky top-0 z-40 h-0 flex justify-end px-4 lg:px-8 pointer-events-none">
            <button
              onClick={() => handleSetHeaderCollapsed(false)}
              className="mt-3 w-10 h-10 border border-slate-200 text-slate-500 bg-white/95 hover:bg-white dark:bg-slate-950/95 dark:border-slate-800 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all active:scale-95 pointer-events-auto cursor-pointer"
              title="แสดงแถบเมนูหลักด้านบน"
            >
              <ArrowDown className="w-4 h-4 animate-bounce" style={{ animationDuration: '3s' }} />
            </button>
          </div>
        )}

        {/* UPPER RESPONSIVE APP HEADER */}
        <header className={`border-b border-slate-200/85 px-2.5 sm:px-4 lg:px-8 flex items-center justify-between bg-white/70 backdrop-blur-md sticky top-0 z-30 dark:bg-slate-900/80 dark:border-slate-800 transition-all duration-300 ${
          headerCollapsed ? 'h-0 py-0 border-b-0 opacity-0 pointer-events-none overflow-hidden' : 'min-h-[3.75rem] h-auto py-1.5 sm:py-0'
        }`}>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-100 flex-shrink-0 cursor-pointer active:scale-95"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar py-0.5 max-w-[calc(100vw-3.5rem)] sm:max-w-none">
            {/* Live Chat Help Desk Support Widget */}
            <HeaderChatWidget
              sessionUser={sessionUser}
              accentColor={settings.colorAccent}
              darkMode={settings.darkMode}
            />

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

              {showNotificationFlyout && (
                <>
                  {/* Backdrop overlay to close when clicking outside */}
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setShowNotificationFlyout(false)} 
                  />
                  <div className="fixed inset-x-3 top-16 max-h-[85vh] sm:max-h-none sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden dark:bg-slate-900 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 flex flex-col">
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

                    {/* Content area */}
                    <div className="max-h-96 overflow-y-auto p-4 space-y-4 dark:bg-slate-900">
                      {notificationCount === 0 ? (
                        <div className="p-8 text-center text-slate-400 dark:text-slate-550 text-xs">
                          ✨ ไม่มีรายการแจ้งเตือนค้างจัดทำหรือข่าวสารใหม่ค่ะ
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* List Announcements */}
                          {visibleAnnouncements.length > 0 && (
                            <div className="space-y-2 text-left">
                              <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">
                                  📢 ข่าวสารประชาสัมพันธ์ ({notificationAnnouncements.length} ใหม่)
                                </span>
                                {notificationAnnouncements.length > 0 && (
                                  <button
                                    onClick={() => {
                                      const allIds = notificationAnnouncements.map(a => a.id);
                                      const updated = Array.from(new Set([...dismissedAnnouncements, ...allIds]));
                                      setDismissedAnnouncements(updated);
                                      if (sessionUser.userId) {
                                        localStorage.setItem(`dismissed_announcements_${sessionUser.userId}`, JSON.stringify(updated));
                                      }
                                    }}
                                    className="text-[9.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                  >
                                    อ่านทั้งหมดแล้ว
                                  </button>
                                )}
                              </div>
                              <div className="space-y-2">
                                {visibleAnnouncements.slice(0, 5).map(ann => {
                                  const isUnread = !dismissedAnnouncements.includes(ann.id);
                                  return (
                                    <div 
                                      key={ann.id} 
                                      onClick={() => {
                                        setShowNotificationFlyout(false);
                                        setShowAnnounceModalId(ann.id);
                                      }}
                                      className={`group p-3 rounded-xl border cursor-pointer transition-all duration-200 flex items-start gap-3 relative shadow-xs hover:shadow-md border-l-4 ${
                                        isUnread 
                                          ? 'bg-indigo-50/80 hover:bg-indigo-100/70 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 border-indigo-200 dark:border-indigo-800 border-l-indigo-500' 
                                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/30 dark:hover:bg-slate-900/40 border-slate-100 dark:border-slate-800 border-l-slate-300'
                                      }`}
                                    >
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${
                                        isUnread ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 font-bold' : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                                      }`}>
                                        📢
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span className={`text-xs font-bold leading-snug line-clamp-1 transition-colors ${
                                            isUnread ? 'text-indigo-950 dark:text-indigo-100 font-black' : 'text-slate-700 dark:text-slate-300'
                                          }`}>
                                            {ann.title}
                                          </span>
                                          {isUnread && (
                                            <span className="text-[8px] font-black bg-rose-500 text-white px-1.5 py-0.2 rounded-full uppercase shrink-0 animate-pulse">
                                              ใหม่
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                                          {ann.content}
                                        </p>
                                        <div className="flex items-center justify-between mt-1.5">
                                          <span className="text-[9px] text-slate-400 font-medium">
                                            {new Date(ann.createdAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} น.
                                          </span>
                                          <span className="text-[9.5px] font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                                            เปิดอ่านป๊อบอัพ →
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {/* List Tasks */}
                          {notificationTasks.length > 0 && (
                            <div className="space-y-2 text-left">
                              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block px-1">📋 ภารกิจเร่งด่วน/ค้างทำ ({notificationTasks.length})</span>
                              <div className="space-y-2">
                                {notificationTasks.map(t => (
                                  <div 
                                    key={t.id} 
                                    onClick={() => {
                                      setActiveTab('tasks');
                                      setShowNotificationFlyout(false);
                                      setTimeout(() => {
                                        window.dispatchEvent(new CustomEvent('focus-task', { detail: { taskId: t.id } }));
                                      }, 300);
                                    }}
                                    className="group p-3 bg-slate-50 hover:bg-rose-500/5 dark:bg-slate-950/40 dark:hover:bg-rose-950/20 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-rose-500/30 dark:hover:border-rose-950/50 cursor-pointer transition-all duration-200 flex items-start gap-3 relative shadow-xs hover:shadow-md border-l-4 border-l-rose-500"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-500 flex-shrink-0 group-hover:scale-110 transition-transform">
                                      <CheckSquare className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                                        {t.title}
                                      </span>
                                      <div className="flex flex-wrap gap-1.5 mt-2">
                                        <span className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                                          📁 {t.category}
                                        </span>
                                        <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center gap-1">
                                          <Clock className="w-2.5 h-2.5" /> กำหนด: {t.dueDate}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity pr-1 text-rose-500 font-bold text-sm">
                                      →
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* List Expenses */}
                          {notificationExpenses.length > 0 && (
                            <div className="space-y-2 text-left">
                              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block px-1">💰 บิลที่ถึงกำหนดชำระ ({notificationExpenses.length})</span>
                              <div className="space-y-2">
                                {notificationExpenses.map(e => (
                                  <div 
                                    key={e.id} 
                                    onClick={() => {
                                      setActiveTab('expenses');
                                      setShowNotificationFlyout(false);
                                      setTimeout(() => {
                                        window.dispatchEvent(new CustomEvent('focus-expense', { detail: { expenseId: e.id } }));
                                      }, 300);
                                    }}
                                    className="group p-3 bg-slate-50 hover:bg-amber-500/5 dark:bg-slate-950/40 dark:hover:bg-amber-950/20 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-amber-500/30 dark:hover:border-amber-950/50 cursor-pointer transition-all duration-200 flex items-start gap-3 relative shadow-xs hover:shadow-md border-l-4 border-l-amber-500"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-500 flex-shrink-0 group-hover:scale-110 transition-transform">
                                      <Receipt className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                        {e.title}
                                      </span>
                                      <div className="flex flex-wrap gap-1.5 mt-2">
                                        <span className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                                          🏷️ {e.cat}
                                        </span>
                                        <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center gap-1">
                                          💵 ฿{e.amount.toLocaleString()}
                                        </span>
                                        <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center gap-1">
                                          📅 กำหนด: {e.dueDate}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity pr-1 text-amber-500 font-bold text-sm">
                                      →
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
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

            {/* Calendar Menu next to Personal Notes */}
            <div className="flex items-center">
              {/* Calendar Button */}
              <button
                onClick={() => setActiveTab('calendar')}
                className={`w-10 h-10 border rounded-xl flex items-center justify-center transition-all relative dark:border-slate-800 cursor-pointer ${
                  activeTab === 'calendar'
                    ? 'text-white shadow-sm'
                    : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 hover:text-slate-700'
                }`}
                style={activeTab === 'calendar' ? { backgroundColor: settings.colorAccent, borderColor: settings.colorAccent } : {}}
                title="ปฏิทินงาน/ค่าใช้จ่าย"
                id="header-calendar-btn"
              >
                <CalendarIcon className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Notes Widget */}
            <NotesWidget
              sessionUser={sessionUser}
              accentColor={settings.colorAccent}
              darkMode={settings.darkMode}
            />

            {/* Quick Install App Button */}
            <AppInstallButton
              accentColor={settings.colorAccent}
              onClick={() => setShowInstallAppModal(true)}
            />

            {/* Quick Dark Mode / Light Mode Toggle Button */}
            <button
              onClick={() => {
                const newDark = !settings.darkMode;
                const updated = { ...settings, darkMode: newDark };
                setSettings(updated);
                if (tempSettings) setTempSettings({ ...tempSettings, darkMode: newDark });
                syncSettings(updated);
              }}
              className={`w-10 h-10 border rounded-xl flex items-center justify-center transition-all relative cursor-pointer active:scale-95 shadow-xs ${
                settings.darkMode
                  ? 'bg-slate-900 border-slate-700 text-amber-400 hover:text-amber-300 hover:bg-slate-850'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
              }`}
              title={settings.darkMode ? "สลับเป็นโหมดสว่าง (Light Mode)" : "สลับเป็นโหมดมืด (Dark Mode)"}
            >
              {settings.darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Connection Status Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-extrabold shadow-sm transition-all duration-300 ${
              isOnline 
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/60 dark:text-emerald-400' 
                : 'bg-amber-50/80 border-amber-200 text-amber-850 dark:bg-amber-950/20 dark:border-amber-900/60 dark:text-amber-400 animate-pulse'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
              <span className="hidden xs:inline">
                {isOnline ? 'เชื่อมต่อระบบแล้ว' : 'เซฟในเครื่องปลอดภัย'}
              </span>
              <span className="inline xs:hidden">
                {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
              </span>
            </div>

            {/* Clock Widget */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-3.5 py-1.5 font-mono text-[10.5px] font-bold text-slate-500 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 animate-pulse text-slate-400" />
              <span>{currentTime || '00:00:00'} น.</span>
            </div>

            {/* Header User Profile Badge */}
            <div 
              onClick={() => setShowEditProfileModal(true)}
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl px-2.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer transition-all"
              title="คลิกเพื่อแก้ไขข้อมูลส่วนตัว & รูปโปรไฟล์"
            >
              <div 
                className="w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs text-white select-none shadow-sm flex-shrink-0 overflow-hidden bg-slate-700 relative group"
                style={!sessionUser.avatarUrl ? { backgroundColor: settings.colorAccent } : {}}
              >
                {sessionUser.avatarUrl ? (
                  <img src={sessionUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover animate-fade-in" referrerPolicy="no-referrer" />
                ) : (
                  <span>{sessionUser.displayName ? sessionUser.displayName.charAt(0).toUpperCase() : (sessionUser.userId ? sessionUser.userId.charAt(0).toUpperCase() : 'U')}</span>
                )}
              </div>
              <div className="hidden md:block text-left min-w-0 pr-1.5">
                <span className="block text-[10.5px] font-extrabold text-slate-700 dark:text-slate-300 leading-tight">
                  {sessionUser.displayName || sessionUser.userId}
                </span>
                <span className="block text-[9px] text-slate-400 font-medium leading-none truncate max-w-[100px]">
                  {sessionUser.email || sessionUser.phone || 'บัญชีผู้ใช้'}
                </span>
                <div 
                  className="flex items-center gap-1 mt-0.5 select-none leading-none cursor-pointer hover:opacity-85"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!isCloudSynced) {
                      showAlert("ระบบกำลังตรวจสอบการซิงก์ผลลัพธ์ในเครื่องขึ้นเซิร์ฟเวอร์ออนไลน์โดยตรงให้ทันทีค่ะ...", "ประสานระบบข้อมูลออนไลน์", "info");
                      try {
                        const uid = currentViewUserId || localStorage.getItem('sess_userId');
                        if (uid) {
                          await forcePushLocalToCloud(currentViewUserId, uid);
                          setIsCloudSynced(true);
                          showAlert("🚀 เชื่อมโยงและบันทึกประวัติไปยังเซิร์ฟเวอร์แบบออนไลน์ 100% เรียบร้อยแล้วค่ะ! ข้อมูลของคุณจะเข้าสู่ระบบออนไลน์แบบเรียลไทม์ทันที", "ระบบออนไลน์ 100%", "success");
                        }
                      } catch (e: any) {
                        showAlert("ไม่สามารถเชื่อมต่อประสานระบบแมนนวลได้ในขณะนี้: " + (e.message || String(e)), "ผิดพลาด", "error");
                      }
                    } else {
                      showAlert("ระบบฐานข้อมูลทำงานได้สมบูรณ์แบบ 100% เชื่อมต่อและบันทึกข้อมูลออนไลน์โดยตรงแบบเรียลไทม์แล้วค่ะ", "บันทึกออนไลน์ 100%", "success");
                    }
                  }}
                >
                  <span className={`w-1 h-1 rounded-full ${isCloudSynced ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
                  <span className={`text-[7.5px] font-extrabold ${isCloudSynced ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {isCloudSynced ? '☁️ ออนไลน์ 100%' : '🔄 กำลังเชื่อมต่อ...'}
                  </span>
                </div>
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

        {/* PRIMARY WINDOW CONTENT VIEW */}
        <main className={activeTab.startsWith('link_') ? "flex-1 w-full h-[calc(100vh-4rem)] overflow-hidden" : "p-2.5 sm:p-4 lg:p-8 flex-1 max-w-7xl w-full mx-auto pb-28 sm:pb-16 min-w-0"}>
          {activeTab.startsWith('link_') && (() => {
            const linkId = activeTab.replace('link_', '');
            const targetLink = visibleCustomLinks?.find(l => l.id === linkId);
            if (!targetLink) {
              return (
                <div className="p-8 text-center animate-fade-in">
                  <p className="text-xs text-slate-500 font-bold">ไม่พบหน้าเว็บลิงก์เชื่อมโยงที่กำหนด</p>
                </div>
              );
            }

            const sanitizedUrl = sanitizeUrl(targetLink.url);
            const isRestricted = isFrameRestricted(sanitizedUrl) || targetLink.openDirectly;

            return (
              <div 
                className="flex flex-col w-full h-full overflow-hidden relative"
                id="custom-link-viewport"
              >
                {/* Header controls for Custom Link */}
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 gap-3 flex-shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => {
                        setActiveTab('tasks');
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-[10px] font-black rounded-lg shadow-sm flex items-center gap-1.5 flex-shrink-0 transition-all hover:scale-105 active:scale-95"
                      title="ย้อนกลับมาหน้าแดชบอร์ดหลักของระบบ"
                    >
                      🏠 กลับหน้าหลักระบบ
                    </button>
                    <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
                    <Link className="w-4 h-4 flex-shrink-0" style={{ color: settings.colorAccent }} />
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{targetLink.title}</span>
                    <span className="text-[10px] font-mono text-slate-400 truncate max-w-[150px] sm:max-w-xs">{sanitizedUrl}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    {!isRestricted && (
                      <>
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
                            if (iframe) iframe.src = sanitizedUrl;
                          }}
                          className="hover:underline text-[10px] font-black flex items-center gap-1 flex-shrink-0"
                          style={{ color: settings.colorAccent }}
                          title="เริ่มใหม่"
                        >
                          🔄 เริ่มใหม่
                        </button>
                      </>
                    )}

                    <button 
                      onClick={() => {
                        window.open(sanitizedUrl, '_blank', 'noopener,noreferrer');
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

                {/* HELP BANNER FOR IFRAME LOAD ISSUES / FALLBACK */}
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between gap-2 text-slate-700 dark:text-slate-300 flex-shrink-0">
                  <span className="text-[10px] font-medium leading-relaxed">
                    💡 <strong>คำแนะนำ:</strong> หากหน้าเว็บไม่แสดงผล หน้าจอว่างเปล่า หรือต้องการแสดงผลเต็มรูปแบบ (เช่น {targetLink.title}) แนะนำให้ใช้ปุ่ม <strong>เปิดในแท็บใหม่</strong> เพื่อประสิทธิภาพสูงสุด 100%
                  </span>
                  <button
                    onClick={() => {
                      setLinkPopupData({
                        url: sanitizedUrl,
                        title: targetLink.title,
                        visible: true
                      });
                      window.open(sanitizedUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 rounded-lg text-[9px] font-bold transition-colors flex-shrink-0"
                  >
                    🌐 เปิดในแท็บใหม่ทันที
                  </button>
                </div>

                {/* MAIN CONTENT AREA FOR THE WEB PAGE */}
                <div className="flex-1 w-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
                  {isRestricted ? (
                    <div className="w-full max-w-xl p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl shadow-xl text-center space-y-6 animate-in fade-in duration-350">
                      <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center mx-auto text-amber-500 text-3xl shadow-sm animate-pulse" style={{ animationDuration: '3s' }}>
                        🌐
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                          กำลังเปิดเข้าสู่ระบบภายนอก: {targetLink.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed max-w-md mx-auto">
                          {targetLink.openDirectly ? (
                            <span>ลิงก์นี้ได้รับการตั้งค่าให้ <strong>"เปิดโดยตรงในแท็บใหม่"</strong> เพื่อประสบการณ์ใช้งานที่ดีที่สุด หลีกเลี่ยงปัญหาเว็บล็อกเอาท์</span>
                          ) : (
                            <span>เว็บไซต์นี้ (เช่น Google.com) มีระบบรักษาความปลอดภัยสูงที่จำกัดการฝังกรอบเฟรมในเว็บอื่น ระบบจึงอำนวยความสะดวกในการเปิดลิงก์ตรงให้แก่ท่านโดยอัตโนมัติ</span>
                          )}
                        </p>
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-xl max-w-md mx-auto font-mono text-[10px] text-slate-400 truncate">
                          {sanitizedUrl}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <button
                          onClick={() => {
                            window.open(sanitizedUrl, '_blank', 'noopener,noreferrer');
                          }}
                          className="w-full sm:w-auto h-11 px-6 text-white font-black text-xs rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                          style={{ backgroundColor: settings.colorAccent }}
                        >
                          🌐 คลิกเปิดเข้าใช้หน้าต่างหลัก
                        </button>
                        
                        <button
                          onClick={() => {
                            setActiveTab('tasks');
                          }}
                          className="w-full sm:w-auto h-11 px-6 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950/40 text-slate-600 dark:text-slate-350 font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          🏠 กลับสู่หน้าแดชบอร์ดหลัก
                        </button>
                      </div>
                      
                      <p className="text-[10px] text-slate-400">
                        * ปลอดภัย 100% รักษาเซสชันการเข้าสู่ระบบบัญชีของคุณไว้ตามปกติในบราวเซอร์หลัก
                      </p>
                    </div>
                  ) : (
                    <iframe 
                      id="link-iframe"
                      src={sanitizedUrl} 
                      className="w-full h-full border-0 bg-white dark:bg-slate-900 rounded-2xl shadow-inner" 
                      title={targetLink.title}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>

                {/* PERSISTENT FLOATING BUTTON (ปุ่มลอยสำหรับกลับหน้าหลัก) */}
                <div className="fixed bottom-6 right-6 z-50 animate-bounce" style={{ animationDuration: '3s' }}>
                  <button
                    onClick={() => {
                      setActiveTab('tasks');
                    }}
                    className="flex items-center gap-2 px-5 py-3 rounded-full text-white font-bold text-xs shadow-2xl transition-all hover:scale-105 active:scale-95 border border-white/10 select-none cursor-pointer"
                    style={{ 
                      backgroundColor: settings.colorAccent || '#4f46e5',
                      boxShadow: `0 10px 25px -5px ${settings.colorAccent || '#4f46e5'}80, 0 8px 10px -6px ${settings.colorAccent || '#4f46e5'}80`
                    }}
                    title="คลิกปุ่มลอยเพื่อย้อนกลับเข้าสู่ระบบหลักทันที"
                  >
                    <Home className="w-4 h-4" />
                    <span>🏠 กลับหน้าหลักระบบ</span>
                  </button>
                </div>

                {/* BEAUTIFUL POPUP MODAL (เด้งป๊อปอัปหากเป็นเว็บ Google หรือมีปัญหาการแสดงผล) */}
                <AnimatePresence>
                  {linkPopupData.visible && linkPopupData.url === sanitizedUrl && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                      {/* Dark blurred overlay */}
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLinkPopupData(prev => ({ ...prev, visible: false }))}
                        className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
                      />
                      
                      {/* Modal Content Card */}
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-6 z-10"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mx-auto text-2xl shadow-sm border border-indigo-100/50 dark:border-indigo-900/30">
                          🚀
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                            ระบบตรวจพบความปลอดภัยสูง
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            หน้าเว็บ <strong>"{linkPopupData.title}"</strong> ปฏิเสธการแสดงผลแบบฝังเฟรม (X-Frame-Options) หรืออาจพบปัญหาการแสดงผล ระบบจึงทำการเปิดแท็บภายนอกเพื่อความสมบูรณ์ในการทำงาน 100%
                          </p>
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-950 text-slate-400 font-mono text-[10px] rounded-xl truncate select-all border border-slate-100 dark:border-slate-850">
                            {linkPopupData.url}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 pt-2">
                          <button
                            onClick={() => {
                              window.open(linkPopupData.url, '_blank', 'noopener,noreferrer');
                            }}
                            className="w-full h-11 text-white font-black text-xs rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                            style={{ backgroundColor: settings.colorAccent }}
                          >
                            🌐 เปิดหน้าเว็บหลักในหน้าต่างใหม่
                          </button>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => {
                                setLinkPopupData(prev => ({ ...prev, visible: false }));
                              }}
                              className="h-10 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-450 font-bold text-xs rounded-xl transition-all cursor-pointer"
                            >
                              ❌ ปิดหน้านี้
                            </button>
                            <button
                              onClick={() => {
                                setLinkPopupData(prev => ({ ...prev, visible: false }));
                                setActiveTab('tasks');
                              }}
                              className="h-10 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-black text-xs rounded-xl transition-all cursor-pointer"
                            >
                              🏠 กลับแดชบอร์ด
                            </button>
                          </div>
                        </div>

                        <p className="text-[9px] text-slate-400 dark:text-slate-500">
                          * คุณสามารถปิดป๊อปอัปนี้หรือกดปุ่มลอย "กลับหน้าหลัก" ได้ตลอดเวลา
                        </p>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
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

          {/* Active Announcements Notice Section */}
          {visibleAnnouncements.some(ann => !dismissedAnnouncements.includes(ann.id)) && (
            <div className="mb-6 space-y-4 animate-fade-in">
              {visibleAnnouncements
                .filter(ann => !dismissedAnnouncements.includes(ann.id))
                .map(ann => (
                  <div
                    key={ann.id}
                    className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-rose-100 dark:border-rose-950/40 shadow-sm relative overflow-hidden flex flex-col md:flex-row gap-5 transition-all hover:shadow-md"
                  >
                    {/* Visual accent bar */}
                    <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: settings.colorAccent }} />
                    
                    {/* Announcement Image if exists */}
                    {ann.imageUrl && (
                      <div className="w-full md:w-48 h-32 md:h-28 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800 relative border border-slate-100 dark:border-slate-800">
                        <img
                          src={ann.imageUrl}
                          alt={ann.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-2 text-left">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-rose-650 bg-rose-50/80 dark:text-rose-400 dark:bg-rose-950/30 flex items-center gap-1">
                          <Megaphone className="w-3 h-3 animate-bounce" /> ประกาศสำคัญ
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {new Date(ann.createdAt).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })} น.
                        </span>
                      </div>
                      
                      <h4 className="text-base font-black text-slate-800 dark:text-slate-100 leading-snug">
                        {ann.title}
                      </h4>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed whitespace-pre-wrap">
                        {ann.content}
                      </p>
                      
                      <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                        <button
                          onClick={() => setShowAnnounceModalId(ann.id)}
                          className="text-xs font-bold hover:underline flex items-center gap-1.5"
                          style={{ color: settings.colorAccent }}
                        >
                          👁️ ขยายดูรูปแบบเต็มหน้าจอ
                        </button>

                        <button
                          onClick={() => handleDismissAnnouncement(ann.id)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all"
                        >
                          รับทราบและปิดประกาศนี้
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
                  onDeleteTasks={handleDeleteTasks}
                  onDeleteAllCompleted={handleDeleteAllCompleted}
                  categories={settings.categories}
                  accentColor={settings.colorAccent}
                  onAddCategory={handleAddCategoryOnTheFly}
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
                  expenses={expenses}
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
                  onEditExpense={handleEditExpense}
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
                  expenseCategories={settings.expenseCategories || DEFAULT_EXPENSE_CATEGORIES}
                  onAddExpenseCategory={handleAddExpenseCategoryOnTheFly}
                />
              </motion.div>
            )}

            {activeTab === 'localFiles' && (
              <motion.div
                key="localFiles"
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 140, damping: 16 }}
                className="w-full"
              >
                <LocalFileExplorer
                  accentColor={settings.colorAccent}
                  darkMode={settings.darkMode}
                />
              </motion.div>
            )}

            {activeTab === 'dekaSearch' && (
              <motion.div
                key="dekaSearch"
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 140, damping: 16 }}
                className="w-full"
              >
                <DekaSearchModule
                  accentColor={settings.colorAccent}
                  darkMode={settings.darkMode}
                />
              </motion.div>
            )}

            {activeTab === 'formDocument' && (
              <motion.div
                key="formDocument"
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 140, damping: 16 }}
                className="w-full"
              >
                <FormDocumentModule
                  accentColor={settings.colorAccent}
                  darkMode={settings.darkMode}
                />
              </motion.div>
            )}

            {activeTab === 'receipt' && (
              <motion.div
                key="receipt"
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 140, damping: 16 }}
                className="w-full"
              >
                <ReceiptModule
                  accentColor={settings.colorAccent}
                  settings={settings}
                  sessionUser={sessionUser}
                  tasks={tasks}
                  expenses={expenses}
                />
              </motion.div>
            )}

            {activeTab === 'admin' && (sessionUser.userId === 'admin' || sessionUser.isAssistant === true) && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 140, damping: 16 }}
                className="w-full"
              >
                <AdminPanel
                  accentColor={settings.colorAccent}
                  darkMode={settings.darkMode}
                  categories={settings.categories}
                  onAddCategory={handleAddCategoryOnTheFly}
                  sessionUser={sessionUser}
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
                  
                  <div className="flex flex-col lg:flex-row gap-6 items-start pb-24 relative" id="unlocked-settings-container">
                    
                    {/* LEFT SIDEBAR NAVIGATION */}
                    <div className="w-full lg:w-64 flex-shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-1">
                      <div className="px-3 py-2 mb-2">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">หมวดหมู่การตั้งค่า</p>
                      </div>
                      
                      {[
                        { id: 'branding', label: 'แบรนดิ้ง & หน้าตาเว็บ', icon: 'Palette' },
                        { id: 'account', label: 'ผู้ใช้ & ความปลอดภัย', icon: 'Shield' },
                        { id: 'notifications', label: 'การแจ้งเตือน & ระบบส่งเมล', icon: 'Bell' },
                        { id: 'reports_links', label: 'พิมพ์สรุป & ลิงก์เสริม', icon: 'FileText' },
                        { id: 'backup', label: 'สำรองข้อมูล & Google Drive / Excel', icon: 'Database' },
                        { id: 'pwa_app', label: 'ติดตั้งเป็นแอป (PWA App)', icon: 'Smartphone' }
                      ].map(tab => {
                        const isActive = settingsSubTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSettingsSubTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer text-left ${
                              isActive
                                ? 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border-l-4 border-accent'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-850 dark:text-slate-400 dark:hover:bg-slate-950/50 dark:hover:text-slate-200'
                            }`}
                            style={isActive ? { borderLeftColor: (tempSettings || settings).colorAccent } : {}}
                          >
                            <span className="text-sm">
                              {tab.icon === 'Palette' && '🎨'}
                              {tab.icon === 'Shield' && '🔐'}
                              {tab.icon === 'Bell' && '🔔'}
                              {tab.icon === 'FileText' && '📄'}
                              {tab.icon === 'Database' && '💾'}
                              {tab.icon === 'Smartphone' && '📱'}
                            </span>
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* RIGHT CONTENT PANEL */}
                    <div className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm min-h-[500px]">
                      
                      {/* STATUS CLOUD SYNC BANNER */}
                      <div className="mb-6 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 p-4 border border-emerald-500/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-blue-950/20 dark:border-emerald-800/30">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500 text-white animate-pulse text-xs">
                            ⚡
                          </div>
                          <div className="text-left">
                            <h4 className="text-[11px] font-black text-emerald-800 dark:text-emerald-400">ระบบซิงก์ข้อมูลคลาวด์แบบเรียลไทม์สมบูรณ์แบบ (Cloud & Cross-Device Live Sync Enabled)</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">การแก้ไขการตั้งค่าใดๆ ในบัญชีเดียวกันบนอุปกรณ์/เบราว์เซอร์นี้ จะเปลี่ยนตามทั้งหมดบนหน้าจอของอุปกรณ์อื่นทันที</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-750 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[9px] font-black">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                          ระบบเชื่อมต่ออยู่ (Cloud Live)
                        </div>
                      </div>

                      {/* SUB-TAB: BRANDING */}
                      {settingsSubTab === 'branding' && (
                        <div className="space-y-6 animate-fade-in text-left">
                          {/* Section 1: Brand Identity */}
                          <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-4">
                            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-200/50 dark:border-slate-800">
                              <span>🖼️</span> อัตลักษณ์ระบบ & ข้อมูลแอปหลัก (App Brand Identity)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1 dark:text-slate-400">ชื่อระบบงานแอปพลิเคชัน (App Name)</label>
                                <input
                                  type="text"
                                  value={(tempSettings || settings).appName || ''}
                                  onChange={(e) => {
                                    if (tempSettings) setTempSettings({ ...tempSettings, appName: e.target.value });
                                  }}
                                  className="w-full h-11 px-3 border border-slate-200 bg-white focus:border-accent dark:focus:border-accent dark:focus:bg-slate-900 rounded-lg text-xs font-bold text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1 dark:text-slate-400">คำอธิบายหรือคำนิยามระบบ (App Description)</label>
                                <input
                                  type="text"
                                  value={(tempSettings || settings).appDesc || ''}
                                  onChange={(e) => {
                                    if (tempSettings) setTempSettings({ ...tempSettings, appDesc: e.target.value });
                                  }}
                                  className="w-full h-11 px-3 border border-slate-200 bg-white focus:border-accent dark:focus:border-accent dark:focus:bg-slate-900 rounded-lg text-xs font-bold text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                                />
                              </div>
                            </div>

                            {/* Logo Upload Box */}
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 dark:text-slate-400">อัปโหลดรูปภาพโลโก้ หรือ ป้อนลิงก์ URL (Logo Image File / URL)</label>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <div className="md:col-span-2">
                                  <div
                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const file = e.dataTransfer.files?.[0];
                                      if (file && tempSettings) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                          if (event.target?.result) {
                                            setTempSettings({ ...tempSettings, appLogoUrl: event.target.result as string });
                                          }
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    className="border border-dashed border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-950/25 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer relative"
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
                                        if (file && tempSettings) {
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            if (event.target?.result) {
                                              setTempSettings({ ...tempSettings, appLogoUrl: event.target.result as string });
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                    {(tempSettings || settings).appLogoUrl ? (
                                      <div className="flex items-center gap-3 w-full">
                                        <div className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 flex items-center justify-center flex-shrink-0 shadow-sm">
                                          <img
                                            src={(tempSettings || settings).appLogoUrl}
                                            alt="Uploaded Logo Preview"
                                            referrerPolicy="no-referrer"
                                            className="max-w-full max-h-full object-contain rounded-md"
                                          />
                                        </div>
                                        <div className="min-w-0 flex-1 text-left">
                                          <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 truncate">มีไฟล์โลโก้ติดตั้งอยู่</p>
                                          <p className="text-[9px] text-slate-400 font-medium truncate">คลิกที่นี่หรือลากรูปใหม่เพื่อเปลี่ยน</p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (tempSettings) setTempSettings({ ...tempSettings, appLogoUrl: '' });
                                          }}
                                          className="text-[10px] font-black text-rose-500 hover:text-rose-650 bg-rose-50 dark:bg-rose-950/40 px-2 py-1 rounded-lg active:scale-95 transition-all cursor-pointer"
                                        >
                                          ลบโลโก้
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="text-center py-1">
                                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">🖼️ ลากรูปภาพวางตรงนี้ หรือคลิกเพื่ออัปโหลด</p>
                                        <p className="text-[9px] text-slate-400 mt-0.5">PNG, JPG, SVG, WebP</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-[10px] text-slate-400 font-bold">หรือป้อน URL โลโก้:</label>
                                  <input
                                    type="text"
                                    placeholder="https://example.com/logo.png"
                                    value={(tempSettings || settings).appLogoUrl || ''}
                                    onChange={(e) => {
                                      if (tempSettings) setTempSettings({ ...tempSettings, appLogoUrl: e.target.value });
                                    }}
                                    className="w-full h-10 px-3 border border-slate-200 bg-white dark:bg-slate-950 rounded-lg text-[11px] text-slate-850 dark:border-slate-800 dark:text-slate-250 font-medium"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                           {/* Section 2: Colors & Dark Mode Customizer with Color Wheel */}
                          <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-5">
                            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-3">
                              <div>
                                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                  <span className="text-base">🎨</span> สลับโหมดมืด/สว่าง & วงล้อปรับแต่งโทนสี (Modern Theme & Color Wheel)
                                </h4>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  ปรับสลับโหมดหน้าจอ และหมุนวงล้อสีเลือกสีพื้นหลังและสีเน้นของระบบได้อย่างอิสระ ทันสมัย เรียลไทม์
                                </p>
                              </div>
                            </div>

                            {/* Mode Switcher Buttons */}
                            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2">
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                🌗 เลือกโหมดการแสดงผลหน้าจอ (Screen Display Mode)
                              </label>
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (tempSettings) setTempSettings({ ...tempSettings, darkMode: false });
                                  }}
                                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                                    !(tempSettings || settings).darkMode
                                      ? 'bg-amber-50/80 border-amber-400 text-amber-900 dark:bg-amber-950/30 dark:border-amber-700 dark:text-amber-200 ring-2 ring-amber-400/50 shadow-xs'
                                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
                                  }`}
                                >
                                  <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold text-base flex-shrink-0">
                                    ☀️
                                  </div>
                                  <div>
                                    <span className="block text-xs font-black">โหมดสว่าง (Light Mode)</span>
                                    <span className="block text-[9.5px] opacity-75">หน้าจอสะอาด สว่าง สบายตาสำหรับตอนกลางวัน</span>
                                  </div>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (tempSettings) setTempSettings({ ...tempSettings, darkMode: true });
                                  }}
                                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                                    (tempSettings || settings).darkMode
                                      ? 'bg-indigo-950/60 border-indigo-500 text-indigo-100 ring-2 ring-indigo-500/50 shadow-xs'
                                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
                                  }`}
                                >
                                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-base flex-shrink-0">
                                    🌙
                                  </div>
                                  <div>
                                    <span className="block text-xs font-black">โหมดมืด (Dark Mode)</span>
                                    <span className="block text-[9.5px] opacity-75">ถนอมสายตา เฉดสีเข้มหรูหราสำหรับกลางคืน</span>
                                  </div>
                                </button>
                              </div>
                            </div>

                            {/* Preset Categories */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                  เลือกชุดจานสีพรีเซ็ตสำเร็จรูป (Theme Presets)
                                </label>
                                <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                                  {THEME_PRESETS.length} ธีมพร้อมใช้งาน
                                </span>
                              </div>

                              {/* Category Filter Pills */}
                              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                                {[
                                  { id: 'all', label: 'ทั้งหมด' },
                                  { id: 'executive', label: '🔥 ผู้บริหาร' },
                                  { id: 'dark', label: '🌙 มืดถนอมสายตา' },
                                  { id: 'vibrant', label: '🎨 สดใส' },
                                  { id: 'nature', label: '🌿 ธรรมชาติ' },
                                  { id: 'cyber', label: '⚡ ไซเบอร์' },
                                  { id: 'pastel', label: '🌸 พาสเทล' },
                                ].map(cat => (
                                  <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setPresetCategoryFilter(cat.id)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                                      presetCategoryFilter === cat.id
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850'
                                    }`}
                                  >
                                    {cat.label}
                                  </button>
                                ))}
                              </div>

                              {/* Presets Grid */}
                              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 max-h-60 overflow-y-auto p-1">
                                {THEME_PRESETS.filter(p => presetCategoryFilter === 'all' || p.category === presetCategoryFilter).map(preset => {
                                  const isActive = (tempSettings || settings).themePreset === preset.id;
                                  return (
                                    <button
                                      key={preset.id}
                                      type="button"
                                      onClick={() => applyThemePreset(preset.id)}
                                      className={`p-2.5 rounded-xl border text-left text-[10.5px] font-bold transition-all relative overflow-hidden cursor-pointer flex flex-col justify-between ${
                                        isActive 
                                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/80 shadow-xs' 
                                          : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:bg-slate-850'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5">
                                          <span className="w-3 h-3 rounded-full flex-shrink-0 border border-black/10 shadow-xs" style={{ backgroundColor: preset.colorAccent }} />
                                          <span className="truncate text-slate-800 dark:text-slate-200 font-extrabold">{preset.nameTh}</span>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-150/60 dark:border-slate-800">
                                        <span className="flex items-center gap-1">
                                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: preset.colorBgAppStart }} />
                                          <span>สว่าง</span>
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: preset.darkColorBgAppStart || '#0f172a' }} />
                                          <span>มืด</span>
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* MODERN COLOR WHEELS SECTION */}
                            <div className="space-y-4 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                              <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <span>🎡</span> วงล้อปรับสีพื้นหลังและสีระบบรายส่วน (Interactive Color Wheels)
                              </h5>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Color Wheel 1: Primary Accent */}
                                <ColorWheelPicker
                                  label="สีเน้นหลักระบบ (Primary Accent Color Wheel)"
                                  description="สีปุ่มหลัก, ไฮไลท์เมนู, และองค์ประกอบสำคัญ"
                                  color={(tempSettings || settings).colorAccent || '#2563eb'}
                                  onChange={(newHex) => handleAccentColorChangeInput(newHex)}
                                />

                                {/* Color Wheel 2: Light Mode App Background */}
                                <ColorWheelPicker
                                  label="สีพื้นหลังโหมดสว่าง (Light App Background)"
                                  description="สีพื้นหลังหลักเมื่อเปิดใช้งานโหมดสว่าง (Light Mode)"
                                  color={(tempSettings || settings).colorBgAppStart || '#f8fafc'}
                                  onChange={(newHex) => {
                                    if (tempSettings) {
                                      setTempSettings({ ...tempSettings, colorBgAppStart: newHex, bgStyle: 'theme-custom' });
                                    }
                                  }}
                                />

                                {/* Color Wheel 3: Dark Mode App Background */}
                                <ColorWheelPicker
                                  label="สีพื้นหลังโหมดมืด (Dark App Background)"
                                  description="สีพื้นหลังหลักเมื่อเปิดใช้งานโหมดมืด (Dark Mode)"
                                  color={(tempSettings || settings).darkColorBgAppStart || '#0f172a'}
                                  onChange={(newHex) => {
                                    if (tempSettings) {
                                      setTempSettings({ ...tempSettings, darkColorBgAppStart: newHex, bgStyle: 'theme-custom' });
                                    }
                                  }}
                                />

                                {/* Color Wheel 4: Sidebar Background */}
                                <ColorWheelPicker
                                  label="สีแถบเมนูซ้ายโหมดสว่าง/มืด (Sidebar Bg Wheel)"
                                  description="ปรับเฉดสีแถบนำทางเมนูซ้ายมือตามต้องการ"
                                  color={(tempSettings || settings).darkMode ? ((tempSettings || settings).darkColorSidebarBg || '#0b0f19') : ((tempSettings || settings).colorSidebarBg || '#ffffff')}
                                  onChange={(newHex) => {
                                    if (tempSettings) {
                                      if (tempSettings.darkMode) {
                                        setTempSettings({ ...tempSettings, darkColorSidebarBg: newHex });
                                      } else {
                                        setTempSettings({ ...tempSettings, colorSidebarBg: newHex });
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>

                            {/* Harmonious Mode Toggle */}
                            <div className="p-3 bg-indigo-50/80 border border-indigo-150 rounded-xl flex items-center justify-between dark:bg-indigo-950/30 dark:border-indigo-900/60">
                              <div className="text-left">
                                <h4 className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                                  <span>✨</span> โหมดคำนวณสีอัตโนมัติ (Harmonious Auto-Color Mode)
                                </h4>
                                <p className="text-[9.5px] text-indigo-700 dark:text-indigo-400/90 mt-0.5">
                                  ระบบจะคำนวณและปรับโทนปุ่มโฮเวอร์ แถบไฮไลต์ และโทนสีดาร์กโหมดให้แมตช์เข้ากันโดยอัตโนมัติ
                                </p>
                              </div>
                              <input
                                type="checkbox"
                                checked={harmoniousMode}
                                onChange={(e) => setHarmoniousMode(e.target.checked)}
                                className="w-4 h-4 cursor-pointer accent-indigo-600"
                              />
                            </div>

                            {/* Live Preview Card */}
                            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2">
                              <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <span>👁️</span> ตัวอย่างการแสดงผลจริง (Live Palette Preview)
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                {/* Light Mode Preview Card */}
                                <div 
                                  className="p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2 text-left"
                                  style={{ backgroundColor: (tempSettings || settings).colorBgAppStart || '#f8fafc' }}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-extrabold text-slate-700">☀️ โหมดสว่าง (Light)</span>
                                    <span 
                                      className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
                                      style={{ backgroundColor: (tempSettings || settings).colorAccent }}
                                    >
                                      ป้ายกำกับ
                                    </span>
                                  </div>
                                  <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs space-y-1">
                                    <p className="text-[11px] font-bold text-slate-800">ตัวอย่างภารกิจงานปรกติ</p>
                                    <p className="text-[9.5px] text-slate-500">ทดสอบโทนสีเน้นและพื้นหลังการ์ดงาน</p>
                                  </div>
                                </div>

                                {/* Dark Mode Preview Card */}
                                <div 
                                  className="p-3 rounded-xl border border-slate-800 shadow-2xs space-y-2 text-left"
                                  style={{ backgroundColor: (tempSettings || settings).darkColorBgAppStart || '#0f172a' }}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-extrabold text-slate-200">🌙 โหมดมืด (Dark)</span>
                                    <span 
                                      className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
                                      style={{ backgroundColor: (tempSettings || settings).colorAccent }}
                                    >
                                      ป้ายกำกับ
                                    </span>
                                  </div>
                                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 shadow-2xs space-y-1">
                                    <p className="text-[11px] font-bold text-slate-100">ตัวอย่างภารกิจงานปรกติ</p>
                                    <p className="text-[9.5px] text-slate-400">ทดสอบโทนสีเน้นและพื้นหลังการ์ดงาน</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Section 3: Background & Dark Mode */}
                          <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1 dark:text-slate-400">สไตล์การแสดงผลพื้นหลังเว็บไซต์ (Background Style)</label>
                              <select
                                value={(tempSettings || settings).bgStyle || 'theme-custom'}
                                onChange={(e) => {
                                  if (tempSettings) setTempSettings({ ...tempSettings, bgStyle: e.target.value as any });
                                }}
                                className="w-full h-11 px-3 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-850 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                              >
                                <option value="theme-custom">ไล่สีระดับกรมท่าหมุนตามโทนสีแบรนด์ (Recommended)</option>
                                <option value="default">สีเทา Minimal ปกติ</option>
                                <option value="indigo">เฉดสีฟ้าม่วงออโรร่าพรีเมียม (Indigo)</option>
                                <option value="slate">เฉดสีเทากระเบื้องเรียบหรู (Slate)</option>
                                <option value="custom">ใช้รูปภาพกำหนดเองผ่านลิงก์เว็บ URL</option>
                              </select>

                              {(tempSettings || settings).bgStyle === 'custom' && (
                                <div className="mt-2.5">
                                  <label className="block text-[10px] text-slate-400 font-bold mb-1">ลิงก์รูปภาพพื้นหลังเว็บไซต์ URL:</label>
                                  <input
                                    type="text"
                                    value={(tempSettings || settings).customBgUrl || ''}
                                    onChange={(e) => {
                                      if (tempSettings) setTempSettings({ ...tempSettings, customBgUrl: e.target.value });
                                    }}
                                    placeholder="https://images.unsplash.com/..."
                                    className="w-full h-10 px-3 border border-slate-200 bg-white rounded-lg text-xs text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col justify-center bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-4">
                              <div className="flex items-center justify-between">
                                <div className="text-left">
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-350">🌙 โหมดธีมมืดและเน้นสายตา (Dark Mode Theme)</p>
                                  <p className="text-[9px] text-slate-400">สลับดีไซน์ของทั้งระบบเป็นเฉดสีมืดถนอมสายตาสำหรับการทำงานเวลากลางคืน</p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={(tempSettings || settings).darkMode || false}
                                  onChange={(e) => {
                                    if (tempSettings) setTempSettings({ ...tempSettings, darkMode: e.target.checked });
                                  }}
                                  className="w-4.5 h-4.5 cursor-pointer accent-accent"
                                  style={{ '--accent': (tempSettings || settings).colorAccent } as React.CSSProperties}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section 4: AI Floating Button Toggle */}
                          <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-4 mt-4 text-left">
                            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-200/50 dark:border-slate-800">
                              <span>🧠</span> ปุ่มลอยเอไอประมวลผล & สั่งการ (Nong Chalat AI Floating Button)
                            </h4>
                            <div className="flex flex-col justify-center bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-4">
                              <div className="flex items-center justify-between">
                                <div className="text-left">
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-350">🤖 เปิดใช้งานปุ่มลอยเลขา AI เฉพาะบัญชีแอดมิน/ผู้ช่วย (Enable Admin AI Button)</p>
                                  <p className="text-[9px] text-slate-400">แสดงปุ่มลอยสำหรับบัญชีแอดมินหรือผู้ช่วย เพื่อรับสั่งงานด้วยเสียง/พิมพ์ สอบถามข้อมูล หรือสับเปลี่ยนสีสันเว็บดลบันดาล</p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={(tempSettings || settings).aiAssistantEnabled !== false}
                                  onChange={(e) => {
                                    if (tempSettings) setTempSettings({ ...tempSettings, aiAssistantEnabled: e.target.checked });
                                  }}
                                  className="w-4.5 h-4.5 cursor-pointer accent-accent"
                                  style={{ '--accent': (tempSettings || settings).colorAccent } as React.CSSProperties}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SUB-TAB: ACCOUNT & SECURITY */}
                      {settingsSubTab === 'account' && (
                        <div className="space-y-6 animate-fade-in text-left">
                          <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-4">
                            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-200/50 dark:border-slate-800">
                              <span>🔐</span> ข้อมูลเข้าสู่ระบบหลักบัญชีเจ้าของเครื่อง (Main Account Security)
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 dark:text-slate-400">ชื่อผู้ใช้งานเพื่อล็อกอิน (Admin Username)</label>
                                <input
                                  type="text"
                                  value={editUsername}
                                  onChange={(e) => setEditUsername(e.target.value)}
                                  placeholder="เช่น admin"
                                  className="w-full h-11 px-3 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 font-mono"
                                />
                                <p className="text-[9px] text-slate-400 mt-1">ใช้กรอกในช่องยูเซอร์เนมเข้าสู่เว็บไซต์ในการล็อกอินครั้งถัดไป</p>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 dark:text-slate-400">รหัสผ่านลับปลดล็อก (Secret Password - 6 หลัก)</label>
                                <input
                                  type="text"
                                  maxLength={6}
                                  value={editPassword}
                                  onChange={(e) => setEditPassword(e.target.value)}
                                  placeholder="เช่น 123456"
                                  className="w-full h-11 px-3 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 font-mono"
                                />
                                <p className="text-[9px] text-slate-400 mt-1">รหัสต้องประกอบด้วยตัวเลข <span className="font-bold text-amber-500">6 หลักเท่านั้น</span> เพื่อความปลอดภัยขั้นสูงสุด</p>
                              </div>
                            </div>

                            {profileMessage && (
                              <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
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
                                style={{ backgroundColor: (tempSettings || settings).colorAccent }}
                              >
                                {profileSaving ? (
                                  <>
                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    กำลังบันทึกบัญชี...
                                  </>
                                ) : (
                                  <>
                                    <span>💾</span>
                                    บันทึกชื่อผู้ใช้ & รหัสผ่านลับใหม่
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-4">
                            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-200/50 dark:border-slate-800">
                              <span>🔒</span> พินจำกัดสิทธิ์เข้าหน้าต่างตั้งค่า (Settings View Access PIN)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 dark:text-slate-400">รหัสล็อกควบคุมหน้าตั้งค่าปัจจุบัน (พินเริ่มต้น 0000)</label>
                                <input
                                  type="text"
                                  maxLength={12}
                                  value={(tempSettings || settings).settingsPassword || '0000'}
                                  onChange={(e) => {
                                    if (tempSettings) setTempSettings({ ...tempSettings, settingsPassword: e.target.value.trim() });
                                  }}
                                  placeholder="เช่น 0000"
                                  className="w-full h-11 px-3 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-850 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 font-mono"
                                />
                                <p className="text-[9px] text-slate-400 mt-1">รหัส PIN นี้จำเป็นต้องกดยืนยันบันทึกแถบสีดำด้านล่างสุดของจอเพื่อบันทึกเซฟขึ้นคลาวด์</p>
                              </div>
                              <div className="flex items-center bg-amber-50/50 p-4 border border-amber-100 rounded-xl dark:bg-amber-950/10 dark:border-amber-900/30">
                                <div className="text-amber-800 dark:text-amber-400 text-[10px] leading-relaxed font-semibold">
                                  💡 <strong>คำแนะนำความปลอดภัย:</strong> รหัสล็อคควบคุมนี้จะช่วยป้องกันไม่ให้บุคคลภายนอกแอบเข้ามาคลิกปรับแต่งแบรนด์หรือสแกนลบข้อมูลเป้าหมายของคุณได้ สามารถปรับเปลี่ยนพินได้อย่างอิสระ
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SUB-TAB: NOTIFICATIONS */}
                      {settingsSubTab === 'notifications' && (
                        <div className="space-y-6 animate-fade-in text-left">
                          {/* Audio & Sounds Card */}
                          <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-4">
                            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-200/50 dark:border-slate-800">
                              <span>🔔</span> ระบบเสียงสังเคราะห์ & เอฟเฟกต์แอปพลิเคชัน (App Audio Feedback)
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                                <div>
                                  <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-200">เปิดระบบเสียงเอฟเฟกต์ (Audio Feedback)</h5>
                                  <p className="text-[9px] text-slate-450 font-normal">เปิด/ปิดเสียงประมวลผลเอฟเฟกต์สังเคราะห์ในกิจกรรมต่างๆ</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (tempSettings) setTempSettings({ ...tempSettings, soundEnabled: (tempSettings.soundEnabled === false) ? true : false });
                                  }}
                                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 flex-shrink-0 ${
                                    (tempSettings || settings).soundEnabled !== false ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'
                                  }`}
                                >
                                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${(tempSettings || settings).soundEnabled !== false ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1 dark:text-slate-400">สไตล์โทนเสียงเอฟเฟกต์หลัก (Primary App Sound)</label>
                                <select
                                  value={(tempSettings || settings).soundType || 'chime'}
                                  onChange={(e) => {
                                    if (tempSettings) setTempSettings({ ...tempSettings, soundType: e.target.value as any });
                                  }}
                                  className="w-full h-11 px-3 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                                >
                                  <option value="chime">🔔 Chime (ระฆังคริสตัลสูง ดึงดูดความสนใจ)</option>
                                  <option value="success">🎉 Success (ดนตรี 4 ตัวโน้ตเสียงแห่งความสำเร็จ)</option>
                                  <option value="alert">🚨 Alert (เสียงเตือนคู่ ไซเรนดับเบิ้ลเร่งด่วน)</option>
                                  <option value="bell">⛪ Cathedral Bell (เสียงระฆังโบสถ์กังวานลึกอบอุ่น)</option>
                                  <option value="pop">🫧 Organic Pop (เสียงน้ำกระเด็นฟองสบู่เบาๆน่ารัก)</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-center">
                                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">ระดับเสียงเอฟเฟกต์ (Sound Volume)</label>
                                  <span className="text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400 px-1.5 py-0.5 rounded font-extrabold">{(tempSettings || settings).soundVolume ?? 80}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="10"
                                  max="100"
                                  step="5"
                                  value={(tempSettings || settings).soundVolume ?? 80}
                                  onChange={(e) => {
                                    if (tempSettings) setTempSettings({ ...tempSettings, soundVolume: Number(e.target.value) });
                                  }}
                                  className="w-full accent-rose-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-800"
                                />
                              </div>

                              <div className="flex items-center">
                                <button
                                  type="button"
                                  onClick={() => playNotificationSound((tempSettings || settings).soundType || 'chime', (tempSettings || settings).soundVolume ?? 80)}
                                  className="w-full h-11 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-400 cursor-pointer"
                                >
                                  <span>🔊 ทดสอบส่งเสียงแจ้งเตือนปัจจุบัน (Test Sound)</span>
                                </button>
                              </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                              <h5 className="font-bold text-slate-700 dark:text-slate-350 text-[11px]">⚙️ ตั้งค่าเงื่อนไขการส่งเสียง (Audio Rules):</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-all">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">เสียงเมื่อปิดงานสำเร็จ</span>
                                    <span className="text-[9px] text-slate-400">เล่นเสียงความยินดีเมื่อติ๊กงานสำเร็จหรือชำระสะสม</span>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={(tempSettings || settings).soundOnComplete !== false}
                                    onChange={(e) => {
                                      if (tempSettings) setTempSettings({ ...tempSettings, soundOnComplete: e.target.checked });
                                    }}
                                    className="w-4 h-4 text-rose-600 focus:ring-rose-500 accent-rose-500 cursor-pointer"
                                  />
                                </label>

                                <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-all">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">เสียงเมื่อคลิกเพิ่มรายการใหม่</span>
                                    <span className="text-[9px] text-slate-400">เล่นเสียง Pop เบาๆ ทันทีที่จดงานหรือบันทึกค่าใช้จ่ายใหม่</span>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={(tempSettings || settings).soundOnAdd !== false}
                                    onChange={(e) => {
                                      if (tempSettings) setTempSettings({ ...tempSettings, soundOnAdd: e.target.checked });
                                    }}
                                    className="w-4 h-4 text-rose-600 focus:ring-rose-500 accent-rose-500 cursor-pointer"
                                  />
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Email SMTP Section */}
                          <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-4">
                            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-200/50 dark:border-slate-800">
                              <span>📧</span> ระบบจัดส่งรายงานด่วนทางอีเมลคลาวด์ (System SMTP Mailer)
                            </h4>

                            <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                              <div>
                                <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-200">เปิดระบบจัดส่งรายงานทางอีเมล</h5>
                                <p className="text-[9px] text-slate-450 font-normal">อนุญาตให้ส่งเมลสรุปงาน/บัญชี ไปยังผู้บริหารเมื่อสิ้นสุดสัปดาห์</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (tempSettings) setTempSettings({ ...tempSettings, emailNotificationEnabled: !tempSettings.emailNotificationEnabled });
                                }}
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 flex-shrink-0 ${
                                  (tempSettings || settings).emailNotificationEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                                }`}
                              >
                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${(tempSettings || settings).emailNotificationEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                              </button>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 mb-1 dark:text-slate-400">อีเมลปลายทางผู้รับรายงาน (Executive Recipient)</label>
                              <input
                                type="email"
                                placeholder="executive@company.com"
                                value={(tempSettings || settings).emailRecipient || ''}
                                onChange={(e) => {
                                  if (tempSettings) setTempSettings({ ...tempSettings, emailRecipient: e.target.value });
                                }}
                                className="w-full h-11 px-3 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                              />
                            </div>

                            {/* Collapsible/Group SMTP detail fields inside nice white sub-card */}
                            <div className="border border-slate-150 rounded-xl p-4 bg-white dark:bg-slate-900 dark:border-slate-800 space-y-3">
                              <div className="font-bold text-[11px] text-slate-800 dark:text-slate-250 border-b border-slate-100 pb-1.5 dark:border-slate-800/80 flex items-center justify-between">
                                <span>⚙️ ข้อมูลเซิร์ฟเวอร์ส่งเมล (SMTP Credentials)</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] text-slate-400 font-bold mb-1">SMTP Host / Address</label>
                                  <input
                                    type="text"
                                    placeholder="smtp.gmail.com"
                                    value={(tempSettings || settings).smtpHost || ''}
                                    onChange={(e) => {
                                      if (tempSettings) setTempSettings({ ...tempSettings, smtpHost: e.target.value });
                                    }}
                                    className="w-full h-10 px-3 border border-slate-200 bg-slate-50 rounded-lg text-xs text-slate-850 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] text-slate-400 font-bold mb-1">Port</label>
                                    <input
                                      type="number"
                                      placeholder="587"
                                      value={(tempSettings || settings).smtpPort || ''}
                                      onChange={(e) => {
                                        if (tempSettings) setTempSettings({ ...tempSettings, smtpPort: parseInt(e.target.value) || 587 });
                                      }}
                                      className="w-full h-10 px-3 border border-slate-200 bg-slate-50 rounded-lg text-xs text-slate-850 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-400 font-bold mb-1">SSL/TLS</label>
                                    <select
                                      value={(tempSettings || settings).smtpSecure ? 'true' : 'false'}
                                      onChange={(e) => {
                                        if (tempSettings) setTempSettings({ ...tempSettings, smtpSecure: e.target.value === 'true' });
                                      }}
                                      className="w-full h-10 px-2.5 border border-slate-200 bg-slate-50 rounded-lg text-xs text-slate-850 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 font-bold"
                                    >
                                      <option value="false">STARTTLS</option>
                                      <option value="true">SSL (Implicit)</option>
                                    </select>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                <div>
                                  <label className="block text-[10px] text-slate-400 font-bold mb-1">บัญชีผู้ใช้ SMTP User/Email</label>
                                  <input
                                    type="text"
                                    placeholder="your-email@gmail.com"
                                    value={(tempSettings || settings).smtpUser || ''}
                                    onChange={(e) => {
                                      if (tempSettings) setTempSettings({ ...tempSettings, smtpUser: e.target.value });
                                    }}
                                    className="w-full h-10 px-3 border border-slate-200 bg-slate-50 rounded-lg text-xs text-slate-850 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-400 font-bold mb-1">รหัสผ่านสำหรับส่งเมล (App Password)</label>
                                  <input
                                    type="password"
                                    placeholder="••••••••••••••••"
                                    value={(tempSettings || settings).smtpPass || ''}
                                    onChange={(e) => {
                                      if (tempSettings) setTempSettings({ ...tempSettings, smtpPass: e.target.value });
                                    }}
                                    className="w-full h-10 px-3 border border-slate-200 bg-slate-50 rounded-lg text-xs text-slate-850 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 font-mono"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Browser Push Notification permission indicator */}
                          <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-3">
                            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-1.5 border-b border-slate-200/50 dark:border-slate-800">
                              <span>📲</span> แจ้งเตือนผ่านหน้าเว็บเบราว์เซอร์เครื่องนี้ (Web Push Permissions)
                            </h4>
                            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="text-left">
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">สถานะสิทธิ์บนเบราว์เซอร์เครื่องนี้:</p>
                                  <p className="text-[9px] text-slate-400">ต้องกดอนุญาตสิทธิ์ในครั้งแรกระบบจึงจะเด้งข้อความแจ้งเตือนได้</p>
                                </div>
                                <div>
                                  {browserPermission === 'granted' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                      <span>อนุญาตสิทธิ์สำเร็จ (Granted)</span>
                                    </span>
                                  ) : browserPermission === 'denied' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                      <span>สิทธิ์ถูกระงับ (Denied)</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                      <span>รอการอนุญาตสิทธิ์ (Pending)</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                                {browserPermission !== 'granted' ? (
                                  <button
                                    type="button"
                                    onClick={handleRequestNotificationPermission}
                                    className={`w-full h-10 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                      browserPermission === 'denied'
                                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                                    }`}
                                  >
                                    <span>🔑 กดยืนยันขออนุญาตสิทธิ์แจ้งเตือน</span>
                                  </button>
                                ) : (
                                  <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-850">
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">เปิดแจ้งเตือนเว็บพุช</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (tempSettings) setTempSettings({ ...tempSettings, nativeNotificationsEnabled: (tempSettings.nativeNotificationsEnabled === false) ? true : false });
                                      }}
                                      className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 flex-shrink-0 ${
                                        (tempSettings || settings).nativeNotificationsEnabled !== false ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'
                                      }`}
                                    >
                                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${(tempSettings || settings).nativeNotificationsEnabled !== false ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                                    </button>
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={handleTestNotification}
                                  disabled={browserPermission !== 'granted'}
                                  className="w-full h-10 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-850 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                                >
                                  <span>🧪 ทดสอบส่งหน้าต่างพุชข้อความลอย (Test Notification)</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SUB-TAB: REPORTS & LINKS */}
                      {settingsSubTab === 'reports_links' && (
                        <div className="space-y-6 animate-fade-in text-left">
                          {/* Print Styling Card */}
                          <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-4">
                            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-200/50 dark:border-slate-800">
                              <span>🖨️</span> รูปแบบรายงานสรุป PDF & ตราสารใบเสร็จ (Print & PDF Styling)
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1 dark:text-slate-400">หัวข้อหลักบนหน้าเอกสาร (Report Document Title)</label>
                                <input
                                  type="text"
                                  placeholder="เช่น รายงานสรุปผลงานและค่าใช้จ่ายประจำสัปดาห์"
                                  value={(tempSettings || settings).printTitle || ''}
                                  onChange={(e) => {
                                    if (tempSettings) setTempSettings({ ...tempSettings, printTitle: e.target.value });
                                  }}
                                  className="w-full h-11 px-3 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1 dark:text-slate-400">คำสโลแกน / จ่าหน้ารองลงมา (Report Subtitle / Header)</label>
                                <input
                                  type="text"
                                  placeholder="เช่น ระบบบัญชีส่วนบุคคลและติดตามเป้าหมายบริษัท"
                                  value={(tempSettings || settings).printSubtitle || ''}
                                  onChange={(e) => {
                                    if (tempSettings) setTempSettings({ ...tempSettings, printSubtitle: e.target.value });
                                  }}
                                  className="w-full h-11 px-3 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1 dark:text-slate-400">รูปแบบการออกแบบดีไซน์หน้ากระดาษ (PDF Layout Pattern)</label>
                                <select
                                  value={(tempSettings || settings).printTemplatePattern || 'formal'}
                                  onChange={(e) => {
                                    if (tempSettings) setTempSettings({ ...tempSettings, printTemplatePattern: e.target.value as any });
                                  }}
                                  className="w-full h-11 px-3 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                                >
                                  <option value="formal">👔 ทางการ (Formal Corporate Template - กรอบและตราประทับ)</option>
                                  <option value="standard">📊 มาตรฐาน (Modern Slate Accent - มีเสาไฮไลต์ไล่โทนสี)</option>
                                  <option value="compact">📄 กะทัดรัด (Compact Spacing - ตัวหนังสือเล็กประหยัดกระดาษ)</option>
                                  <option value="creative">🎨 สร้างสรรค์ (Creative Pastel Theme - ขอบตารางโค้งมนสีพาสเทล)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 mb-1 dark:text-slate-400">หมายเหตุด้านท้ายหน้ากระดาษ (Report Footer Memo)</label>
                                <input
                                  type="text"
                                  placeholder="เช่น เอกสารประเมินสรุปสถิติคลาวด์อัตโนมัติ"
                                  value={(tempSettings || settings).printFooterMemo || ''}
                                  onChange={(e) => {
                                    if (tempSettings) setTempSettings({ ...tempSettings, printFooterMemo: e.target.value });
                                  }}
                                  className="w-full h-11 px-3 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Custom external navigation links Card */}
                          <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-4">
                            <div>
                              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-200/50 dark:border-slate-800">
                                <span>🔗</span> ลิงก์เชื่อมโยงภายนอก & ปุ่มเมนูเสริมแถบสไลด์ (External Navigation Links)
                              </h4>
                              <p className="text-[10px] text-slate-450 mt-1.5">เพิ่มเมนูย่อยเพื่อลิงก์ไปยังเว็บภายนอก ซึ่งจะเปิดในแท็บใหม่ทันที และปรากฏที่เมนูแถบข้าง (3 ขีด) โดยอัตโนมัติ</p>
                            </div>

                            <div className="space-y-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-4 rounded-xl">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] text-slate-500 font-bold mb-1">ชื่อปุ่มเมนูที่แสดงผล (เช่น สถิติบริษัท, เว็บหลัก)</label>
                                  <input
                                    type="text"
                                    placeholder="ป้อนชื่อปุ่มเมนู..."
                                    value={newLinkTitle}
                                    onChange={(e) => setNewLinkTitle(e.target.value)}
                                    className="w-full h-10 px-3 border border-slate-200 bg-slate-50 rounded-lg text-xs font-medium text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-500 font-bold mb-1">URL ลิงก์เชื่อมโยงไปยังหน้าเว็บ</label>
                                  <input
                                    type="text"
                                    placeholder="เช่น google.com หรือ wikipedia.org..."
                                    value={newLinkUrl}
                                    onChange={(e) => setNewLinkUrl(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddMenuLink(); }}
                                    className="w-full h-10 px-3 border border-slate-200 bg-slate-50 rounded-lg text-xs font-medium text-slate-850 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-250"
                                  />
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                                  <span className="text-[10px] text-slate-400 font-bold">ไอคอน:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {[
                                      { name: 'Globe', icon: '🌐' },
                                      { name: 'Link', icon: '🔗' },
                                      { name: 'Briefcase', icon: '💼' },
                                      { name: 'TrendingUp', icon: '📈' },
                                      { name: 'BookOpen', icon: '📖' },
                                      { name: 'ShoppingBag', icon: '🛍️' }
                                    ].map(item => (
                                      <button
                                        key={item.name}
                                        type="button"
                                        onClick={() => setNewLinkIcon(item.name as any)}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all border cursor-pointer ${
                                          newLinkIcon === item.name
                                            ? 'border-accent bg-accent/10'
                                            : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950/40'
                                        }`}
                                        style={newLinkIcon === item.name ? { borderColor: (tempSettings || settings).colorAccent } : {}}
                                      >
                                        {item.icon}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={handleAddMenuLink}
                                  className="h-10 px-5 text-xs font-black text-white rounded-lg shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer w-full sm:w-auto"
                                  style={{ backgroundColor: (tempSettings || settings).colorAccent }}
                                >
                                  <span>{editingLinkId ? '💾 อัปเดตลิงก์ย่อย' : '➕ เพิ่มเมนูลิงก์ใหม่'}</span>
                                </button>
                              </div>
                            </div>

                            {/* Links list */}
                            <div className="space-y-2">
                              <h5 className="text-[11px] font-bold text-slate-500">รายการเมนูปุ่มลิงก์เสริมที่มีอยู่ขณะนี้ ({(tempSettings || settings).customMenuLinks?.length || 0} ลิงก์):</h5>
                              {!(tempSettings || settings).customMenuLinks || (tempSettings || settings).customMenuLinks.length === 0 ? (
                                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl text-center text-slate-400 font-medium">
                                  🏖️ ยังไม่มีลิงก์ภายนอกเสริมที่ติดตั้งไว้ สามารถกดเพิ่มจากแบบฟอร์มด้านบนได้เลยค่ะ
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {((tempSettings || settings).customMenuLinks || []).map((link, idx) => {
                                    return (
                                      <div
                                        key={link.id}
                                        className="p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-850 flex-shrink-0 text-sm">
                                            {link.iconName === 'Globe' ? '🌐' : link.iconName === 'Link' ? '🔗' : link.iconName === 'Briefcase' ? '💼' : link.iconName === 'TrendingUp' ? '📈' : link.iconName === 'BookOpen' ? '📖' : link.iconName === 'ShoppingBag' ? '🛍️' : '📄'}
                                          </div>
                                          <div className="min-w-0 text-left">
                                            <p className="text-xs font-black text-slate-850 dark:text-slate-100 truncate">{link.title}</p>
                                            <p className="text-[10px] text-slate-400 font-mono font-medium truncate">{link.url}</p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => moveMenuLinkUp(link.id)}
                                            disabled={idx === 0}
                                            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-850 disabled:opacity-30 rounded transition-all dark:hover:bg-slate-800 cursor-pointer text-[10px]"
                                            title="เลื่อนขึ้น"
                                          >
                                            ▲
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => moveMenuLinkDown(link.id)}
                                            disabled={idx === ((tempSettings || settings).customMenuLinks || []).length - 1}
                                            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-850 disabled:opacity-30 rounded transition-all dark:hover:bg-slate-800 cursor-pointer text-[10px]"
                                            title="เลื่อนลง"
                                          >
                                            ▼
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleEditMenuLinkStart(link)}
                                            className="p-1 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-all dark:hover:bg-blue-950/40 cursor-pointer text-[10px]"
                                            title="แก้ไข"
                                          >
                                            ✏️
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveMenuLink(link.id)}
                                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-650 rounded transition-all dark:hover:bg-rose-950/40 cursor-pointer text-[10px]"
                                            title="ลบ"
                                          >
                                            🗑️
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
                      )}

                      {/* SUB-TAB: BACKUP & GOOGLE DRIVE */}
                      {settingsSubTab === 'backup' && (
                        <div className="space-y-6 animate-fade-in text-left">
                          <BackupModule
                            tasks={tasks}
                            expenses={expenses}
                            settings={settings}
                            onRestore={handleCloudRestore}
                            accentColor={settings.colorAccent}
                            sessionUser={sessionUser}
                            allUsersList={allUsersList}
                            announcements={dbAnnouncements.length > 0 ? dbAnnouncements : adminAnnouncements}
                            customMenuLinks={adminCustomLinks.length > 0 ? adminCustomLinks : (settings.customMenuLinks || [])}
                          />
                        </div>
                      )}

                      {/* SUB-TAB: PWA APP INSTALLATION & CAPABILITIES */}
                      {settingsSubTab === 'pwa_app' && (
                        <div className="space-y-6 animate-fade-in text-left">
                          <div className="bg-slate-50 dark:bg-slate-950/40 p-6 rounded-2xl border border-slate-150 dark:border-slate-800/80 space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-slate-800">
                              <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <span>📱</span> การติดตั้งใช้งานเป็นแอปพลิเคชัน (Progressive Web App - PWA)
                              </h4>
                              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                PWA Ready ✓
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              คุณสามารถเปลี่ยนการใช้งานจากเว็บไซต์ปกติ ให้กลายเป็น <strong>แอปพลิเคชันเต็มรูปแบบ (Native Web App)</strong> ติดตั้งลงบนหน้าจอมือถือ iPhone, iPad, Android หรือคอมพิวเตอร์ Windows / Mac เพื่อความรวดเร็วและเปิดใช้งานได้ทันทีโดยไม่ต้องเข้าเบราว์เซอร์
                            </p>

                            {/* Action Install Button */}
                            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 p-2 shadow-inner">
                                  <img src="/favicon.svg" alt="App Icon" className="w-full h-full object-contain" />
                                </div>
                                <div>
                                  <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">
                                    TaskFlow Space Executive Pro
                                  </h5>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    เวอร์ชัน Progressive Web App พร้อมระบบออฟไลน์แคช
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setShowInstallAppModal(true)}
                                className="w-full sm:w-auto px-5 py-3 rounded-xl text-white font-black text-xs flex items-center justify-center gap-2 shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                                style={{ backgroundColor: (tempSettings || settings).colorAccent }}
                              >
                                <Download className="w-4 h-4" />
                                <span>เปิดคำแนะนำ & ติดตั้งแอป</span>
                              </button>
                            </div>

                            {/* Features list */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800/80 flex items-start gap-3">
                                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0 text-xs font-black">
                                  1
                                </div>
                                <div className="text-xs">
                                  <div className="font-bold text-slate-800 dark:text-slate-200">หน้าจอเต็มตา ไร้แถบ URL</div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">ทำงานในโหมด Standalone Display เสมือนแอปแท้ 100%</div>
                                </div>
                              </div>

                              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800/80 flex items-start gap-3">
                                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0 text-xs font-black">
                                  2
                                </div>
                                <div className="text-xs">
                                  <div className="font-bold text-slate-800 dark:text-slate-200">แคชข้อมูล & ออฟไลน์โหลดไว</div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Service Worker บันทึกแคชหน้าจอ ช่วยให้เปิดแอปได้ในเสี้ยววินาที</div>
                                </div>
                              </div>

                              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800/80 flex items-start gap-3">
                                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0 text-xs font-black">
                                  3
                                </div>
                                <div className="text-xs">
                                  <div className="font-bold text-slate-800 dark:text-slate-200">ทางลัดด่วน (App Shortcuts)</div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">กดค้างที่ไอคอนแอปบนหน้าจอเพื่อเข้าสู่ ภารกิจ, ปฏิทิน, ค่าใช้จ่ายได้ทันที</div>
                                </div>
                              </div>

                              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800/80 flex items-start gap-3">
                                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0 text-xs font-black">
                                  4
                                </div>
                                <div className="text-xs">
                                  <div className="font-bold text-slate-800 dark:text-slate-200">รองรับทุกอุปกรณ์</div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">ใช้ได้ทั้ง iPhone, iPad, สมาร์ตโฟน Android, แท็บเล็ต, โน้ตบุ๊ก และ PC</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      </div>

                    {/* BOTTOM STICKY CONTROL BAR */}
                    {tempSettings && JSON.stringify(tempSettings) !== JSON.stringify(settings) && (
                      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-6 border border-slate-850 backdrop-blur-md max-w-2xl w-[92%] animate-fade-in">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400 animate-pulse text-sm">⚠️</span>
                          <span className="text-xs font-bold text-slate-200">คุณมีรายการตั้งค่าที่ยังไม่ได้บันทึก</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleResetAllSettings}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all text-[11px] font-extrabold rounded-xl cursor-pointer text-slate-300"
                          >
                            ยกเลิก
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveAllSettings}
                            className="px-5 py-2 active:scale-95 transition-all text-[11px] font-black rounded-xl text-white shadow-md cursor-pointer shadow-accent/25"
                            style={{ backgroundColor: (tempSettings || settings).colorAccent }}
                          >
                            ยืนยันเพื่อบันทึก
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Announcement Fullscreen Modal Popup */}
      <AnimatePresence>
        {showAnnounceModalId && (() => {
          const ann = visibleAnnouncements.find(a => a.id === showAnnounceModalId);
          if (!ann) return null;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.4 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden relative flex flex-col max-h-[85vh]"
              >
                {/* Header with Background Pattern */}
                <div className="p-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center font-bold text-lg">
                      📢
                    </span>
                    <div className="text-left">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full inline-block">
                        ข่าวสารสำคัญล่าสุด
                      </span>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        เผยแพร่เมื่อ: {new Date(ann.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} น.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAnnounceModalId(null)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-400 hover:text-slate-700 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto space-y-4">
                  {ann.imageUrl && (
                    <div className="w-full h-48 sm:h-64 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 relative">
                      <img
                        src={ann.imageUrl}
                        alt={ann.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  <div className="space-y-3 text-left">
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 leading-snug">
                      {ann.title}
                    </h3>
                    
                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3" />
                    
                    <p className="text-sm text-slate-650 dark:text-slate-350 leading-relaxed whitespace-pre-wrap font-medium">
                      {ann.content}
                    </p>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-400 font-medium">
                    {dismissedAnnouncements.includes(ann.id) ? (
                      <span className="text-emerald-500 font-bold">✓ คุณเคยรับทราบประกาศนี้แล้ว</span>
                    ) : (
                      <span>โปรดกดรับทราบเพื่อบันทึกและปิดการแสดงผล</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!dismissedAnnouncements.includes(ann.id) && (
                      <button
                        onClick={() => {
                          handleDismissAnnouncement(ann.id);
                          setShowAnnounceModalId(null);
                        }}
                        className="px-5 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" /> รับทราบข่าวสาร
                      </button>
                    )}
                    <button
                      onClick={() => setShowAnnounceModalId(null)}
                      className="px-4 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
                    >
                      ปิดหน้าต่าง
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        sessionUser={sessionUser}
        onProfileUpdated={(updated) => {
          setSessionUser(updated);
        }}
        accentColor={settings.colorAccent}
      />

      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        tasks={tasks}
        expenses={expenses}
        settings={settings}
      />

      {/* Floating Alarm Notifications Stack */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {activeAlarms.map((alarm) => (
            <motion.div
              key={alarm.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className="bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-2xl shadow-xl p-5 pointer-events-auto flex flex-col gap-3 relative overflow-hidden"
            >
              {/* Pulsing light behind icon */}
              <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500 animate-pulse" />
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-lg animate-bounce">
                  🔔
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full inline-block mb-1.5 animate-pulse">
                    🚨 ถึงเวลาด่วน / Task Alert
                  </span>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate">
                    {alarm.title}
                  </h4>
                  {alarm.dueTime && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>เวลาส่ง: {alarm.dueTime} น. (วันนี้)</span>
                    </p>
                  )}
                </div>
              </div>

              {alarm.desc && (
                <p className="text-xs text-slate-650 dark:text-slate-450 line-clamp-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 text-left">
                  {alarm.desc}
                </p>
              )}

              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    handleEditTask(alarm.id, { status: 'completed' });
                    setActiveAlarms(prev => prev.filter(a => a.id !== alarm.id));
                  }}
                  className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>✓ ทำงานเสร็จแล้ว</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playNotificationSound(settings.soundType || 'alert', settings.soundVolume ?? 80);
                  }}
                  className="px-3 h-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-350 rounded-lg text-xs transition-colors"
                  title="ฟังเสียงแจ้งเตือนอีกครั้ง"
                >
                  📢
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveAlarms(prev => prev.filter(a => a.id !== alarm.id));
                  }}
                  className="h-9 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-550 dark:text-slate-400 rounded-lg text-xs transition-colors hover:text-slate-800 font-bold"
                >
                  ปิด
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* MOBILE BOTTOM NAVIGATION DOCK (Touch Friendly) */}
      <nav 
        className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800/90 z-30 lg:hidden flex items-center justify-around px-1 py-1.5 shadow-xl select-none"
        style={{ paddingBottom: 'calc(0.35rem + env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={() => { setActiveTab('tasks'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[9.5px] font-bold transition-all cursor-pointer ${
            activeTab === 'tasks' ? 'text-indigo-600 dark:text-indigo-400 font-black scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          style={activeTab === 'tasks' ? { color: settings.colorAccent } : {}}
        >
          <CheckSquare className="w-5 h-5 mb-0.5" />
          <span>ภารกิจ</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('expenses'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[9.5px] font-bold transition-all cursor-pointer ${
            activeTab === 'expenses' ? 'text-indigo-600 dark:text-indigo-400 font-black scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          style={activeTab === 'expenses' ? { color: settings.colorAccent } : {}}
        >
          <Receipt className="w-5 h-5 mb-0.5" />
          <span>ค่าใช้จ่าย</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('dekaSearch'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[9.5px] font-bold transition-all cursor-pointer ${
            activeTab === 'dekaSearch' ? 'text-amber-500 font-black scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          style={activeTab === 'dekaSearch' ? { color: settings.colorAccent } : {}}
        >
          <Scale className="w-5 h-5 mb-0.5 text-amber-500" />
          <span>สืบค้นฎีกา</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('formDocument'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[9.5px] font-bold transition-all cursor-pointer ${
            activeTab === 'formDocument' ? 'text-amber-500 font-black scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          style={activeTab === 'formDocument' ? { color: settings.colorAccent } : {}}
        >
          <FileText className="w-5 h-5 mb-0.5 text-amber-500" />
          <span>แบบฟอร์ม</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('receipt'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[9.5px] font-bold transition-all cursor-pointer ${
            activeTab === 'receipt' ? 'text-emerald-500 font-black scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          style={activeTab === 'receipt' ? { color: settings.colorAccent } : {}}
        >
          <Receipt className="w-5 h-5 mb-0.5 text-emerald-400" />
          <span>ใบเสร็จ</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('settings'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[9.5px] font-bold transition-all cursor-pointer ${
            activeTab === 'settings' ? 'text-indigo-600 dark:text-indigo-400 font-black scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          style={activeTab === 'settings' ? { color: settings.colorAccent } : {}}
        >
          <SettingsIcon className="w-5 h-5 mb-0.5" />
          <span>ตั้งค่า</span>
        </button>
      </nav>

      {/* Nong Chalat AI Assistant Button - Visible to admin/assistant, toggled in settings */}
      {(sessionUser.userId === 'admin' || sessionUser.isAssistant === true) && settings.aiAssistantEnabled !== false && (
        <AiAssistant
          tasks={tasks}
          expenses={expenses}
          categories={settings.categories}
          todayStr={getThailandTodayStr()}
          onExecuteActions={handleExecuteAiActions}
          soundEnabled={settings.soundEnabled}
          soundVolume={settings.soundVolume}
          soundType={settings.soundType}
          settings={settings}
        />
      )}

      {/* App Install Prompt Modal for PWA */}
      <AppInstallModal
        isOpen={showInstallAppModal}
        onClose={() => setShowInstallAppModal(false)}
        accentColor={settings.colorAccent}
      />
    </div>
  );
}
