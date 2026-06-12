import React, { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, HelpCircle, CheckCircle, Info, Flame, AlertTriangle } from 'lucide-react';

interface DialogConfig {
  id: string;
  type: 'alert' | 'confirm';
  intent: 'info' | 'danger' | 'warning' | 'success';
  title?: string;
  message: string;
  resolve: (value: boolean) => void;
}

interface DialogContextType {
  showAlert: (message: string, title?: string, intent?: 'info' | 'danger' | 'warning' | 'success') => Promise<void>;
  showConfirm: (message: string, title?: string, intent?: 'info' | 'danger' | 'warning' | 'success') => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | null>(null);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a CustomDialogProvider');
  }
  return context;
}

export function CustomDialogProvider({ children }: { children: ReactNode }) {
  const [dialogs, setDialogs] = useState<DialogConfig[]>([]);

  const showAlert = (
    message: string,
    title: string = 'แจ้งเตือนสรุปผล',
    intent: 'info' | 'danger' | 'warning' | 'success' = 'info'
  ): Promise<void> => {
    return new Promise((resolve) => {
      const id = Math.random().toString();
      setDialogs((prev) => [
        ...prev,
        {
          id,
          type: 'alert',
          intent,
          title,
          message,
          resolve: () => {
            setDialogs((curr) => curr.filter((d) => d.id !== id));
            resolve();
          },
        },
      ]);
    });
  };

  const showConfirm = (
    message: string,
    title: string = 'โปรดยืนยันการดำเนินการ',
    intent: 'info' | 'danger' | 'warning' | 'success' = 'warning'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = Math.random().toString();
      setDialogs((prev) => [
        ...prev,
        {
          id,
          type: 'confirm',
          intent,
          title,
          message,
          resolve: (res: boolean) => {
            setDialogs((curr) => curr.filter((d) => d.id !== id));
            resolve(res);
          },
        },
      ]);
    });
  };

  const getIcon = (intent: string) => {
    switch (intent) {
      case 'success':
        return <CheckCircle className="w-10 h-10 text-emerald-500 flex-shrink-0" />;
      case 'danger':
        return <Flame className="w-10 h-10 text-rose-500 flex-shrink-0 animate-pulse" />;
      case 'warning':
        return <AlertTriangle className="w-10 h-10 text-amber-500 flex-shrink-0" />;
      default:
        return <Info className="w-10 h-10 text-sky-500 flex-shrink-0" />;
    }
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <AnimatePresence>
        {dialogs.map((dialog) => (
          <div
            key={dialog.id}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => dialog.resolve(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 15 }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
              className="relative w-full max-w-sm overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-xl dark:bg-slate-900 dark:border-slate-850 p-6 flex flex-col gap-4 text-left"
            >
              {/* Header section with Icon & Title */}
              <div className="flex items-start gap-4">
                <div className="p-1 rounded-xl bg-slate-50 dark:bg-slate-850">
                  {getIcon(dialog.intent)}
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {dialog.title}
                  </h3>
                  <p className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed font-medium">
                    {dialog.message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50 dark:border-slate-850">
                {dialog.type === 'confirm' && (
                  <button
                    type="button"
                    onClick={() => dialog.resolve(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-all dark:bg-slate-800 dark:border-slate-750 dark:text-slate-200 dark:hover:bg-slate-700/80 cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => dialog.resolve(true)}
                  className="px-5 py-2.5 rounded-xl text-white font-extrabold text-xs transition-all shadow-md active:scale-98 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent, #3b82f6)',
                    boxShadow: '0 4px 12px var(--accent-light, rgba(59, 130, 246, 0.25))',
                  }}
                >
                  {dialog.intent === 'danger' ? 'ยืนยันลบ' : 'ตกลง'}
                </button>
              </div>
            </motion.div>
          </div>
        ))}
      </AnimatePresence>
    </DialogContext.Provider>
  );
}
