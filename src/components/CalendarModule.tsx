import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, CheckCircle, Clock, FileText, Printer } from 'lucide-react';
import { Task } from '../types';
import { useDialog } from './CustomDialog';

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
  const { showAlert, showConfirm } = useDialog();
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  });
  
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[] | null>(null);
  const [selectedDayStr, setSelectedDayStr] = useState<string>('');
  const [selectedDayHoliday, setSelectedDayHoliday] = useState<string>('');

  // Print Configuration States
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printMonth, setPrintMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [printYear, setPrintYear] = useState(String(new Date().getFullYear()));
  const [printIncludeList, setPrintIncludeList] = useState(true);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Sync print configurations with currently viewed calendar month/year
  useEffect(() => {
    setPrintMonth(String(currentMonth + 1).padStart(2, '0'));
    setPrintYear(String(currentYear));
  }, [currentMonth, currentYear]);

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

  const handlePrintCalendar = () => {
    const targetMonthNum = parseInt(printMonth);
    const targetYearNum = parseInt(printYear);
    
    const firstDayIdx = new Date(targetYearNum, targetMonthNum - 1, 1).getDay();
    const totalDaysInMonth = new Date(targetYearNum, targetMonthNum, 0).getDate();
    
    const printCells: Array<{ day: number | null; dateStr: string; tasks: Task[]; holiday: string }> = [];
    
    // Empty prefix cells
    for (let i = 0; i < firstDayIdx; i++) {
      printCells.push({ day: null, dateStr: '', tasks: [], holiday: '' });
    }
    
    // Real days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dStr = `${targetYearNum}-${String(targetMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const shortKey = `${String(targetMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hName = holidays[dStr] || fixedHolidaysPattern[shortKey] || '';
      const dayTasks = tasks.filter(t => t.dueDate === dStr);
      printCells.push({ day: d, dateStr: dStr, tasks: dayTasks, holiday: hName });
    }
    
    // Empty suffix cells to snap perfectly to 7-columns layout
    while (printCells.length % 7 !== 0) {
      printCells.push({ day: null, dateStr: '', tasks: [], holiday: '' });
    }
    
    // Group cells into weeks
    const weeksList: Array<typeof printCells> = [];
    for (let i = 0; i < printCells.length; i += 7) {
      weeksList.push(printCells.slice(i, i + 7));
    }
    
    const monthNameTh = monthNames[targetMonthNum - 1];
    const yearTh = targetYearNum + 543;

    // Filter list of schedules in this month
    const scheduledTasks = tasks.filter(t => t.dueDate && t.dueDate.substring(0, 7) === `${printYear}-${printMonth}`)
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

    const htmlLayout = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>แผนผังตารางกำหนดการปฏิบัติงาน ประจำเดือน ${monthNameTh} พ.ศ. ${yearTh}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
          body {
            font-family: 'Sarabun', sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 30px;
            font-size: 11px;
            background-color: #ffffff;
            line-height: 1.4;
          }
          .title-section {
            text-align: center;
            border-bottom: 2px solid #1e293b;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .title-section h1 {
            font-size: 18px;
            margin: 0 0 4px 0;
            font-weight: 800;
          }
          .title-section p {
            font-size: 11px;
            color: #64748b;
            margin: 0;
          }
          .info-meta {
            margin-bottom: 15px;
            font-size: 11px;
            display: flex;
            justify-content: space-between;
          }
          /* Calendar Grid table styled for A4 */
          .cal-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 30px;
          }
          .cal-table th {
            border: 1px solid #1e293b;
            padding: 6px;
            font-size: 11px;
            font-weight: bold;
            background-color: #f1f5f9;
            text-align: center;
          }
          .cal-table td {
            border: 1px solid #94a3b8;
            height: 75px;
            vertical-align: top;
            padding: 5px;
            font-size: 9.5px;
            background-color: #ffffff;
          }
          .day-number {
            font-weight: 800;
            font-size: 11px;
            margin-bottom: 4px;
            display: inline-block;
          }
          .holiday-tag {
            color: #b45309;
            font-size: 8px;
            background-color: #fef3c7;
            padding: 1px 3px;
            border-radius: 2px;
            margin-bottom: 3px;
            display: block;
            font-weight: bold;
            border: 1px solid #fde68a;
          }
          .task-strip {
            background-color: #f8fafc;
            border-left: 2.5px solid #64748b;
            padding: 1px 3px;
            margin-bottom: 2px;
            border-radius: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 8px;
            color: #334155;
          }
          .task-strip.completed {
            border-left-color: #10b981;
            background-color: #f0fdf4;
            color: #047857;
            text-decoration: line-through;
          }
          /* Tabular schedule */
          .sub-title {
            font-size: 13px;
            font-weight: bold;
            border-bottom: 1.5px solid #475569;
            padding-bottom: 4px;
            margin-top: 25px;
            margin-bottom: 12px;
            color: #0f172a;
          }
          .sched-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .sched-table th {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 8px;
            font-weight: bold;
            text-align: left;
            font-size: 10.5px;
          }
          .sched-table td {
            border: 1px solid #e2e8f0;
            padding: 8px;
            font-size: 10.5px;
          }
          .sched-table tr:nth-child(even) {
            background-color: #fafbfc;
          }
          .signature-box-row {
            margin-top: 50px;
            display: flex;
            justify-content: space-around;
            text-align: center;
          }
          .sign-box {
            width: 220px;
          }
          .sign-line {
            border-bottom: 1px dotted #475569;
            margin-bottom: 6px;
            height: 38px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="title-section">
          <h1>แผนผังตารางกำหนดการปฏิบัติงานและการนัดหมายรอบเดือน</h1>
          <p>เอกสารสรุปกำหนดการประจำเดือนแบบราชการอย่างเป็นทางการ (Official Monthly Calendar Schedule Sheet)</p>
        </div>

        <div class="info-meta">
          <div><strong>ประจำเดือน:</strong> ${monthNameTh} พ.ศ. ${yearTh}</div>
          <div><strong>จัดพิมพ์เมื่อวันที่:</strong> ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} น.</div>
        </div>

        <table class="cal-table">
          <thead>
            <tr>
              <th style="color:#ef4444; width:14.2%;">อาทิตย์ (SUN)</th>
              <th style="width:14.2%;">จันทร์ (MON)</th>
              <th style="width:14.2%;">อังคาร (TUE)</th>
              <th style="width:14.2%;">พุธ (WED)</th>
              <th style="width:14.2%;">พฤหัสฯ (THU)</th>
              <th style="width:14.2%;">ศุกร์ (FRI)</th>
              <th style="color:#3b82f6; width:14.2%;">เสาร์ (SAT)</th>
            </tr>
          </thead>
          <tbody>
            ${weeksList.map(week => `
              <tr>
                ${week.map(cell => {
                  if (cell.day === null) {
                    return `<td style="background-color: #f8fafc;"></td>`;
                  }
                  
                  return `
                    <td>
                      <span class="day-number">${cell.day}</span>
                      ${cell.holiday ? `<span class="holiday-tag" title="${cell.holiday}">🎉 ${cell.holiday}</span>` : ''}
                      
                      ${cell.tasks.slice(0, 3).map(t => `
                        <div class="task-strip ${t.status === 'completed' ? 'completed' : ''}" title="${t.title}">
                          ${t.dueTime ? t.dueTime : ''} ${t.title}
                        </div>
                      `).join('')}
                      
                      ${cell.tasks.length > 3 ? `
                        <div style="font-size: 7.5px; color:#64748b; font-weight:bold; padding-left: 3px;">
                          และงานอื่นอีก +${cell.tasks.length - 3} รายการ...
                        </div>
                      ` : ''}
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${printIncludeList ? `
          <div class="sub-title">📌 บัญชีรายชื่อกิจกรรม/งานภารกิจกำหนดส่งในรอบเดือนนี้ (Monthly Task Listing)</div>
          <table class="sched-table">
            <thead>
              <tr>
                <th style="width: 8%; text-align: center;">ลำดับ</th>
                <th style="width: 15%;">วันที่กำหนดส่ง</th>
                <th style="width: 45%;">ชื่องานนัดหมาย / ภารกิจหลัก</th>
                <th style="width: 17%;">หมวดหมู่</th>
                <th style="width: 15%;">สถานะการทำ</th>
              </tr>
            </thead>
            <tbody>
              ${scheduledTasks.length === 0 ? `
                <tr>
                  <td colspan="5" style="text-align: center; padding: 25px; color:#64748b;">
                    <i>- เดือนนี้ไม่มีรายการบันทึกงานภารกิจหรือเวลานัดหมายสะสม -</i>
                  </td>
                </tr>
              ` : scheduledTasks.map((t, index) => `
                <tr>
                  <td style="text-align: center; font-weight: bold;">${index + 1}</td>
                  <td>${t.dueDate ? t.dueDate.split('-').reverse().join('/') : '-'} ${t.dueTime ? `⏰ ${t.dueTime}` : ''}</td>
                  <td><strong>${t.title}</strong>${t.desc ? `<br/><span style="font-size:9px;color:#64748b;">(${t.desc})</span>` : ''}</td>
                  <td>${t.category}</td>
                  <td style="font-weight: 600; color: ${t.status === 'completed' ? '#047857' : '#b45309'}">
                    ${t.status === 'completed' ? '✅ เสร็จสิ้นแล้ว' : '⏳ รอดำเนินการบอร์ด'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="signature-box-row">
          <div class="sign-box">
            <div class="sign-line"></div>
            <p style="font-weight: 600; font-size: 11px; margin: 0;">ลงชื่อผู้ออกตารางจัดเตรียม</p>
            <p style="font-size: 9.5px; color:#64748b; margin-top: 3px;">(............................................................)</p>
          </div>
          <div class="sign-box">
            <div class="sign-line"></div>
            <p style="font-weight: 600; font-size: 11px; margin: 0;">ลงชื่อผู้ตรวจสอบอนุมัติตาราง</p>
            <p style="font-size: 9.5px; color:#64748b; margin-top: 3px;">(............................................................)</p>
          </div>
        </div>

        <p style="font-size: 9px; color: #94a3b8; text-align: center; margin-top: 50px; border-top: 1px dotted #cbd5e1; padding-top: 10px;">
          รายงานสรุปวิถีปฏิทินปฏิบัติการอย่างเป็นทางการ เชื่อมโยงผ่าน Firebase Firestore
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
    iframe.contentWindow?.document.write(htmlLayout);
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

  const handleQuickComplete = (id: string) => {
    onEditTask(id, { status: 'completed' });
    // Update local inspectors
    if (selectedDayTasks) {
      setSelectedDayTasks(prev => 
        prev ? prev.map(t => t.id === id ? { ...t, status: 'completed' } : t) : null
      );
    }
  };

  const handleDeleteItem = async (id: string, title: string) => {
    const isConfirmed = await showConfirm(
      `คุณต้องการยืนยันลบกิจกรรมงาน "${title}" ออกจากระบบใช่หรือไม่?`,
      'ยืนยันการลบ',
      'danger'
    );
    if (isConfirmed) {
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
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-print-modal', { detail: { initialTab: 'calendar' } }))}
            className="h-10 px-3.5 border border-slate-200 bg-white rounded-xl font-semibold text-xs text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-950 transition-all flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>พิมพ์รายงานปฏิทิน / PDF</span>
          </button>

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
