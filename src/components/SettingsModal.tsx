import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Palette, 
  Shield, 
  Bell, 
  FileText, 
  Database, 
  Smartphone, 
  ChevronRight, 
  Sparkles,
  Download,
  Lock,
  Volume2,
  Mail,
  Printer,
  Link as LinkIcon,
  Sun,
  Moon,
  Sliders,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { AppSettings, Task, Expense, CustomMenuLink, Announcement } from '../types';
import { ColorWheelPicker } from './ColorWheelPicker';
import BackupModule from './BackupModule';

// Theme Presets Definition
export const THEME_PRESETS = [
  { id: 'indigo-dream', nameTh: 'มหาเสน่ห์คราม (Indigo Dream)', category: 'executive', colorAccent: '#2563eb', colorAccentHover: '#1d4ed8', colorAccentLight: '#dbeafe', colorAccentText: '#ffffff', colorSidebarBg: '#0f172a', colorSidebarText: '#94a3b8', colorSidebarActive: '#2563eb', colorBgAppStart: '#f8fafc', colorBgAppEnd: '#e2e8f0', darkColorBgAppStart: '#090d16', darkColorBgAppEnd: '#030712', darkColorSidebarBg: '#050811' },
  { id: 'emerald-luxury', nameTh: 'มรกตพรีเมียม (Emerald Wealth)', category: 'nature', colorAccent: '#059669', colorAccentHover: '#047857', colorAccentLight: '#d1fae5', colorAccentText: '#ffffff', colorSidebarBg: '#022c22', colorSidebarText: '#6ee7b7', colorSidebarActive: '#059669', colorBgAppStart: '#f0fdf4', colorBgAppEnd: '#dcfce7', darkColorBgAppStart: '#021812', darkColorBgAppEnd: '#010f0b', darkColorSidebarBg: '#01120d' },
  { id: 'rose-gold', nameTh: 'โรสโกลด์หรูหรา (Rose Gold)', category: 'pastel', colorAccent: '#e11d48', colorAccentHover: '#be123c', colorAccentLight: '#ffe4e6', colorAccentText: '#ffffff', colorSidebarBg: '#1c1917', colorSidebarText: '#fda4af', colorSidebarActive: '#e11d48', colorBgAppStart: '#fff1f2', colorBgAppEnd: '#ffe4e6', darkColorBgAppStart: '#140508', darkColorBgAppEnd: '#0d0205', darkColorSidebarBg: '#120407' },
  { id: 'slate-corporate', nameTh: 'ผู้บริหารสุขุม (Slate Executive)', category: 'executive', colorAccent: '#475569', colorAccentHover: '#334155', colorAccentLight: '#f1f5f9', colorAccentText: '#ffffff', colorSidebarBg: '#0f172a', colorSidebarText: '#cbd5e1', colorSidebarActive: '#475569', colorBgAppStart: '#f8fafc', colorBgAppEnd: '#f1f5f9', darkColorBgAppStart: '#0b0f19', darkColorBgAppEnd: '#060911', darkColorSidebarBg: '#080c14' },
  { id: 'amber-sunset', nameTh: 'อำพันเรืองรอง (Amber Prestige)', category: 'vibrant', colorAccent: '#d97706', colorAccentHover: '#b45309', colorAccentLight: '#fef3c7', colorAccentText: '#ffffff', colorSidebarBg: '#1c1917', colorSidebarText: '#fde68a', colorSidebarActive: '#d97706', colorBgAppStart: '#fffbeb', colorBgAppEnd: '#fef3c7', darkColorBgAppStart: '#140c02', darkColorBgAppEnd: '#0c0701', darkColorSidebarBg: '#100902' },
  { id: 'purple-royalty', nameTh: 'ราชันสีม่วง (Imperial Purple)', category: 'executive', colorAccent: '#7c3aed', colorAccentHover: '#6d28d9', colorAccentLight: '#ede9fe', colorAccentText: '#ffffff', colorSidebarBg: '#1e1b4b', colorSidebarText: '#c4b5fd', colorSidebarActive: '#7c3aed', colorBgAppStart: '#faf5ff', colorBgAppEnd: '#f3e8ff', darkColorBgAppStart: '#0e081e', darkColorBgAppEnd: '#080412', darkColorSidebarBg: '#0c0618' },
  { id: 'cyber-neon', nameTh: 'ไซเบอร์พังก์ (Cyber Neon)', category: 'cyber', colorAccent: '#06b6d4', colorAccentHover: '#0891b2', colorAccentLight: '#cffafe', colorAccentText: '#ffffff', colorSidebarBg: '#082f49', colorSidebarText: '#67e8f9', colorSidebarActive: '#06b6d4', colorBgAppStart: '#ecfeff', colorBgAppEnd: '#cffafe', darkColorBgAppStart: '#02131d', darkColorBgAppEnd: '#010a0f', darkColorSidebarBg: '#020f17' },
  { id: 'midnight-oled', nameTh: 'มิดไนท์ถนอมสายตา (OLED Pure)', category: 'dark', colorAccent: '#3b82f6', colorAccentHover: '#2563eb', colorAccentLight: '#1e293b', colorAccentText: '#ffffff', colorSidebarBg: '#000000', colorSidebarText: '#94a3b8', colorSidebarActive: '#3b82f6', colorBgAppStart: '#000000', colorBgAppEnd: '#09090b', darkColorBgAppStart: '#000000', darkColorBgAppEnd: '#000000', darkColorSidebarBg: '#000000' }
];

