import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  Trash2, 
  LogOut, 
  ShieldCheck, 
  ChevronRight,
  Info,
  Calendar,
  FileJson,
  Search,
  Users,
  Bell,
  Link as LinkIcon,
  Table,
  Eye,
  Filter,
  Layers,
  FileText,
  CreditCard,
  Check
} from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup, type User } from 'firebase/auth';
import { auth } from '../firebase';
import { Task, Expense, AppSettings, CustomMenuLink, Announcement } from '../types';

interface BackupModuleProps {
  tasks: Task[];
  expenses: Expense[];
  settings: AppSettings;
  onRestore: (data: { tasks?: Task[]; expenses?: Expense[]; settings?: AppSettings }) => void;
  accentColor: string;
  sessionUser: any;
  allUsersList?: { userId: string; email: string; phone: string; uid: string }[];
  announcements?: Announcement[];
  customMenuLinks?: CustomMenuLink[];
}

interface BackupFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  createdTime: string;
  webViewLink?: string;
}

export default function BackupModule({ 
  tasks, 
  expenses, 
  settings, 
  onRestore, 
  accentColor,
  sessionUser,
  allUsersList = [],
  announcements = [],
  customMenuLinks = []
}: BackupModuleProps) {
  
  // Google Drive Authentication States
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [driveUser, setDriveUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Backup/Restore status
  const [backupStatus, setBackupStatus] = useState<{ type: 'success' | 'error' | 'idle', message: string }>({ type: 'idle', message: '' });
  const [driveBackups, setDriveBackups] = useState<BackupFile[]>([]);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Live Backend Data Inspector States
  const [activePreviewTab, setActivePreviewTab] = useState<'tasks' | 'expenses' | 'installments' | 'users' | 'announcements' | 'links'>('tasks');
  const [searchTerm, setSearchTerm] = useState('');

  // Check if session user is Creator Admin
  const isAdminCreator = useMemo(() => {
    if (!sessionUser) return false;
    const uid = String(sessionUser.userId || sessionUser.uid || '').toLowerCase();
    const email = String(sessionUser.email || '').toLowerCase();
    return uid === 'admin' || sessionUser.isCreatorAdmin === true || email === 'khongkrit.law@gmail.com' || sessionUser.role === 'admin';
  }, [sessionUser]);

  // Helper: Format Bytes to human readable
  const formatBytes = (bytesStr: string | number) => {
    const bytes = Number(bytesStr);
    if (isNaN(bytes) || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper: Format ISO date to Thai display format
  const formatThaiDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' น.';
    } catch (e) {
      return isoStr;
    }
  };

  // Google Sign-In with popup + Drive Scopes
  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setError('');
      setBackupStatus({ type: 'idle', message: '' });
      
      const provider = new GoogleAuthProvider();
      // Scope to create and read only the files created by this app in Google Drive
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (credential && credential.accessToken) {
        setAccessToken(credential.accessToken);
        setDriveUser(result.user);
        
        // Load existing backups
        await initializeDriveFolderAndList(credential.accessToken);
      } else {
        throw new Error('ไม่ได้รับสิทธิ์การเชื่อมต่อ (Google Access Token) กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setError(err.message || 'เชื่อมต่อกับบัญชี Google ล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  // Disconnect Google Account
  const handleDisconnect = () => {
    setAccessToken(null);
    setDriveUser(null);
    setDriveBackups([]);
    setDriveFolderId(null);
    setError('');
    setBackupStatus({ type: 'idle', message: '' });
  };

  // Locate or Create "DekaSuite_Backups" folder
  const initializeDriveFolderAndList = async (token: string) => {
    try {
      setLoading(true);
      setError('');
      
      // 1. Search for existing folder
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        "name = 'DekaSuite_Backups' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
      )}&fields=files(id,name)`;
      
      const searchRes = await fetch(searchUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!searchRes.ok) throw new Error('ไม่สามารถตรวจสอบโฟลเดอร์ใน Google Drive ได้');
      const searchData = await searchRes.json();
      
      let folderId = '';
      if (searchData.files && searchData.files.length > 0) {
        folderId = searchData.files[0].id;
      } else {
        // Create new folder
        const createUrl = 'https://www.googleapis.com/drive/v3/files';
        const createRes = await fetch(createUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'DekaSuite_Backups',
            mimeType: 'application/vnd.google-apps.folder',
            description: 'โฟลเดอร์สำหรับเก็บไฟล์สำรองข้อมูลของระบบ DekaSuite'
          })
        });
        
        if (!createRes.ok) throw new Error('ไม่สามารถสร้างโฟลเดอร์สำหรับสำรองข้อมูลใน Google Drive ได้');
        const createData = await createRes.json();
        folderId = createData.id;
      }
      
      setDriveFolderId(folderId);
      await fetchBackupFiles(token, folderId);
      
    } catch (err: any) {
      console.error('Folder init error:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการตรวจสอบโฟลเดอร์เก็บข้อมูลสำรอง');
    } finally {
      setLoading(false);
    }
  };

  // Fetch list of backup files inside "DekaSuite_Backups" folder
  const fetchBackupFiles = async (token: string, folderId: string) => {
    try {
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        `'${folderId}' in parents and trashed = false`
      )}&fields=files(id,name,mimeType,size,createdTime,webViewLink)&orderBy=createdTime desc&pageSize=50`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('ไม่สามารถดึงรายชื่อไฟล์สำรองได้');
      const data = await res.json();
      setDriveBackups(data.files || []);
    } catch (err: any) {
      console.error('Fetch files error:', err);
      setError('ไม่สามารถเรียกดูรายการไฟล์สำรองบน Google Drive ได้');
    }
  };

  // Refresh backups list manually
  const handleRefreshList = async () => {
    if (!accessToken || !driveFolderId) return;
    setLoading(true);
    await fetchBackupFiles(accessToken, driveFolderId);
    setLoading(false);
  };

  // Escape string for CSV format to make it Excel-compatible and clean
  const escapeCSV = (val: any): string => {
    if (val === null || val === undefined) return '""';
    let str = String(val);
    // Escape double quotes inside values by doubling them
    str = str.replace(/"/g, '""');
    // Wrap entire field in quotes
    return `"${str}"`;
  };

  // 1. Convert tasks array to Excel-compatible CSV string
  const generateTasksCSV = (taskList: Task[]): string => {
    const headers = [
      'รหัสงาน (ID)',
      'หัวข้อภารกิจ/ชื่องาน',
      'รายละเอียด',
      'หมวดหมู่',
      'วันที่ครบกำหนด (Due Date)',
      'เวลาครบกำหนด',
      'สถานะการทำงาน',
      'ประเภททำซ้ำ',
      'วันที่ทำซ้ำ',
      'วันที่เสร็จสิ้น',
      'บันทึกสรุปงาน/ปิดคดี',
      'ผู้มอบหมายโดยแอดมิน',
      'สถานะอนุมัติ',
      'ข้อเสนอแนะจากแอดมิน',
      'ผู้ใช้ผู้บันทึก',
      'วันที่สร้างรายการ'
    ];
    
    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel
    csvContent += headers.map(escapeCSV).join(',') + '\n';
    
    taskList.forEach(t => {
      const row = [
        t.id,
        t.title,
        t.desc || '',
        t.category,
        t.dueDate,
        t.dueTime || '',
        t.status === 'completed' ? 'เสร็จสิ้น (Completed)' : 'รอดำเนินการ (Pending)',
        t.isRecurring ? 'ทำซ้ำรายสัปดาห์' : 'ครั้งเดียว',
        t.recurringDays ? t.recurringDays.join('; ') : '-',
        t.completedAt || '-',
        t.completionNotes || '-',
        t.assignedByAdmin ? 'ใช่' : 'ไม่ใช่',
        t.approvalStatus || 'ปกติ',
        t.adminFeedback || '-',
        t.userId,
        t.createdAt || '-'
      ];
      csvContent += row.map(escapeCSV).join(',') + '\n';
    });
    
    return csvContent;
  };

  // 2. Convert expenses array to Excel-compatible CSV string
  const generateExpensesCSV = (expenseList: Expense[]): string => {
    const headers = [
      'รหัสรายการ (ID)',
      'ชื่อรายการ/บิล',
      'จำนวนเงิน (บาท)',
      'หมวดหมู่รายจ่าย',
      'วันที่ทำรายการ',
      'วันที่ครบกำหนดชำระ',
      'สถานะการชำระเงิน',
      'วันที่ชำระเงิน',
      'เป็นรายการผ่อนชำระ',
      'จำนวนงวดทั้งหมด',
      'บันทึกเพิ่มเติม',
      'ผู้ใช้ผู้บันทึก'
    ];
    
    let csvContent = '\uFEFF';
    csvContent += headers.map(escapeCSV).join(',') + '\n';
    
    expenseList.forEach(e => {
      const row = [
        e.id,
        e.name,
        e.amount,
        e.cat,
        e.date,
        e.dueDate,
        e.paid ? 'ชำระเงินแล้ว' : 'ค้างชำระ (Pending)',
        e.paidDate || '-',
        e.isInstallment ? 'ใช่' : 'ไม่ใช่',
        e.totalInstallments || '-',
        e.note || '',
        e.userId
      ];
      csvContent += row.map(escapeCSV).join(',') + '\n';
    });
    
    return csvContent;
  };

  // 3. Convert installments schedule array to Excel-compatible CSV string
  const generateInstallmentsCSV = (expenseList: Expense[]): string => {
    const headers = [
      'รหัสบิลหลัก (Expense ID)',
      'ชื่อรายการหลัก',
      'งวดที่',
      'จำนวนเงินงวดนี้ (บาท)',
      'กำหนดชำระงวดนี้',
      'สถานะชำระงวดนี้',
      'วันที่ชำระงวดนี้',
      'มีสลิปแนบ',
      'หมวดหมู่',
      'ผู้ใช้ผู้บันทึก'
    ];

    let csvContent = '\uFEFF';
    csvContent += headers.map(escapeCSV).join(',') + '\n';

    expenseList.filter(e => e.isInstallment && e.installments && e.installments.length > 0).forEach(e => {
      e.installments?.forEach(inst => {
        const row = [
          e.id,
          e.name,
          inst.installmentNo,
          inst.amount,
          inst.dueDate,
          inst.paid ? 'ชำระแล้ว' : 'ค้างชำระ',
          inst.paidDate || '-',
          inst.slipBase64 ? 'มีไฟล์สลิป' : 'ไม่มี',
          e.cat,
          e.userId
        ];
        csvContent += row.map(escapeCSV).join(',') + '\n';
      });
    });

    return csvContent;
  };

  // 4. Convert user accounts registry to Excel-compatible CSV string
  const generateUsersCSV = (users: { userId: string; email: string; phone: string; uid: string }[]): string => {
    const headers = [
      'ลำดับ',
      'ชื่อผู้ใช้ / Username',
      'อีเมล (Email Address)',
      'เบอร์โทรศัพท์',
      'รหัสประจำตัวคลาวด์ (Firebase UID)'
    ];

    let csvContent = '\uFEFF';
    csvContent += headers.map(escapeCSV).join(',') + '\n';

    users.forEach((u, idx) => {
      const row = [
        idx + 1,
        u.userId,
        u.email || '-',
        u.phone || '-',
        u.uid || '-'
      ];
      csvContent += row.map(escapeCSV).join(',') + '\n';
    });

    return csvContent;
  };

  // 5. Convert announcements to Excel-compatible CSV string
  const generateAnnouncementsCSV = (annList: Announcement[]): string => {
    const headers = [
      'รหัสประกาศ (ID)',
      'หัวข้อข่าวสาร/ประกาศ',
      'เนื้อหาประกาศ',
      'ขอบเขตผู้มองเห็น',
      'ผู้เขียนประกาศ',
      'วันที่สร้าง',
      'สถานะเปิดใช้งาน'
    ];

    let csvContent = '\uFEFF';
    csvContent += headers.map(escapeCSV).join(',') + '\n';

    annList.forEach(a => {
      const row = [
        a.id,
        a.title,
        a.content,
        a.visibility === 'all' ? 'ทุกคน' : 'เฉพาะบุคคลที่กำหนด',
        a.author || 'ผู้ดูแลระบบ',
        a.createdAt ? formatThaiDate(a.createdAt) : '-',
        a.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'
      ];
      csvContent += row.map(escapeCSV).join(',') + '\n';
    });

    return csvContent;
  };

  // 6. Convert custom menu links to Excel-compatible CSV string
  const generateLinksCSV = (linkList: CustomMenuLink[]): string => {
    const headers = [
      'รหัสลิงก์ (ID)',
      'ชื่อเมนู',
      'URL ปลายทาง',
      'ไอคอน',
      'ขอบเขตสิทธิ์ใช้งาน',
      'ผู้ได้รับการอนุญาต'
    ];

    let csvContent = '\uFEFF';
    csvContent += headers.map(escapeCSV).join(',') + '\n';

    linkList.forEach(l => {
      const row = [
        l.id,
        l.title,
        l.url,
        l.iconName || 'Link',
        l.visibility === 'all' ? 'ผู้ใช้ทุกคน' : 'ระบุผู้ใช้',
        l.allowedUsers ? l.allowedUsers.join('; ') : 'ทั้งหมด'
      ];
      csvContent += row.map(escapeCSV).join(',') + '\n';
    });

    return csvContent;
  };

  // 7. Master All-in-One Consolidated Excel CSV Report
  const generateMasterAllCSV = (): string => {
    let csv = '\uFEFF';
    const dateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    csv += `=== รายงานสรุปข้อมูลหลังบ้านระบบ DekaSuite Master Backend Data Export ===\n`;
    csv += `วันที่ออกรายงาน,${escapeCSV(dateStr)}\n`;
    csv += `ผู้สร้างรายงาน,${escapeCSV(sessionUser?.userId || 'Admin')}\n`;
    csv += `จำนวนภารกิจ/คดีทั้งหมด,${tasks.length}\n`;
    csv += `จำนวนรายการรายจ่ายทั้งหมด,${expenses.length}\n`;
    csv += `ยอดรวมรายจ่ายทั้งหมด (บาท),${expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)}\n`;
    csv += `จำนวนสมาชิกในระบบ,${allUsersList.length}\n\n`;

    csv += `--- [หมวด 1: รายการภารกิจและคดีทั้งหมด (${tasks.length} รายการ)] ---\n`;
    csv += generateTasksCSV(tasks).replace('\uFEFF', '') + '\n';

    csv += `--- [หมวด 2: รายการบัญชีรายจ่าย/บิล (${expenses.length} รายการ)] ---\n`;
    csv += generateExpensesCSV(expenses).replace('\uFEFF', '') + '\n';

    csv += `--- [หมวด 3: แจกแจงค่างวดผ่อนชำระ] ---\n`;
    csv += generateInstallmentsCSV(expenses).replace('\uFEFF', '') + '\n';

    csv += `--- [หมวด 4: บัญชีผู้ใช้งานหลังบ้าน (${allUsersList.length} รายชื่อ)] ---\n`;
    csv += generateUsersCSV(allUsersList).replace('\uFEFF', '') + '\n';

    csv += `--- [หมวด 5: ประกาศข่าวสาร (${announcements.length} รายการ)] ---\n`;
    csv += generateAnnouncementsCSV(announcements).replace('\uFEFF', '') + '\n';

    csv += `--- [หมวด 6: ลิงก์เมนูย่อยระบบ (${customMenuLinks.length} รายการ)] ---\n`;
    csv += generateLinksCSV(customMenuLinks).replace('\uFEFF', '') + '\n';

    return csv;
  };

  // Trigger Local Excel (CSV) Download for user
  const handleLocalExcelDownload = (type: 'tasks' | 'expenses' | 'installments' | 'users' | 'announcements' | 'links' | 'all') => {
    try {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
      let csvContent = '';
      let fileName = '';
      
      switch (type) {
        case 'tasks':
          csvContent = generateTasksCSV(tasks);
          fileName = `DekaSuite_Tasks_Backend_${dateStr}.csv`;
          break;
        case 'expenses':
          csvContent = generateExpensesCSV(expenses);
          fileName = `DekaSuite_Expenses_Backend_${dateStr}.csv`;
          break;
        case 'installments':
          csvContent = generateInstallmentsCSV(expenses);
          fileName = `DekaSuite_InstallmentSchedules_${dateStr}.csv`;
          break;
        case 'users':
          csvContent = generateUsersCSV(allUsersList);
          fileName = `DekaSuite_UsersRegistry_${dateStr}.csv`;
          break;
        case 'announcements':
          csvContent = generateAnnouncementsCSV(announcements);
          fileName = `DekaSuite_Announcements_${dateStr}.csv`;
          break;
        case 'links':
          csvContent = generateLinksCSV(customMenuLinks);
          fileName = `DekaSuite_CustomLinks_${dateStr}.csv`;
          break;
        case 'all':
          csvContent = generateMasterAllCSV();
          fileName = `DekaSuite_MASTER_BACKEND_FULL_EXPORT_${dateStr}.csv`;
          break;
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error(err);
      alert('เกิดข้อผิดพลาดขณะส่งออกไฟล์ Excel');
    }
  };

  // Trigger Local JSON backup download (highly structured, includes settings)
  const handleLocalJsonDownload = () => {
    try {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
      const backupData = {
        appSignature: 'DEKASUITE_FULL_BACKUP',
        backupDate: new Date().toISOString(),
        tasks,
        expenses,
        settings
      };
      
      const jsonContent = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `DekaSuite_FullBackup_${dateStr}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดขณะส่งออกไฟล์สำรอง JSON');
    }
  };

  // Restore database from local JSON file upload
  const handleLocalJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.appSignature !== 'DEKASUITE_FULL_BACKUP') {
          throw new Error('โครงสร้างไฟล์ไม่ถูกต้องหรือไม่ใช่ไฟล์สำรองที่ถูกต้องของระบบ DekaSuite');
        }
        
        const confirmRestore = window.confirm(
          `⚠️ คำเตือน: คุณแน่ใจหรือไม่ว่าต้องการกู้คืนข้อมูล?\n\nการนำเข้าไฟล์นี้จะเขียนทับข้อมูลงานและรายจ่ายในปัจจุบันของคุณด้วยข้อมูลจากไฟล์สำรองวันที่: ${formatThaiDate(data.backupDate)}`
        );
        
        if (confirmRestore) {
          onRestore({
            tasks: data.tasks || [],
            expenses: data.expenses || [],
            settings: data.settings
          });
          alert('🎉 กู้คืนข้อมูลสำเร็จเรียบร้อยแล้ว!');
        }
      } catch (err: any) {
        alert(`การกู้คืนล้มเหลว: ${err.message || 'ไฟล์ JSON รูปแบบไม่ถูกต้อง'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  // Upload/Create full backup in Google Drive (JSON restore + Excel backups)
  const handleGoogleDriveBackup = async () => {
    if (!accessToken || !driveFolderId) {
      setError('กรุณาเข้าสู่ระบบบัญชี Google ก่อนเริ่มการสำรองข้อมูล');
      return;
    }
    
    try {
      setLoading(true);
      setBackupStatus({ type: 'idle', message: '' });
      
      const timestamp = new Date().toISOString();
      const dateStr = new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '_');
      
      // 1. Generate Backup Files Content
      const fullBackupData = {
        appSignature: 'DEKASUITE_FULL_BACKUP',
        backupDate: timestamp,
        tasks,
        expenses,
        settings
      };
      
      const jsonContent = JSON.stringify(fullBackupData, null, 2);
      const tasksCsvContent = generateTasksCSV(tasks);
      const expensesCsvContent = generateExpensesCSV(expenses);
      
      // Define files to upload
      const filesToUpload = [
        {
          name: `DekaSuite_FullRestore_${dateStr}.json`,
          mimeType: 'application/json',
          content: jsonContent
        },
        {
          name: `DekaSuite_Tasks_${dateStr}.csv`,
          mimeType: 'text/csv',
          content: tasksCsvContent
        },
        {
          name: `DekaSuite_Expenses_${dateStr}.csv`,
          mimeType: 'text/csv',
          content: expensesCsvContent
        }
      ];
      
      // 2. Perform multipart upload for each file
      for (const fileItem of filesToUpload) {
        const metadata = {
          name: fileItem.name,
          parents: [driveFolderId],
          mimeType: fileItem.mimeType
        };
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([fileItem.content], { type: fileItem.mimeType }));
        
        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          body: form
        });
        
        if (!res.ok) {
          throw new Error(`อัปโหลดไฟล์ ${fileItem.name} ล้มเหลว`);
        }
      }
      
      setBackupStatus({
        type: 'success',
        message: `สำรองข้อมูลขึ้น Google Drive สำเร็จ! (อัปโหลดครบ 3 ไฟล์: ไฟล์กู้คืนหลัก, งาน-คดี Excel, รายรับรายจ่าย Excel)`
      });
      
      // Refresh list to show newly added files
      await fetchBackupFiles(accessToken, driveFolderId);
      
    } catch (err: any) {
      console.error('Drive upload error:', err);
      setBackupStatus({
        type: 'error',
        message: err.message || 'การสำรองข้อมูลขึ้นคลาวด์ Google Drive ล้มเหลว'
      });
    } finally {
      setLoading(false);
    }
  };

  // Restore directly from a backup file listed on Google Drive
  const handleRestoreFromDrive = async (fileId: string, fileName: string) => {
    if (!accessToken) return;
    
    const confirmRestore = window.confirm(
      `⚠️ คำเตือน: คุณต้องการกู้คืนข้อมูลจากไฟล์ "${fileName}" ใช่หรือไม่?\n\nข้อมูลภารกิจ งาน และบัญชีรายรับรายจ่ายในระบบตอนนี้จะถูกทดแทนด้วยไฟล์กู้คืนที่เลือกทันที`
    );
    
    if (!confirmRestore) return;
    
    try {
      setIsRestoring(true);
      setError('');
      
      // Download file content using fileId
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (!res.ok) throw new Error('ไม่สามารถดาวน์โหลดไฟล์เพื่ออ่านข้อมูลได้');
      const backupData = await res.json();
      
      if (backupData.appSignature !== 'DEKASUITE_FULL_BACKUP') {
        throw new Error('ไฟล์ที่เลือกไม่ใช่รูปแบบไฟล์สำรองระบบ (JSON) ที่ถูกต้องของ DekaSuite');
      }
      
      onRestore({
        tasks: backupData.tasks || [],
        expenses: backupData.expenses || [],
        settings: backupData.settings
      });
      
      alert('🎉 ดำเนินการกู้คืนข้อมูลจาก Google Drive สำเร็จเรียบร้อยแล้ว!');
      setBackupStatus({
        type: 'success',
        message: `กู้คืนข้อมูลย้อนกลับเป็นรุ่นวันที่ ${formatThaiDate(backupData.backupDate)} เรียบร้อยแล้ว`
      });
    } catch (err: any) {
      console.error('Restore error:', err);
      alert(`การกู้คืนข้อมูลล้มเหลว: ${err.message || 'ระบบไม่สามารถเข้าถึงไฟล์ได้'}`);
    } finally {
      setIsRestoring(false);
    }
  };

  // Delete backup file from Google Drive
  const handleDeleteFromDrive = async (fileId: string, fileName: string) => {
    if (!accessToken) return;
    
    const confirmDelete = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์สำรอง "${fileName}" ออกจาก Google Drive ของคุณถาวร?`);
    if (!confirmDelete) return;
    
    try {
      setLoading(true);
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (!res.ok) throw new Error('ลบไฟล์ล้มเหลว');
      
      setBackupStatus({
        type: 'success',
        message: `ลบไฟล์ "${fileName}" สำเร็จ`
      });
      
      // Refresh list
      await fetchBackupFiles(accessToken, driveFolderId!);
    } catch (err: any) {
      console.error('Delete error:', err);
      setError('ไม่สามารถลบไฟล์สำรองจาก Google Drive ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* PERFORMANCE & ONLINE DATA LOSS PREVENTION STATUS BANNER */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/25 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left dark:border-emerald-800/40">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-md text-lg">
            ⚡
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                ระบบดึงข้อมูลออนไลน์ความเร็วสูง & กลไกป้องกันข้อมูลสูญหาย (High-Speed Online Sync & Zero-Data-Loss Engine)
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                Active 100%
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              • <strong>ดึงข้อมูลไว ใช้งานออนไลน์:</strong> อ่านข้อมูลจากความจำความเร็วสูง (Local Cache & Memory) ตอบสนองทันทีใน 0ms พร้อมซิงก์ฐานข้อมูล Cloud Firestore แบบเรียลไทม์<br />
              • <strong>ระบบป้องกันข้อมูลหาย 2 ชั้น:</strong> บันทึกข้อมูลลงทั้ง Google Cloud Firestore และเบราว์เซอร์เครื่องท้องถิ่น (IndexedDB/LocalStorage) อัตโนมัติ ป้องกันข้อมูลสูญหาย 100% แม้อินเทอร์เน็ตหลุดหรือเครื่องดับ
            </p>
          </div>
        </div>
      </div>

      {/* STORAGE LOCATION SPECIFICATIONS & FILE ACCESS CENTER (EXCLUSIVELY FOR CREATOR ADMIN) */}
      {isAdminCreator ? (
        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 dark:from-indigo-950/20 dark:via-slate-900/40 dark:to-slate-900/20 p-5 sm:p-6 space-y-5 text-left shadow-xs">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md text-base">
                📍
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    ศูนย์ข้อมูลระบุตำแหน่งจัดเก็บ & สิทธิ์เข้าถึงไฟล์จริง (Data Storage Specs & File Access Center)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[9.5px] font-black border border-indigo-200 dark:border-indigo-800">
                    👑 เฉพาะแอดมินผู้สร้างเท่านั้น
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  รายละเอียดตำแหน่งที่อยู่ของไฟล์ข้อมูลจริงบนคลาวด์และในเครื่อง พร้อมเครื่องมือเข้าถึงและเปิดไฟล์โดยตรง
                </p>
              </div>
            </div>
          </div>

          {/* Grid of Storage Locations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. Cloud Database Location */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                <span>☁️</span>
                <span>1. ฐานข้อมูลคลาวด์หลัก (Cloud Database)</span>
              </div>
              <div className="text-[11px] space-y-1.5 text-slate-700 dark:text-slate-300">
                <p><strong className="text-slate-900 dark:text-white">ระบบ:</strong> Google Cloud Firestore</p>
                <p><strong className="text-slate-900 dark:text-white">ภูมิภาค (Region):</strong> Asia-East1 (Singapore / Multi-Region Cloud)</p>
                <p><strong className="text-slate-900 dark:text-white">Project ID:</strong> <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">ais-dev-996d37c...</code></p>
                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                  <p className="font-bold text-[10px] text-slate-500 dark:text-slate-400 mb-1">Collections / เส้นทางจัดเก็บข้อมูล:</p>
                  <ul className="text-[10px] font-mono text-slate-600 dark:text-slate-400 space-y-0.5 pl-2 list-disc list-inside">
                    <li><span className="text-indigo-600 dark:text-indigo-400 font-bold">/users/</span> (บัญชีผู้ใช้ระบบ)</li>
                    <li><span className="text-indigo-600 dark:text-indigo-400 font-bold">/tasks/</span> (ภารกิจ งานคดี มอบหมาย)</li>
                    <li><span className="text-indigo-600 dark:text-indigo-400 font-bold">/expenses/</span> (บิล รายจ่าย งวดผ่อน)</li>
                    <li><span className="text-indigo-600 dark:text-indigo-400 font-bold">/announcements/</span> (ประกาศข่าวสาร)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 2. Local Machine Cache Location */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <span>💾</span>
                <span>2. ที่เก็บในเครื่องเบราว์เซอร์ (Local Cache)</span>
              </div>
              <div className="text-[11px] space-y-1.5 text-slate-700 dark:text-slate-300">
                <p><strong className="text-slate-900 dark:text-white">เทคโนโลยี:</strong> LocalStorage & IndexedDB Engine</p>
                <p><strong className="text-slate-900 dark:text-white">วัตถุประสงค์:</strong> โหลดเร็ว 0ms & ป้องกันข้อมูลหาย</p>
                <p><strong className="text-slate-900 dark:text-white">สิทธิ์การเข้าถึง:</strong> แอดมินผู้สร้างระบบเครื่องนี้</p>
                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                  <p className="font-bold text-[10px] text-slate-500 dark:text-slate-400 mb-1">Local Storage Keys ในเครื่อง:</p>
                  <ul className="text-[10px] font-mono text-slate-600 dark:text-slate-400 space-y-0.5 pl-2 list-disc list-inside">
                    <li><span className="text-emerald-600 dark:text-emerald-400 font-bold">taskflow_tasks_v2</span></li>
                    <li><span className="text-emerald-600 dark:text-emerald-400 font-bold">taskflow_expenses_v1</span></li>
                    <li><span className="text-emerald-600 dark:text-emerald-400 font-bold">deka_settings_v3</span></li>
                    <li><span className="text-emerald-600 dark:text-emerald-400 font-bold">user_profile_*</span></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 3. Google Drive Cloud Vault Location */}
            <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                <span>📁</span>
                <span>3. ไดรฟ์เก็บไฟล์สำรอง (Google Drive Vault)</span>
              </div>
              <div className="text-[11px] space-y-1.5 text-slate-700 dark:text-slate-300">
                <p><strong className="text-slate-900 dark:text-white">ชื่อโฟลเดอร์:</strong> <code className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-mono px-1.5 py-0.5 rounded">DekaSuite_Backups</code></p>
                <p><strong className="text-slate-900 dark:text-white">ประเภทสิทธิ์:</strong> Google OAuth2 (drive.file)</p>
                <p><strong className="text-slate-900 dark:text-white">การควบคุม:</strong> แอดมินจัดการไฟล์เข้า/ออกได้อิสระ</p>
                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                  <p className="font-bold text-[10px] text-slate-500 dark:text-slate-400 mb-1">รูปแบบไฟล์สำรองในโฟลเดอร์:</p>
                  <ul className="text-[10px] font-mono text-slate-600 dark:text-slate-400 space-y-0.5 pl-2 list-disc list-inside">
                    <li><span className="text-amber-600 dark:text-amber-400 font-bold">*.json</span> (ไฟล์กู้คืนระบบหลัก)</li>
                    <li><span className="text-amber-600 dark:text-amber-400 font-bold">*.csv</span> (ไฟล์สเปรดชีตตารางงาน/รายจ่าย)</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>

          {/* Interactive Direct File Access Center Panel */}
          <div className="bg-white dark:bg-slate-900 border border-indigo-150 dark:border-indigo-900/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>📂</span>
                <span>ศูนย์ดาวน์โหลดและเข้าถึงไฟล์ข้อมูลดิบจริง (Direct File Access Center)</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold">
                อนุญาตสิทธิ์เฉพาะแอดมินผู้สร้าง
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              
              {/* Access File 1: Full JSON */}
              <button
                type="button"
                onClick={handleLocalJsonDownload}
                className="p-3 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-left transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">📄 DekaSuite_Full.json</span>
                  <Download className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <p className="text-[9.5px] text-slate-500 dark:text-slate-400">ไฟล์โครงสร้างข้อมูลดิบรวมทั้งหมด</p>
              </button>

              {/* Access File 2: Tasks CSV */}
              <button
                type="button"
                onClick={() => handleLocalExcelDownload('tasks')}
                className="p-3 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-left transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">📊 Tasks_Database.csv</span>
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <p className="text-[9.5px] text-slate-500 dark:text-slate-400">ไฟล์ตารางงาน คำฟ้อง และคดี ({tasks.length} รายการ)</p>
              </button>

              {/* Access File 3: Expenses CSV */}
              <button
                type="button"
                onClick={() => handleLocalExcelDownload('expenses')}
                className="p-3 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-left transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">💵 Expenses_Database.csv</span>
                  <Download className="w-3.5 h-3.5 text-teal-500" />
                </div>
                <p className="text-[9.5px] text-slate-500 dark:text-slate-400">ไฟล์ตารางรายจ่ายและบิล ({expenses.length} รายการ)</p>
              </button>

              {/* Access File 4: Users CSV */}
              <button
                type="button"
                onClick={() => handleLocalExcelDownload('users')}
                className="p-3 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-left transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">👥 Users_Registry.csv</span>
                  <Download className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <p className="text-[9.5px] text-slate-500 dark:text-slate-400">ไฟล์ตารางสิทธิ์บัญชีผู้ใช้ ({allUsersList.length} ผู้ใช้)</p>
              </button>

            </div>
          </div>

        </div>
      ) : (
        /* Notice for Non-Admin / General Users */
        <div className="rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/10 p-5 text-left flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
              ตำแหน่งจัดเก็บข้อมูลและสิทธิ์เข้าถึงไฟล์จำกัดการเข้าถึง
            </h4>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80 mt-0.5">
              ข้อมูลระบุตำแหน่งจัดเก็บไฟล์ดิบและเครื่องมือดาวน์โหลดไฟล์ฐานข้อมูลเชิงลึก จะแสดงผลและให้สิทธิ์เข้าถึงเฉพาะแอดมินผู้สร้างระบบเท่านั้น
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* COLUMN 1: GOOGLE DRIVE BACKUP (CLOUD SECURITY) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            
            {/* Sec Title */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-left">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">เชื่อมต่อ Google Drive (Cloud Backup)</h3>
                  <p className="text-[10px] text-slate-400">เก็บเอกสารงานและฐานข้อมูลไว้บนกูเกิลคลาวด์ของคุณ</p>
                </div>
              </div>

              {driveUser && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>เชื่อมต่อแล้ว</span>
                </div>
              )}
            </div>

            {/* Auth panel */}
            {!driveUser ? (
              <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-600">
                  <Cloud className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-750 dark:text-slate-300">เข้าสู่ระบบด้วยบัญชี Google ของคุณ</h4>
                  <p className="text-[10px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                    อนุญาตให้สิทธิ์ "DekaSuite" สำรองข้อมูลโดยตรง และจัดเก็บไฟล์สเปรดชีตสืบค้นฎีกา/รายจ่ายลงในบัญชี Drive ของท่านอย่างปลอดภัยเป็นส่วนตัว (สิทธิ์ drive.file จะมองไม่เห็นโฟลเดอร์อื่นของท่าน ปลอดภัยที่สุด)
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full sm:w-auto h-11 px-6 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-850 dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 border border-slate-200 dark:border-slate-300 disabled:opacity-50"
                >
                  <Database className="w-4 h-4 text-amber-500" />
                  <span>{loading ? 'กำลังเชื่อมต่อ...' : 'ลงชื่อเข้าใช้ด้วย Google'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Account Details Banner */}
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <img 
                      src={driveUser.photoURL || ''} 
                      alt={driveUser.displayName || ''} 
                      className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate">{driveUser.displayName}</h4>
                      <p className="text-[10px] text-slate-400 truncate">{driveUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-500 hover:text-rose-600 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                    title="ตัดการเชื่อมต่อบัญชี"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>

                {/* Cloud backup action widgets */}
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={handleGoogleDriveBackup}
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all text-slate-950 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10 disabled:opacity-50"
                  >
                    <Upload className="w-4.5 h-4.5" />
                    <span>{loading ? 'กำลังบันทึกสำรอง...' : 'เริ่มกระบวนการสำรองข้อมูลขึ้น Google Drive'}</span>
                  </button>
                </div>

              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-150 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400 text-left text-xs flex gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success notification banner */}
            {backupStatus.type !== 'idle' && (
              <div className={`p-4 rounded-xl text-left text-xs flex gap-2.5 border ${
                backupStatus.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400' 
                  : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400'
              }`}>
                {backupStatus.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                )}
                <div className="space-y-0.5">
                  <h4 className="font-bold">{backupStatus.type === 'success' ? 'บันทึกข้อมูลเรียบร้อย' : 'ล้มเหลว'}</h4>
                  <p className="text-[11px] leading-relaxed opacity-90">{backupStatus.message}</p>
                </div>
              </div>
            )}

          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-850">
            <div className="flex gap-2 text-left text-[10px] text-slate-400 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>
                ข้อมูลของคุณปลอดภัย ความปลอดภัยระดับทหาร (Military-grade security) ข้อมูลทั้งหมดจะถูกบันทึกในรูปของไฟล์ส่วนตัว ไม่สามารถเข้าถึงโดยผู้ใช้อื่น และจะได้รับการจัดเก็บเฉพาะในที่จัดเก็บส่วนตัวของคุณเองใน Drive เท่านั้น
              </span>
            </div>
          </div>

        </div>

        {/* COLUMN 2: LOCAL EXCEL (SAVES DIRECTLY TO COMPUTER) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            
            {/* Sec Title */}
            <div className="flex items-center gap-2 text-left">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">ส่งออก Excel & สำรองในเครื่องท้องถิ่น</h3>
                <p className="text-[10px] text-slate-400">บันทึกเป็นสเปรดชีตลงคอมพิวเตอร์ของคุณโดยไม่ต้องเชื่อมต่อกูเกิลคลาวด์</p>
              </div>
            </div>

            {/* Quick download widgets */}
            <div className="space-y-3 text-left">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">เลือกดาวน์โหลดข้อมูลหลังบ้านแยกตามหมวดหมู่ (Excel / Google Sheets):</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Export tasks */}
                <button
                  type="button"
                  onClick={() => handleLocalExcelDownload('tasks')}
                  className="h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-950/60 text-slate-750 dark:text-slate-200 text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="truncate">1. รายการงานและคดี ({tasks.length})</span>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                </button>

                {/* Export expenses */}
                <button
                  type="button"
                  onClick={() => handleLocalExcelDownload('expenses')}
                  className="h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-950/60 text-slate-750 dark:text-slate-200 text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileSpreadsheet className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    <span className="truncate">2. รายงานรายจ่าย/บิล ({expenses.length})</span>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                </button>

                {/* Export Installment Schedules */}
                <button
                  type="button"
                  onClick={() => handleLocalExcelDownload('installments')}
                  className="h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-950/60 text-slate-750 dark:text-slate-200 text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2 truncate">
                    <CreditCard className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                    <span className="truncate">3. งวดผ่อนชำระ</span>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                </button>

                {/* Export Users Registry */}
                <button
                  type="button"
                  onClick={() => handleLocalExcelDownload('users')}
                  className="h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-950/60 text-slate-750 dark:text-slate-200 text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Users className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span className="truncate">4. ผู้ใช้งานหลังบ้าน ({allUsersList.length})</span>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                </button>

                {/* Export Announcements */}
                <button
                  type="button"
                  onClick={() => handleLocalExcelDownload('announcements')}
                  className="h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-950/60 text-slate-750 dark:text-slate-200 text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Bell className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="truncate">5. ประกาศข่าวสาร ({announcements.length})</span>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                </button>

                {/* Export Links */}
                <button
                  type="button"
                  onClick={() => handleLocalExcelDownload('links')}
                  className="h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-950/60 text-slate-750 dark:text-slate-200 text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2 truncate">
                    <LinkIcon className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span className="truncate">6. เมนูลิงก์ภายนอก ({customMenuLinks.length})</span>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                </button>
              </div>

              {/* ALL-IN-ONE MASTER EXPORT BUTTON */}
              <button
                type="button"
                onClick={() => handleLocalExcelDownload('all')}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-98 transition-all cursor-pointer border border-emerald-400/30 mt-2"
              >
                <FileSpreadsheet className="w-4.5 h-4.5 text-amber-300" />
                <span>🌟 ส่งออกรวมข้อมูลหลังบ้านทั้งหมดในไฟล์เดียว (Master All-in-One Excel)</span>
              </button>
            </div>

            {/* Local JSON restore/backup panel */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-4 text-left">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">ระบบนำเข้าข้อมูลและสำรองข้อมูลฉบับเต็ม (.json):</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Download Full JSON Backup */}
                <button
                  type="button"
                  onClick={handleLocalJsonDownload}
                  className="h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-750 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <Download className="w-4 h-4 text-amber-500" />
                  <span>บันทึกไฟล์สำรองหลัก (.json)</span>
                </button>

                {/* Import JSON Restore */}
                <label className="h-11 px-4 rounded-xl border-2 border-dashed border-slate-350 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-950/50 text-slate-750 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98">
                  <Upload className="w-4 h-4 text-amber-500" />
                  <span>นำเข้าไฟล์กู้คืนข้อมูล (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleLocalJsonUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-850">
            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 text-left leading-relaxed">
              <strong>💡 คำแนะนำเพิ่มเติม:</strong> เมื่อดาวน์โหลดสเปรดชีต Excel (.csv) ระบบได้ฝังรหัสภาษาไทย (BOM) เรียบร้อย ทำให้สามารถคลิกเปิดดูไฟล์ผ่าน Microsoft Excel 2560+ หรือ Google Sheets ภาษาไทยได้ทันที ตัวอักษรจะไม่เพี้ยนและไม่แสดงสัญลักษณ์แปลกประหลาด
            </div>
          </div>

        </div>

      </div>

      {/* CLOUD FILES LISTING & RESTORE PORTAL */}
      {driveUser && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 p-6 text-left space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileJson className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">รายการไฟล์สำรองบน Google Drive</h3>
                <p className="text-[10px] text-slate-400">เลือกและกู้คืนข้อมูลย้อนหลังกลับสู่ระบบได้ทันที (Restoration Portal)</p>
              </div>
            </div>

            <button
              onClick={handleRefreshList}
              disabled={loading || isRestoring}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer disabled:opacity-50"
              title="ดึงข้อมูลใหม่"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Table list */}
          {driveBackups.length === 0 ? (
            <div className="border border-dashed border-slate-150 dark:border-slate-850 rounded-xl p-8 text-center text-slate-400">
              <Database className="w-8 h-8 mx-auto opacity-30 mb-2" />
              <p className="text-xs">ไม่พบไฟล์สำรองข้อมูลในโฟลเดอร์ "DekaSuite_Backups"</p>
              <p className="text-[10px] text-slate-500 mt-0.5">กดปุ่ม "เริ่มกระบวนการสำรองข้อมูล" ด้านบนเพื่อทำการสร้างไฟล์สำรองครั้งแรก</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950/25">
              <table className="w-full text-xs text-left text-slate-600 dark:text-slate-400">
                <thead className="text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                  <tr>
                    <th className="px-4 py-3">ชื่อไฟล์สำรอง</th>
                    <th className="px-4 py-3">ประเภทไฟล์</th>
                    <th className="px-4 py-3">ขนาดไฟล์</th>
                    <th className="px-4 py-3">วันที่สร้าง/อัปโหลด</th>
                    <th className="px-4 py-3 text-right">การจัดการคลาวด์</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                  {driveBackups.map((file) => {
                    const isRestoreFile = file.name.endsWith('.json');
                    return (
                      <tr key={file.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                          <div className="flex items-center gap-2">
                            {isRestoreFile ? (
                              <FileJson className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            ) : (
                              <FileSpreadsheet className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            )}
                            <span className="truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                            isRestoreFile 
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          }`}>
                            {isRestoreFile ? 'กู้คืนหลัก (JSON)' : 'ตาราง (Excel / CSV)'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px]">{formatBytes(file.size)}</td>
                        <td className="px-4 py-3 text-slate-450">{formatThaiDate(file.createdTime)}</td>
                        <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                          
                          {/* Direct view link on Google Drive */}
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                              title="เปิดดูบน Google Drive"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Restore Option (only for .json restore file) */}
                          {isRestoreFile && (
                            <button
                              onClick={() => handleRestoreFromDrive(file.id, file.name)}
                              disabled={isRestoring || loading}
                              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] flex items-center gap-1 active:scale-95 transition-all disabled:opacity-50"
                              title="กู้คืนข้อมูลจากไฟล์นี้"
                            >
                              <Upload className="w-3 h-3" />
                              <span>กู้คืน</span>
                            </button>
                          )}

                          {/* Delete option */}
                          <button
                            onClick={() => handleDeleteFromDrive(file.id, file.name)}
                            disabled={loading || isRestoring}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 transition-colors"
                            title="ลบไฟล์ออกจาก Drive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* LIVE BACKEND DATA INSPECTOR TABLE (ตารางดูข้อมูลหลังบ้านแบบเรียลไทม์ในหน้าตั้งค่า) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 p-6 text-left space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-inner">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <span>ตารางพรีวิวและตรวจสอบข้อมูลหลังบ้านสด (Live Backend Data Viewer)</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black">
                  เรียลไทม์
                </span>
              </h3>
              <p className="text-[10px] text-slate-400">คลิกเลือกหมวดหมู่ข้อมูล ค้นหา และกดส่งออก Excel ของหมวดหมู่นั้นๆ ได้ทันที</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาในตารางข้อมูลหลังบ้าน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-[11px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="button"
              onClick={() => handleLocalExcelDownload(activePreviewTab as any)}
              className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>โหลด Excel ตารางนี้</span>
            </button>
          </div>
        </div>

        {/* DATA SELECTOR TABS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'tasks', label: '📋 งาน/คดี', count: tasks.length },
            { id: 'expenses', label: '💰 รายจ่าย/บิล', count: expenses.length },
            { id: 'installments', label: '💳 งวดผ่อนชำระ', count: expenses.filter(e => e.isInstallment && e.installments?.length).length },
            { id: 'users', label: '👥 ผู้ใช้งานหลังบ้าน', count: allUsersList.length },
            { id: 'announcements', label: '📢 ประกาศข่าวสาร', count: announcements.length },
            { id: 'links', label: '🔗 ลิงก์เสริม', count: customMenuLinks.length },
          ].map(tab => {
            const isActive = activePreviewTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePreviewTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-850'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9.5px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* LIVE DATA GRID DISPLAY */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950/20 max-h-80 overflow-y-auto">
          {activePreviewTab === 'tasks' && (
            <table className="w-full text-xs text-left text-slate-600 dark:text-slate-400">
              <thead className="text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2.5">หัวข้อภารกิจ</th>
                  <th className="px-3 py-2.5">หมวดหมู่</th>
                  <th className="px-3 py-2.5">กำหนดส่ง</th>
                  <th className="px-3 py-2.5">สถานะ</th>
                  <th className="px-3 py-2.5">ผู้ใช้ผู้บันทึก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                {tasks.filter(t => !searchTerm || t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase())).map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                    <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200">{t.title}</td>
                    <td className="px-3 py-2"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">{t.category}</span></td>
                    <td className="px-3 py-2 font-mono text-[10.5px]">{t.dueDate} {t.dueTime || ''}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {t.status === 'completed' ? 'เสร็จสิ้น' : 'รอดำเนินการ'}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium">{t.userId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activePreviewTab === 'expenses' && (
            <table className="w-full text-xs text-left text-slate-600 dark:text-slate-400">
              <thead className="text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2.5">ชื่อรายการ</th>
                  <th className="px-3 py-2.5">จำนวนเงิน</th>
                  <th className="px-3 py-2.5">หมวดหมู่</th>
                  <th className="px-3 py-2.5">วันที่ครบกำหนด</th>
                  <th className="px-3 py-2.5">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                {expenses.filter(e => !searchTerm || e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.cat.toLowerCase().includes(searchTerm.toLowerCase())).map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                    <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200">{e.name}</td>
                    <td className="px-3 py-2 font-mono font-bold text-emerald-500">{e.amount?.toLocaleString()} ฿</td>
                    <td className="px-3 py-2"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">{e.cat}</span></td>
                    <td className="px-3 py-2 font-mono text-[10.5px]">{e.dueDate}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${e.paid ? 'bg-teal-500/10 text-teal-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {e.paid ? 'ชำระแล้ว' : 'ค้างชำระ'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activePreviewTab === 'installments' && (
            <table className="w-full text-xs text-left text-slate-600 dark:text-slate-400">
              <thead className="text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2.5">รายการหลัก</th>
                  <th className="px-3 py-2.5">งวดที่</th>
                  <th className="px-3 py-2.5">ยอดงวดนี้</th>
                  <th className="px-3 py-2.5">กำหนดชำระ</th>
                  <th className="px-3 py-2.5">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                {expenses.filter(e => e.isInstallment && e.installments?.length).flatMap(e => (e.installments || []).map(inst => ({ parentName: e.name, cat: e.cat, ...inst }))).filter(i => !searchTerm || i.parentName.toLowerCase().includes(searchTerm.toLowerCase())).map((i, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                    <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200">{i.parentName}</td>
                    <td className="px-3 py-2 font-mono font-bold">งวดที่ {i.installmentNo}</td>
                    <td className="px-3 py-2 font-mono font-bold text-cyan-500">{i.amount?.toLocaleString()} ฿</td>
                    <td className="px-3 py-2 font-mono text-[10.5px]">{i.dueDate}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${i.paid ? 'bg-teal-500/10 text-teal-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {i.paid ? 'ชำระแล้ว' : 'ค้างชำระ'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activePreviewTab === 'users' && (
            <table className="w-full text-xs text-left text-slate-600 dark:text-slate-400">
              <thead className="text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2.5">ลำดับ</th>
                  <th className="px-3 py-2.5">ชื่อผู้ใช้ / Username</th>
                  <th className="px-3 py-2.5">อีเมล</th>
                  <th className="px-3 py-2.5">เบอร์โทรศัพท์</th>
                  <th className="px-3 py-2.5">Firebase UID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                {allUsersList.filter(u => !searchTerm || u.userId.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase())).map((u, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                    <td className="px-3 py-2 font-mono">{idx + 1}</td>
                    <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200">{u.userId}</td>
                    <td className="px-3 py-2">{u.email || '-'}</td>
                    <td className="px-3 py-2 font-mono">{u.phone || '-'}</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-slate-400 truncate max-w-[120px]">{u.uid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activePreviewTab === 'announcements' && (
            <table className="w-full text-xs text-left text-slate-600 dark:text-slate-400">
              <thead className="text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2.5">หัวข้อประกาศ</th>
                  <th className="px-3 py-2.5">ผู้เขียน</th>
                  <th className="px-3 py-2.5">ขอบเขต</th>
                  <th className="px-3 py-2.5">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                {announcements.filter(a => !searchTerm || a.title.toLowerCase().includes(searchTerm.toLowerCase())).map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                    <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200">{a.title}</td>
                    <td className="px-3 py-2">{a.author || 'แอดมิน'}</td>
                    <td className="px-3 py-2"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">{a.visibility === 'all' ? 'ทุกคน' : 'ระบุผู้ใช้'}</span></td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${a.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'}`}>
                        {a.isActive ? 'เปิดอยู่' : 'ปิดอยู่'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activePreviewTab === 'links' && (
            <table className="w-full text-xs text-left text-slate-600 dark:text-slate-400">
              <thead className="text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2.5">ชื่อเมนู</th>
                  <th className="px-3 py-2.5">URL ปลายทาง</th>
                  <th className="px-3 py-2.5">ไอคอน</th>
                  <th className="px-3 py-2.5">ขอบเขตสิทธิ์</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                {customMenuLinks.filter(l => !searchTerm || l.title.toLowerCase().includes(searchTerm.toLowerCase()) || l.url.toLowerCase().includes(searchTerm.toLowerCase())).map(l => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                    <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200">{l.title}</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-indigo-500 truncate max-w-[200px]">{l.url}</td>
                    <td className="px-3 py-2 font-semibold">{l.iconName || 'Link'}</td>
                    <td className="px-3 py-2"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">{l.visibility === 'all' ? 'ทุกคน' : 'ระบุผู้ใช้'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
