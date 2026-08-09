import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

interface SettingsLockScreenProps {
  correctPassword: string;
  onUnlock: () => void;
  accentColor: string;
}

export default function SettingsLockScreen({ correctPassword, onUnlock, accentColor }: SettingsLockScreenProps) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input on load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleUnlockAttempt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!pin.trim()) {
      setErrorMsg('กรุณากรอกรหัสผ่านก่อนกดยืนยัน');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (pin === correctPassword) {
      setIsUnlocked(true);
      setErrorMsg('');
      setTimeout(() => {
        onUnlock();
      }, 300);
    } else {
      setErrorMsg('รหัสผ่านไม่ถูกต้อง! กรุณาตรวจสอบและลองใหม่อีกครั้ง');
      setPin('');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div id="settings-lock-screen" className="flex flex-col items-center justify-center min-h-[450px] p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -15 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center select-none"
      >
        {/* Animated Icon Lock State */}
        <div className="relative mb-5">
          <motion.div
            animate={isUnlocked ? { scale: [1, 1.1, 0.9, 1], rotate: [0, 10, -10, 0] } : shake ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transition-colors duration-300"
            style={{ 
              backgroundColor: isUnlocked ? '#10b981' : (errorMsg ? '#ef4444' : accentColor),
              color: '#ffffff'
            }}
          >
            {isUnlocked ? (
              <Unlock className="w-10 h-10 animate-pulse" />
            ) : (
              <Lock className="w-10 h-10" />
            )}
          </motion.div>
        </div>

        <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight text-center">
          ยืนยันรหัสผ่านเข้าสู่การตั้งค่า
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-medium text-center leading-relaxed">
          กรุณาป้อนรหัสผ่าน และกดยืนยันเพื่อเข้าใช้งาน
        </p>

        {/* Form with Input + Confirm Button */}
        <form onSubmit={handleUnlockAttempt} className="w-full mt-6 space-y-4">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={(e) => {
                setErrorMsg('');
                setPin(e.target.value);
              }}
              placeholder="ป้อนรหัสผ่านการตั้งค่า..."
              className={`w-full h-12 px-4 pr-12 text-center text-base tracking-[0.2em] font-black font-mono border rounded-2xl bg-slate-50 focus:bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 transition-all duration-200 outline-none ${
                errorMsg 
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-200' 
                  : 'border-slate-200 focus:border-accent focus:ring-2 focus:ring-accent/20'
              }`}
              style={{ '--accent': accentColor } as React.CSSProperties}
            />
            
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold animate-shake"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>⚠️ {errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Explicit Confirm Button */}
          <button
            type="submit"
            className="w-full h-12 rounded-2xl flex items-center justify-center text-xs sm:text-sm font-black text-white hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer shadow-lg gap-2"
            style={{ backgroundColor: accentColor }}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>ยืนยันเข้าใช้งาน</span>
          </button>
          
          <div className="text-center pt-1">
            <span className="text-[10px] font-semibold text-slate-400">
              * ต้องกดยืนยันรหัสผ่านเพื่อเข้าปรับแต่งระบบเสมอ
            </span>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
