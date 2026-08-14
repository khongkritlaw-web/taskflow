import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface AppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor?: string;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA)
    const checkStandalone = () => {
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };

    checkStandalone();

    // Check if iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture beforeinstallprompt for Chrome/Edge/Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // App installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) {
      return false;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable,
    isInstalled,
    isIOS,
    triggerInstall,
    deferredPrompt
  };
}

export function AppInstallModal({ isOpen, onClose, accentColor = '#4f46e5' }: AppInstallModalProps) {
  const { isInstallable, isInstalled, isIOS, triggerInstall } = usePWAInstall();
  const [installSuccess, setInstallSuccess] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await triggerInstall();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          {/* Backdrop click to close */}
          <div className="fixed inset-0" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative z-10 my-auto"
          >
            {/* Header banner */}
            <div 
              className="p-6 text-white relative overflow-hidden flex flex-col justify-between"
              style={{ backgroundColor: accentColor }}
            >
              {/* Decorative background circles */}
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/15 blur-xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-black/10 blur-lg pointer-events-none" />

              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-lg p-2 flex items-center justify-center flex-shrink-0">
                    <img src="/favicon.svg" alt="App Icon" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                        TaskFlow Pro
                      </h2>
                      <span className="text-[10px] bg-white/20 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-xs">
                        App Mode
                      </span>
                    </div>
                    <p className="text-xs text-white/90 font-medium mt-0.5">
                      ติดตั้งเป็นแอปพลิเคชันใช้งานบนหน้าจอมือถือ & คอมพิวเตอร์
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {isInstalled || installSuccess ? (
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                  <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                    แอปพลิเคชันได้รับการติดตั้งเรียบร้อยแล้ว! 🎉
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    คุณสามารถเปิดใช้งาน TaskFlow Pro ได้ทันทีจากหน้าจอโฮมสกรีนหรือเมนูแอปพลิเคชันของเครื่องได้เลยค่ะ
                  </p>
                </div>
              ) : (
                <>
                  {/* Key App Benefits */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center gap-1.5">
                      <Zap className="w-5 h-5 text-amber-500" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">เปิดแอปได้ทันที</span>
                      <span className="text-[10px] text-slate-500">แตะเปิดจากหน้าจอโฮม ไม่ต้องพิมพ์ URL</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center gap-1.5">
                      <Smartphone className="w-5 h-5 text-indigo-500" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">เต็มจอไร้ขอบ</span>
                      <span className="text-[10px] text-slate-500">สัมผัสเต็มจอ ไร้แถบ URL กวนใจเหมือนแอปแท้</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center gap-1.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">ประหยัดเน็ต & แคช</span>
                      <span className="text-[10px] text-slate-500">โหลดข้อมูลได้เร็วขึ้น รองรับระบบแคชในเครื่อง</span>
                    </div>
                  </div>

                  {/* Native Install Button (Chrome / Android / Desktop) */}
                  {isInstallable && (
                    <button
                      type="button"
                      onClick={handleInstallClick}
                      className="w-full py-3.5 px-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Download className="w-5 h-5" />
                      <span>กดเพื่อติดตั้งแอปพลิเคชันลงในเครื่องทันที</span>
                    </button>
                  )}

                  {/* iOS / Safari Instruction Guide */}
                  {isIOS ? (
                    <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 space-y-3">
                      <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200 font-black text-xs">
                        <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>วิธีติดตั้งสำหรับ iPhone / iPad (Safari)</span>
                      </div>
                      <ol className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <li className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                          <span>แตะที่ปุ่ม <strong className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 font-bold"><Share2 className="w-3 h-3" /> แชร์ (Share)</strong> ที่แถบด้านล่างของ Safari</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                          <span>เลื่อนลงมาแล้วเลือกเมนู <strong className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 font-bold"><PlusSquare className="w-3 h-3" /> เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)</strong></span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                          <span>แตะ <strong className="text-indigo-600 dark:text-indigo-400 font-bold">"เพิ่ม (Add)"</strong> ที่มุมขวาบน ไอคอนแอปจะไปปรากฏบนหน้าจอมือถือของคุณทันที!</span>
                        </li>
                      </ol>
                    </div>
                  ) : !isInstallable ? (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs">
                        <Monitor className="w-4 h-4 text-indigo-500" />
                        <span>วิธีติดตั้งบนคอมพิวเตอร์ & เบราว์เซอร์อื่นๆ</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        คุณสามารถคลิกที่ไอคอน <strong>"ติดตั้งแอป (Install App)"</strong> ที่แถบ Address bar ของ Google Chrome หรือ Microsoft Edge หรือกดที่เมนู 3 จุด <span className="font-mono font-bold">⋮</span> แล้วเลือก <strong>"ติดตั้ง TaskFlow Pro..."</strong>
                      </p>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>PWA Progressive Web App</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function AppInstallButton({ accentColor = '#4f46e5', onClick }: { accentColor?: string; onClick: () => void }) {
  const { isInstalled } = usePWAInstall();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs ${
        isInstalled 
          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' 
          : 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
      }`}
      title={isInstalled ? "กำลังทำงานในโหมดแอปพลิเคชัน" : "คลิกเพื่อติดตั้งเป็นแอปพลิเคชัน (Add to Home Screen)"}
    >
      {isInstalled ? (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span className="hidden sm:inline">โหมดแอป</span>
        </>
      ) : (
        <>
          <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>ติดตั้งแอป</span>
        </>
      )}
    </button>
  );
}
