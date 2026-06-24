import React, { useState } from 'react';
import {
  List,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit3,
  Plus,
  Search,
  FileText,
  Star,
  ChevronDown,
  ChevronUp,
  Folder,
  Calendar,
  AlignLeft,
  ChevronsRight
} from 'lucide-react';
import { Task } from '../types';
import { useDialog } from './CustomDialog';
import { motion, AnimatePresence } from 'motion/react';

const getThailandTodayStr = () => {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
};

interface TaskModuleProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onEditTask: (id: string, updated: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onDeleteAllCompleted: () => void;
  categories: string[];
  accentColor: string;
}

export default function TaskModule({
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onDeleteAllCompleted,
  categories,
  accentColor
}: TaskModuleProps) {
  const { showAlert, showConfirm } = useDialog();
  const [searchQuery, setSearchQuery] = useState('');
  const [openDrawers, setOpenDrawers] = useState<Record<string, boolean>>({});
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  
  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Fields for Task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskCategory, setTaskCategory] = useState(categories[0] || '💼 งานทั่วไป');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskDueTime, setTaskDueTime] = useState('');

  // General Filter Popup modal state
  const [activeFilterPopup, setActiveFilterPopup] = useState<'all' | 'pending' | 'completed' | 'overdue' | null>(null);

  // Print Modal Configuration States
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printPeriod, setPrintPeriod] = useState<'all' | 'day' | 'month' | 'year'>('all');
  const [printDay, setPrintDay] = useState(getThailandTodayStr ? getThailandTodayStr() : '');
  const [printMonth, setPrintMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [printYear, setPrintYear] = useState(String(new Date().getFullYear()));
  const [printStatus, setPrintStatus] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [printCategory, setPrintCategory] = useState('all');
  const [printIncludeDesc, setPrintIncludeDesc] = useState(true);

  const todayStr = getThailandTodayStr();

  // Filter computation
  const filteredTasks = tasks.filter(t => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = t.title.toLowerCase().includes(query) || (t.desc || '').toLowerCase().includes(query);
    return matchesSearch;
  });

  const countToday = tasks.filter(t => t.dueDate === todayStr && t.status !== 'completed').length;
  const countPending = tasks.filter(t => t.status !== 'completed').length;
  const countCompleted = tasks.filter(t => t.status === 'completed').length;
  
  const countOverdue = tasks.filter(t => {
    return t.dueDate && t.dueDate < todayStr && t.status !== 'completed';
  }).length;

  const toggleDrawer = (id: string) => {
    setOpenDrawers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Forms management
  const openNewTaskModal = (overrideDate?: string) => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskCategory(categories[0] || '💼 งานทั่วไป');
    setTaskDueDate(overrideDate || todayStr);
    setTaskDueTime('');
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.desc || '');
    setTaskCategory(task.category);
    setTaskDueDate(task.dueDate);
    setTaskDueTime(task.dueTime || '');
    setIsTaskModalOpen(true);
  };

  const submitTaskForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      await showAlert('กรุณากรอกหัวชื่องานให้ครบถ้วนถูกต้องก่อนบันทึกรายการ', 'ข้อมูลไม่สมบูรณ์', 'warning');
      return;
    }

    if (editingTask) {
      onEditTask(editingTask.id, {
        title: taskTitle,
        desc: taskDesc,
        category: taskCategory,
        dueDate: taskDueDate,
        dueTime: taskDueTime
      });
    } else {
      onAddTask({
        title: taskTitle,
        desc: taskDesc,
        category: taskCategory,
        dueDate: taskDueDate,
        dueTime: taskDueTime,
        status: 'pending',
        userId: 'session'
      });
    }

    setIsTaskModalOpen(false);
  };

  const handleQuickComplete = async (id: string, title: string) => {
    const isConfirmed = await showConfirm(
      `คุณทำเสร็จสิ้นภารกิจ "${title}" เรียบร้อยแล้วใช่หรือไม่?`,
      'เสร็จสิ้นภารกิจ',
      'success'
    );
    if (isConfirmed) {
      onEditTask(id, { status: 'completed' });
    }
  };

  const handleDeleteClick = async (id: string, title: string) => {
    const isConfirmed = await showConfirm(
      `คุณต้องการยืนยันลบกิจกรรมงาน "${title}" ออกจากระบบใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนคืนได้`,
      'ยืนยันการลบงาน',
      'danger'
    );
    if (isConfirmed) {
      onDeleteTask(id);
    }
  };

  const handleClearCompletedClick = async () => {
    const isConfirmed = await showConfirm(
      'คุณเสร็จสิ้นภารกิจทั้งหมดแล้ว และต้องการลบงานสัมฤทธิ์ผลเหล่านั้นเป็นข้อมูลขยะใช่หรือไม่?',
      'ลบงานเสร็จสิ้นทั้งหมด',
      'danger'
    );
    if (isConfirmed) {
      onDeleteAllCompleted();
    }
  };

  const getDaysPillInfo = (dueDateStr: string | null) => {
    if (!dueDateStr) return null;
    const due = new Date(dueDateStr);
    const today = new Date(todayStr);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `เลยกำหนด ${Math.abs(diffDays)} วัน`, style: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900' };
    } else if (diffDays === 0) {
      return { text: 'วันนี้!', style: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900' };
    } else if (diffDays <= 3) {
      return { text: `เหลือ ${diffDays} วัน`, style: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900' };
    } else {
      return { text: `เหลือ ${diffDays} วัน`, style: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900' };
    }
  };

  // Kanban partition
  const todayTasks = filteredTasks.filter(t => t.dueDate === todayStr && t.status !== 'completed');
  const pendingTasks = filteredTasks.filter(t => t.dueDate !== todayStr && t.status !== 'completed');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  // Export static summaries with custom filter selection
  const triggerPdfExport = () => {
    window.dispatchEvent(new CustomEvent('open-print-modal', { detail: { initialTab: 'tasks' } }));
  };

  const handlePrintTasks = () => {
    // Filter tasks based on custom user filter criteria
    const matched = tasks.filter(t => {
      // 1. Period constraints
      if (printPeriod === 'day') {
        if (t.dueDate !== printDay) return false;
      } else if (printPeriod === 'month') {
        if (!t.dueDate || t.dueDate.substring(0, 7) !== `${printYear}-${printMonth}`) return false;
      } else if (printPeriod === 'year') {
        if (!t.dueDate || t.dueDate.substring(0, 4) !== printYear) return false;
      }

      // 2. Status constraints
      if (printStatus === 'pending' && t.status === 'completed') return false;
      if (printStatus === 'completed' && t.status !== 'completed') return false;
      if (printStatus === 'overdue') {
        const isOverdue = t.dueDate && t.dueDate < todayStr && t.status !== 'completed';
        if (!isOverdue) return false;
      }

      // 3. Category constraints
      if (printCategory !== 'all' && t.category !== printCategory) return false;

      return true;
    });

    const statusLabel = {
      all: 'ทุกสถานะงาน',
      pending: 'รอดำเนินการบอร์ด',
      completed: 'เสร็จสิ้นการดำเนินงาน',
      overdue: 'เกินกำหนดเวลาส่งล่าช้า'
    }[printStatus];

    const periodLabel = {
      all: 'งานทั้งหมดที่มีสะสมอยู่ในโปรแกรมระบบ',
      day: `เฉพาะวันที่ประเมิน ${printDay.split('-').reverse().join('/')}`,
      month: `ประจำรอบช่วงเดือน ${['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'][parseInt(printMonth) - 1]} พ.ศ. ${parseInt(printYear) + 543}`,
      year: `ประจำปี พ.ศ. ${parseInt(printYear) + 543}`
    }[printPeriod];

    const categoryLabel = printCategory === 'all' ? 'ทุกประเภทภารกิจงาน' : printCategory;

    // Build Thai traditional layout template
    const printDocContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>รายงานรายการภารกิจและการดำเนินงานอย่างเป็นทางการ</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
          body {
            font-family: 'Sarabun', sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 40px;
            line-height: 1.6;
            background-color: #ffffff;
            font-size: 13px;
          }
          .header-title-box {
            border-bottom: 3px double #0f172a;
            padding-bottom: 20px;
            margin-bottom: 25px;
            text-align: center;
          }
          .header-title-box h1 {
            font-size: 22px;
            margin: 0 0 8px 0;
            font-weight: 800;
            letter-spacing: 0.5px;
          }
          .header-title-box p {
            font-size: 12px;
            color: #64748b;
            margin: 0;
          }
          .meta-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 25px;
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 15px;
            border-radius: 8px;
            font-size: 12px;
          }
          .meta-info-grid div {
            margin-bottom: 5px;
          }
          .metric-boxes {
            display: flex;
            gap: 15px;
            margin-bottom: 30px;
          }
          .m-box {
            flex: 1;
            border: 1px solid #e2e8f0;
            border-top: 4px solid #475569;
            padding: 12px;
            text-align: center;
            background-color: #ffffff;
            border-radius: 6px;
          }
          .m-box-completed { border-top-color: #10b981; }
          .m-box-pending { border-top-color: #f59e0b; }
          .m-box-overdue { border-top-color: #ef4444; }
          .m-box-title {
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 4px;
          }
          .m-box-value {
            font-size: 18px;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          th {
            background-color: #f1f5f9;
            border: 1px solid #94a3b8;
            color: #1f2937;
            font-weight: 700;
            font-size: 11.5px;
            padding: 10px;
            text-align: left;
          }
          td {
            border: 1px solid #cbd5e1;
            padding: 10px;
            font-size: 11.5px;
            vertical-align: top;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .badge-btn {
            font-size: 10.5px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 4px;
            display: inline-block;
          }
          .badge-btn-pending { background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
          .badge-btn-completed { background-color: #d1fae5; color: #047857; border: 1px solid #a7f3d0; }
          .badge-btn-overdue { background-color: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
          .signing-block {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
          }
          .sign-col {
            width: 45%;
            text-align: center;
          }
          .sign-dotted-line {
            border-bottom: 1px dotted #64748b;
            height: 45px;
            width: 80%;
            margin: 0 auto 10px auto;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="header-title-box">
          <h1>รายงานสรุปสารสนเทศภารกิจและการดำเนินงานอย่างเป็นทางการ</h1>
          <p>เอกสารสรุปผลการปฏิบัติการเพื่อใช้งานในหน่วยงาน (Official Task Summary Sheet)</p>
        </div>

        <div class="meta-info-grid">
          <div><strong>ขอบข่ายระยะเวลาข้อมูล:</strong> ${periodLabel}</div>
          <div><strong>หมวดหมู่ที่คัดกรอง:</strong> ${categoryLabel}</div>
          <div><strong>สถานะงานเกณฑ์:</strong> ${statusLabel}</div>
          <div><strong>พิมพ์เมื่อวันที่:</strong> ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} น.</div>
        </div>

        <div class="metric-boxes">
          <div class="m-box">
            <span class="m-box-title">จำนวนงานทั้งหมด</span>
            <div class="m-box-value" style="color:#475569;">${matched.length} รายการ</div>
          </div>
          <div class="m-box m-box-completed">
            <span class="m-box-title">ประมวลผลเสร็จสิ้น</span>
            <div class="m-box-value" style="color:#059669;">${matched.filter(t => t.status === 'completed').length} รายการ</div>
          </div>
          <div class="m-box m-box-pending">
            <span class="m-box-title">อยู่วิถีรอดำเนินการ</span>
            <div class="m-box-value" style="color:#d97706;">${matched.filter(t => t.status !== 'completed').length} รายการ</div>
          </div>
          <div class="m-box m-box-overdue">
            <span class="m-box-title">เกินกำหนดเวลาส่งล่าช้า</span>
            <div class="m-box-value" style="color:#dc2626;">${matched.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== 'completed').length} รายการ</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 7%; text-align: center;">ลำดับ</th>
              <th style="width: 25%;">ชื่องาน / ภารกิจหลัก</th>
              ${printIncludeDesc ? '<th style="width: 33%;">รายละเอียด/บันทึกการดำเนินงาน</th>' : ''}
              <th style="width: 13%;">หมวดหมู่หลัก</th>
              <th style="width: 11%;">กำหนดการส่ง</th>
              <th style="width: 11%; text-align: center;">สถานะการทำงาน</th>
            </tr>
          </thead>
          <tbody>
            ${matched.length === 0 ? `
              <tr>
                <td colspan="${printIncludeDesc ? 6 : 5}" style="text-align: center; padding: 40px; color: #94a3b8;">
                  <i>- ไม่พบข้อมูลใดที่ตรงตามเงื่อนไขที่เลือกจัดพิมพ์ -</i>
                </td>
              </tr>
            ` : matched.map((t, idx) => {
              const isDone = t.status === 'completed';
              const isOverdue = t.dueDate && t.dueDate < todayStr && !isDone;
              let sText = 'รอดำเนินการ';
              let badgeColorClass = 'badge-btn-pending';
              if (isDone) {
                sText = 'เสร็จสิ้น';
                badgeColorClass = 'badge-btn-completed';
              } else if (isOverdue) {
                sText = 'เลยกำหนดส่ง';
                badgeColorClass = 'badge-btn-overdue';
              }

              return `
                <tr>
                  <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                  <td><strong>${t.title}</strong></td>
                  ${printIncludeDesc ? `<td>${t.desc ? t.desc.replace(/\n/g, '<br/>') : '<span style="color:#cbd5e1">-</span>'}</td>` : ''}
                  <td>${t.category}</td>
                  <td>
                    ${t.dueDate ? t.dueDate.split('-').reverse().join('/') : '-'}
                    ${t.dueTime ? `<div style="font-size: 9.5px; color:#64748b; margin-top:2px;">⏰ ${t.dueTime} น.</div>` : ''}
                  </td>
                  <td style="text-align: center;">
                    <span class="badge-btn ${badgeColorClass}">${sText}</span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="signing-block">
          <div class="sign-col">
            <div class="sign-dotted-line"></div>
            <p style="font-size: 11px; margin: 0; font-weight: 600;">ลงชื่อผู้พิมพ์รายงาน</p>
            <p style="font-size: 9.5px; color: #64748b; margin-top: 3px;">(............................................................)</p>
          </div>
          <div class="sign-col">
            <div class="sign-dotted-line"></div>
            <p style="font-size: 11px; margin: 0; font-weight: 600;">ลงชื่อผู้มีอำนาจตรวจสอบ / สักขีพยาน</p>
            <p style="font-size: 9.5px; color: #64748b; margin-top: 3px;">(............................................................)</p>
          </div>
        </div>

        <p style="font-size: 9.5px; color: #94a3b8; text-align: center; margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
          เอกสารทางการฉบับนี้ส่งตรงจากฐานข้อมูล Firebase Cloud คัดลอกและตรวจสอบความถูกต้องด้วยความลับระบบ
        </p>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    iframe.contentWindow?.document.open();
    iframe.contentWindow?.document.write(printDocContent);
    iframe.contentWindow?.document.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 400);

    setIsPrintModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Metric widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          onClick={() => setActiveFilterPopup('all')}
          whileHover={{ scale: 1.04, y: -4 }}
          whileTap={{ scale: 0.96 }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.02 }}
          className="bg-white p-5 rounded-2xl border border-slate-200 cursor-pointer shadow-sm relative overflow-hidden group dark:bg-slate-900 dark:border-slate-800"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-400"></div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">งานทั้งหมด</div>
          <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-accent" style={{ '--accent': accentColor } as React.CSSProperties}>{tasks.length}</div>
        </motion.div>

        <motion.div
          onClick={() => setActiveFilterPopup('pending')}
          whileHover={{ scale: 1.04, y: -4 }}
          whileTap={{ scale: 0.96 }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.05 }}
          className="bg-white p-5 rounded-2xl border border-slate-200 cursor-pointer shadow-sm relative overflow-hidden group dark:bg-slate-900 dark:border-slate-800"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500"></div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">กำลังดำเนินการ</div>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 group-hover:text-accent" style={{ '--accent': accentColor } as React.CSSProperties}>{countPending}</div>
        </motion.div>

        <motion.div
          onClick={() => setActiveFilterPopup('completed')}
          whileHover={{ scale: 1.04, y: -4 }}
          whileTap={{ scale: 0.96 }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.08 }}
          className="bg-white p-5 rounded-2xl border border-slate-200 cursor-pointer shadow-sm relative overflow-hidden group dark:bg-slate-900 dark:border-slate-800"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500"></div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">เสร็จสิ้นแล้ว</div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 group-hover:text-accent" style={{ '--accent': accentColor } as React.CSSProperties}>{countCompleted}</div>
        </motion.div>

        <motion.div
          onClick={() => setActiveFilterPopup('overdue')}
          whileHover={{ scale: 1.04, y: -4 }}
          whileTap={{ scale: 0.96 }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.11 }}
          className="bg-white p-5 rounded-2xl border border-slate-200 cursor-pointer shadow-sm relative overflow-hidden group dark:bg-slate-900 dark:border-slate-800"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-rose-500"></div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">เกินกำหนดส่ง</div>
          <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 group-hover:text-accent" style={{ '--accent': accentColor } as React.CSSProperties}>{countOverdue}</div>
        </motion.div>
      </div>

      {/* 2. Actions toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center dark:bg-slate-900 dark:border-slate-800">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 animate-pulse" />
          <input
            type="text"
            placeholder="พิมพ์คำค้นหาเพื่อเด้งเปิดดูข้อมูลงานได้ทันที..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-accent text-sm text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 font-extrabold"
            style={{ '--accent': accentColor } as React.CSSProperties}
          />
          
          {/* Live Search Instant Dropdown Results (เด้งรายการขึ้นมาทันที) */}
          <AnimatePresence>
            {searchQuery.trim().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98, y: 5 }}
                className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto"
              >
                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 tracking-wider">
                    พบรายการที่ตรงกับคำค้นทั้งหมด {filteredTasks.length} รายการ
                  </span>
                  {filteredTasks.length > 0 && (
                    <span className="text-[9px] font-black text-emerald-500">
                      คลิกเพื่อเด้งเปิดงานหน้านี้ได้ทันที 🚀
                    </span>
                  )}
                </div>
                
                {filteredTasks.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 italic">
                    ไม่พบข้อมูลงานที่ตรงกับคำค้นหา " {searchQuery} " 🔍
                  </div>
                ) : (
                  <div className="p-1 px-1.5 flex flex-col gap-0.5">
                    {filteredTasks.map(t => {
                      const isDone = t.status === 'completed';
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            // Clear query, make drawer active, scroll and flash highlight!
                            setSearchQuery('');
                            setOpenDrawers(prev => ({ ...prev, [t.id]: true }));
                            setHighlightedTaskId(t.id);
                            
                            // Delay slightly for render cycles to smooth scroll perfectly
                            setTimeout(() => {
                              const el = document.getElementById(`task-card-${t.id}`);
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }, 120);

                            // auto-clear highlight flash after 2.5 seconds
                            setTimeout(() => {
                              setHighlightedTaskId(null);
                            }, 2500);
                          }}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all flex items-start gap-3 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 group"
                        >
                          <span className="text-base flex-shrink-0 mt-0.5">
                            {isDone ? '✅' : '📌'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-accent transition-colors" style={{ '--accent': accentColor } as React.CSSProperties}>
                              {t.title}
                            </h5>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md dark:bg-slate-850">
                                {t.category}
                              </span>
                              {t.dueDate && (
                                <span className="text-[9px] text-slate-400 font-medium">
                                  กำหนดส่ง: {t.dueDate}
                                </span>
                              )}
                              <span className={`text-[9px] font-extrabold ${isDone ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {isDone ? 'เสร็จสิ้นแล้ว' : 'รอดำเนินการ'}
                              </span>
                            </div>
                          </div>
                          <span 
                            className="text-[9px] font-bold px-2 py-1 rounded-lg border text-white transition-transform group-hover:scale-105" 
                            style={{ backgroundColor: accentColor }}
                          >
                            เด้งดูหน้างาน 🚀
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={triggerPdfExport}
            className="flex-1 sm:flex-none h-11 px-4 border border-slate-200 rounded-xl font-semibold text-xs text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-950"
          >
            <FileText className="w-4 h-4" />
            พิมพ์สรุปงาน
          </button>
          
          <button
            onClick={() => openNewTaskModal()}
            className="flex-1 sm:flex-none h-11 px-5 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 hover:opacity-90 active:scale-95"
            style={{ backgroundColor: accentColor }}
          >
            <Plus className="w-4 h-4" />
            เพิ่มงานใหม่
          </button>
        </div>
      </div>

      {/* 3. Kanban grid views */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Today tasks */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden dark:bg-slate-950/40 dark:border-slate-800/80">
          <div className="bg-white p-4 border-b border-slate-200/80 flex items-center justify-between dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              <span className="w-2.5 h-2.5 bg-accent rounded-full animate-ping" style={{ backgroundColor: accentColor }}></span>
              <Star className="w-4 h-4" style={{ color: accentColor }} />
              ต้องทำวันนี้
            </div>
            <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full dark:bg-blue-950/60 dark:text-blue-300">
              {todayTasks.length}
            </span>
          </div>

          <div className="p-3 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
            {todayTasks.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400 italic">
                ไม่มีนัดหมายงานเสร็จสิ้นวันนี้ 🎉
              </div>
            ) : (
              todayTasks.map(t => renderTaskCard(t))
            )}
          </div>
        </div>

        {/* Pending / Future Tasks */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden dark:bg-slate-950/40 dark:border-slate-800/80">
          <div className="bg-white p-4 border-b border-slate-200/80 flex items-center justify-between dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              <Clock className="w-4 h-4 text-amber-500" />
              รอคิว / งานค้างสะสม
            </div>
            <span className="text-[10px] font-extrabold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full dark:bg-amber-950/60 dark:text-amber-300">
              {pendingTasks.length}
            </span>
          </div>

          <div className="p-3 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400 italic">
                ไม่มีคิวงานคั่งค้างอยู่ 😌
              </div>
            ) : (
              pendingTasks.map(t => renderTaskCard(t))
            )}
          </div>
        </div>

        {/* Completed tasks */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden dark:bg-slate-950/40 dark:border-slate-800/80">
          <div className="bg-white p-4 border-b border-slate-200/80 flex items-center justify-between dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              ทำงานเสร็จสิ้นแล้ว
            </div>
            <div className="flex items-center gap-2">
              {completedTasks.length > 0 && (
                <button
                  onClick={handleClearCompletedClick}
                  title="เคลียร์ข้อมูลขยะ"
                  className="p-1 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all dark:hover:bg-slate-950"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full dark:bg-emerald-950/60 dark:text-emerald-300">
                {completedTasks.length}
              </span>
            </div>
          </div>

          <div className="p-3 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
            {completedTasks.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400 italic">
                ไม่มีประวัติเสร็จงานสะสมในรายการ 📦
              </div>
            ) : (
              completedTasks.map(t => renderTaskCard(t))
            )}
          </div>
        </div>

      </div>

      {/* 4. Task adding / modification Model */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={submitTaskForm} className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150 dark:bg-slate-900 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 dark:bg-slate-950 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Folder className="w-4 h-4" style={{ color: accentColor }} />
                {editingTask ? 'แก้ไขรายละเอียดงานภารกิจ' : 'เพิ่มภารกิจใหม่เข้าระบบ'}
              </h3>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-400 hover:text-slate-800 bg-white dark:bg-slate-900 dark:border-slate-800 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-400">หัวชื่องานภารกิจ *</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="เช่น ทำรายงานสรุปสถิติประจำเดือน..."
                  className="w-full h-11 px-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-sm text-slate-800 focus:outline-none focus:border-accent dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-400">รายละเอียดงานเพิ่มเติม</label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="ใส่รายละเอียดสำคัญที่นี่..."
                  rows={3}
                  className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-sm text-slate-800 focus:outline-none focus:border-accent dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-400">หมวดหมู่รายงาน</label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    className="w-full h-11 px-3 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-accent dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                    style={{ '--accent': accentColor } as React.CSSProperties}
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-400">วันที่กำหนดส่ง (Due Date)</label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full h-11 px-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-sm text-slate-800 focus:outline-none focus:border-accent dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                    style={{ '--accent': accentColor } as React.CSSProperties}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-400">ระบุเวลากำหนดส่ง (ไม่บังคับ)</label>
                <input
                  type="time"
                  value={taskDueTime}
                  onChange={(e) => setTaskDueTime(e.target.value)}
                  className="w-full h-11 px-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-sm text-slate-800 focus:outline-none focus:border-accent dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 dark:bg-slate-950 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="h-10 px-4 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-950"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="h-10 px-5 text-white font-bold text-xs rounded-lg shadow-md hover:opacity-95"
                style={{ backgroundColor: accentColor }}
              >
                บันทึกภารกิจ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Metrics Inspect popups */}
      {activeFilterPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[80vh] dark:bg-slate-900 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 dark:bg-slate-950 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <List className="w-4 h-4 text-accent" style={{ color: accentColor }} />
                สรุปภารกิจตรวจสอบ: {activeFilterPopup === 'all' && 'งานทั้งหมด'}
                {activeFilterPopup === 'pending' && 'งานอยู่ระหว่างรอดำเนินการ'}
                {activeFilterPopup === 'completed' && 'งานเสร็จสิ้นสะสม'}
                {activeFilterPopup === 'overdue' && 'งานเลยกำหนดส่งที่ล่าช้า'}
              </h3>
              <button
                onClick={() => setActiveFilterPopup(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-400 hover:text-slate-800 bg-white dark:bg-slate-900 dark:border-slate-800 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {renderPopupInspectItems()}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end dark:bg-slate-950 dark:border-slate-800">
              <button
                onClick={() => setActiveFilterPopup(null)}
                className="h-10 px-5 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Print Settings Selection Dialog */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150 dark:bg-slate-900 dark:border-slate-800">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50 dark:bg-slate-950 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" style={{ color: accentColor }} />
                ระบบจัดพิมพ์รายงานสรุปภารกิจ (Print Settings Form)
              </h3>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-400 hover:text-slate-800 bg-white dark:bg-slate-900 dark:border-slate-800 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Part 1: Select range */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-350">⏳ เลือกช่วงเวลาของข้อมูลภารกิจ (Date Range Selection)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: 'all', label: 'ทั้งหมด' },
                    { val: 'day', label: 'ระบุวัน' },
                    { val: 'month', label: 'ระบุเดือน' },
                    { val: 'year', label: 'ระบุปี' }
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setPrintPeriod(p.val as any)}
                      className={`h-9 rounded-lg border font-bold text-xs transition-all ${
                        printPeriod === p.val 
                          ? 'border-accent text-white dark:border-slate-700' 
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                      }`}
                      style={printPeriod === p.val ? { backgroundColor: accentColor } : {}}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {printPeriod === 'day' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 mt-2 dark:bg-slate-950 dark:border-slate-800 animate-in fade-in duration-150">
                    <span className="text-[11px] font-semibold text-slate-400">เลือกวันที่ต้องการพิมพ์:</span>
                    <input
                      type="date"
                      value={printDay}
                      onChange={(e) => setPrintDay(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none dark:bg-slate-900 dark:border-slate-800"
                    />
                  </div>
                )}

                {printPeriod === 'month' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-2 gap-2 mt-2 dark:bg-slate-950 dark:border-slate-800 animate-in fade-in duration-150">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400">เลือกเดือน:</span>
                      <select
                        value={printMonth}
                        onChange={(e) => setPrintMonth(e.target.value)}
                        className="w-full h-10 px-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none dark:bg-slate-900 dark:border-slate-800"
                      >
                        {['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map((m, idx) => (
                          <option key={m} value={String(idx + 1).padStart(2, '0')}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400">เลือกปี:</span>
                      <select
                        value={printYear}
                        onChange={(e) => setPrintYear(e.target.value)}
                        className="w-full h-10 px-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none dark:bg-slate-900 dark:border-slate-800"
                      >
                        {Array.from({ length: 11 }, (_, k) => String(new Date().getFullYear() - 5 + k)).map(y => (
                          <option key={y} value={y}>พ.ศ. {parseInt(y) + 543}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {printPeriod === 'year' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 mt-2 dark:bg-slate-950 dark:border-slate-800 animate-in fade-in duration-150">
                    <span className="text-[11px] font-semibold text-slate-400">เลือกปีในการออกรายงาน:</span>
                    <select
                      value={printYear}
                      onChange={(e) => setPrintYear(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none dark:bg-slate-900 dark:border-slate-800"
                    >
                      {Array.from({ length: 11 }, (_, k) => String(new Date().getFullYear() - 5 + k)).map(y => (
                        <option key={y} value={y}>พ.ศ. {parseInt(y) + 543}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Part 2: Select custom fields / Filters */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 dark:text-slate-350">📝 คัดกรองสถานะงาน</label>
                  <select
                    value={printStatus}
                    onChange={(e) => setPrintStatus(e.target.value as any)}
                    className="w-full h-10 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none dark:bg-slate-950 dark:border-slate-800"
                  >
                    <option value="all">ทั้งหมด (ทุกสถานะงาน)</option>
                    <option value="pending">รอดำเนินการ (Pending)</option>
                    <option value="completed">เสร็จสิ้นแล้ว (Completed)</option>
                    <option value="overdue">เกินกำหนดส่ง (Overdue)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 dark:text-slate-350">🏷️ หมวดหมู่กิจกรรมงาน</label>
                  <select
                    value={printCategory}
                    onChange={(e) => setPrintCategory(e.target.value)}
                    className="w-full h-10 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none dark:bg-slate-950 dark:border-slate-800"
                  >
                    <option value="all">ทั้งหมด (ทุกหมวดหมู่)</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Part 3: Option checkbox */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="includeDescCheck"
                  checked={printIncludeDesc}
                  onChange={(e) => setPrintIncludeDesc(e.target.checked)}
                  className="w-4 h-4 text-accent border-slate-200 rounded focus:ring-accent accent-accent"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                />
                <label htmlFor="includeDescCheck" className="text-xs text-slate-600 dark:text-slate-400 font-semibold cursor-pointer">
                  แสดงรายละเอียดรายงานงานอย่างครบถ้วน (Task Notes/Descriptions)
                </label>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 dark:bg-slate-950 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="h-10 px-4 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-950"
              >
                ปิดหน้าต่าง
              </button>
              <button
                type="button"
                onClick={handlePrintTasks}
                className="h-10 px-5 text-white rounded-lg font-bold text-xs shadow-md flex items-center gap-1.5 hover:opacity-95"
                style={{ backgroundColor: accentColor }}
              >
                <FileText className="w-4 h-4" />
                เริ่มจัดพิมพ์เอกสารสรุป
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderPopupInspectItems() {
    const list = tasks.filter(t => {
      if (activeFilterPopup === 'pending') return t.status !== 'completed';
      if (activeFilterPopup === 'completed') return t.status === 'completed';
      if (activeFilterPopup === 'overdue') return t.dueDate && t.dueDate < todayStr && t.status !== 'completed';
      return true; // elements for All
    });

    if (list.length === 0) {
      return (
        <div className="text-center py-12 text-slate-400 text-xs italic">
          ยังไม่มีรายการงานบันทึกอยู่ในสโคปนี้
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2.5">
        {list.map(t => {
          const isDone = t.status === 'completed';
          const isOverdue = t.dueDate && t.dueDate < todayStr && !isDone;
          const statusColor = isDone ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : isOverdue ? 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse' : 'bg-amber-100 text-amber-800 border-amber-200';
          const statusText = isDone ? 'เสร็จสิ้น' : isOverdue ? 'ล่าช้าเลยวันกำหนด' : 'รอดำเนินการ';

          return (
            <div
              key={t.id}
              className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4 dark:bg-slate-950 dark:border-slate-800"
            >
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{t.title}</p>
                <div className="flex items-center gap-2 flex-wrap mt-1 text-[10.5px] text-slate-400 font-mono">
                  <span>ครบกำหนด: {t.dueDate || '-'} {t.dueTime ? `⏰ ${t.dueTime} น.` : ''}</span>
                  <span>·</span>
                  <span>หมวด: {t.category}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                  {statusText}
                </span>
                {!isDone && (
                  <button
                    onClick={() => {
                      handleQuickComplete(t.id, t.title);
                      setActiveFilterPopup(null);
                    }}
                    className="h-8 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 rounded-lg dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
                  >
                    เสร็จสิ้น
                  </button>
                )}
                {isDone && (
                  <button
                    onClick={() => {
                      onDeleteTask(t.id);
                      setActiveFilterPopup(null);
                    }}
                    className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all dark:hover:bg-slate-950"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderTaskCard(t: Task) {
    const isDone = t.status === 'completed';
    const isOverdue = t.dueDate && t.dueDate < todayStr && !isDone;
    const isToday = t.dueDate === todayStr && !isDone;
    const isDrawerOpen = !!openDrawers[t.id] || (searchQuery.trim().length > 0 && (t.title.toLowerCase().includes(searchQuery.toLowerCase()) || (t.desc || '').toLowerCase().includes(searchQuery.toLowerCase())));
    const daysPill = getDaysPillInfo(t.dueDate);

    return (
      <motion.div
        key={t.id}
        id={`task-card-${t.id}`}
        layout
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        whileHover={{ y: -3, scale: 1.015 }}
        transition={{ type: "spring", stiffness: 180, damping: 15 }}
        className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md dark:bg-slate-900 dark:border-slate-800 text-left ${
          t.id === highlightedTaskId ? 'ring-2 ring-offset-2 dark:ring-offset-slate-950 animate-pulse' : ''
        }`}
        style={t.id === highlightedTaskId ? { borderColor: accentColor, borderRadius: '12px', boxShadow: `0 0 20px ${accentColor}`, transform: 'scale(1.03)', zIndex: 10, '--tw-ring-color': accentColor } : {}}
      >
        
        {/* Main Header */}
        <div className="p-3.5">
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 max-w-[100px] overflow-hidden text-overflow-ellipsis white-space-nowrap dark:bg-slate-800 dark:text-slate-400">
              {t.category}
            </span>
            <div className="flex gap-1.5 flex-shrink-0">
              {isToday && (
                <span className="text-[9px] font-extrabold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md flex items-center gap-1 dark:bg-blue-950/50 dark:text-blue-300">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
                  วันนี้
                </span>
              )}
              {isOverdue && (
                <span className="text-[9px] font-extrabold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md dark:bg-rose-950/60 dark:text-rose-300">
                  เลยกำหนด
                </span>
              )}
            </div>
          </div>

          <h4
            onClick={() => toggleDrawer(t.id)}
            className="text-xs font-bold text-slate-800 hover:text-accent cursor-pointer line-clamp-2 leading-relaxed dark:text-slate-100"
            style={{ '--accent': accentColor } as React.CSSProperties}
          >
            {isToday && <span className="inline-block w-1.5 h-1.5 bg-accent rounded-full mr-1.5 animate-pulse" style={{ backgroundColor: accentColor }}></span>}
            {t.title}
          </h4>

          {/* Footer controls inside card */}
          <div className="mt-4 pt-3.5 border-t border-slate-100/80 flex items-center justify-between gap-3 dark:border-slate-800">
            <div>
              {isDone ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  เสร็จสิ้นแล้ว
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleQuickComplete(t.id, t.title)}
                  className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full hover:bg-amber-100 transition-all dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900"
                >
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                  รอดำเนินการ
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              {daysPill && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${daysPill.style}`}>
                  {daysPill.text}
                </span>
              )}
              
              <button
                onClick={() => toggleDrawer(t.id)}
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950 dark:text-slate-500"
              >
                {isDrawerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {!isDone ? (
                <button
                  onClick={() => openEditTaskModal(t)}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-accent rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950 dark:text-slate-500"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => handleDeleteClick(t.id, t.title)}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-950 dark:text-slate-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic sliding drawer content */}
        <AnimatePresence initial={false}>
          {isDrawerOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              className="overflow-hidden"
            >
              <div className="px-3.5 pb-4 pt-1 bg-slate-50 border-t border-slate-105/50 space-y-3 text-[11.5px] text-slate-500 dark:bg-slate-950/60 dark:border-slate-800">
                <div className="flex gap-2">
                  <AlignLeft className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
                  <p className="leading-relaxed whitespace-pre-wrap flex-1 dark:text-slate-300">
                    {t.desc ? t.desc : <em className="text-slate-400">ไม่มีข้อมูลบันทึกรายละเอียด</em>}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Folder className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-600 dark:text-slate-400">{t.category}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.dueDate || 'ไม่มีกำหนด'}</span>
                  </div>
                </div>

                {t.dueTime && (
                  <div className="flex items-center gap-1.5 font-mono text-[10.5px] text-slate-500 dark:text-slate-400 border-t border-slate-200/50 pt-2 dark:border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>เวลาระบุส่ง: <strong className="text-slate-700 dark:text-slate-300">{t.dueTime} น.</strong></span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    );
  }
}
