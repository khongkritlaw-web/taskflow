import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Camera, 
  UploadCloud, 
  Check, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase'; // verify this matches imports

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionUser: {
    userId: string;
    email: string;
    phone: string;
    password?: string;
    displayName?: string;
    avatarUrl?: string;
  };
  onProfileUpdated: (updatedProfile: {
    userId: string;
    email: string;
    phone: string;
    password?: string;
    displayName?: string;
    avatarUrl?: string;
  }) => void;
  accentColor: string;
}

export function EditProfileModal({ 
  isOpen, 
  onClose, 
  sessionUser, 
  onProfileUpdated, 
  accentColor 
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync inputs with profile data when modal is launched
  useEffect(() => {
    if (isOpen) {
      setDisplayName(sessionUser.displayName || '');
      setEmail(sessionUser.email || '');
      setPhone(sessionUser.phone || '');
      setPassword(sessionUser.password || '');
      setAvatarUrl(sessionUser.avatarUrl || '');
      setErrorText('');
      setSuccessText('');
    }
  }, [isOpen, sessionUser]);

  // Image shrink / downscaling helper utilizing HTML Canvas before sync
  const compressImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 160; // perfect 160x160 size for profile resolution
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64Str = canvas.toDataURL('image/jpeg', 0.85); // compress with 85% high fidelity quality
          setAvatarUrl(base64Str);
          setSuccessText('โหลดและตรวจสอบรูปภาพเรียบร้อยแล้วค่ะ!');
          setErrorText('');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setErrorText('กรุณาเลือกไฟล์รูปภาพเท่านั้นค่ะ');
        return;
      }
      compressImageFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) {
        setErrorText('กรุณาเลือกไฟล์ประเภทรูปภาพเท่านั้นค่ะ');
        return;
      }
      compressImageFile(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setSuccessText('');
    setSaving(true);

    try {
      if (!displayName.trim()) {
        throw new Error('กรุณากรอกชื่อผู้ใช้ / ชื่อแสดงตัวตนด้วยค่ะ');
      }

      const updatedData = {
        userId: sessionUser.userId,
        displayName: displayName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password.trim(),
        avatarUrl: avatarUrl,
        uid: localStorage.getItem('sess_uid') || sessionUser.userId,
      };

      // 1. Persist directly to Firebase Firestore users collection
      const userRef = doc(db, 'users', sessionUser.userId);
      await setDoc(userRef, updatedData, { merge: true });

      // 2. Persist locally to storage for offline instant boot
      localStorage.setItem(`profile_${sessionUser.userId}`, JSON.stringify(updatedData));
      
      // Update phone and email fields in main state/local attributes
      localStorage.setItem('user_email', email.trim());
      localStorage.setItem('user_phone', phone.trim());
      if (password.trim()) {
        localStorage.setItem('user_password', password.trim());
      }

      // 3. Dispatch changes to parent application
      onProfileUpdated(updatedData);

      setSuccessText('✅ บันทึกและซิงก์ข้อมูลส่วนตัวขึ้นฐานข้อมูล Cloud เรียบร้อยแล้วค่ะ!');
      
      // Auto-dismiss inside 1.5 seconds so user can resume work
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('Save profile error:', err);
      setErrorText(err.message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้งค่ะ');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Modal Content Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header section */}
          <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30">
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm"
                style={{ backgroundColor: accentColor }}
              >
                👤
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm leading-tight text-left">
                  แก้ไขข้อมูลส่วนตัว & รูปภาพโปรไฟล์
                </h3>
                <p className="text-[10px] text-slate-400 font-medium text-left">
                  ข้อมูลจะถูกซิงก์เรียลไทม์ข้ามทุกอุปกรณ์ทันทีค่ะ
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 px-1.5 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Scroll Area */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5 text-left">
            {errorText && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5 font-semibold">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorText}</span>
              </div>
            )}

            {successText && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-150 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2.5 font-bold">
                <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{successText}</span>
              </div>
            )}

            {/* Profile Avatar Selection Block */}
            <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-50 dark:bg-slate-950/45 p-4 rounded-2xl border border-slate-150/50 dark:border-slate-800/60">
              <div className="relative group flex-shrink-0">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center font-extrabold text-2xl text-white select-none shadow-md overflow-hidden bg-slate-200 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 relative"
                  style={!avatarUrl ? { backgroundColor: accentColor } : {}}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span>{displayName ? displayName.charAt(0).toUpperCase() : (sessionUser.userId ? sessionUser.userId.charAt(0).toUpperCase() : 'U')}</span>
                  )}
                </div>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl('')}
                    className="absolute -top-1 -right-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 shadow-sm transition-colors"
                    title="ลบรูปภาพ"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Drag/Drop and selector section */}
              <div 
                className={`flex-1 w-full border-2 border-dashed rounded-xl p-3.5 text-center transition-colors cursor-pointer ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-50/20 dark:border-indigo-500/40 dark:bg-indigo-950/10' 
                    : 'border-slate-200 hover:border-slate-350 dark:border-slate-800 dark:hover:border-slate-700'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                <div className="flex flex-col items-center gap-1.5">
                  <UploadCloud className="w-5 h-5 text-slate-400" />
                  <p className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                    คลิกเพื่ออัปโหลด หรือลากไฟล์มาวางที่นี่
                  </p>
                  <p className="text-[9px] text-slate-400 font-medium">
                    รองรับ JPG, PNG สัดส่วนจัตุรัสจะแสดงผลได้ดีที่สุดค่ะ
                  </p>
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
              {/* Display name field */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-450 mb-1.5">
                  ชื่อแสดงตัวตน / ชื่อผู้ใช้ระบบ (Display Name) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full h-10.5 pl-10 pr-4 rounded-xl border border-slate-200 hover:border-slate-350 bg-white text-xs dark:bg-slate-950 dark:border-slate-850 dark:hover:border-slate-800 text-slate-800 dark:text-slate-100 font-extrabold outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                    placeholder="เช่น คุณท่าน, มล. สมศักดิ์"
                  />
                </div>
              </div>

              {/* Email field */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-450 mb-1.5">
                  อีเมลเชื่อมโยงระบบ (Email Address)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10.5 pl-10 pr-4 rounded-xl border border-slate-200 hover:border-slate-350 bg-white text-xs dark:bg-slate-950 dark:border-slate-850 dark:hover:border-slate-800 text-slate-800 dark:text-slate-100 font-extrabold outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                    placeholder="เช่น user@mail.space"
                  />
                </div>
              </div>

              {/* Phone field */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-450 mb-1.5">
                  เบอร์โทรศัพท์ติดต่อ (Phone Number)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-10.5 pl-10 pr-4 rounded-xl border border-slate-200 hover:border-slate-350 bg-white text-xs dark:bg-slate-950 dark:border-slate-850 dark:hover:border-slate-800 text-slate-800 dark:text-slate-100 font-extrabold outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                    placeholder="เช่น 0812345678"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-450">
                    รหัสผ่านเข้าใช้งาน (Security Password)
                  </label>
                  <span className="text-[8.5px] font-extrabold text-slate-400">สำหรับเข้าเครื่องอื่น</span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10.5 pl-10 pr-4 rounded-xl border border-slate-200 hover:border-slate-350 bg-white text-xs dark:bg-slate-950 dark:border-slate-850 dark:hover:border-slate-800 text-slate-800 dark:text-slate-100 font-extrabold outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                    placeholder="กำหนดรหัสผ่านใหม่ที่นี่"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>
          </form>

          {/* Footer controls */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-950/30">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="px-4 h-10 text-xs font-extrabold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-5 h-10 text-xs font-bold text-white rounded-xl shadow-sm hover:brightness-105 active:brightness-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-70"
              style={{ backgroundColor: accentColor }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังเก็บบันทึกบน Cloud...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>บันทึก & เชื่อมโยงบัญชี</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
