import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, CheckCircle, Clock } from 'lucide-react';
import { Task } from '../types';

interface CalendarModuleProps {
  tasks: Task[];
  holidays: Record<string, string>;
  onAddTaskOnDate: (date: string) => void;
  onEditTask: (id: string, updated: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  accentColor: string;
}

export default function CalendarModule({
  tasks,
  holidays,
  onAddTaskOnDate,
  onEditTask,
  onDeleteTask,
  accentColor
}: CalendarModuleProps) {
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  });
  
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[] | null>(null);
  const [selectedDayStr, setSelectedDayStr] = useState<string>('');
  const [selectedDayHoliday, setSelectedDayHoliday] = useState<string>('');

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>, type: 'month' | 'year') => {
    const val = parseInt(e.target.value);
    if (type === 'month') {
      setCurrentDate(new Date(currentYear, val, 1));
    } else {
      setCurrentDate(new Date(val, currentMonth, 1));
    }
  };

  const getThailandTodayStr = () => {
    return new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  };

  const todayStr = getThailandTodayStr();

  // Static/Fallback Holidays
  const fixedHolidaysPattern: Record<string, string> = {
    '01-01': 'วันขึ้นปีใหม่',
    '04-06': 'วันจักรี',
    '04-13': 'วันสงกรานต์',
    '04-14': 'วันสงกรานต์',
    '04-15': 'วันสงกรานต์',
    '05-01': 'วันแรงงานแห่งชาติ',
    '05-04': 'วันฉัตรมงคล',
    '06-03': 'วันเฉลิมพระชนมพรรษา พระราชินี',
    '07-28': 'วันเฉลิมพระชนมพรรษา ร.10',
    '08-12': 'วันแม่แห่งชาติ',
    '10-13': 'วันคล้ายวันสวรรคต ร.9',
    '10-23': 'วันปิยมหาราช',
    '12-05': 'วันพ่อแห่งชาติ / วันชาติ',
    '12-10': 'วันรัฐธรรมนูญ',
    '12-31': 'วันสิ้นปี'
  };

  const inspectDay = (day: number) => {
    const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const shortKey = `${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const hName = holidays[dStr] || fixedHolidaysPattern[shortKey] || '';
    const dayTasks = tasks.filter(t => t.dueDate === dStr);
    
    setSelectedDayStr(dStr);
    setSelectedDayHoliday(hName);
    setSelectedDayTasks(dayTasks);
  };

  const handleQuickComplete = (id: string) => {
    onEditTask(id, { status: 'completed' });
    // Update local inspectors
    if (selectedDayTasks) {
      setSelectedDayTasks(prev => 
        prev ? prev.map(t => t.id === id ? { ...t, status: 'completed' } : t) : null
      );
    }
  };

  const handleDeleteItem = (id: string, title: string) => {
    if (confirm(`คุณแน่ใจว่าต้องการลบงาน "${title}" ใช่หรือไม่?`)) {
      onDeleteTask(id);
      if (selectedDayTasks) {
        setSelectedDayTasks(prev => prev ? prev.filter(t => t.id !== id) : null);
      }
    }
  };

  const cells: React.ReactNode[] = [];

  // Empty cells leading up to 1st of month
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push(
      <div key={`empty-${i}`} className="min-h-[100px] border-r border-b border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/20" />
    );
  }

  // Active days mapping
  for (let day = 1; day <= totalDays; day++) {
    const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const shortKey = `${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const hName = holidays[dStr] || fixedHolidaysPattern[shortKey] || '';
    const dayTasks = tasks.filter(t => t.dueDate === dStr);
    const isToday = dStr === todayStr;

    const pendingCount = dayTasks.filter(t => t.status !== 'completed').length;
    const completedCount = dayTasks.filter(t => t.status === 'completed').length;

    cells.push(
      <div
        key={`day-${day}`}
        onClick={() => inspectDay(day)}
        className={`min-h-[100px] p-2 border-r border-b border-slate-200 cursor-pointer flex flex-col justify-between hover:bg-slate-50 transition-all dark:border-slate-800 dark:hover:bg-slate-900 ${
          isToday ? 'bg-blue-50/50 outline-2 outline-offset-[-2px] outline-accent/45 dark:bg-blue-950/25' : ''
        } ${hName ? 'bg-amber-50/30 dark:bg-amber-950/5' : ''}`}
        style={isToday ? { '--accent': accentColor } as React.CSSProperties : {}}
      >
        <span className={`text-xs font-bold leading-none ${
          isToday 
            ? 'w-6 h-6 rounded-full flex items-center justify-center text-white font-mono' 
            : hName 
              ? 'text-amber-600 dark:text-amber-400' 
              : 'text-slate-700 dark:text-slate-300'
        }`}
        style={isToday ? { backgroundColor: accentColor } : {}}
        >
          {day}
        </span>

        <div className="flex flex-col gap-1 mt-2">
          {hName && (
            <div className="text-[9px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded truncate max-w-full dark:bg-amber-950/40 dark:text-amber-300" title={hName}>
              🎉 {hName}
            </div>
          )}
          {pendingCount > 0 && (
            <div className="text-[9px] font-extrabold bg-amber-50/80 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-1 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              รอคิว ({pendingCount})
            </div>
          )}
          {completedCount > 0 && (
            <div className="text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded flex items-center gap-1 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              เสร็จ ({completedCount})
            </div>
          )}
        </div>
      </div>
    );
  }

  // Backfill remaining cells in grid to keep calendar looking clean and balanced
  const totalCells = cells.length;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 0; i < remaining; i++) {
    cells.push(
      <div key={`pad-${i}`} className="min-h-[100px] border-r border-b border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/10" />
    );
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Header Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20" style={{ '--accent': accentColor } as React.CSSProperties}>
            <CalendarIcon className="w-5 h-5 text-accent" style={{ color: accentColor }} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">สรุปปฏิทินกิจงานรายเดือน</h2>
            <p className="text-[10.5px] text-slate-400 mt-0.5">วางรากฐานและติดตามกำหนดส่งของงานได้อย่างสะดวก</p>
          </div>
        </div>

        {/* Filters/Navigates controls */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="flex border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
            <button
              onClick={handlePrevMonth}
              className="w-10 h-10 flex items-center justify-center hover:bg-slate-150 text-slate-500 hover:text-slate-800 dark:hover:bg-slate-900 dark:hover:text-slate-200 border-r border-slate-200 dark:border-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="w-10 h-10 flex items-center justify-center hover:bg-slate-150 text-slate-500 hover:text-slate-800 dark:hover:bg-slate-900 dark:hover:text-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <select
            value={currentMonth}
            onChange={(e) => handleSelectionChange(e, 'month')}
            className="h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300"
          >
            {monthNames.map((mn, idx) => (
              <option key={mn} value={idx}>{mn}</option>
            ))}
          </select>

          <select
            value={currentYear}
            onChange={(e) => handleSelectionChange(e, 'year')}
            className="h-10 px-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300"
          >
            {Array.from({ length: 11 }, (_, k) => currentYear - 5 + k).map(y => (
              <option key={y} value={y}>พ.ศ. {y + 543}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid wraps */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="grid grid-cols-7 border-b border-slate-200 text-center font-bold text-[10.5px] text-slate-400 tracking-wider py-3.5 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/30">
          <div className="text-rose-500">อา.</div>
          <div>จ.</div>
          <div>อ.</div>
          <div>พ.</div>
          <div>พฤ.</div>
          <div>ศ.</div>
          <div className="text-blue-500">ส.</div>
        </div>

        <div className="grid grid-cols-7 bg-slate-100 gap-[1px] dark:bg-slate-800">
          {cells}
        </div>
      </div>

      {/* Day Inspector Popup details */}
      {selectedDayTasks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[85vh] dark:bg-slate-900 dark:border-slate-800 animate-in fade-in zoom-in duration-150">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 dark:bg-slate-950 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  {selectedDayStr}
                </h3>
                {selectedDayHoliday && (
                  <p className="text-[10px] font-bold text-amber-600 mt-0.5 dark:text-amber-400">🎉 วันหยุด: {selectedDayHoliday}</p>
                )}
              </div>
              
              <button
                onClick={() => setSelectedDayTasks(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-400 hover:text-slate-800 bg-white dark:bg-slate-950 dark:border-slate-800 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1 bg-slate-50/40 dark:bg-slate-950/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">รายการงานปฏิบัติการในวัน</span>
                <button
                  onClick={() => {
                    onAddTaskOnDate(selectedDayStr);
                    setSelectedDayTasks(null);
                  }}
                  className="h-8 px-3 text-white rounded-lg font-bold text-xs shadow-md flex items-center gap-1 hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: accentColor }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่มงาน
                </button>
              </div>

              {selectedDayTasks.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs italic bg-white border border-dashed border-slate-200 rounded-xl dark:bg-slate-900 dark:border-slate-800">
                  ไม่มีรายการจัดงานใดสำหรับวันนี้
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedDayTasks.map(t => {
                    const isDone = t.status === 'completed';
                    return (
                      <div
                        key={t.id}
                        className={`p-4 bg-white border rounded-xl shadow-sm flex items-center justify-between gap-4 dark:bg-slate-900 dark:border-slate-800 border-l-[3px] ${
                          isDone 
                            ? 'border-emerald-500 border-r-slate-200 border-y-slate-200' 
                            : 'border-amber-500 border-r-slate-200 border-y-slate-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-slate-800 dark:text-slate-100">{t.title}</p>
                          <div className="font-mono text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                            {t.dueTime && (
                              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded dark:bg-slate-950 dark:text-slate-400">⏰ {t.dueTime} น.</span>
                            )}
                            <span className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded dark:bg-blue-950/40 dark:text-blue-400">{t.category}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {!isDone ? (
                            <button
                              onClick={() => handleQuickComplete(t.id)}
                              className="h-7 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 rounded-lg dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900"
                            >
                              ทำเสร็จแล้ว
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeleteItem(t.id, t.title)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end dark:bg-slate-950 dark:border-slate-800">
              <button
                onClick={() => setSelectedDayTasks(null)}
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
}
