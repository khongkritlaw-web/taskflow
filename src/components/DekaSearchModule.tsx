import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ExternalLink, 
  RotateCcw,
  X,
  Info,
  Maximize2
} from 'lucide-react';

interface DekaSearchModuleProps {
  accentColor: string;
  darkMode: boolean;
}

export default function DekaSearchModule({ accentColor, darkMode }: DekaSearchModuleProps) {
  const targetUrl = 'https://deka.supremecourt.or.th/';
  const [key, setKey] = useState(0); // Used to force reload/reset iframe to home
  const [showWarning, setShowWarning] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleOpenDirectly = () => {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleReset = () => {
    setKey(prev => prev + 1); // Triggers re-render of iframe to reset to targetUrl
  };

  return (
    <div className="space-y-3">
      {/* Sleek Minimal Control Bar */}
      <div className="flex items-center justify-between px-2 py-1">
        {/* Left Side: Back/Reset Button */}
        <button
          onClick={handleReset}
          className="h-9 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
          title="ย้อนกลับไปหน้าแรกของการสืบค้น"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
          <span>ย้อนกลับ / เริ่มใหม่</span>
        </button>

        {/* Right Side: Open Full Window Button */}
        <button
          onClick={handleOpenDirectly}
          className="h-9 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-amber-500/10"
          title="เปิดหน้าเว็บศาลฎีกาขนาดเต็มจอในแท็บใหม่"
        >
          <span>เปิดหน้าเว็บเต็มจอ</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Full-Screen Web Frame Container */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden flex flex-col h-[calc(100vh-10rem)] min-h-[450px] sm:min-h-[720px] shadow-2xl relative">
        
        {/* Frame Contents */}
        <div className="flex-1 w-full h-full relative bg-slate-900">
          <iframe
            key={key}
            ref={iframeRef}
            src={targetUrl}
            title="ระบบสืบค้นฎีกา - ศาลฎีกา"
            className="w-full h-full border-none bg-white"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
            referrerPolicy="no-referrer"
          />

          {/* Floating warning banner (dismissible) at the bottom */}
          <AnimatePresence>
            {showWarning && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-4 left-4 right-4 md:left-6 md:right-6 bg-slate-950/95 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md shadow-2xl"
              >
                <div className="flex items-start gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                    <Info className="w-4.5 h-4.5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>คำแนะนำในการสืบค้นคดีศาลฎีกา</span>
                      <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md font-normal">ปลอดภัยสูงสุด</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      หากอุปกรณ์หรือเบราว์เซอร์แสดงผลเป็นหน้าจอว่างเปล่าเนื่องจากความปลอดภัยระดับสูงของระบบศาล (X-Frame Option) กรุณากดปุ่ม <strong className="text-amber-400 font-semibold cursor-pointer underline" onClick={handleOpenDirectly}>"เปิดหน้าเว็บเต็มจอ"</strong> เพื่อใช้งานได้ทันที 100%
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-shrink-0">
                  <button
                    onClick={handleOpenDirectly}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-[11px] font-bold text-slate-950 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>เปิดหน้าเว็บเต็มจอ</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowWarning(false)}
                    className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="ปิดการแจ้งเตือน"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
