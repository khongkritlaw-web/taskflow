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
  const [searchQuery, setSearchQuery] = useState('');
  const [openDrawers, setOpenDrawers] = useState<Record<string, boolean>>({});
  
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

  const getThailandTodayStr = () => {
    return new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  };

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

  const submitTaskForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      alert('กรุณากรอกหัวชื่องานให้ครบถ้วน');
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

  const handleQuickComplete = (id: string, title: string) => {
    if (confirm(`คุณเสร็จสิ้นภารกิจ "${title}" แล้วใช่หรือไม่?`)) {
      onEditTask(id, { status: 'completed' });
    }
  };

  const handleDeleteClick = (id: string, title: string) => {
    if (confirm(`ยืนยันการลบงาน "${title}" ใช่หรือไม่?`)) {
      onDeleteTask(id);
    }
  };

  const handleClearCompletedClick = () => {
    if (confirm('คุณแน่ใจว่าต้องการลบงานที่ทำเสร็จแล้วทั้งหมดเป็นข้อมูลขยะหรือไม่?')) {
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

  // Export static summaries
  const triggerPdfExport = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Metric widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveFilterPopup('all')}
          className="bg-white p-5 rounded-2xl border border-slate-200 cursor-pointer shadow-sm hover:translate-y-[-2px] transition-all relative overflow-hidden group dark:bg-slate-900 dark:border-slate-800"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-400"></div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">งานทั้งหมด</div>
          <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-accent" style={{ '--accent': accentColor } as React.CSSProperties}>{tasks.length}</div>
        </div>

        <div
          onClick={() => setActiveFilterPopup('pending')}
          className="bg-white p-5 rounded-2xl border border-slate-200 cursor-pointer shadow-sm hover:translate-y-[-2px] transition-all relative overflow-hidden group dark:bg-slate-900 dark:border-slate-800"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500"></div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">กำลังดำเนินการ</div>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 group-hover:text-accent" style={{ '--accent': accentColor } as React.CSSProperties}>{countPending}</div>
        </div>

        <div
          onClick={() => setActiveFilterPopup('completed')}
          className="bg-white p-5 rounded-2xl border border-slate-200 cursor-pointer shadow-sm hover:translate-y-[ -2px] transition-all relative overflow-hidden group dark:bg-slate-900 dark:border-slate-800"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500"></div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">เสร็จสิ้นแล้ว</div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 group-hover:text-accent" style={{ '--accent': accentColor } as React.CSSProperties}>{countCompleted}</div>
        </div>

        <div
          onClick={() => setActiveFilterPopup('overdue')}
          className="bg-white p-5 rounded-2xl border border-slate-200 cursor-pointer shadow-sm hover:translate-y-[-2px] transition-all relative overflow-hidden group dark:bg-slate-900 dark:border-slate-800"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-rose-500"></div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">เกินกำหนดส่ง</div>
          <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 group-hover:text-accent" style={{ '--accent': accentColor } as React.CSSProperties}>{countOverdue}</div>
        </div>
      </div>

      {/* 2. Actions toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center dark:bg-slate-900 dark:border-slate-800">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ค้นหาชื่องาน รายละเอียด หรือกิจกรรมหลักงาน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-accent text-sm text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
            style={{ '--accent': accentColor } as React.CSSProperties}
          />
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
    const isDrawerOpen = !!openDrawers[t.id];
    const daysPill = getDaysPillInfo(t.dueDate);

    return (
      <div key={t.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md dark:bg-slate-900 dark:border-slate-800">
        
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
        {isDrawerOpen && (
          <div className="px-3.5 pb-4 pt-1 bg-slate-50 border-t border-slate-105/50 space-y-3 text-[11.5px] text-slate-500 animate-in slide-in-from-top-2 duration-200 dark:bg-slate-950/60 dark:border-slate-800">
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
        )}

      </div>
    );
  }
}
