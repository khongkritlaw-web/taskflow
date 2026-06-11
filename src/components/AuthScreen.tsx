import React, { useState } from 'react';
import { Lock, UserPlus, HelpCircle, ShieldCheck, DoorOpen } from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface AuthScreenProps {
  onLoginSuccess: (userId: string, email: string, phone: string, firebaseUid: string) => void;
  accentColor: string;
}

const padPass = (pass: string) => {
  if (pass.length >= 6) return pass;
  return pass.padEnd(6, '0');
};

const formatEmail = (id: string) => {
  const clean = id.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  return `${clean || 'user'}@taskflow.space`;
};

export default function AuthScreen({ onLoginSuccess, accentColor }: AuthScreenProps) {
  const [formType, setFormType] = useState<'login' | 'register' | 'forgot' | 'otp'>('login');
  
  // Login input
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  
  // Register input
  const [regId, setRegId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPass, setRegPass] = useState('');
  
  // Forgot password input
  const [forgotId, setForgotId] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  
  // OTP input
  const [otpValue, setOtpValue] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [otpUserId, setOtpUserId] = useState('');

  // Statuses
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg('');
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginId.trim() || !loginPass) {
      triggerError('กรุณากรอกไอดีและรหัสผ่านให้ครบถ้วน');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedId = loginId.trim().toLowerCase().replace(/\s/g, '');
    const emailFirebase = formatEmail(trimmedId);
    const finalPass = padPass(loginPass);

    try {
      // 1. Attempt login with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, emailFirebase, finalPass);
      const uid = userCredential.user.uid;

      // Fetch user profile info from Firestore
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const udata = userDoc.data();
        onLoginSuccess(udata.userId || trimmedId, udata.email || '', udata.phone || '', uid);
      } else {
        // Fallback user details
        onLoginSuccess(trimmedId, `${trimmedId}@taskflow.com`, '0812345678', uid);
      }
    } catch (error: any) {
      console.log('Login error, checking auto-registration...', error);
      
      // Auto register if user doesn't exist (to make review/testing super easy, as original code did)
      if (
        error.code === 'auth/user-not-found' || 
        error.code === 'auth/invalid-credential' || 
        error.code === 'auth/invalid-email'
      ) {
        try {
          // Attempt auto registration in Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(auth, emailFirebase, finalPass);
          const uid = userCredential.user.uid;
          
          const profile = {
            userId: trimmedId,
            email: `${trimmedId}@taskflow.com`,
            phone: '0812345678',
            password: loginPass
          };

          // Save user credentials to Firestore
          await setDoc(doc(db, 'users', uid), profile);
          
          onLoginSuccess(trimmedId, profile.email, profile.phone, uid);
        } catch (regError: any) {
          triggerError('ไม่สามารถเข้าสู่ระบบหรือสร้างบัญชีใหม่ได้: ' + (regError.message || String(regError)));
          setIsLoading(false);
        }
      } else {
        triggerError('อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบข้อมูลอีกครั้ง');
        setIsLoading(false);
      }
    }
  };

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedId = regId.trim().replace(/\s/g, '').toLowerCase();
    const trimmedEmail = regEmail.trim();
    const trimmedPhone = regPhone.trim();
    
    if (!trimmedId || !trimmedEmail || !trimmedPhone || !regPass) {
      triggerError('กรุณากรอกข้อมูลดาว (*) จัดหาให้ครบถ้วน');
      return;
    }
    if (regPass.length < 4) {
      triggerError('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const emailFirebase = formatEmail(trimmedId);
      const finalPass = padPass(regPass);

      // Verify if username already registered in Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('userId', '==', trimmedId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        triggerError('ไอดีนี้ถูกใช้งานแล้วในระบบ กรุณาเปลี่ยนไอดีใหม่');
        setIsLoading(false);
        return;
      }

      // Create Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, emailFirebase, finalPass);
      const uid = userCredential.user.uid;

      // Save user to Firestore users collection
      await setDoc(doc(db, 'users', uid), {
        userId: trimmedId,
        email: trimmedEmail,
        phone: trimmedPhone,
        password: regPass
      });

      triggerSuccess('ลงทะเบียนผู้ใช้ใหม่สำเร็จ! กำลังนำคุณกลับไปหน้าเข้าสู่ระบบ...');
      
      // Clear
      setRegId('');
      setRegEmail('');
      setRegPhone('');
      setRegPass('');
      
      setTimeout(() => {
        setFormType('login');
        setSuccessMsg('');
      }, 1500);
    } catch (error: any) {
      triggerError('การลงทะเบียนล้มเหลว: ' + (error.message || String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestForgotOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedId = forgotId.trim().toLowerCase();
    const trimmedPhone = forgotPhone.trim();
    
    if (!trimmedId || !trimmedPhone) {
      triggerError('กรุณากรอกข้อมูลให้ครบถ้วนเพื่อทำการค้นหา');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Lookup user in Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('userId', '==', trimmedId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Special mock admin fallback if not yet registered in Firebase
        if (trimmedId === 'admin') {
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          setGeneratedOTP(otp);
          setOtpUserId('admin');
          setFormType('otp');
          triggerSuccess('สร้างรหัสผ่านกู้คืน OTP สำเร็จ!');
          setIsLoading(false);
          return;
        }

        triggerError('ไม่พบข้อมูลไอดีผู้ใช้หรือเบอร์โทรศัพท์นี้ตรงกันในระบบ');
        setIsLoading(false);
        return;
      }

      let foundUser: any = null;
      querySnapshot.forEach((doc) => {
        const udata = doc.data();
        if (udata.phone === trimmedPhone) {
          foundUser = udata;
        }
      });

      if (!foundUser) {
        triggerError('ไม่พบข้อมูลไอดีผู้ใช้หรือเบอร์โทรศัพท์นี้ตรงกันในระบบ');
        setIsLoading(false);
        return;
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOTP(otp);
      setOtpUserId(trimmedId);
      setFormType('otp');
    } catch (error: any) {
      triggerError('เกิดข้อผิดพลาดในการตรวจสอบ: ' + (error.message || String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otpValue.trim() !== generatedOTP) {
      triggerError('รหัส OTP ไม่ถูกต้อง กรุณาตรวจสอบรหัสอีกครั้ง');
      return;
    }
    
    setIsLoading(true);
    try {
      if (otpUserId === 'admin') {
        alert(`ยืนยัน OTP เรียบร้อยแล้ว!\nรหัสผ่านสำหรับข้อมูลผู้ใช้ "admin" คือ: 1234`);
        setFormType('login');
        setIsLoading(false);
        return;
      }

      // Retrieve password from Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('userId', '==', otpUserId));
      const querySnapshot = await getDocs(q);

      let password = '(ไม่พบรหัสผ่าน)';
      querySnapshot.forEach((doc) => {
        password = doc.data().password || password;
      });

      // reset otp page
      setOtpValue('');
      setGeneratedOTP('');
      
      // Display custom info
      alert(`ยืนยัน OTP เรียบร้อยแล้ว!\nรหัสผ่านสำหรับข้อมูลผู้ใช้ "${otpUserId}" คือ: ${password}`);
      setFormType('login');
    } catch (error: any) {
      triggerError('เกิดข้อผิดพลาด: ' + (error.message || String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transition-all dark:bg-slate-900 dark:border-slate-800">
        
        {/* Header Ribbon */}
        <div className="p-8 text-center bg-slate-50 border-b border-slate-100 dark:bg-slate-950 dark:border-slate-800">
          <div className="w-14 h-14 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mx-auto mb-4 border border-accent/20" style={{ '--accent': accentColor } as React.CSSProperties}>
            {formType === 'login' && <Lock className="w-6 h-6" />}
            {formType === 'register' && <UserPlus className="w-6 h-6" />}
            {formType === 'forgot' && <HelpCircle className="w-6 h-6" />}
            {formType === 'otp' && <ShieldCheck className="w-6 h-6" />}
          </div>
          
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {formType === 'login' && 'เข้าสู่ระบบ TaskFlow Space'}
            {formType === 'register' && 'ลงทะเบียนบัญชีใหม่'}
            {formType === 'forgot' && 'กู้คืนรหัสผ่าน'}
            {formType === 'otp' && 'ยืนยันรหัสความปลอดภัย OTP'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
            {formType === 'login' && 'ป้อนบัญชีของคุณ หากยังไม่มีระบบจะลงทะเบียนให้อัตโนมัติ'}
            {formType === 'register' && 'ร่วมเป็นส่วนหนึ่งกับระบบจัดการงานอัจฉริยะ'}
            {formType === 'forgot' && 'กรอกหมายเลขและชื่อยูสเซอรสำหรับการกู้ข้อมูล'}
            {formType === 'otp' && 'รหัส OTP ได้ถูกจัดเตรียมไว้สำหรับการตรวจสอบด่วน'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-8">
          
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-lg text-center dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-400">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-lg text-center dark:bg-emerald-950/35 dark:border-emerald-900 dark:text-emerald-400">
              {successMsg}
            </div>
          )}

          {/* LOGIN FORM */}
          {formType === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-400">ไอดีผู้ใช้งาน (User ID)</label>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="ป้อนชื่อไอดีผู้ใช้ของคุณ... (เช่น admin)"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-accent focus:bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-400">รหัสผ่าน</label>
                <input
                  type="password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-accent focus:bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                  disabled={isLoading}
                />
              </div>
              
              <button
                type="submit"
                className="w-full h-11 font-bold text-sm text-white rounded-lg transition-all shadow-md focus:outline-none hover:opacity-90"
                style={{ backgroundColor: accentColor }}
                disabled={isLoading}
              >
                {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>

              <div className="pt-2 text-center flex flex-col space-y-2">
                <button
                  type="button"
                  onClick={() => { setFormType('register'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: accentColor }}
                >
                  ยังไม่มีบัญชีใช้งานใหม่? ลงทะเบียนที่นี่
                </button>
                <button
                  type="button"
                  onClick={() => { setFormType('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  ลืมรหัสผ่านใช่หรือไม่?
                </button>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {formType === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-400">ระบุไอดีผู้ใช้ * (ห้ามมีช่องว่าง)</label>
                <input
                  type="text"
                  value={regId}
                  onChange={(e) => setRegId(e.target.value)}
                  placeholder="เช่น user1"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-accent focus:bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-400">อีเมลทางการพิมพ์ *</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="example@yourdomain.com"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-accent focus:bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-400">เบอร์โทรศัพท์สำหรับกู้ข้อมูล *</label>
                <input
                  type="text"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="เช่น 0812345678"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-accent focus:bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-400">กำหนดรหัสผ่านเข้าใช้ *</label>
                <input
                  type="password"
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                  placeholder="รหัสผ่านขั้นต่ำ 4 หลักขึ้นไป"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-accent focus:bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 font-bold text-sm text-white rounded-lg shadow-md hover:opacity-90 transition-all"
                style={{ backgroundColor: accentColor }}
                disabled={isLoading}
              >
                {isLoading ? 'กำลังทำรายการ...' : 'สร้างบัญชีผู้บริโภคใหม่'}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setFormType('login'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: accentColor }}
                >
                  มีบัญชีอยู่แล้ว? ย้อนกลับไปเพื่อเข้าสู่ระบบ
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {formType === 'forgot' && (
            <form onSubmit={handleRequestForgotOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-400">พิมพ์ยูสเซอรของคุณ</label>
                <input
                  type="text"
                  value={forgotId}
                  onChange={(e) => setForgotId(e.target.value)}
                  placeholder="ป้อนชื่อผู้ใช้ของคุณ..."
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-accent focus:bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-400">หมายเลขเบอร์โทรศัพท์ที่เคยบันทึกไว้</label>
                <input
                  type="text"
                  value={forgotPhone}
                  onChange={(e) => setForgotPhone(e.target.value)}
                  placeholder="เช่น 0812345678"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-accent focus:bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 font-bold text-sm text-white rounded-lg shadow-md hover:opacity-90 transition-all bg-slate-800 dark:bg-slate-950"
              >
                ร้องขอบอร์ดคาสท์รหัส OTP
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setFormType('login'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: accentColor }}
                >
                  ย้อนกลับสู่หน้าลงชื่อเข้าใช้
                </button>
              </div>
            </form>
          )}

          {/* OTP CONFIRMATION */}
          {formType === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-1 dark:bg-amber-950/20 dark:border-amber-900">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">บอร์ดคาสท์รหัสทดสอบ OTP ด่วน (ใช้ได้ 5 นาที)</p>
                <p className="text-2xl font-bold font-mono tracking-widest text-slate-800 dark:text-slate-100">{generatedOTP}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-400 text-center">กรอกรหัสยืนยัน 6 ตัวตรงด้านบน</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                  placeholder="000000"
                  className="w-full h-12 text-center font-mono text-2xl tracking-widest bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-accent focus:bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 font-bold text-sm text-white rounded-lg shadow-md hover:opacity-90 transition-all"
                style={{ backgroundColor: accentColor }}
              >
                ยืนยันเพื่อดึงรหัสผ่าน
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setFormType('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  เปลี่ยนข้อมูลร้องขอรหัสใหม่
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
