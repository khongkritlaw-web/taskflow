import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, CheckCircle, Clock, FileText, Printer, Coins, Receipt, Upload, Eye, X, Image } from 'lucide-react';
import { Task, Expense } from '../types';
import { useDialog } from './CustomDialog';

interface CalendarModuleProps {
  tasks: Task[];
  expenses?: Expense[];
  holidays: Record<string, string>;
  onAddTaskOnDate: (date: string) => void;
  onEditTask: (id: string, updated: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onEditExpense?: (id: string, updated: Partial<Expense>) => void;
  accentColor: string;
}

export default function CalendarModule({
  tasks,
  expenses = [],
  holidays,
  onAddTaskOnDate,
  onEditTask,
  onDeleteTask,
  onEditExpense,
  accentColor
}: CalendarModuleProps) {
  const { showAlert, showConfirm } = useDialog();

  const getThailandTodayStr = () => {
    return new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  };

  const [currentDate, setCurrentDate] = useState<Date>(() => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
  });
  
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[] | null>(null);
  const [selectedDayStr, setSelectedDayStr] = useState<string>('');
  const [selectedDayHoliday, setSelectedDayHoliday] = useState<string>('');
  const [calendarViewMode, setCalendarViewMode] = useState<'grid' | 'agenda'>('grid');