export interface SettingsTopic {
  id: string;
  title: string;
  titleEn: string;
  desc: string;
  icon: string;
  category: string;
  badge?: string;
  accentClass?: string;
}

export const SETTINGS_TOPICS: SettingsTopic[] = [
  {
    id: 'branding',
    title: 'แบรนดิ้ง & หน้าตาเว็บ',
    titleEn: 'Brand Identity & Visual Theme',
    desc: 'ชื่อระบบ, โลโก้, รูปพื้นหลัง, โหมดมืด/สว่าง และวงล้อปรับโทนสีอัตโนมัติ',
    icon: 'Palette',
    category: 'ลักษณะภายนอก',
    badge: 'ดีไซน์',
    accentClass: 'from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400'
  },
  {
    id: 'account',
    title: 'บัญชีผู้ใช้ & ความปลอดภัย',
    titleEn: 'Account Security & Access PIN',
    desc: 'ชื่อผู้ใช้แอดมิน, รหัสผ่าน 6 หลัก และรหัส PIN ปลดล็อคหน้าต่างการตั้งค่า',
    icon: 'Shield',
    category: 'ความปลอดภัย',
    badge: 'สำคัญ',
    accentClass: 'from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400'
  },
  {
    id: 'notifications',
    title: 'การแจ้งเตือน & ระบบส่งเมล',
    titleEn: 'Sound, Web Push & SMTP Mailer',
    desc: 'เสียงสังเคราะห์, แจ้งเตือนพุชบนเบราว์เซอร์ และระบบ SMTP ส่งสรุปงานทางอีเมล',
    icon: 'Bell',
    category: 'การสื่อสาร',
    accentClass: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400'
  },
  {
    id: 'reports_links',
    title: 'พิมพ์รายงาน & ลิงก์เสริม',
    titleEn: 'Print/PDF Report & External Links',
    desc: 'ออกแบบดีไซน์หน้าพิมพ์ PDF และจัดการเมนูปุ่มเชื่อมโยงเว็บไซต์ภายนอก',
    icon: 'FileText',
    category: 'เอกสาร & ทางลัด',
    accentClass: 'from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400'
  },
  {
    id: 'backup',
    title: 'สำรองข้อมูล & กู้คืนระบบ',
    titleEn: 'Cloud Backup, JSON & Excel Sync',
    desc: 'สำรองและกู้คืนฐานข้อมูล กู้คืนจากคลาวด์ ส่งออกไฟล์ Excel และเชื่อมโยง Google Drive',
    icon: 'Database',
    category: 'ฐานข้อมูล',
    badge: 'คลาวด์',
    accentClass: 'from-cyan-500/10 to-blue-500/10 text-cyan-600 dark:text-cyan-400'
  },
  {
    id: 'pwa_app',
    title: 'ติดตั้งเป็นแอป (PWA App)',
    titleEn: 'Progressive Web App Installation',
    desc: 'ติดตั้งเป็นแอปพลิเคชันเต็มรูปแบบบน iOS, Android, Mac และ Windows ไร้แถบ URL',
    icon: 'Smartphone',
    category: 'แอปพลิเคชัน',
    badge: 'PWA Ready',
    accentClass: 'from-rose-500/10 to-pink-500/10 text-rose-600 dark:text-rose-400'
  }
];

