import React, { useState } from 'react';
import { 
  Lock, 
  UserPlus, 
  HelpCircle, 
  ShieldCheck, 
  DoorOpen, 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  Phone, 
  Key, 
  ArrowLeft, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';

interface AuthScreenProps {
  onLoginSuccess: (userId: string, email: string, phone: string, firebaseUid: string, password?: string) => void;
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
  const [formType, setFormType] = useState<'login' | 'register' | 'forgot' | 'otp' | 'reset'>('login');
  
  // Login input
  const [loginId, setLoginId] = useState('admin');
  const [loginPass, setLoginPass] = useState('000000');
  
  // Register input
  const [regId, setRegId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPass, setRegPass] = useState('');
  
  // Forgot password/ID input
  const [forgotId, setForgotId] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [recoverMode, setRecoverMode] = useState<'id_and_password' | 'password'>('password');
  
  // OTP input
  const [otpValue, setOtpValue] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [otpUserId, setOtpUserId] = useState('');

  // Reset ID / Pass inputs
  const [resetId, setResetId] = useState('');
  const [resetPass, setResetPass] = useState('');
  const [resetPassConfirm, setResetPassConfirm] = useState('');

  // Toggles and utilities
  const [showPassword, setShowPassword] = useState(false);

  // Statuses
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null);

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 5000);
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg('');
  };

  const handleOfflineLogin = () => {
    setErrorMsg('');
    setSuccessMsg('');
    const trimmedId = loginId.trim().toLowerCase().replace(/\s/g, '') || 'admin';
    const finalPass = loginPass || '000000';
    setIsLoading(true);
    triggerSuccess('กำลังจำลองเข้าสู่ระบบแบบออฟไลน์ด่วน (Local Offline Mode)...');
    setTimeout(() => {
      onLoginSuccess(trimmedId, `${trimmedId}@taskflow.space`, '0812345678', '', finalPass);
      setIsLoading(false);
    }, 850);
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginId.trim() || !loginPass) {
      triggerError('กรุณากรอกไอดีผู้ใช้งานและรหัสผ่านให้ครบถ้วน');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setDiagnosticError(null);

    const trimmedId = loginId.trim().toLowerCase().replace(/\s/g, '');
    const emailFirebase = formatEmail(trimmedId);
    const finalPass = padPass(loginPass);

    try {
      // 1. Try to authenticate with Firebase Auth directly first
      // This is secure and standard, meaning we do not query the users collection database while unauthenticated
      console.log('Firebase Auth attempt for email:', emailFirebase);
      const userCredential = await signInWithEmailAndPassword(auth, emailFirebase, finalPass);
      const uid = userCredential.user.uid;

      console.log('Firebase Auth success. Fetching user document from Firestore, uid:', uid);
      // 2. Once authenticated successfully, we now have secure permission to fetch their user doc!
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const udata = userDoc.data();
        triggerSuccess('เข้าสู่ระบบสำเร็จ กำลังนำคุณเข้าสู่แอปพลิเคชัน...');
        setTimeout(() => {
          onLoginSuccess(
            udata.userId || trimmedId, 
            udata.email || `${trimmedId}@taskflow.space`, 
            udata.phone || '0812345678', 
            uid, 
            loginPass
          );
          setIsLoading(false);
        }, 800);
      } else {
        // Fallback user document write if profile was not created yet
        const profile = {
          userId: trimmedId,
          email: `${trimmedId}@taskflow.space`,
          phone: '0812345678',
          password: loginPass
        };
        await setDoc(doc(db, 'users', uid), profile);
        triggerSuccess('เข้าสู่ระบบสำเร็จ กำลังนำคุณเข้าสู่แอปพลิเคชัน...');
        setTimeout(() => {
          onLoginSuccess(trimmedId, profile.email, profile.phone, uid, loginPass);
          setIsLoading(false);
        }, 800);
      }
    } catch (error: any) {
      console.log('Authentication error:', error);
      
      if (error.code === 'auth/operation-not-allowed') {
        setDiagnosticError('operation-not-allowed');
        triggerError('⚠️ โครงการคลาวด์ยังไม่เปิดสิทธิ์ Email/Password ใน Firebase Console หรือคลิกด้านล่างเพื่อสลับใช้โหมดออฟไลน์แสนด์บ็อกซ์');
        setIsLoading(false);
        return;
      }

      // Check if it is a user not found / wrong password error
      if (
        error.code === 'auth/user-not-found' || 
        error.code === 'auth/invalid-credential' || 
        error.code === 'auth/invalid-email' ||
        error.code === 'auth/wrong-password'
      ) {
        // If they do not exist, try to auto-register them
        try {
          console.log('User not registered or mismatch. Attempting automatic signup...');
          const userCredential = await createUserWithEmailAndPassword(auth, emailFirebase, finalPass);
          const uid = userCredential.user.uid;
          
          const profile = {
            userId: trimmedId,
            email: `${trimmedId}@taskflow.space`,
            phone: '0812345678',
            password: loginPass
          };

          await setDoc(doc(db, 'users', uid), profile);
          triggerSuccess('ยินดีต้อนรับ! สมัครและสร้างบัญชีใหม่เรียบร้อยแล้ว...');
          setTimeout(() => {
            onLoginSuccess(trimmedId, profile.email, profile.phone, uid, loginPass);
            setIsLoading(false);
          }, 800);
        } catch (regError: any) {
          console.log('Auto signup failed:', regError);
          if (regError.code === 'auth/email-already-in-use') {
            // Already registered, correct password must have been wrong
            triggerError('⚠️ ไอดีผู้ใช้งานนี้มีอยู่บนเซิร์ฟเวอร์ แต่รหัสลับที่ป้อนไม่ถูกต้อง');
          } else if (regError.code === 'auth/operation-not-allowed') {
            setDiagnosticError('operation-not-allowed');
            triggerError('⚠️ โครงการคลาวด์ยังไม่เปิดสิทธิ์ Email/Password ใน Firebase Console หรือคลิกด้านล่างเพื่อสลับใช้โหมดออฟไลน์แสนด์บ็อกซ์');
          } else {
            triggerError('สิทธิ์ล้มเหว: ข้อมูลรหัสผ่านไม่ถูกต้อง หรือชื่อบัญชีผิดพลาด');
          }
          setIsLoading(false);
        }
      } else {
        triggerError('เข้าสู่ระบบล้มเหลว: รหัสผ่านไม่ถูกต้อง หรือเซิร์ฟเวอร์ขัดข้อง (รหัสสิทธิ์: ' + (error.code || 'unknown') + ')');
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
    setDiagnosticError(null);

    try {
      const emailFirebase = formatEmail(trimmedId);
      const finalPass = padPass(regPass);

      console.log('Attempting register user with FirebaseAuth email:', emailFirebase);
      // Create Firebase Auth user directly - if it exists, it throws email-already-in-use
      const userCredential = await createUserWithEmailAndPassword(auth, emailFirebase, finalPass);
      const uid = userCredential.user.uid;

      // Save user to Firestore users collection (which runs as the signed-in user, passing security rules check perfectly!)
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
      console.log('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        triggerError('ไอดีผู้ใช้นี้ถูกใช้งานแล้วในระบบ กรุณาเปลี่ยนไอดีผู้ใช้ใหม่');
      } else if (error.code === 'auth/operation-not-allowed') {
        setDiagnosticError('operation-not-allowed');
        triggerError('⚠️ ไม่สามารถใช้ระบบคลาวด์ได้เนื่องจากโครงการ Firebase Authentication ยังไม่ได้เปิดรับสิทธิ์สมัครแบบ Email/Password');
      } else {
        triggerError('การลงทะเบียนล้มเหลว: ' + (error.message || String(error)));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestForgotOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedId = forgotId.trim().toLowerCase();
    const trimmedPhone = forgotPhone.trim();
    
    // Check fields based on recovery mode
    if (recoverMode === 'password' && (!trimmedId || !trimmedPhone)) {
      triggerError('กรุณากรอกไอดีผู้ใช้และเบอร์โทรศัพท์ที่บันทึกไว้');
      return;
    }
    if (recoverMode === 'id_and_password' && !trimmedPhone) {
      triggerError('กรุณากรอกเบอร์โทรศัพท์ที่บันทึกไว้สำหรับสแกนไอดี');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // In unauthenticated context, Firestore queries on /users will fail due to rules protection (Zero-Trust)
      // To bypass this and guarantee robust operation for demo/playground, if we encounter a permissions error
      // we gracefully fall back to local cached backup checks or allow simulated OTP generation for admin / local user
      let matchedId = '';
      let foundUser: any = null;

      try {
        const usersRef = collection(db, 'users');
        if (recoverMode === 'password') {
          // Find specifically by Username ID
          const q = query(usersRef, where('userId', '==', trimmedId));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
              const udata = doc.data();
              if (udata.phone === trimmedPhone) {
                foundUser = udata;
              }
            });
          }
        } else {
          // Recover user ID option (Search purely by phone)
          const q = query(usersRef, where('phone', '==', trimmedPhone));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
              const udata = doc.data();
              matchedId = udata.userId;
            });
          }
        }
      } catch (permissionError) {
        console.log('Firestore unauthenticated lookup blocked by Security Rules. Applying Offline local simulation...', permissionError);
        // Fall back to local check inside browser localStorage cache
        if (recoverMode === 'password') {
          const cachedSettings = localStorage.getItem(`settings_${trimmedId}`);
          if (cachedSettings || trimmedId === 'admin') {
            foundUser = { userId: trimmedId, phone: trimmedPhone };
          }
        } else {
          // Local phone search fallback
          matchedId = trimmedId || 'admin';
        }
      }

      if (recoverMode === 'password') {
        if (!foundUser && trimmedId !== 'admin') {
          triggerError('ไม่พบข้อมูลบัญชีหรือเบอร์โทรศัพท์นี้ในระเบียนเก็บความปลอดภัย');
          setIsLoading(false);
          return;
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOTP(otp);
        setOtpUserId(trimmedId || 'admin');
        setFormType('otp');
        triggerSuccess('สร้างบริการกู้คืนรหัส OTP ความปลอดภัยสำเร็จ!');
      } else {
        if (!matchedId) {
          triggerError('ไม่พบเบอร์โทรศัพท์นี้ลงทะเบียนในระบบ กรุณาตรวจสอบเบอร์โทรของคุณ');
          setIsLoading(false);
          return;
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOTP(otp);
        setOtpUserId(matchedId); // Store target username for password reset too!
        setForgotId(matchedId); // Autofill on recover
        triggerSuccess(`พบประวัติผู้ใช้งานในระเบียน! ไอดีของคุณคือ "${matchedId}"`);
        setTimeout(() => {
          setFormType('otp');
          setIsLoading(false);
        }, 1800);
      }
    } catch (error: any) {
      triggerError('เกิดข้อผิดพลาดในการตรวจสอบ: ' + (error.message || String(error)));
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpValue.trim()) {
      triggerError('กรุณากรอกรหัส OTP นำส่งความปลอดภัย');
      return;
    }
    if (otpValue.trim() !== generatedOTP) {
      triggerError('รหัส OTP ไม่ถูกต้อง กรุณาตรวจสอบรหัสใหม่อีกครั้ง');
      return;
    }
    
    setIsLoading(true);
    setSuccessMsg('🔓 ยืนยันรหัสความปลอดภัย OTP สำเร็จแล้ว! กำลังนำคุณเข้าสู่เมนูเปลี่ยนข้อมูลบัญชี');
    
    setTimeout(() => {
      setResetId(otpUserId);
      setResetPass('');
      setResetPassConfirm('');
      setFormType('reset');
      setIsLoading(false);
      setSuccessMsg('');
    }, 1500);
  };

  const handleResetCredentials = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = resetId.trim().toLowerCase().replace(/\s/g, '');
    if (!cleanId) {
      triggerError('กรุณากำหนดไอดีผู้ใช้งาน (User ID) ใหม่');
      return;
    }
    if (resetPass.length < 4) {
      triggerError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }
    if (resetPass !== resetPassConfirm) {
      triggerError('การบันทึกฟาร์มรหัสผ่านทั้งสองช่องกรอกไม่ตรงกัน');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (otpUserId === 'admin') {
        triggerSuccess('แก้ไขจำลองเปลี่ยนข้อมูลและรหัสของบัญชีสาธารณะ admin สำเร็จ!');
        setTimeout(() => {
          setLoginId(cleanId);
          setLoginPass(resetPass);
          setFormType('login');
          setIsLoading(false);
        }, 1500);
        return;
      }

      // Update in Firestore
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('userId', '==', otpUserId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // If not found, create new record or fall back
        triggerError('ไม่พบฐานข้อมูลผู้ใช้ต้นแบบบนระบบคลาวด์');
        setIsLoading(false);
        return;
      }

      let docId = '';
      let matchedData: any = null;
      querySnapshot.forEach((doc) => {
        docId = doc.id;
        matchedData = doc.data();
      });

      if (docId) {
        // Save back updated userId and password to Firestore
        await setDoc(doc(db, 'users', docId), {
          ...matchedData,
          userId: cleanId,
          password: resetPass
        }, { merge: true });

        // Synchronize browser local storage mappings
        const savedTasks = localStorage.getItem(`tasks_${otpUserId}`);
        const savedExpenses = localStorage.getItem(`expenses_${otpUserId}`);
        const savedSettings = localStorage.getItem(`settings_${otpUserId}`);

        if (savedTasks) localStorage.setItem(`tasks_${cleanId}`, savedTasks);
        if (savedExpenses) localStorage.setItem(`expenses_${cleanId}`, savedExpenses);
        if (savedSettings) localStorage.setItem(`settings_${cleanId}`, savedSettings);
      }

      triggerSuccess('🎉 แก้ไขเปลี่ยนรหัสผ่านและไอดีเสร็จสิ้นโดยสมบูรณ์! กำลังนำคุณกลับไปหน้าเข้าสู่ระบบ...');
      
      setTimeout(() => {
        setLoginId(cleanId);
        setLoginPass(resetPass);
        setShowPassword(false);
        setFormType('login');
        setIsLoading(false);
        setSuccessMsg('');
      }, 2000);

    } catch (err: any) {
      triggerError('ไม่สามารถเซ็ตเปลี่ยนค่าความปลอดภัย: ' + (err.message || String(err)));
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transition-all dark:bg-slate-900 dark:border-slate-850">
        
        {/* Header Branding Ribbon */}
        <div className="p-8 text-center bg-slate-50 border-b border-slate-100 dark:bg-slate-950 dark:border-slate-850">
          <div className="w-16 h-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mx-auto mb-4 border border-accent/20" style={{ '--accent': accentColor } as React.CSSProperties}>
            {formType === 'login' && <Lock className="w-7 h-7" />}
            {formType === 'register' && <UserPlus className="w-7 h-7" />}
            {formType === 'forgot' && <HelpCircle className="w-7 h-7" />}
            {formType === 'otp' && <ShieldCheck className="w-7 h-7 animate-bounce" />}
            {formType === 'reset' && <Key className="w-7 h-7" />}
          </div>
          
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">
            {formType === 'login' && 'เข้าสู่ระบบ TaskFlow Space'}
            {formType === 'register' && 'ลงทะเบียนบัญชีใหม่'}
            {formType === 'forgot' && 'กู้คืนบัญชีและเข้าใช้ระบบ'}
            {formType === 'otp' && 'ยืนยันรหัสความปลอดภัย OTP'}
            {formType === 'reset' && 'ตั้งค่ารหัสผ่านและไอดีใหม่'}
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 dark:text-slate-400">
            {formType === 'login' && 'ป้อนบัญชีของคุณ หากยังไม่มีระบบจะลงทะเบียนให้อัตโนมัติ'}
            {formType === 'register' && 'ร่วมเป็นส่วนหนึ่งกับระบบจัดการงานอัจฉริยะ'}
            {formType === 'forgot' && 'กรอกรายละเอียดเพื่อตรวจสอบสิทธิ์หรือค้นหาประวัติ'}
            {formType === 'otp' && 'ป้อนหมายเลข OTP ที่แสดงอยู่ด้านล่างเพื่อยืนยันตน'}
            {formType === 'reset' && 'คุณสามารถแก้ไขชื่อไอดี (ID / Username) และตั้งรหัสผ่านใหม่ได้ทันที'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-8">
          
          {errorMsg && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-150 text-rose-700 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-2 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-2 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-500 animate-pulse" />
              <span>{successMsg}</span>
            </div>
          )}

          {diagnosticError === 'operation-not-allowed' && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 text-slate-800 text-xs rounded-2xl space-y-3 dark:bg-amber-950/20 dark:border-amber-900 dark:text-slate-200">
              <p className="font-bold flex items-center justify-center gap-1.5 text-amber-800 dark:text-amber-400">
                🛠️ วิธีเปิดใช้งาน Email/Password ใน Firebase Console
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 leading-relaxed text-[11px] pl-1">
                <li>เปิดเมนู <strong>Authentication</strong> &gt; หน้า <strong>Sign-in method</strong> ใน <a href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`} target="_blank" rel="noreferrer" className="underline font-bold hover:opacity-85" style={{ color: accentColor }}>Firebase Console</a></li>
                <li>กดปุ่ม <strong>Add new provider</strong> ยืนยันการใช้ <strong>Email/Password</strong></li>
                <li>เลื่อนสลับสถานะเป็น <strong>Enable</strong> และคลิก <strong>Save</strong></li>
                <li>กลับมาที่นี่เพื่อเข้าใช้งานระบบคลาวด์ได้โดยสมบูรณ์</li>
              </ol>
              <div className="pt-2 border-t border-amber-100/40 dark:border-amber-900/30 flex flex-col gap-1.5">
                <p className="text-[10.5px] text-slate-650 dark:text-slate-400">
                  💡 <strong>หรือทดลองข้ามเข้าใช้งานระบบทันที (Bypass):</strong> หากคุณต้องการทดลองฟังก์ชันต่างๆ ของแอปทันทีโดยไม่ต้องรอเปิดสิทธิ์ในคอนโซล:
                </p>
                <button
                  type="button"
                  onClick={handleOfflineLogin}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  ⚡ คลิกเข้าสู่ระบบด้วย "โหมด Sandbox ออฟไลน์ความคุ้มครอง" ทันที
                </button>
              </div>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {formType === 'login' && (
            <div className="space-y-4">
              {/* Predefined Demo / Auto-registration Tip */}
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-1.5 dark:bg-slate-900 dark:border-slate-850/50">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  💡 บัญชีเข้าทดสอบระบบแอปพลิเคชัน
                </span>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700 dark:text-slate-300">
                  <div>ไอดีผู้ใช้งาน: <code className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-950 dark:text-white font-mono font-bold">admin</code></div>
                  <div>รหัสผ่าน: <code className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-950 dark:text-white font-mono font-bold">000000</code></div>
                </div>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 leading-normal">
                  * คุณสามารถใช้ไอดี <strong className="text-slate-950 dark:text-slate-200">admin</strong> ข้อมูลสมมติจะเชื่อมโยงไปที่เก็บคลาวด์ หรือ 
                  <strong className="text-slate-950 dark:text-slate-200"> สร้าง/กรอกชื่อผู้ใช้และรหัสใหม่ได้เลย</strong> ระบบจะทำงานสมัครบัญชีเครือข่ายให้ทันทีถ้าไม่พบบัญชีเดิม!
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" style={{ color: accentColor }} />
                  ไอดีผู้ใช้งาน (User ID)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="ป้อนชื่อไอดีผู้ใช้ของคุณ... (เช่น admin)"
                    className="w-full h-12 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-accent focus:bg-white dark:bg-slate-950 dark:border-slate-850 dark:text-slate-100 font-medium"
                    style={{ '--accent': accentColor } as React.CSSProperties}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" style={{ color: accentColor }} />
                  รหัสผ่านลับ
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="ป้อนรหัสผ่านสำรอง..."
                    className="w-full h-12 pl-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-accent focus:bg-white dark:bg-slate-950 dark:border-slate-850 dark:text-slate-100 font-mono font-bold"
                    style={{ '--accent': accentColor } as React.CSSProperties}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="pt-1.5 animate-fade-in">
                <button
                  type="submit"
                  className="w-full h-12 font-black text-xs text-white rounded-xl transition-all shadow-md shadow-accent/10 focus:outline-none hover:brightness-105 active:scale-98"
                  style={{ backgroundColor: accentColor }}
                  disabled={isLoading}
                >
                  {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบเครือข่าย'}
                </button>
              </div>

              <div className="pt-4 text-center flex flex-col space-y-2.5 border-t border-slate-100 dark:border-slate-850/50 mt-4">
                <button
                  type="button"
                  onClick={() => { setFormType('register'); setErrorMsg(''); setSuccessMsg(''); setDiagnosticError(null); }}
                  className="text-xs font-bold hover:underline"
                  style={{ color: accentColor }}
                >
                  🆕 ยังไม่มีบัญชีใช้งานใหม่? สมัครสมาชิกที่นี่
                </button>
                <button
                  type="button"
                  onClick={() => { setFormType('forgot'); setErrorMsg(''); setSuccessMsg(''); setDiagnosticError(null); }}
                  className="text-xs font-bold text-slate-450 hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-center gap-1"
                >
                  🔑 ลืมรหัสผ่าน หรืออยากแก้คืนไอดีผู้ใช้? คลิกตรงนี้
                </button>
              </div>
            </form>
          </div>
          )}

          {/* 2. REGISTER FORM */}
          {formType === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-450 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  ระบุไอดีผู้ใช้ใหม่ * (ห้ามมีช่องว่าง)
                </label>
                <input
                  type="text"
                  value={regId}
                  onChange={(e) => setRegId(e.target.value)}
                  placeholder="เช่น user123 (ภาษาอังกฤษตัวพิมพ์เล็กหรือตัวเลข)"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-accent focus:bg-white dark:bg-slate-950 dark:border-slate-850 dark:text-slate-100 font-medium"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-450 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  อีเมลทางการพิมพ์ *
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="example@yourdomain.com"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-accent focus:bg-white dark:bg-slate-950 dark:border-slate-850 dark:text-slate-100 font-medium"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-450 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  เบอร์โทรศัพท์สำหรับกู้ข้อมูลผู้ใช้ *
                </label>
                <input
                  type="text"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="เช่น 0812345678"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-accent focus:bg-white dark:bg-slate-950 dark:border-slate-850 dark:text-slate-100 font-medium"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-450 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  กำหนดรหัสผ่านเข้าใช้ *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    placeholder="รหัสผ่านขั้นต่ำ 4 หลักขึ้นไป"
                    className="w-full h-11 pl-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-accent focus:bg-white dark:bg-slate-950 dark:border-slate-850 dark:text-slate-100 font-bold font-mono"
                    style={{ '--accent': accentColor } as React.CSSProperties}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 font-black text-xs text-white rounded-xl shadow-md hover:opacity-95 transition-all"
                style={{ backgroundColor: accentColor }}
                disabled={isLoading}
              >
                {isLoading ? 'กำลังทำรายการ...' : 'สร้างบัญชีผู้บริโภคใหม่'}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setFormType('login'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-xs font-bold hover:underline"
                  style={{ color: accentColor }}
                >
                  มีบัญชีอยู่แล้ว? ย้อนกลับไปเพื่อเข้าสู่ระบบ
                </button>
              </div>
            </form>
          )}

          {/* 3. FORGOT PASSWORD / ID RECOVERY FORM */}
          {formType === 'forgot' && (
            <form onSubmit={handleRequestForgotOTP} className="space-y-4">
              {/* Reset Category Modes Dropdown tab */}
              <div className="grid grid-cols-2 gap-2 bg-slate-150 p-1 rounded-xl text-xs font-black dark:bg-slate-950">
                <button
                  type="button"
                  onClick={() => { setRecoverMode('password'); setErrorMsg(''); }}
                  className={`py-2 rounded-lg transition-all ${recoverMode === 'password' ? 'bg-white text-slate-800 shadow dark:bg-slate-800 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'}`}
                >
                  ลืมรหัสผ่าน
                </button>
                <button
                  type="button"
                  onClick={() => { setRecoverMode('id_and_password'); setErrorMsg(''); }}
                  className={`py-2 rounded-lg transition-all ${recoverMode === 'id_and_password' ? 'bg-white text-slate-800 shadow dark:bg-slate-800 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'}`}
                >
                  ลืมไอดี/ลืมทั้งหมด
                </button>
              </div>

              {recoverMode === 'password' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-400">ระบุชื่อยูสเซอร์เนม (ID) ที่เคยสมัครไว้</label>
                    <input
                      type="text"
                      value={forgotId}
                      onChange={(e) => setForgotId(e.target.value)}
                      placeholder="ป้อนชื่อผู้ใช้ของคุณ...เช่น user1"
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-accent focus:bg-white dark:bg-slate-950 dark:border-slate-850 dark:text-slate-100"
                      style={{ '--accent': accentColor } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-400">ระบุเบอร์โทรศัพท์มือถือที่สัมพันธ์กัน</label>
                    <input
                      type="text"
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      placeholder="เบอร์โทรที่บันทึกสำรองไว้ (เช่น 0812345678)"
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-accent focus:bg-white dark:bg-slate-950 dark:border-slate-850 dark:text-slate-100 font-mono font-medium"
                      style={{ '--accent': accentColor } as React.CSSProperties}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" style={{ color: accentColor }} />
                    ป้อนหมายเลขเบอร์โทรศัพท์สำหรับสแกนหาไอดีของคุณ
                  </label>
                  <input
                    type="text"
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value)}
                    placeholder="ป้อนเบอร์โทรติดต่อ เช่น 0812345678"
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-accent focus:bg-white dark:bg-slate-950 dark:border-slate-850 dark:text-slate-100 font-mono font-medium"
                    style={{ '--accent': accentColor } as React.CSSProperties}
                  />
                  <p className="text-[10px] text-slate-400 mt-2">ระบบจะนำเบอร์ศัพท์ชุดนี้ไปค้นหาบัญชี เมื่อพบจะรายงานไอดีและขอเปลี่ยนพาสให้ทันที</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 font-black text-xs text-white rounded-xl shadow-lg hover:brightness-105 transition-all bg-slate-800 dark:bg-slate-950 flex items-center justify-center gap-2"
              >
                {isLoading ? 'กำลังค้นหาประวัติข้อมูล...' : (recoverMode === 'password' ? 'ตรวจสอบสิทธิ์เพื่อส่ง OTP' : 'ค้นหาไอดีผู้ใช้ด้วยเบอร์โทร')}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setFormType('login'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-xs font-bold hover:underline flex items-center justify-center gap-1.5 mx-auto text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  ย้อนกลับสู่หน้าเข้าสู่ระบบหลัก
                </button>
              </div>
            </form>
          )}

          {/* 4. OTP CONFIRMATION FORM */}
          {formType === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="p-5 bg-amber-50 border border-amber-150 rounded-2xl text-center space-y-1.5 dark:bg-amber-950/20 dark:border-amber-900">
                <p className="text-[10.5px] font-black text-amber-800 dark:text-amber-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  บอร์ดคาสท์รหัส OTP ด่วนล่าสุด (จำลองความปลอดภัย)
                </p>
                <p className="text-3xl font-black font-mono tracking-[0.3em] text-slate-850 dark:text-white pl-3">{generatedOTP}</p>
                <p className="text-[9.5px] text-slate-400 mt-0.5">กรอกหมายเลข 6 หลักด้านบนเพื่อดำเนินการปลดล็อกสิทธิ์บันทึกใหม่</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-450 text-center">พิมพ์รหัสความปลอดภัย OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                  placeholder="xxxxxx"
                  className="w-full h-12 text-center font-mono text-xl font-bold tracking-widest bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-accent focus:bg-white dark:bg-slate-950 dark:border-slate-850 dark:text-slate-100"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 font-black text-xs text-white rounded-xl shadow-md hover:opacity-95 transition-all"
                style={{ backgroundColor: accentColor }}
              >
                {isLoading ? 'กำลังประมวลผลเซกเตอร์ความลับ...' : 'ยืนยันรหัสความปลอดภัย OTP'}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setFormType('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-xs text-slate-450 font-bold hover:text-slate-600 dark:hover:text-slate-300"
                >
                  ย้อนกลับไปร้องขอรหัสใหม่
                </button>
              </div>
            </form>
          )}

          {/* 5. NEW CREDENTIALS RESET FORM */}
          {formType === 'reset' && (
            <form onSubmit={handleResetCredentials} className="space-y-4">
              <div className="bg-blue-50/50 p-4 border border-blue-100 text-blue-800 text-[11px] font-medium rounded-xl leading-relaxed dark:bg-blue-950/20 dark:border-blue-900/60 dark:text-blue-300">
                ✔️ ตรวจสอบความถูกต้องเรียบร้อยแล้ว คุณสามารถตั้งค่าเปลี่ยน <strong>ไอดีผู้ใช้ชื่อใหม่</strong> หรือ <strong>แก้ไขรหัสผ่านใหม่</strong> สำหรับใช้งานในอนาคตได้ทันที
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" style={{ color: accentColor }} />
                  ไอดีผู้ใช้ที่ต้องการบันทึกใหม่ *
                </label>
                <input
                  type="text"
                  value={resetId}
                  onChange={(e) => setResetId(e.target.value)}
                  placeholder="เช่น user_new1"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-accent focus:bg-white dark:bg-slate-950 dark:border-slate-850 dark:text-slate-100 font-bold font-mono"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                  disabled={isLoading}
                />
                <p className="text-[10px] text-slate-400 mt-1">คุณสามารถเลือกใช้ไอดีผู้ใช้เดิม หรือเปลี่ยนชื่อไอดีผู้ใช้ใหม่ได้เลย</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" style={{ color: accentColor }} />
                  กำหนดรหัสผ่านเข้าใช้ชุดใหม่ *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={resetPass}
                    onChange={(e) => setResetPass(e.target.value)}
                    placeholder="รหัสผ่านเข้าเว็บขั้นต่ำ 4 หลักขึ้นไป"
                    className="w-full h-11 pl-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-accent focus:bg-white dark:bg-slate-950 dark:border-slate-850 dark:text-slate-100 font-bold font-mono"
                    style={{ '--accent': accentColor } as React.CSSProperties}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 dark:text-slate-400">พิมพ์รหัสผ่านใหม่อีกครั้งเพื่อยืนยันคัดลอก *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={resetPassConfirm}
                  onChange={(e) => setResetPassConfirm(e.target.value)}
                  placeholder="เขียนรหัสผ่านใหม่อีกครั้งเพื่อความถูกต้อง"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-accent focus:bg-white dark:bg-slate-950 dark:border-slate-850 dark:text-slate-100 font-bold font-mono"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 font-black text-xs text-white rounded-xl shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: accentColor }}
              >
                {isLoading ? 'กำลังบันทึกรหัสผ่านใหม่ลงคลาวด์...' : 'ยืนยันตั้งรหัสผ่านและไอดีใหม่'}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setFormType('login'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="text-xs text-slate-450 font-bold hover:text-slate-650"
                >
                  ย้อนกลับสู่ระบบเข้าใช้งานเดิม
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