  // Professional Print Configuration States
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printDocType, setPrintDocType] = useState<'monthly-grid' | 'agenda-timetable' | 'executive-summary' | 'daily-focus'>('monthly-grid');
  const [printMonth, setPrintMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [printYear, setPrintYear] = useState(String(new Date().getFullYear()));
  const [printSingleDate, setPrintSingleDate] = useState<string>(getThailandTodayStr());
  const [printTaskStatus, setPrintTaskStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [printIncludeTasks, setPrintIncludeTasks] = useState(true);
  const [printIncludeExpenses, setPrintIncludeExpenses] = useState(true);
  const [printIncludeHolidays, setPrintIncludeHolidays] = useState(true);
  const [printIncludeSignatures, setPrintIncludeSignatures] = useState(true);
  const [printIncludeNotes, setPrintIncludeNotes] = useState(true);
  const [printOrientation, setPrintOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [printTheme, setPrintTheme] = useState<'official' | 'slate' | 'emerald' | 'monochrome'>('official');
  const [printHeaderTitle, setPrintHeaderTitle] = useState('แผนผังตารางกำหนดการปฏิบัติงานและการนัดหมาย');
  const [printOrgName, setPrintOrgName] = useState('');

  // Payment Slip Upload Modal states
  const [isPaySlipModalOpen, setIsPaySlipModalOpen] = useState(false);
  const [paySlipExpense, setPaySlipExpense] = useState<Expense | null>(null);
  const [paySlipInstallmentNo, setPaySlipInstallmentNo] = useState<number | null>(null);
  const [paySlipBase64, setPaySlipBase64] = useState<string>('');
  const [paySlipFileName, setPaySlipFileName] = useState<string>('');

  // View Slip Modal states
  const [isViewSlipModalOpen, setIsViewSlipModalOpen] = useState(false);
  const [viewSlipTitle, setViewSlipTitle] = useState('');
  const [viewSlipBase64, setViewSlipBase64] = useState('');
  const [viewSlipAmount, setViewSlipAmount] = useState<number>(0);
  const [viewSlipDate, setViewSlipDate] = useState('');

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

  const todayStr = getThailandTodayStr();

  const getExpensesForDate = (dateStr: string) => {
    if (!expenses) return [];
    const list: Array<{
      expenseId: string;
      parentName: string;
      amount: number;
      paid: boolean;
      isInstallment: boolean;
      installmentNo?: number;
      totalInstallments?: number;
      cat: string;
      dueDate: string;
      slipBase64?: string;
    }> = [];

    expenses.forEach(e => {
      if (e.isInstallment && e.installments) {
        e.installments.forEach(inst => {
          if (inst.dueDate === dateStr) {
            list.push({
              expenseId: e.id,
              parentName: e.name,
              amount: inst.amount,
              paid: inst.paid,
              isInstallment: true,
              installmentNo: inst.installmentNo,
              totalInstallments: e.totalInstallments,
              cat: e.cat,
              dueDate: inst.dueDate,
              slipBase64: inst.slipBase64
            });
          }
        });
      } else {
        if (e.dueDate === dateStr) {
          list.push({
            expenseId: e.id,
            parentName: e.name,
            amount: e.amount,
            paid: e.paid,
            isInstallment: false,
            cat: e.cat,
            dueDate: e.dueDate,
            slipBase64: e.slipBase64
          });
        }
      }
    });

    return list;
  };

  const handleToggleInstallmentPaid = (expenseId: string, installmentNo: number) => {
    if (!expenses) return;
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;

    const inst = expense.installments?.find(i => i.installmentNo === installmentNo);
    if (inst?.paid) {
      setViewSlipTitle(`${expense.name} (ผ่อนงวดที่ ${installmentNo}/${expense.totalInstallments})`);
      setViewSlipBase64(inst.slipBase64 || '');
      setViewSlipAmount(inst.amount);
      setViewSlipDate(inst.dueDate);
      setIsViewSlipModalOpen(true);
      return;
    }

    setPaySlipExpense(expense);
    setPaySlipInstallmentNo(installmentNo);
    setPaySlipBase64('');
    setPaySlipFileName('');
    setIsPaySlipModalOpen(true);
  };

  const handleToggleRegularExpensePaid = (expenseId: string, currentPaid: boolean) => {
    if (!expenses) return;
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;

    if (expense.paid) {
      setViewSlipTitle(expense.name);
      setViewSlipBase64(expense.slipBase64 || '');
      setViewSlipAmount(expense.amount);
      setViewSlipDate(expense.dueDate);
      setIsViewSlipModalOpen(true);
      return;
    }

    setPaySlipExpense(expense);
    setPaySlipInstallmentNo(null);
    setPaySlipBase64('');
    setPaySlipFileName('');
    setIsPaySlipModalOpen(true);
  };

  const handleSavePaymentWithSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paySlipExpense || !onEditExpense) return;

    const targetAmount = paySlipInstallmentNo !== null
      ? (paySlipExpense.installments?.find(i => i.installmentNo === paySlipInstallmentNo)?.amount ?? paySlipExpense.amount)
      : paySlipExpense.amount;

    const isConfirmed = await showConfirm(
      `คุณต้องการบันทึกการชำระเงินสำหรับ "${paySlipExpense.name}" ${
        paySlipInstallmentNo ? `งวดที่ ${paySlipInstallmentNo}` : ''
      } ยอดเงิน ฿${targetAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ใช่หรือไม่? (เมื่อกดยืนยันแล้วจะไม่สามารถแก้ไขสลิปหรือยกเลิกการจ่ายเงินได้)`,
      'ยืนยันการบันทึกชำระเงิน',
      'success'
    );

    if (!isConfirmed) return;

    if (paySlipInstallmentNo !== null) {
      const updated = paySlipExpense.installments?.map(inst => {
        if (inst.installmentNo === paySlipInstallmentNo) {
          return {
            ...inst,
            paid: true,
            paidDate: getThailandTodayStr(),
            slipBase64: paySlipBase64 || undefined
          };
        }
        return inst;
      });
      const allPaid = updated?.every(inst => inst.paid) || false;
      onEditExpense(paySlipExpense.id, {
        installments: updated,
        paid: allPaid
      });
    } else {
      onEditExpense(paySlipExpense.id, {
        paid: true,
        slipBase64: paySlipBase64 || undefined
      });
    }

    setIsPaySlipModalOpen(false);
    setPaySlipExpense(null);
    setPaySlipInstallmentNo(null);
    setPaySlipBase64('');
    setPaySlipFileName('');
    await showAlert('บันทึกการชำระเงินเสร็จสมบูรณ์เรียบร้อยแล้วค่ะ!', 'สำเร็จ', 'success');
  };

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

  const generateCalendarPrintHtml = () => {
    const targetMonthNum = parseInt(printMonth);
    const targetYearNum = parseInt(printYear);
    const monthNameTh = monthNames[targetMonthNum - 1] || 'มกราคม';
    const yearTh = targetYearNum + 543;

    // Primary Colors according to printTheme
    let themePrimary = '#1e3a8a';
    let themeHeaderBg = '#1e3a8a';
    let themeThBg = '#f1f5f9';
    let themeBorder = '#1e3a8a';

    if (printTheme === 'slate') {
      themePrimary = '#0f172a';
      themeHeaderBg = '#0f172a';
      themeThBg = '#f8fafc';
      themeBorder = '#334155';
    } else if (printTheme === 'emerald') {
      themePrimary = '#065f46';
      themeHeaderBg = '#065f46';
      themeThBg = '#ecfdf5';
      themeBorder = '#047857';
    } else if (printTheme === 'monochrome') {
      themePrimary = '#000000';
      themeHeaderBg = '#000000';
      themeThBg = '#f3f4f6';
      themeBorder = '#000000';
    }

    // Date filtering prefix
    const monthPrefix = `${printYear}-${printMonth}`;
    
    // Filter Tasks
    let filteredTasks = tasks.filter(t => {
      if (printDocType === 'daily-focus') {
        return t.dueDate === printSingleDate;
      }
      return t.dueDate && t.dueDate.substring(0, 7) === monthPrefix;
    });

    if (printTaskStatus === 'pending') {
      filteredTasks = filteredTasks.filter(t => t.status !== 'completed');
    } else if (printTaskStatus === 'completed') {
      filteredTasks = filteredTasks.filter(t => t.status === 'completed');
    }

    filteredTasks.sort((a, b) => {
      const dateCmp = (a.dueDate || '').localeCompare(b.dueDate || '');
      if (dateCmp !== 0) return dateCmp;
      return (a.dueTime || '').localeCompare(b.dueTime || '');
    });

    // Filter Expenses
    let filteredExpenses: Array<{
      parentName: string;
      amount: number;
      paid: boolean;
      dueDate: string;
      isInstallment: boolean;
      installmentNo?: number;
      totalInstallments?: number;
      cat: string;
    }> = [];

    if (printIncludeExpenses) {
      expenses.forEach(e => {
        if (e.isInstallment && e.installments) {
          e.installments.forEach(inst => {
            const matches = printDocType === 'daily-focus'
              ? inst.dueDate === printSingleDate
              : inst.dueDate && inst.dueDate.substring(0, 7) === monthPrefix;
            if (matches) {
              filteredExpenses.push({
                parentName: e.name,
                amount: inst.amount,
                paid: inst.paid,
                dueDate: inst.dueDate,
                isInstallment: true,
                installmentNo: inst.installmentNo,
                totalInstallments: e.totalInstallments,
                cat: e.cat
              });
            }
          });
        } else {
          const matches = printDocType === 'daily-focus'
            ? e.dueDate === printSingleDate
            : e.dueDate && e.dueDate.substring(0, 7) === monthPrefix;
          if (matches) {
            filteredExpenses.push({
              parentName: e.name,
              amount: e.amount,
              paid: e.paid,
              dueDate: e.dueDate,
              isInstallment: false,
              cat: e.cat
            });
          }
        }
      });
      filteredExpenses.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    }

    const formattedPrintDate = new Date().toLocaleDateString('th-TH', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    let documentTitleText = printHeaderTitle || 'แผนผังตารางกำหนดการปฏิบัติงานและการนัดหมาย';
    let documentSubText = printOrgName ? `หน่วยงาน / สังกัด: ${printOrgName}` : `เอกสารออกโดยระบบบริหารจัดการตารางงานส่วนบุคคล`;

    if (printDocType === 'monthly-grid') {
      documentSubText += ` — ประจำเดือน ${monthNameTh} พ.ศ. ${yearTh}`;
    } else if (printDocType === 'agenda-timetable') {
      documentTitleText = `ตารางเวลาและกำหนดการปฏิบัติงาน (Timetable & Agenda)`;
      documentSubText += ` — ประจำเดือน ${monthNameTh} พ.ศ. ${yearTh}`;
    } else if (printDocType === 'executive-summary') {
      documentTitleText = `รายงานสรุปผู้บริหาร แผนงานและค่างวดชำระประจำเดือน`;
      documentSubText += ` — ประจำเดือน ${monthNameTh} พ.ศ. ${yearTh}`;
    } else if (printDocType === 'daily-focus') {
      const parts = printSingleDate.split('-');
      const dTh = parts.length === 3 ? `${parseInt(parts[2])} ${monthNames[parseInt(parts[1]) - 1]} พ.ศ. ${parseInt(parts[0]) + 543}` : printSingleDate;
      documentTitleText = `กำหนดการปฏิบัติงานและภารกิจประจำวัน (Daily Schedule)`;
      documentSubText += ` — ประจำวันที่ ${dTh}`;
    }

    const signatureBlockHtml = printIncludeSignatures ? `
      <div class="signature-box-row">
        <div class="sign-box">
          <div class="sign-line"></div>
          <p style="font-weight: 700; font-size: 11px; margin: 0; color: #1e293b;">ลงชื่อ..........................................................</p>
          <p style="font-weight: 600; font-size: 10px; margin: 3px 0 0 0; color: #475569;">(..........................................................)</p>
          <p style="font-size: 9.5px; color:#64748b; margin-top: 2px;">ตำแหน่ง: ผู้จัดทำตารางปฏิบัติงาน</p>
        </div>
        <div class="sign-box">
          <div class="sign-line"></div>
          <p style="font-weight: 700; font-size: 11px; margin: 0; color: #1e293b;">ลงชื่อ..........................................................</p>
          <p style="font-weight: 600; font-size: 10px; margin: 3px 0 0 0; color: #475569;">(..........................................................)</p>
          <p style="font-size: 9.5px; color:#64748b; margin-top: 2px;">ตำแหน่ง: ผู้ตรวจสอบ / อนุมัติแผนงาน</p>
        </div>
      </div>
    ` : '';

    let bodyContentHtml = '';

    if (printDocType === 'monthly-grid') {
      const firstDayIdx = new Date(targetYearNum, targetMonthNum - 1, 1).getDay();
      const totalDaysInMonth = new Date(targetYearNum, targetMonthNum, 0).getDate();
      const printCells: Array<{ day: number | null; dateStr: string; tasks: Task[]; expenses: typeof filteredExpenses; holiday: string }> = [];

      for (let i = 0; i < firstDayIdx; i++) {
        printCells.push({ day: null, dateStr: '', tasks: [], expenses: [], holiday: '' });
      }

      for (let d = 1; d <= totalDaysInMonth; d++) {
        const dStr = `${targetYearNum}-${String(targetMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const shortKey = `${String(targetMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const hName = printIncludeHolidays ? (holidays[dStr] || fixedHolidaysPattern[shortKey] || '') : '';
        const dayTasks = filteredTasks.filter(t => t.dueDate === dStr);
        const dayExps = filteredExpenses.filter(e => e.dueDate === dStr);
        printCells.push({ day: d, dateStr: dStr, tasks: dayTasks, expenses: dayExps, holiday: hName });
      }

      while (printCells.length % 7 !== 0) {
        printCells.push({ day: null, dateStr: '', tasks: [], expenses: [], holiday: '' });
      }

      const weeksList: Array<typeof printCells> = [];
      for (let i = 0; i < printCells.length; i += 7) {
        weeksList.push(printCells.slice(i, i + 7));
      }

      bodyContentHtml = `
        <table class="cal-table">
          <thead>
            <tr>
              <th style="color:#dc2626; width:14.2%;">อาทิตย์ (SUN)</th>
              <th style="width:14.2%;">จันทร์ (MON)</th>
              <th style="width:14.2%;">อังคาร (TUE)</th>
              <th style="width:14.2%;">พุธ (WED)</th>
              <th style="width:14.2%;">พฤหัสฯ (THU)</th>
              <th style="width:14.2%;">ศุกร์ (FRI)</th>
              <th style="color:#2563eb; width:14.2%;">เสาร์ (SAT)</th>
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
                      ${cell.holiday ? `<span class="holiday-tag">🎉 ${cell.holiday}</span>` : ''}
                      
                      ${cell.tasks.slice(0, 3).map(t => `
                        <div class="task-strip ${t.status === 'completed' ? 'completed' : ''}">
                          ${t.dueTime ? `⏰${t.dueTime} ` : ''}${t.title}
                        </div>
                      `).join('')}
                      
                      ${cell.tasks.length > 3 ? `
                        <div style="font-size: 7.5px; color:#64748b; font-weight:bold; padding-left:2px;">+อีก ${cell.tasks.length - 3} งาน...</div>
                      ` : ''}

                      ${cell.expenses.slice(0, 2).map(e => `
                        <div class="expense-strip ${e.paid ? 'completed' : ''}">
                          💰 ฿${e.amount.toLocaleString('th-TH')} ${e.parentName}
                        </div>
                      `).join('')}

                      ${cell.expenses.length > 2 ? `
                        <div style="font-size: 7.5px; color:#7c3aed; font-weight:bold; padding-left:2px;">+อีก ${cell.expenses.length - 2} บิล...</div>
                      ` : ''}
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${printIncludeTasks ? `
          <div class="sub-title">📌 บัญชีตารางงานและภารกิจนัดหมายทั้งหมดในรอบเดือน (Monthly Task Roster)</div>
          <table class="sched-table">
            <thead>
              <tr>
                <th style="width: 7%; text-align: center;">ลำดับ</th>
                <th style="width: 15%;">กำหนดส่ง / เวลา</th>
                <th style="width: 43%;">ชื่องานนัดหมาย / รายละเอียด</th>
                <th style="width: 18%;">หมวดหมู่</th>
                <th style="width: 17%;">สถานะดำเนินงาน</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTasks.length === 0 ? `
                <tr><td colspan="5" style="text-align: center; padding: 20px; color:#64748b;"><i>- ไม่มีรายการงานภารกิจในช่วงเวลานี้ -</i></td></tr>
              ` : filteredTasks.map((t, idx) => `
                <tr>
                  <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                  <td>${t.dueDate ? t.dueDate.split('-').reverse().join('/') : '-'} ${t.dueTime ? `<br/>⏰ ${t.dueTime}` : ''}</td>
                  <td>
                    <strong>${t.title}</strong>
                    ${printIncludeNotes && t.desc ? `<br/><span style="font-size:9px;color:#64748b;">(${t.desc})</span>` : ''}
                  </td>
                  <td>${t.category}</td>
                  <td style="font-weight: 600; color: ${t.status === 'completed' ? '#047857' : '#b45309'}">
                    ${t.status === 'completed' ? '✅ เสร็จสิ้นแล้ว' : '⏳ รอดำเนินการ'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        ${printIncludeExpenses && filteredExpenses.length > 0 ? `
          <div class="sub-title">💰 บัญชีรายการบิลและค่างวดชำระรอบเดือน (Monthly Bills & Payments)</div>
          <table class="sched-table">
            <thead>
              <tr>
                <th style="width: 7%; text-align: center;">ลำดับ</th>
                <th style="width: 15%;">กำหนดชำระ</th>
                <th style="width: 43%;">รายการบิล / ค่างวด</th>
                <th style="width: 18%;">จำนวนเงิน</th>
                <th style="width: 17%;">สถานะการชำระ</th>
              </tr>
            </thead>
            <tbody>
              ${filteredExpenses.map((e, idx) => `
                <tr>
                  <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
                  <td>${e.dueDate.split('-').reverse().join('/')}</td>
                  <td>
                    <strong>${e.parentName}</strong>
                    ${e.isInstallment ? `<br/><span style="font-size:9px;color:#7c3aed;">(งวดที่ ${e.installmentNo}/${e.totalInstallments})</span>` : ''}
                  </td>
                  <td style="font-family: monospace; font-weight: bold;">฿${e.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                  <td style="font-weight: 600; color: ${e.paid ? '#047857' : '#dc2626'}">
                    ${e.paid ? '✅ ชำระแล้ว' : '⏳ รอชำระเงิน'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
      `;
    } else if (printDocType === 'agenda-timetable') {
      const groupedByDate: Record<string, { tasks: Task[]; expenses: typeof filteredExpenses; holiday: string }> = {};

      filteredTasks.forEach(t => {
        const d = t.dueDate || 'Unscheduled';
        if (!groupedByDate[d]) {
          const shortKey = d.length === 10 ? `${d.substring(5, 7)}-${d.substring(8, 10)}` : '';
          const hName = printIncludeHolidays && d.length === 10 ? (holidays[d] || fixedHolidaysPattern[shortKey] || '') : '';
          groupedByDate[d] = { tasks: [], expenses: [], holiday: hName };
        }
        groupedByDate[d].tasks.push(t);
      });

      if (printIncludeExpenses) {
        filteredExpenses.forEach(e => {
          const d = e.dueDate || 'Unscheduled';
          if (!groupedByDate[d]) {
            const shortKey = d.length === 10 ? `${d.substring(5, 7)}-${d.substring(8, 10)}` : '';
            const hName = printIncludeHolidays && d.length === 10 ? (holidays[d] || fixedHolidaysPattern[shortKey] || '') : '';
            groupedByDate[d] = { tasks: [], expenses: [], holiday: hName };
          }
          groupedByDate[d].expenses.push(e);
        });
      }

      const sortedDates = Object.keys(groupedByDate).sort();

      bodyContentHtml = `
        <div class="summary-kpi-bar">
          <div class="kpi-box">
            <div class="kpi-num">${filteredTasks.length}</div>
            <div class="kpi-label">ภารกิจนัดหมายทั้งหมด</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-num" style="color: #047857;">${filteredTasks.filter(t => t.status === 'completed').length}</div>
            <div class="kpi-label">เสร็จสิ้นแล้ว</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-num" style="color: #b45309;">${filteredTasks.filter(t => t.status !== 'completed').length}</div>
            <div class="kpi-label">รอดำเนินการ</div>
          </div>
          ${printIncludeExpenses ? `
            <div class="kpi-box">
              <div class="kpi-num" style="color: #7c3aed;">฿${filteredExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString('th-TH')}</div>
              <div class="kpi-label">ยอดบิลค่างวดรวม</div>
            </div>
          ` : ''}
        </div>

        ${sortedDates.length === 0 ? `
          <div style="text-align:center; padding: 40px; color:#64748b; font-style:italic;">
            - ไม่พบรายการนัดหมายหรือภารกิจในช่วงเวลานี้ -
          </div>
        ` : sortedDates.map(dStr => {
          const item = groupedByDate[dStr];
          const parts = dStr.split('-');
          const formattedD = parts.length === 3 ? `${parseInt(parts[2])} ${monthNames[parseInt(parts[1]) - 1]} พ.ศ. ${parseInt(parts[0]) + 543}` : dStr;

          return `
            <div class="date-group-block">
              <div class="date-header">
                <span>🗓️ วันที่ ${formattedD}</span>
                ${item.holiday ? `<span class="holiday-pill">🎉 ${item.holiday}</span>` : ''}
              </div>

              <table class="sched-table" style="margin-bottom: 12px;">
                <thead>
                  <tr>
                    <th style="width: 12%;">เวลา</th>
                    <th style="width: 48%;">รายการภารกิจ / บิลค่าใช้จ่าย</th>
                    <th style="width: 18%;">หมวดหมู่</th>
                    <th style="width: 22%; text-align: center;">การตรวจสอบ (Checklist)</th>
                  </tr>
                </thead>
                <tbody>
                  ${item.tasks.map(t => `
                    <tr>
                      <td style="font-weight: bold; color: ${themePrimary};">
                        ${t.dueTime ? `⏰ ${t.dueTime}` : 'ตลอดวัน'}
                      </td>
                      <td>
                        <strong>${t.title}</strong>
                        ${printIncludeNotes && t.desc ? `<br/><span style="font-size:9px;color:#64748b;">${t.desc}</span>` : ''}
                      </td>
                      <td>${t.category}</td>
                      <td style="text-align: center;">
                        <span style="display: inline-block; width: 14px; height: 14px; border: 1.5px solid #475569; vertical-align: middle; margin-right: 4px; border-radius: 2px;"></span>
                        <span style="font-size: 10px; font-weight: bold; color: ${t.status === 'completed' ? '#047857' : '#475569'}">
                          ${t.status === 'completed' ? '✅ เสร็จแล้ว' : '⏳ รอทำ'}
                        </span>
                      </td>
                    </tr>
                  `).join('')}

                  ${item.expenses.map(e => `
                    <tr style="background-color: #faf5ff;">
                      <td style="font-weight: bold; color: #7c3aed;">💰 บิลชำระ</td>
                      <td>
                        <strong>${e.parentName}</strong>
                        ${e.isInstallment ? `<span style="font-size:9px; color:#7c3aed;"> (งวด ${e.installmentNo}/${e.totalInstallments})</span>` : ''}
                      </td>
                      <td style="font-family: monospace; font-weight: bold;">฿${e.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                      <td style="text-align: center; font-weight: bold; color: ${e.paid ? '#047857' : '#dc2626'}">
                        ${e.paid ? '✅ ชำระแล้ว' : '⏳ รอชำระ'}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `;
        }).join('')}
      `;
    } else if (printDocType === 'executive-summary') {
      const totalTasks = filteredTasks.length;
      const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
      const pendingTasks = totalTasks - completedTasks;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const totalExp = filteredExpenses.reduce((s, e) => s + e.amount, 0);
      const paidExp = filteredExpenses.filter(e => e.paid).reduce((s, e) => s + e.amount, 0);
      const pendingExp = totalExp - paidExp;

      bodyContentHtml = `
        <div class="summary-kpi-bar">
          <div class="kpi-box">
            <div class="kpi-num" style="color: ${themePrimary};">${totalTasks}</div>
            <div class="kpi-label">ภารกิจในความรับผิดชอบ</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-num" style="color: #047857;">${completionRate}%</div>
            <div class="kpi-label">อัตราความสำเร็จ (${completedTasks}/${totalTasks})</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-num" style="color: #b45309;">${pendingTasks}</div>
            <div class="kpi-label">คงเหลือรอดำเนินการ</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-num" style="color: #7c3aed;">฿${totalExp.toLocaleString('th-TH')}</div>
            <div class="kpi-label">งบประมาณค่างวดชำระรวม</div>
          </div>
        </div>

        <div class="sub-title">📊 รายงานสรุปสถานะการปฏิบัติงานจำแนกตามหมวดหมู่</div>
        <table class="sched-table">
          <thead>
            <tr>
              <th>หมวดหมู่ภารกิจ</th>
              <th style="text-align: center;">จำนวนทั้งหมด</th>
              <th style="text-align: center;">เสร็จสิ้นแล้ว</th>
              <th style="text-align: center;">รอดำเนินการ</th>
              <th style="text-align: center;">สัดส่วนความสำเร็จ</th>
            </tr>
          </thead>
          <tbody>
            ${(() => {
              const cats: Record<string, { total: number; done: number }> = {};
              filteredTasks.forEach(t => {
                const c = t.category || 'ทั่วไป';
                if (!cats[c]) cats[c] = { total: 0, done: 0 };
                cats[c].total++;
                if (t.status === 'completed') cats[c].done++;
              });

              const catNames = Object.keys(cats);
              if (catNames.length === 0) {
                return `<tr><td colspan="5" style="text-align:center; padding:15px; color:#64748b;">- ไม่มีข้อมูลงาน -</td></tr>`;
              }

              return catNames.map(c => {
                const item = cats[c];
                const pct = Math.round((item.done / item.total) * 100);
                return `
                  <tr>
                    <td><strong>${c}</strong></td>
                    <td style="text-align: center;">${item.total}</td>
                    <td style="text-align: center; color: #047857; font-weight: bold;">${item.done}</td>
                    <td style="text-align: center; color: #b45309; font-weight: bold;">${item.total - item.done}</td>
                    <td style="text-align: center; font-weight: bold; color: ${themePrimary};">${pct}%</td>
                  </tr>
                `;
              }).join('');
            })()}
          </tbody>
        </table>

        ${printIncludeExpenses ? `
          <div class="sub-title">💳 รายงานสถานะรายการภาระค่าใช้จ่ายและค่างวด</div>
          <table class="sched-table">
            <thead>
              <tr>
                <th style="width: 40%;">ประเภทสถานะการชำระ</th>
                <th style="width: 30%; text-align: right;">จำนวนเงินรวม</th>
                <th style="width: 30%; text-align: center;">สัดส่วนเทียบงบรวม</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="color: #047857; font-weight: bold;">✅ ชำระเงินเรียบร้อยแล้ว (Paid)</td>
                <td style="text-align: right; font-family: monospace; font-weight: bold; color: #047857;">฿${paidExp.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                <td style="text-align: center; font-weight: bold;">${totalExp > 0 ? Math.round((paidExp / totalExp) * 100) : 0}%</td>
              </tr>
              <tr>
                <td style="color: #dc2626; font-weight: bold;">⏳ ค้างชำระ / รอชำระ (Unpaid)</td>
                <td style="text-align: right; font-family: monospace; font-weight: bold; color: #dc2626;">฿${pendingExp.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                <td style="text-align: center; font-weight: bold;">${totalExp > 0 ? Math.round((pendingExp / totalExp) * 100) : 0}%</td>
              </tr>
            </tbody>
          </table>
        ` : ''}
      `;
    } else if (printDocType === 'daily-focus') {
      const parts = printSingleDate.split('-');
      const formattedD = parts.length === 3 ? `${parseInt(parts[2])} ${monthNames[parseInt(parts[1]) - 1]} พ.ศ. ${parseInt(parts[0]) + 543}` : printSingleDate;

      bodyContentHtml = `
        <div style="background-color: ${themeThBg}; border-left: 5px solid ${themePrimary}; padding: 12px 18px; margin-bottom: 20px; border-radius: 4px;">
          <h2 style="margin:0 0 4px 0; font-size: 16px; font-weight: 800; color: ${themePrimary};">
            📅 ตารางนัดหมายและภารกิจประจำวัน: ${formattedD}
          </h2>
          <p style="margin:0; font-size: 11px; color: #475569;">
            สรุปเวลานัดหมาย กิจกรรมที่ต้องปฏิบัติ และบิลค่างวดชำระประจำวัน
          </p>
        </div>

        <div class="sub-title">⏰ ตารางเวลากิจกรรมและงานปฏิบัติการ (Daily Task Schedule)</div>
        <table class="sched-table">
          <thead>
            <tr>
              <th style="width: 12%;">เวลา</th>
              <th style="width: 45%;">ชื่องานปฏิบัติการ / นัดหมาย</th>
              <th style="width: 18%;">หมวดหมู่</th>
              <th style="width: 25%; text-align: center;">ผลการปฏิบัติงาน</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTasks.length === 0 ? `
              <tr><td colspan="4" style="text-align: center; padding: 25px; color:#64748b;"><i>- ไม่มีบันทึกกิจกรรมงานสำหรับวันนี้ -</i></td></tr>
            ` : filteredTasks.map(t => `
              <tr>
                <td style="font-weight: bold; color: ${themePrimary};">${t.dueTime ? `⏰ ${t.dueTime}` : 'ตลอดวัน'}</td>
                <td>
                  <strong>${t.title}</strong>
                  ${printIncludeNotes && t.desc ? `<br/><span style="font-size:9.5px;color:#64748b;">${t.desc}</span>` : ''}
                </td>
                <td>${t.category}</td>
                <td style="text-align: center; font-weight: bold; color: ${t.status === 'completed' ? '#047857' : '#b45309'}">
                  ${t.status === 'completed' ? '✅ ดำเนินการแล้ว' : '⏳ รอการดำเนินงาน'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${printIncludeExpenses && filteredExpenses.length > 0 ? `
          <div class="sub-title">💰 บัญชีค่างวดและบิลต้องชำระประจำวันนี้</div>
          <table class="sched-table">
            <thead>
              <tr>
                <th style="width: 12%;">ประเภท</th>
                <th style="width: 45%;">รายการบิล / ค่างวด</th>
                <th style="width: 23%;">จำนวนเงิน</th>
                <th style="width: 20%; text-align: center;">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              ${filteredExpenses.map(e => `
                <tr style="background-color: #faf5ff;">
                  <td style="font-weight: bold; color:#7c3aed;">บิลชำระ</td>
                  <td><strong>${e.parentName}</strong> ${e.isInstallment ? `(งวดที่ ${e.installmentNo}/${e.totalInstallments})` : ''}</td>
                  <td style="font-family: monospace; font-weight: bold;">฿${e.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                  <td style="text-align: center; font-weight: bold; color: ${e.paid ? '#047857' : '#dc2626'}">
                    ${e.paid ? '✅ ชำระแล้ว' : '⏳ รอชำระ'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div style="margin-top: 30px; border: 1px border-slate-300; padding: 12px; border-radius: 4px; background-color: #fafbfc;">
          <strong style="font-size: 11px; color:#1e293b;">📝 บันทึกเพิ่มเติม / หมายเหตุการปฏิบัติงานประจำวัน:</strong>
          <div style="min-height: 50px; border-bottom: 1px dotted #cbd5e1; margin-top: 8px;"></div>
          <div style="min-height: 30px; border-bottom: 1px dotted #cbd5e1; margin-top: 8px;"></div>
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${documentTitleText}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap');
          @page {
            size: A4 ${printOrientation};
            margin: 12mm 10mm;
          }
          body {
            font-family: 'Sarabun', sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 20px;
            font-size: 11px;
            background-color: #ffffff;
            line-height: 1.45;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .title-section {
            text-align: center;
            border-bottom: 2.5px double ${themeBorder};
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .title-section h1 {
            font-size: 18px;
            margin: 0 0 4px 0;
            font-weight: 800;
            color: ${themePrimary};
            letter-spacing: -0.2px;
          }
          .title-section p {
            font-size: 10.5px;
            color: #475569;
            margin: 0;
          }
          .info-meta {
            margin-bottom: 15px;
            font-size: 10.5px;
            display: flex;
            justify-content: space-between;
            background-color: ${themeThBg};
            padding: 6px 12px;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
          }
          .summary-kpi-bar {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
          }
          .kpi-box {
            flex: 1;
            border: 1px solid #cbd5e1;
            background-color: #f8fafc;
            padding: 8px 10px;
            border-radius: 4px;
            text-align: center;
          }
          .kpi-num {
            font-size: 16px;
            font-weight: 800;
            font-family: monospace;
          }
          .kpi-label {
            font-size: 9.5px;
            color: #64748b;
            font-weight: 600;
            margin-top: 2px;
          }
          .cal-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 20px;
          }
          .cal-table th {
            border: 1px solid #334155;
            padding: 5px;
            font-size: 10.5px;
            font-weight: bold;
            background-color: ${themeThBg};
            text-align: center;
            color: #0f172a;
          }
          .cal-table td {
            border: 1px solid #cbd5e1;
            height: 72px;
            vertical-align: top;
            padding: 4px;
            font-size: 9px;
            background-color: #ffffff;
            page-break-inside: avoid;
          }
          .day-number {
            font-weight: 800;
            font-size: 10.5px;
            margin-bottom: 3px;
            display: inline-block;
          }
          .holiday-tag {
            color: #b45309;
            font-size: 7.5px;
            background-color: #fef3c7;
            padding: 1px 3px;
            border-radius: 2px;
            margin-bottom: 2px;
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
            font-size: 7.5px;
            color: #334155;
          }
          .task-strip.completed {
            border-left-color: #10b981;
            background-color: #f0fdf4;
            color: #047857;
            text-decoration: line-through;
          }
          .expense-strip {
            background-color: #f5f3ff;
            border-left: 2.5px solid #8b5cf6;
            padding: 1px 3px;
            margin-bottom: 2px;
            border-radius: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 7.5px;
            color: #5b21b6;
            font-weight: bold;
          }
          .expense-strip.completed {
            border-left-color: #10b981;
            background-color: #f0fdf4;
            color: #047857;
            text-decoration: line-through;
          }
          .sub-title {
            font-size: 12px;
            font-weight: 800;
            border-bottom: 1.5px solid ${themeBorder};
            padding-bottom: 4px;
            margin-top: 20px;
            margin-bottom: 10px;
            color: ${themePrimary};
          }
          .sched-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .sched-table th {
            background-color: ${themeThBg};
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
            font-weight: bold;
            text-align: left;
            font-size: 10px;
            color: #1e293b;
          }
          .sched-table td {
            border: 1px solid #e2e8f0;
            padding: 6px 8px;
            font-size: 10px;
          }
          .sched-table tr:nth-child(even) {
            background-color: #fafbfc;
          }
          .date-group-block {
            margin-bottom: 18px;
            page-break-inside: avoid;
          }
          .date-header {
            font-weight: 800;
            font-size: 11px;
            background-color: ${themeThBg};
            padding: 5px 10px;
            border: 1px solid #cbd5e1;
            border-bottom: none;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .holiday-pill {
            background-color: #fef3c7;
            color: #b45309;
            font-size: 8.5px;
            padding: 1px 6px;
            border-radius: 10px;
            border: 1px solid #fde68a;
          }
          .signature-box-row {
            margin-top: 40px;
            display: flex;
            justify-content: space-around;
            text-align: center;
            page-break-inside: avoid;
          }
          .sign-box {
            width: 230px;
          }
          .sign-line {
            border-bottom: 1px dotted #475569;
            margin-bottom: 6px;
            height: 30px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="title-section">
          <h1>${documentTitleText}</h1>
          <p>${documentSubText}</p>
        </div>

        <div class="info-meta">
          <div><strong>ขอบเขตเอกสาร:</strong> ${printDocType === 'daily-focus' ? `ประจำวันที่ ${printSingleDate}` : `ประจำเดือน ${monthNameTh} พ.ศ. ${yearTh}`}</div>
          <div><strong>จัดพิมพ์เมื่อวันที่:</strong> ${formattedPrintDate} น.</div>
        </div>

        ${bodyContentHtml}

        ${signatureBlockHtml}

        <p style="font-size: 8.5px; color: #94a3b8; text-align: center; margin-top: 35px; border-top: 1px dotted #cbd5e1; padding-top: 8px;">
          เอกสารรายงานตารางงานและกำหนดการอย่างเป็นทางการ
        </p>
      </body>
      </html>
    `;
  };

  const handlePrintCalendar = () => {
    const htmlLayout = generateCalendarPrintHtml();

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
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
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

  const dayExpenses = selectedDayStr ? getExpensesForDate(selectedDayStr) : [];
  const cells: React.ReactNode[] = [];

  // Empty cells leading up to 1st of month
  for (let i = 0; i < firstDayIndex; i++) {
    cells.push(
      <div key={`empty-${i}`} className="min-h-[50px] sm:min-h-[100px] border-r border-b border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/20" />
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

    const dayExpenses = getExpensesForDate(dStr);
    const pendingExpensesCount = dayExpenses.filter(e => !e.paid).length;
    const paidExpensesCount = dayExpenses.filter(e => e.paid).length;

    cells.push(
      <div
        key={`day-${day}`}
        onClick={() => inspectDay(day)}
        className={`min-h-[52px] sm:min-h-[100px] p-1 sm:p-2 border-r border-b border-slate-200 cursor-pointer flex flex-col justify-between hover:bg-slate-50 transition-all dark:border-slate-800 dark:hover:bg-slate-900 ${
          isToday ? 'bg-blue-50/50 outline-2 outline-offset-[-2px] outline-accent/45 dark:bg-blue-950/25' : ''
        } ${hName ? 'bg-amber-50/30 dark:bg-amber-950/5' : ''}`}
        style={isToday ? { '--accent': accentColor } as React.CSSProperties : {}}
      >
        <span className={`text-[10px] sm:text-xs font-bold leading-none ${
          isToday 
            ? 'w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-white font-mono' 
            : hName 
              ? 'text-amber-600 dark:text-amber-400' 
              : 'text-slate-700 dark:text-slate-300'
        }`}
        style={isToday ? { backgroundColor: accentColor } : {}}
        >
          {day}
        </span>

        <div className="flex flex-col gap-0.5 sm:gap-1 mt-1 sm:mt-2">
          {hName && (
            <div className="text-[8px] sm:text-[9px] font-extrabold bg-amber-100 text-amber-800 px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded truncate max-w-full dark:bg-amber-950/40 dark:text-amber-300" title={hName}>
              <span className="sm:hidden">🎉</span>
              <span className="hidden sm:inline">🎉 {hName}</span>
            </div>
          )}
          {pendingCount > 0 && (
            <div className="text-[8px] sm:text-[9px] font-extrabold bg-amber-50/80 text-amber-700 border border-amber-200 px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded flex items-center justify-center sm:justify-start gap-1 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              <span className="sm:hidden">{pendingCount}</span>
              <span className="hidden sm:inline">รอคิว ({pendingCount})</span>
            </div>
          )}
          {completedCount > 0 && (
            <div className="text-[8px] sm:text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded flex items-center justify-center sm:justify-start gap-1 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              <span className="sm:hidden">{completedCount}</span>
              <span className="hidden sm:inline">เสร็จ ({completedCount})</span>
            </div>
          )}
          {pendingExpensesCount > 0 && (
            <div className="text-[8px] sm:text-[9px] font-extrabold bg-violet-50 text-violet-700 border border-violet-200 px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded flex items-center justify-center sm:justify-start gap-1 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900" title={`มีรายจ่าย/ค่างวดที่ต้องชำระ ${pendingExpensesCount} รายการ`}>
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse"></span>
              <span className="sm:hidden">{pendingExpensesCount}</span>
              <span className="hidden sm:inline">ค่างวด ({pendingExpensesCount})</span>
            </div>
          )}
          {paidExpensesCount > 0 && (
            <div className="text-[8px] sm:text-[9px] font-extrabold bg-teal-50 text-teal-700 border border-teal-200 px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded flex items-center justify-center sm:justify-start gap-1 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900" title={`ชำระค่างวดแล้ว ${paidExpensesCount} รายการ`}>
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
              <span className="sm:hidden">{paidExpensesCount}</span>
              <span className="hidden sm:inline">จ่ายแล้ว ({paidExpensesCount})</span>
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
      <div key={`pad-${i}`} className="min-h-[50px] sm:min-h-[100px] border-r border-b border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/10" />
    );
  }

  // Prepare monthly agenda list items
  const monthlyAgendaDays = [];
  for (let day = 1; day <= totalDays; day++) {
    const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const shortKey = `${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const hName = holidays[dStr] || fixedHolidaysPattern[shortKey] || '';
    const dayTasks = tasks.filter(t => t.dueDate === dStr);
    const dayExpenses = getExpensesForDate(dStr);

    if (hName || dayTasks.length > 0 || dayExpenses.length > 0) {
      monthlyAgendaDays.push({
        day,
        dStr,
        hName,
        tasks: dayTasks,
        expenses: dayExpenses,
        isToday: dStr === todayStr
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Header Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20" style={{ '--accent': accentColor } as React.CSSProperties}>
              <CalendarIcon className="w-5 h-5 text-accent" style={{ color: accentColor }} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">สรุปปฏิทินกิจงานรายเดือน</h2>
              <p className="text-[10.5px] text-slate-400 mt-0.5">วางรากฐานและติดตามกำหนดส่งของงานได้อย่างสะดวก</p>
            </div>
          </div>

          {/* View Mode Toggle Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl dark:bg-slate-950 border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setCalendarViewMode('grid')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 ${
                calendarViewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              📅 <span>ตารางเดือน</span>
            </button>
            <button
              onClick={() => setCalendarViewMode('agenda')}
              className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 ${
                calendarViewMode === 'agenda'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              📋 <span>รายการกำหนดการ</span>
            </button>
          </div>
        </div>

        {/* Filters/Navigates controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="h-9 px-3 border border-slate-200 bg-white rounded-xl font-semibold text-xs text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-950 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">พิมพ์รายงานปฏิทิน / PDF</span>
            <span className="sm:hidden">พิมพ์ PDF</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
              <button
                onClick={handlePrevMonth}
                className="w-9 h-9 flex items-center justify-center hover:bg-slate-150 text-slate-500 hover:text-slate-800 dark:hover:bg-slate-900 dark:hover:text-slate-200 border-r border-slate-200 dark:border-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="w-9 h-9 flex items-center justify-center hover:bg-slate-150 text-slate-500 hover:text-slate-800 dark:hover:bg-slate-900 dark:hover:text-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <select
              value={currentMonth}
              onChange={(e) => handleSelectionChange(e, 'month')}
              className="h-9 px-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300"
            >
              {monthNames.map((mn, idx) => (
                <option key={mn} value={idx}>{mn}</option>
              ))}
            </select>

            <select
              value={currentYear}
              onChange={(e) => handleSelectionChange(e, 'year')}
              className="h-9 px-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300"
            >
              {Array.from({ length: 11 }, (_, k) => currentYear - 5 + k).map(y => (
                <option key={y} value={y}>พ.ศ. {y + 543}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {calendarViewMode === 'grid' ? (
        /* Grid View */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto dark:bg-slate-900 dark:border-slate-800">
          <div className="w-full min-w-[340px]">
            <div className="grid grid-cols-7 border-b border-slate-200 text-center font-bold text-[10px] sm:text-[10.5px] text-slate-400 tracking-wider py-2.5 sm:py-3.5 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/30">
              <div className="text-rose-500"><span className="hidden sm:inline">อาทิตย์</span><span className="sm:hidden">อา.</span></div>
              <div><span className="hidden sm:inline">จันทร์</span><span className="sm:hidden">จ.</span></div>
              <div><span className="hidden sm:inline">อังคาร</span><span className="sm:hidden">อ.</span></div>
              <div><span className="hidden sm:inline">พุธ</span><span className="sm:hidden">พ.</span></div>
              <div><span className="hidden sm:inline">พฤหัสบดี</span><span className="sm:hidden">พฤ.</span></div>
              <div><span className="hidden sm:inline">ศุกร์</span><span className="sm:hidden">ศ.</span></div>
              <div className="text-blue-500"><span className="hidden sm:inline">เสาร์</span><span className="sm:hidden">ส.</span></div>
            </div>

            <div className="grid grid-cols-7 bg-slate-100 gap-[1px] dark:bg-slate-800">
              {cells}
            </div>
          </div>
        </div>
      ) : (
        /* Agenda List View Mode */
        <div className="space-y-3">
          {monthlyAgendaDays.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-400 font-semibold">ไม่มีกำหนดการ งาน หรือค่างวดในเดือน {monthNames[currentMonth]} พ.ศ. {currentYear + 543}</p>
            </div>
          ) : (
            monthlyAgendaDays.map(item => (
              <div 
                key={item.dStr}
                onClick={() => inspectDay(item.day)}
                className={`bg-white p-4 rounded-2xl border cursor-pointer hover:border-slate-300 transition-all dark:bg-slate-900 dark:border-slate-800 ${
                  item.isToday ? 'border-accent ring-1 ring-accent/20 dark:ring-accent/30' : 'border-slate-200'
                }`}
                style={item.isToday ? { '--accent': accentColor } as React.CSSProperties : {}}
              >
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span 
                      className="px-2.5 py-1 rounded-lg text-xs font-black text-white font-mono"
                      style={{ backgroundColor: item.isToday ? accentColor : '#64748b' }}
                    >
                      {item.day} {monthNames[currentMonth]}
                    </span>
                    {item.isToday && (
                      <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md dark:bg-blue-950 dark:text-blue-300">
                        วันนี้ 📍
                      </span>
                    )}
                    {item.hName && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md dark:bg-amber-950 dark:text-amber-300">
                        🎉 {item.hName}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 hover:text-slate-600">
                    ดูรายละเอียดวัน →
                  </span>
                </div>

                {/* Day Tasks List */}
                {item.tasks.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ภารกิจ/งาน ({item.tasks.length})</div>
                    {item.tasks.map(t => (
                      <div key={t.id} className="p-2 bg-slate-50 rounded-xl dark:bg-slate-950/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span>{t.status === 'completed' ? '✅' : '📌'}</span>
                          <span className={`font-extrabold truncate ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                            {t.title}
                          </span>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0 ${t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {t.status === 'completed' ? 'เสร็จสิ้น' : 'รอคิว'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Day Expenses List */}
                {item.expenses.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ค่างวด/รายจ่าย ({item.expenses.length})</div>
                    {item.expenses.map(e => (
                      <div key={e.id} className="p-2 bg-slate-50 rounded-xl dark:bg-slate-950/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span>💳</span>
                          <span className={`font-bold truncate ${e.paid ? 'text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                            {e.title} ({e.amount.toLocaleString('th-TH')} บาท)
                          </span>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0 ${e.paid ? 'bg-teal-100 text-teal-800' : 'bg-violet-100 text-violet-800'}`}>
                          {e.paid ? 'จ่ายแล้ว' : 'ค่างวด'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

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

              {/* รายการชำระเงิน / ค่างวดผ่อนจ่ายรายเดือน */}
              <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">รายการชำระเงิน / ค่างวดผ่อนในวัน</span>
                </div>

                {dayExpenses.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs italic bg-white border border-dashed border-slate-200 rounded-xl dark:bg-slate-900 dark:border-slate-800">
                    ไม่มีรายการบิลหรือค่างวดที่ครบกำหนดชำระในวันนี้
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {dayExpenses.map(e => {
                      return (
                        <div
                          key={e.expenseId + (e.isInstallment ? `_inst_${e.installmentNo}` : '_reg')}
                          className={`p-4 bg-white border rounded-xl shadow-sm flex items-center justify-between gap-4 dark:bg-slate-900 dark:border-slate-800 border-l-[3px] ${
                            e.paid 
                              ? 'border-emerald-500 border-r-slate-200 border-y-slate-200' 
                              : 'border-violet-500 border-r-slate-200 border-y-slate-200'
                          }`}
                        >
                          <div className="min-w-0 flex-1 text-left">
                            <p className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                              <span>{e.parentName}</span>
                              {e.isInstallment && (
                                <span className="text-[9.5px] font-extrabold px-1.5 py-0.2 bg-violet-50 text-violet-700 rounded-md dark:bg-violet-950/40 dark:text-violet-300">
                                  ผ่อนงวดที่ {e.installmentNo}/{e.totalInstallments}
                                </span>
                              )}
                            </p>
                            <div className="font-mono text-[10.5px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold" style={{ color: accentColor }}>
                                ฿{e.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded dark:bg-slate-950 dark:text-slate-400 text-[9px]">{e.cat}</span>
                              {e.paid ? (
                                <span className="text-emerald-600 font-bold text-[9px]">✓ ชำระแล้ว</span>
                              ) : (
                                <span className="text-rose-500 font-bold text-[9px]">⏳ ค้างชำระ</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {onEditExpense && (
                              <button
                                onClick={() => {
                                  if (e.isInstallment && e.installmentNo !== undefined) {
                                    handleToggleInstallmentPaid(e.expenseId, e.installmentNo);
                                  } else {
                                    handleToggleRegularExpensePaid(e.expenseId, e.paid);
                                  }
                                }}
                                className={`h-8 px-3 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                                  e.paid
                                    ? 'bg-purple-50 hover:bg-purple-100 text-purple-750 border border-purple-200 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-900'
                                    : 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm'
                                }`}
                              >
                                {e.paid ? (
                                  <>
                                    <Eye className="w-3.5 h-3.5" /> ดูสลิป
                                  </>
                                ) : 'ทำชำระเงิน'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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

      {/* Payment & Slip Upload Modal */}
      {isPaySlipModalOpen && paySlipExpense && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-800 animate-in zoom-in duration-150 text-left">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 dark:bg-slate-950 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-purple-600" />
                บันทึกการชำระเงิน / แนบสลิป
              </h3>
              <button
                onClick={() => {
                  setIsPaySlipModalOpen(false);
                  setPaySlipExpense(null);
                  setPaySlipInstallmentNo(null);
                  setPaySlipBase64('');
                  setPaySlipFileName('');
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-400 hover:text-slate-800 bg-white dark:bg-slate-900 dark:border-slate-800 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePaymentWithSlip}>
              <div className="p-5 space-y-4">
                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 dark:bg-purple-950/10 dark:border-purple-900/50 space-y-1">
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider dark:text-purple-400">
                    {paySlipInstallmentNo ? `ค่างวดผ่อนรายเดือน (งวดที่ ${paySlipInstallmentNo}/${paySlipExpense.totalInstallments})` : 'รายการบิล/ค่าใช้จ่าย'}
                  </span>
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">
                    {paySlipExpense.name}
                  </h4>
                  <div className="text-sm font-black text-purple-700 dark:text-purple-400 pt-1">
                    ยอดชำระ: ฿{(paySlipInstallmentNo 
                      ? (paySlipExpense.installments?.find(i => i.installmentNo === paySlipInstallmentNo)?.amount ?? paySlipExpense.amount)
                      : paySlipExpense.amount
                    ).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10.5px] text-slate-400 font-mono mt-1">
                    กำหนดชำระ: {paySlipInstallmentNo 
                      ? (paySlipExpense.installments?.find(i => i.installmentNo === paySlipInstallmentNo)?.dueDate ?? paySlipExpense.dueDate)
                      : paySlipExpense.dueDate
                    }
                  </div>
                </div>

                {/* Slip File Upload Field */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">
                    แนบไฟล์ภาพหลักฐานการโอนเงิน (สลิป) <span className="text-slate-400 font-normal">(ไม่บังคับแนบก็ได้)</span>
                  </label>
                  
                  <div className="relative border-2 border-dashed border-slate-250 dark:border-slate-850 rounded-xl hover:border-purple-400 dark:hover:border-purple-800 transition-all p-5 text-center bg-slate-50/50 dark:bg-slate-950/20">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPaySlipBase64(reader.result as string);
                            setPaySlipFileName(file.name);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    
                    {paySlipBase64 ? (
                      <div className="space-y-2 relative z-20">
                        <div className="flex justify-center">
                          <img
                            src={paySlipBase64}
                            alt="Slip preview"
                            className="max-h-36 rounded-lg object-contain shadow-md border border-slate-200 dark:border-slate-800"
                          />
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 truncate max-w-full px-4">
                          📄 {paySlipFileName}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setPaySlipBase64('');
                            setPaySlipFileName('');
                          }}
                          className="text-[10px] text-rose-500 hover:underline font-bold"
                        >
                          ลบรูปและเลือกใหม่
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 pointer-events-none">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-400">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-350">
                            คลิกหรือลากวางไฟล์สลิปโอนเงินที่นี่
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            รองรับไฟล์รูปภาพ PNG, JPG, JPEG
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[10.5px] text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400">
                  ⚠️ <strong>คำชี้แจงสำคัญ:</strong> เมื่อบันทึกการชำระเงินแล้ว จะไม่สามารถแก้ไขข้อมูลหรือยกเลิกสถานะได้ นอกจากลบรายการนี้ออกเท่านั้น โปรดตรวจสอบความถูกต้องของสลิปและยอดชำระก่อนกดยืนยัน
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 dark:bg-slate-950 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaySlipModalOpen(false);
                    setPaySlipExpense(null);
                    setPaySlipInstallmentNo(null);
                    setPaySlipBase64('');
                    setPaySlipFileName('');
                  }}
                  className="h-10 px-4 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-1 hover:opacity-95"
                  style={{ backgroundColor: accentColor }}
                >
                  <CheckCircle className="w-4 h-4" />
                  บันทึกชำระเงิน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Slip Modal */}
      {isViewSlipModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-800 animate-in zoom-in duration-150 text-left">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 dark:bg-slate-950 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                หลักฐานการชำระเงิน (สลิปโอนเงิน)
              </h3>
              <button
                onClick={() => {
                  setIsViewSlipModalOpen(false);
                  setViewSlipBase64('');
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-400 hover:text-slate-800 bg-white dark:bg-slate-900 dark:border-slate-800 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1 pb-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider dark:text-emerald-400">
                  ชำระเงินเสร็จสิ้น ✓
                </p>
                <h4 className="font-extrabold text-base text-slate-850 dark:text-slate-100">
                  {viewSlipTitle}
                </h4>
                <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                  ยอดโอน: ฿{viewSlipAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  กำหนดชำระดั้งเดิม: {viewSlipDate}
                </div>
              </div>

              <div className="space-y-2">
                <span className="block text-xs font-bold text-slate-500 dark:text-slate-450">ภาพสลิปหลักฐาน:</span>
                {viewSlipBase64 ? (
                  <div className="border border-slate-100 dark:border-slate-850 rounded-xl overflow-hidden shadow-sm bg-slate-50 p-2 flex justify-center">
                    <img
                      src={viewSlipBase64}
                      alt="Payment Slip Evidence"
                      referrerPolicy="no-referrer"
                      className="max-h-96 w-auto object-contain rounded-lg shadow-md"
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs italic text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200">
                    ไม่มีไฟล์รูปภาพสลิปแนบอยู่
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 dark:bg-slate-950 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsViewSlipModalOpen(false);
                  setViewSlipBase64('');
                }}
                className="h-10 px-5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
              >
                ปิดหน้านี้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Print Settings & Live Preview Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] dark:bg-slate-900 dark:border-slate-800 text-left">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/80 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span>สั่งพิมพ์เอกสารตารางงานอย่างมืออาชีพ</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                      PDF & Print Roster
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    เลือกรูปแบบผังปฏิทิน ตารางเวลา หรือรายงานผู้บริหาร พร้อมสั่งพิมพ์หรือบันทึก PDF A4 ได้ทันที
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 text-slate-400 hover:text-slate-800 bg-white dark:bg-slate-900 dark:border-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Split 2 Columns */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-150 dark:divide-slate-800">
              
              {/* Left Column: Configuration Controls (lg:col-span-5) */}
              <div className="lg:col-span-5 p-4 sm:p-5 space-y-4 bg-slate-50/40 dark:bg-slate-950/20 overflow-y-auto max-h-[68vh] lg:max-h-[72vh]">
                
                {/* Section 1: Document Layout Type */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
                    1. รูปแบบประเภทเอกสาร (Document Type)
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      {
                        id: 'monthly-grid',
                        label: '📅 ผังตารางปฏิทินปฏิบัติงานรายเดือน (Monthly Grid)',
                        desc: 'ตาราง 7 วัน + บัญชีรายชื่อภารกิจและค่างวด เหมาะสำหรับปิดประกาศหรือติดบอร์ด'
                      },
                      {
                        id: 'agenda-timetable',
                        label: '📋 ตารางเวลาปฏิบัติงานและนัดหมาย (Agenda Timetable)',
                        desc: 'เรียงตามลำดับเวลาวันต่อวัน พร้อมช่องติ๊กตรวจสอบ (Checklist)'
                      },
                      {
                        id: 'executive-summary',
                        label: '💼 รายงานสรุปผู้บริหารและค่างวดชำระ (Executive Summary)',
                        desc: 'การ์ดสรุป KPI สถิติภารกิจและสรุปภาระงบประมาณค่าใช้จ่าย'
                      },
                      {
                        id: 'daily-focus',
                        label: '📆 กำหนดการเจาะจงเฉพาะวัน (Daily Schedule Focus)',
                        desc: 'ใบสรุปนัดหมายเจาะจงสำหรับรายวันเฉพาะกิจ'
                      }
                    ].map(item => {
                      const isActive = printDocType === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setPrintDocType(item.id as any);
                            if (item.id === 'monthly-grid') setPrintOrientation('landscape');
                            else setPrintOrientation('portrait');
                          }}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isActive
                              ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-2 ring-indigo-500/70 dark:border-indigo-500'
                              : 'border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850'
                          }`}
                        >
                          <div className="font-extrabold text-xs text-slate-800 dark:text-slate-100 flex items-center justify-between">
                            <span>{item.label}</span>
                            {isActive && <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                            {item.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Time Scope */}
                <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
                    2. ช่วงเวลาของเอกสาร (Time Range)
                  </label>

                  {printDocType === 'daily-focus' ? (
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-500 mb-1">เลือกวันที่เจาะจง:</label>
                      <input
                        type="date"
                        value={printSingleDate}
                        onChange={(e) => setPrintSingleDate(e.target.value)}
                        className="w-full h-9 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-950 dark:text-slate-200"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 mb-1">เดือน:</label>
                        <select
                          value={printMonth}
                          onChange={(e) => setPrintMonth(e.target.value)}
                          className="w-full h-9 px-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-950 dark:text-slate-200"
                        >
                          {monthNames.map((mn, idx) => (
                            <option key={mn} value={String(idx + 1).padStart(2, '0')}>{mn}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 mb-1">ปี พ.ศ.:</label>
                        <select
                          value={printYear}
                          onChange={(e) => setPrintYear(e.target.value)}
                          className="w-full h-9 px-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-950 dark:text-slate-200"
                        >
                          {Array.from({ length: 11 }, (_, k) => parseInt(printYear) - 5 + k).map(y => (
                            <option key={y} value={String(y)}>พ.ศ. {y + 543}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 3: Content Options */}
                <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
                    3. ตัวเลือกเนื้อหาและองค์ประกอบ (Content Options)
                  </label>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-500 mb-1">กรองสถานะงาน:</label>
                    <select
                      value={printTaskStatus}
                      onChange={(e) => setPrintTaskStatus(e.target.value as any)}
                      className="w-full h-8 px-2.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-950 dark:text-slate-200"
                    >
                      <option value="all">ทั้งหมด (All Tasks)</option>
                      <option value="pending">เฉพาะรอดำเนินการ (Pending Only)</option>
                      <option value="completed">เฉพาะที่เสร็จสิ้นแล้ว (Completed Only)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <label className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printIncludeTasks}
                        onChange={(e) => setPrintIncludeTasks(e.target.checked)}
                        className="w-4 h-4 rounded accent-indigo-600"
                      />
                      <span>รายการงานภารกิจ</span>
                    </label>

                    <label className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printIncludeExpenses}
                        onChange={(e) => setPrintIncludeExpenses(e.target.checked)}
                        className="w-4 h-4 rounded accent-indigo-600"
                      />
                      <span>บิลและค่างวดผ่อน</span>
                    </label>

                    <label className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printIncludeHolidays}
                        onChange={(e) => setPrintIncludeHolidays(e.target.checked)}
                        className="w-4 h-4 rounded accent-indigo-600"
                      />
                      <span>วันหยุดราชการ</span>
                    </label>

                    <label className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printIncludeSignatures}
                        onChange={(e) => setPrintIncludeSignatures(e.target.checked)}
                        className="w-4 h-4 rounded accent-indigo-600"
                      />
                      <span>ช่องลงลายมือชื่อ</span>
                    </label>
                  </div>
                </div>

                {/* Section 4: Style & Orientation */}
                <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
                    4. จานสีและรูปแบบกระดาษ (Theme & Layout)
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-500 mb-1">การวางกระดาษ A4:</label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setPrintOrientation('landscape')}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer ${
                            printOrientation === 'landscape'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          📄 แนวนอน
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrintOrientation('portrait')}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer ${
                            printOrientation === 'portrait'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          📄 แนวตั้ง
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-500 mb-1">ธีมสีเอกสาร:</label>
                      <select
                        value={printTheme}
                        onChange={(e) => setPrintTheme(e.target.value as any)}
                        className="w-full h-8 px-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-950 dark:text-slate-200"
                      >
                        <option value="official">🏛️ ทางการสถาบัน (Navy)</option>
                        <option value="slate">💼 ผู้บริหารมินิมอล (Slate)</option>
                        <option value="emerald">🌿 เอ็มเมอรัลด์ (Emerald)</option>
                        <option value="monochrome">🖤 ขาวดำประหยัดหมึก (Monochrome)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-500 mb-1">หัวข้อเอกสาร (Document Title):</label>
                      <input
                        type="text"
                        value={printHeaderTitle}
                        onChange={(e) => setPrintHeaderTitle(e.target.value)}
                        placeholder="เช่น แผนผังตารางกำหนดการปฏิบัติงานและการนัดหมาย"
                        className="w-full h-8 px-3 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-950 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-500 mb-1">ชื่อหน่วยงาน / บริษัท (ระบุเพิ่มเติมได้):</label>
                      <input
                        type="text"
                        value={printOrgName}
                        onChange={(e) => setPrintOrgName(e.target.value)}
                        placeholder="เช่น แผนกการตลาด / บริษัท เอ็กแซมเปิล จำกัด"
                        className="w-full h-8 px-3 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium bg-slate-50 dark:bg-slate-950 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Live Paper Document Preview (lg:col-span-7) */}
              <div className="lg:col-span-7 p-4 sm:p-5 bg-slate-200/60 dark:bg-slate-950/80 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>ตัวอย่างหน้ากระดาษพิมพ์จริง (Live Document Paper Preview)</span>
                  </span>
                  <span className="text-[10px] font-extrabold text-slate-500 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-300 dark:border-slate-800">
                    A4 ({printOrientation === 'landscape' ? 'แนวนอน' : 'แนวตั้ง'})
                  </span>
                </div>

                {/* Paper Canvas Frame */}
                <div className="flex-1 bg-white border border-slate-300 shadow-lg rounded-xl overflow-y-auto max-h-[58vh] lg:max-h-[62vh] p-2 dark:bg-white dark:border-slate-300">
                  <iframe
                    srcDoc={generateCalendarPrintHtml()}
                    title="Live Print Preview"
                    className="w-full h-[600px] border-none bg-white"
                  />
                </div>

                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 text-center mt-3">
                  💡 <strong>คำแนะนำการพิมพ์:</strong> สามารถคลิกปุ่มด้านล่างเพื่อเปิดหน้าต่างพิมพ์ของเบราว์เซอร์ และเลือกเครื่องพิมพ์จริง หรือบันทึกเป็นไฟล์ PDF ได้ทันที
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2 dark:bg-slate-950 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="h-10 px-5 border border-slate-200 bg-white rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-850 transition-all cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handlePrintCalendar}
                className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>สั่งพิมพ์ / บันทึกเอกสารเป็น PDF (Print or Save PDF)</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
