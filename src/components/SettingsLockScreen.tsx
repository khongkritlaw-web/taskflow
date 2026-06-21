import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, Eye, EyeOff, KeyRound, Delete } from 'lucide-react';

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
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input on load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleUnlockAttempt = (enteredPin: string) => {
    if (enteredPin === correctPassword) {
      setIsUnlocked(true);
      setErrorMsg('');
      setTimeout(() => {
        onUnlock();
      }, 300); // Small delay to let green animation finish
    } else {
      setErrorMsg('รหัสความปลอดภัยไม่ถูกต้อง กรุณาลองอีกครั้ง');
      setPin('');
      // Trigger short shake animation
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyPress = (num: string) => {
    setErrorMsg('');
    const newPin = pin + num;
    setPin(newPin);
    
    // Auto-attempt when PIN reaches correct password length if only numbers, but let's allow Enter key or custom length
    if (newPin === correctPassword) {
      handleUnlockAttempt(newPin);
    }
  };

  const handleBackspace = () => {
    setErrorMsg('');
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleUnlockAttempt(pin);
  };

  return (
    <div id="settings-lock-screen" className="flex flex-col items-center justify-center min-h-[500px] p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -15 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center select-none"
      >
        {/* Animated Icon Lock State */}
        <div className="relative mb-6">
          <motion.div
            animate={isUnlocked ? { scale: [1, 1.1, 0.9, 1], rotate: [0, 10, -10, 0] } : {}}
            transition={{ duration: 0.5 }}
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
          
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-500">
            PIN
          </div>
        </div>

        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight text-center">
          เมนูตั้งค่านี้ถูกจำกัดสิทธิ์
        </h2>
        <p className="text-xs text-slate-400 mt-1.5 font-semibold text-center leading-relaxed">
          กรุณาป้อนรหัสความปลอดภัยผ่านแผงปุ่มด้านล่างเพื่อปลดล็อกเข้าสู่ตัวเลือก
        </p>

        {/* Input PIN Box */}
        <form onSubmit={handleSubmit} className="w-full mt-6 space-y-4">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={(e) => {
                setErrorMsg('');
                setPin(e.target.value);
              }}
              placeholder="ป้อนรหัสล็อก (ค่าเริ่มต้นคือ 0000)"
              className={`w-full h-12 px-4 pr-12 text-center text-lg tracking-[0.4em] font-black font-mono border rounded-2xl bg-slate-50 focus:bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 transition-all duration-200 outline-none ${
                errorMsg 
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200' 
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
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-[11px] font-bold text-rose-500 text-center animate-shake"
              >
                ⚠️ {errorMsg}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Keypad Layout */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <motion.button
                key={num}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => handleKeyPress(String(num))}
                className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center font-bold text-base text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs active:bg-slate-200"
              >
                {num}
              </motion.button>
            ))}
            
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={handleBackspace}
              className="h-12 rounded-xl bg-slate-100/50 hover:bg-slate-150 text-slate-500 dark:bg-slate-950/50 dark:hover:bg-slate-900 flex items-center justify-center transition-all cursor-pointer border border-transparent dark:border-slate-800"
              title="ลบตัวเลขหลังสุด"
            >
              <Delete className="w-5 h-5" />
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => handleKeyPress('0')}
              className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center font-bold text-base text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-xs active:bg-slate-205"
            >
              0
            </motion.button>

            <motion.button
              type="submit"
              whileTap={{ scale: 0.95 }}
              className="h-12 rounded-xl flex items-center justify-center text-xs font-black text-white hover:opacity-95 transition-all cursor-pointer shadow-md"
              style={{ backgroundColor: accentColor }}
            >
              <KeyRound className="w-4 h-4 mr-1" />
              ตกลง
            </motion.button>
          </div>
          
          <div className="text-center pt-2">
            <span className="text-[10px] font-bold text-slate-400">
              * รหัสล็อกป้องกันการแก้ไขค่าอุปกรณ์ส่วนตัว
            </span>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