interface SettingsModalProps {
  activeTopicId: string | null;
  onClose: () => void;
  tempSettings: AppSettings | null;
  setTempSettings: (settings: AppSettings | null) => void;
  settings: AppSettings;
  editUsername: string;
  setEditUsername: (val: string) => void;
  editPassword: string;
  setEditPassword: (val: string) => void;
  profileSaving: boolean;
  profileMessage: { text: string; type: 'ok' | 'err' } | null;
  handleUpdateAccount: (u: string, p: string) => Promise<void>;
  browserPermission: string;
  handleRequestNotificationPermission: () => Promise<void>;
  handleTestNotification: () => void;
  playNotificationSound: (type: any, vol: number) => void;
  newLinkTitle: string;
  setNewLinkTitle: (val: string) => void;
  newLinkUrl: string;
  setNewLinkUrl: (val: string) => void;
  newLinkIcon: string;
  setNewLinkIcon: (val: any) => void;
  editingLinkId: string | null;
  handleAddMenuLink: () => Promise<void>;
  moveMenuLinkUp: (id: string) => void;
  moveMenuLinkDown: (id: string) => void;
  handleEditMenuLinkStart: (link: CustomMenuLink) => void;
  handleRemoveMenuLink: (id: string) => Promise<void>;
  tasks: Task[];
  expenses: Expense[];
  handleCloudRestore: (data: { tasks?: Task[]; expenses?: Expense[]; settings?: AppSettings }) => Promise<void>;
  sessionUser: any;
  allUsersList: any[];
  dbAnnouncements: Announcement[];
  adminAnnouncements: Announcement[];
  adminCustomLinks: CustomMenuLink[];
  setShowInstallAppModal: (show: boolean) => void;
  presetCategoryFilter: string;
  setPresetCategoryFilter: (val: string) => void;
  applyThemePreset: (presetId: string) => void;
  handleAccentColorChangeInput: (hex: string) => void;
  harmoniousMode: boolean;
  setHarmoniousMode: (val: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  activeTopicId,
  onClose,
  tempSettings,
  setTempSettings,
  settings,
  editUsername,
  setEditUsername,
  editPassword,
  setEditPassword,
  profileSaving,
  profileMessage,
  handleUpdateAccount,
  browserPermission,
  handleRequestNotificationPermission,
  handleTestNotification,
  playNotificationSound,
  newLinkTitle,
  setNewLinkTitle,
  newLinkUrl,
  setNewLinkUrl,
  newLinkIcon,
  setNewLinkIcon,
  editingLinkId,
  handleAddMenuLink,
  moveMenuLinkUp,
  moveMenuLinkDown,
  handleEditMenuLinkStart,
  handleRemoveMenuLink,
  tasks,
  expenses,
  handleCloudRestore,
  sessionUser,
  allUsersList,
  dbAnnouncements,
  adminAnnouncements,
  adminCustomLinks,
  setShowInstallAppModal,
  presetCategoryFilter,
  setPresetCategoryFilter,
  applyThemePreset,
  handleAccentColorChangeInput,
  harmoniousMode,
  setHarmoniousMode
}) => {
  if (!activeTopicId) return null;

  const currentTopic = SETTINGS_TOPICS.find(t => t.id === activeTopicId) || SETTINGS_TOPICS[0];
  const activeSettings = tempSettings || settings;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Palette': return <Palette className="w-5 h-5" />;
      case 'Shield': return <Shield className="w-5 h-5" />;
      case 'Bell': return <Bell className="w-5 h-5" />;
      case 'FileText': return <FileText className="w-5 h-5" />;
      case 'Database': return <Database className="w-5 h-5" />;
      case 'Smartphone': return <Smartphone className="w-5 h-5" />;
      default: return <Sliders className="w-5 h-5" />;
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* MODAL HEADER */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 backdrop-blur-md flex-shrink-0">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm flex-shrink-0"
                style={{ backgroundColor: activeSettings.colorAccent }}
              >
                {renderIcon(currentTopic.icon)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-850 dark:text-slate-100">
                    {currentTopic.title}
                  </h3>
                  {currentTopic.badge && (
                    <span 
                      className="px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white"
                      style={{ backgroundColor: activeSettings.colorAccent }}
                    >
                      {currentTopic.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  {currentTopic.titleEn}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer"
              title="ปิดหน้าต่างตั้งค่า"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* MODAL CONTENT BODY */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* SUB-TAB: BRANDING */}
            {activeTopicId === 'branding' && (
              <div className="space-y-6 text-left">
                {/* Section 1: Brand Identity */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-200/50 dark:border-slate-800">
                    <span>🖼️</span> อัตลักษณ์ระบบ & ข้อมูลแอปหลัก (App Brand Identity)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1 dark:text-slate-400">ชื่อระบบงานแอปพลิเคชัน (App Name)</label>
                      <input
                        type="text"
                        value={activeSettings.appName || ''}
                        onChange={(e) => {
                          if (tempSettings) setTempSettings({ ...tempSettings, appName: e.target.value });
                        }}
                        className="w-full h-11 px-3 border border-slate-200 bg-white focus:border-accent dark:focus:border-accent dark:focus:bg-slate-900 rounded-lg text-xs font-bold text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1 dark:text-slate-400">คำอธิบายหรือคำนิยามระบบ (App Description)</label>
                      <input
                        type="text"
                        value={activeSettings.appDesc || ''}
                        onChange={(e) => {
                          if (tempSettings) setTempSettings({ ...tempSettings, appDesc: e.target.value });
                        }}
                        className="w-full h-11 px-3 border border-slate-200 bg-white focus:border-accent dark:focus:border-accent dark:focus:bg-slate-900 rounded-lg text-xs font-bold text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  {/* Logo Upload Box */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1.5 dark:text-slate-400">อัปโหลดรูปภาพโลโก้ หรือ ป้อนลิงก์ URL (Logo Image File / URL)</label>
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
                            const fileInput = document.getElementById('modal-logo-file-input');
                            if (fileInput) fileInput.click();
                          }}
                        >
                          <input
                            id="modal-logo-file-input"
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
                          {activeSettings.appLogoUrl ? (
                            <div className="flex items-center gap-3 w-full">
                              <div className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <img
                                  src={activeSettings.appLogoUrl}
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
                                className="text-[10px] font-black text-rose-500 hover:text-rose-650 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer"
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
                          value={activeSettings.appLogoUrl || ''}
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
                <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-5">
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
                          !activeSettings.darkMode
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
                          activeSettings.darkMode
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
                        const isActive = activeSettings.themePreset === preset.id;
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
                        color={activeSettings.colorAccent || '#2563eb'}
                        onChange={(newHex) => handleAccentColorChangeInput(newHex)}
                      />

                      {/* Color Wheel 2: Light Mode App Background */}
                      <ColorWheelPicker
                        label="สีพื้นหลังโหมดสว่าง (Light App Background)"
                        description="สีพื้นหลังหลักเมื่อเปิดใช้งานโหมดสว่าง (Light Mode)"
                        color={activeSettings.colorBgAppStart || '#f8fafc'}
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
                        color={activeSettings.darkColorBgAppStart || '#0f172a'}
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
                        color={activeSettings.darkMode ? (activeSettings.darkColorSidebarBg || '#0b0f19') : (activeSettings.colorSidebarBg || '#ffffff')}
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
                </div>

                {/* Section 3: Background & Dark Mode */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 dark:text-slate-400">สไตล์การแสดงผลพื้นหลังเว็บไซต์ (Background Style)</label>
                    <select
                      value={activeSettings.bgStyle || 'theme-custom'}
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

                    {activeSettings.bgStyle === 'custom' && (
                      <div className="mt-2.5">
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">ลิงก์รูปภาพพื้นหลังเว็บไซต์ URL:</label>
                        <input
                          type="text"
                          value={activeSettings.customBgUrl || ''}
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
                        checked={activeSettings.darkMode || false}
                        onChange={(e) => {
                          if (tempSettings) setTempSettings({ ...tempSettings, darkMode: e.target.checked });
                        }}
                        className="w-4.5 h-4.5 cursor-pointer accent-accent"
                        style={{ '--accent': activeSettings.colorAccent } as React.CSSProperties}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: AI Floating Button Toggle */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-4 text-left">
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
                        checked={activeSettings.aiAssistantEnabled !== false}
                        onChange={(e) => {
                          if (tempSettings) setTempSettings({ ...tempSettings, aiAssistantEnabled: e.target.checked });
                        }}
                        className="w-4.5 h-4.5 cursor-pointer accent-accent"
                        style={{ '--accent': activeSettings.colorAccent } as React.CSSProperties}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB: ACCOUNT & SECURITY */}
            {activeTopicId === 'account' && (
              <div className="space-y-6 text-left">
                <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-200/50 dark:border-slate-800">
                    <span>🔐</span> ข้อมูลเข้าสู่ระบบหลักบัญชีเจ้าของเครื่อง (Main Account Security)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1.5 dark:text-slate-400">ชื่อผู้ใช้งานเพื่อล็อกอิน (Admin Username)</label>
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
                      <label className="block text-[11px] font-bold text-slate-600 mb-1.5 dark:text-slate-400">รหัสผ่านลับปลดล็อก (Secret Password - 6 หลัก)</label>
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
                      style={{ backgroundColor: activeSettings.colorAccent }}
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

                <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-200/50 dark:border-slate-800">
                    <span>🔒</span> พินจำกัดสิทธิ์เข้าหน้าต่างตั้งค่า (Settings View Access PIN)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1.5 dark:text-slate-400">รหัสล็อกควบคุมหน้าตั้งค่าปัจจุบัน (พินเริ่มต้น 0000)</label>
                      <input
                        type="text"
                        maxLength={12}
                        value={activeSettings.settingsPassword || '0000'}
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
            {activeTopicId === 'notifications' && (
              <div className="space-y-6 text-left">
                {/* Audio & Sounds Card */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-4">
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
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 flex-shrink-0 cursor-pointer ${
                          activeSettings.soundEnabled !== false ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${activeSettings.soundEnabled !== false ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1 dark:text-slate-400">สไตล์โทนเสียงเอฟเฟกต์หลัก (Primary App Sound)</label>
                      <select
                        value={activeSettings.soundType || 'chime'}
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
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">ระดับเสียงเอฟเฟกต์ (Sound Volume)</label>
                        <span className="text-[10px] bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400 px-1.5 py-0.5 rounded font-extrabold">{activeSettings.soundVolume ?? 80}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={activeSettings.soundVolume ?? 80}
                        onChange={(e) => {
                          if (tempSettings) setTempSettings({ ...tempSettings, soundVolume: Number(e.target.value) });
                        }}
                        className="w-full accent-rose-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-800"
                      />
                    </div>

                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => playNotificationSound(activeSettings.soundType || 'chime', activeSettings.soundVolume ?? 80)}
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
                          checked={activeSettings.soundOnComplete !== false}
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
                          checked={activeSettings.soundOnAdd !== false}
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
                <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-4">
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
                      className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 flex-shrink-0 cursor-pointer ${
                        activeSettings.emailNotificationEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${activeSettings.emailNotificationEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 dark:text-slate-400">อีเมลปลายทางผู้รับรายงาน (Executive Recipient)</label>
                    <input
                      type="email"
                      placeholder="executive@company.com"
                      value={activeSettings.emailRecipient || ''}
                      onChange={(e) => {
                        if (tempSettings) setTempSettings({ ...tempSettings, emailRecipient: e.target.value });
                      }}
                      className="w-full h-11 px-3 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                    />
                  </div>

                  {/* SMTP detail fields inside white sub-card */}
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
                          value={activeSettings.smtpHost || ''}
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
                            value={activeSettings.smtpPort || ''}
                            onChange={(e) => {
                              if (tempSettings) setTempSettings({ ...tempSettings, smtpPort: parseInt(e.target.value) || 587 });
                            }}
                            className="w-full h-10 px-3 border border-slate-200 bg-slate-50 rounded-lg text-xs text-slate-850 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold mb-1">SSL/TLS</label>
                          <select
                            value={activeSettings.smtpSecure ? 'true' : 'false'}
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
                          value={activeSettings.smtpUser || ''}
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
                          value={activeSettings.smtpPass || ''}
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
                <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
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
                            className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 flex-shrink-0 cursor-pointer ${
                              activeSettings.nativeNotificationsEnabled !== false ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                          >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${activeSettings.nativeNotificationsEnabled !== false ? 'translate-x-[18px]' : 'translate-x-0'}`} />
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
            {activeTopicId === 'reports_links' && (
              <div className="space-y-6 text-left">
                {/* Print Styling Card */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-200/50 dark:border-slate-800">
                    <span>🖨️</span> รูปแบบรายงานสรุป PDF & ตราสารใบเสร็จ (Print & PDF Styling)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1 dark:text-slate-400">หัวข้อหลักบนหน้าเอกสาร (Report Document Title)</label>
                      <input
                        type="text"
                        placeholder="เช่น รายงานสรุปผลงานและค่าใช้จ่ายประจำสัปดาห์"
                        value={activeSettings.printTitle || ''}
                        onChange={(e) => {
                          if (tempSettings) setTempSettings({ ...tempSettings, printTitle: e.target.value });
                        }}
                        className="w-full h-11 px-3 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1 dark:text-slate-400">คำสโลแกน / จ่าหน้ารองลงมา (Report Subtitle / Header)</label>
                      <input
                        type="text"
                        placeholder="เช่น ระบบบัญชีส่วนบุคคลและติดตามเป้าหมายบริษัท"
                        value={activeSettings.printSubtitle || ''}
                        onChange={(e) => {
                          if (tempSettings) setTempSettings({ ...tempSettings, printSubtitle: e.target.value });
                        }}
                        className="w-full h-11 px-3 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1 dark:text-slate-400">รูปแบบการออกแบบดีไซน์หน้ากระดาษ (PDF Layout Pattern)</label>
                      <select
                        value={activeSettings.printTemplatePattern || 'formal'}
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
                      <label className="block text-[11px] font-bold text-slate-600 mb-1 dark:text-slate-400">หมายเหตุด้านท้ายหน้ากระดาษ (Report Footer Text)</label>
                      <input
                        type="text"
                        placeholder="เช่น เอกสารประเมินสรุปสถิติคลาวด์อัตโนมัติ"
                        value={activeSettings.printFooterText || ''}
                        onChange={(e) => {
                          if (tempSettings) setTempSettings({ ...tempSettings, printFooterText: e.target.value });
                        }}
                        className="w-full h-11 px-3 border border-slate-200 bg-white rounded-lg text-xs font-bold text-slate-800 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom external navigation links Card */}
                <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-200/50 dark:border-slate-800">
                      <span>🔗</span> ลิงก์เชื่อมโยงภายนอก & ปุ่มเมนูเสริมแถบสไลด์ (External Navigation Links)
                    </h4>
                    <p className="text-[10px] text-slate-450 mt-1.5">เพิ่มเมนูย่อยเพื่อลิงก์ไปยังเว็บภายนอก ซึ่งจะเปิดในแท็บใหม่ทันที และปรากฏที่เมนูแถบข้างโดยอัตโนมัติ</p>
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
                              style={newLinkIcon === item.name ? { borderColor: activeSettings.colorAccent } : {}}
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
                        style={{ backgroundColor: activeSettings.colorAccent }}
                      >
                        <span>{editingLinkId ? '💾 อัปเดตลิงก์ย่อย' : '➕ เพิ่มเมนูลิงก์ใหม่'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Links list */}
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-bold text-slate-500">รายการเมนูปุ่มลิงก์เสริมที่มีอยู่ขณะนี้ ({activeSettings.customMenuLinks?.length || 0} ลิงก์):</h5>
                    {!activeSettings.customMenuLinks || activeSettings.customMenuLinks.length === 0 ? (
                      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl text-center text-slate-400 font-medium">
                        🏖️ ยังไม่มีลิงก์ภายนอกเสริมที่ติดตั้งไว้ สามารถกดเพิ่มจากแบบฟอร์มด้านบนได้เลยค่ะ
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(activeSettings.customMenuLinks || []).map((link, idx) => {
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
                                  disabled={idx === (activeSettings.customMenuLinks || []).length - 1}
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
            {activeTopicId === 'backup' && (
              <div className="space-y-6 text-left">
                <BackupModule
                  tasks={tasks}
                  expenses={expenses}
                  settings={settings}
                  onRestore={handleCloudRestore}
                  accentColor={activeSettings.colorAccent}
                  sessionUser={sessionUser}
                  allUsersList={allUsersList}
                  announcements={dbAnnouncements.length > 0 ? dbAnnouncements : adminAnnouncements}
                  customMenuLinks={adminCustomLinks.length > 0 ? adminCustomLinks : (activeSettings.customMenuLinks || [])}
                />
              </div>
            )}

            {/* SUB-TAB: PWA APP INSTALLATION */}
            {activeTopicId === 'pwa_app' && (
              <div className="space-y-6 text-left">
                <div className="bg-slate-50 dark:bg-slate-950/40 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-5">
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
                          {activeSettings.appName || 'TaskFlow Space Executive Pro'}
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          เวอร์ชัน Progressive Web App พร้อมระบบออฟไลน์แคช
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        setShowInstallAppModal(true);
                      }}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl text-white font-black text-xs flex items-center justify-center gap-2 shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                      style={{ backgroundColor: activeSettings.colorAccent }}
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

          {/* MODAL FOOTER */}
          <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70 flex items-center justify-between flex-shrink-0">
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              💡 เมื่อปรับแต่งเสร็จแล้ว การตั้งค่าจะพร้อมบันทึกหรือยกเลิกที่แถบด้านล่างของหน้าจอ
            </p>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-extrabold text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
