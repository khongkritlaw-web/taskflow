import React from 'react';
import { motion } from 'motion/react';
import { Lock, LogOut, ShieldAlert, AlertTriangle } from 'lucide-react';

interface LockedUserViewProps {
  sessionUser: {
    userId: string;
    email: string;
    phone: string;
    displayName?: string;
  };
  accentColor: string;
  darkMode: boolean;
  onLogout: () => void;
}

export default function LockedUserView({
  sessionUser,
  accentColor,
  darkMode,
  onLogout
}: LockedUserViewProps) {
  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 font-sans transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100 dark' : 'bg-slate-50 text-slate-800'}`}>
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6"
      >
        {/* Visual Lock Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500 border border-rose-100 dark:border-rose-900/30">
              <Lock className="w-10 h-10 animate-bounce" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Text Header */}
        <div className="space-y-2">
          <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100 uppercase">
            บัญชีของคุณถูกล็อก
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Account Locked specifically (@{sessionUser.userId})
          </p>
        </div>

        {/* Warning card */}
        <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/20 text-left space-y-2">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>คำสั่งล็อกบัญชีเฉพาะเจาะจงโดยผู้ดูแลระบบ</span>
          </div>
          <p className="text-[11px] text-slate-550 dark:text-slate-400 leading-relaxed font-semibold">
            บัญชีเข้าใช้บริการนี้ได้ถูกสั่งระงับล็อกการเข้าถึงชั่วคราวหรือถาวรโดยแอดมิน เพื่อความปลอดภัยและตรวจสอบความสอดคล้องด้านกฎเกณฑ์ หากคุณเชื่อว่าเป็นความผิดพลาดหรือต้องการยื่นเรื่องปลดล็อก กรุณาติดต่อหน่วยงานดูแลหรือทำรายการเข้าสู่ระบบด้วยไอดีอื่นค่ะ
          </p>
        </div>

        {/* Contact info metadata */}
        <div className="pt-2 border-t border-slate-150 dark:border-slate-800 text-xs text-slate-400 space-y-1">
          <div className="flex justify-between">
            <span className="font-semibold text-slate-400">ชื่อโปรไฟล์:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{sessionUser.displayName || sessionUser.userId}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-400">อีเมลติดต่อ:</span>
            <span className="font-mono text-slate-600 dark:text-slate-400">{sessionUser.email || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-400">เบอร์โทรศัพท์:</span>
            <span className="font-mono text-slate-600 dark:text-slate-400">{sessionUser.phone || '-'}</span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full py-3 px-4 rounded-xl text-white font-black text-xs bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md"
        >
          <LogOut className="w-4 h-4" />
          <span>ออกจากระบบบัญชีนี้</span>
        </button>
      </motion.div>
    </div>
  );
}
