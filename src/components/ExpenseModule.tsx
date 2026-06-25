import React, { useState } from 'react';
import { Receipt, Plus, CheckCircle, Trash2, Edit3, Circle, Coins, Calendar, Tag, Printer, ChevronDown, ChevronUp } from 'lucide-react';
import { Expense, Installment } from '../types';
import { useDialog } from './CustomDialog';

const addMonthsSafely = (startDateStr: string, monthsToAdd: number): string => {
  if (!startDateStr) return '';
  const parts = startDateStr.split('-');
  if (parts.length !== 3) return startDateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  let targetMonth0Based = (month - 1) + monthsToAdd;
  let targetYear = year + Math.floor(targetMonth0Based / 12);
  targetMonth0Based = targetMonth0Based % 12;
  if (targetMonth0Based < 0) {
    targetMonth0Based += 12;
    targetYear -= 1;
  }
  
  const maxDays = new Date(targetYear, targetMonth0Based + 1, 0).getDate();
  const targetDay = Math.min(day, maxDays);
  
  const yyyy = targetYear;
  const mm = String(targetMonth0Based + 1).padStart(2, '0');
  const dd = String(targetDay).padStart(2, '0');
  
  return `${yyyy}-${mm}-${dd}`;
};

const generateInstallments = (startDate: string, total: number, amount: number): Installment[] => {
  const list: Installment[] = [];
  for (let i = 1; i <= total; i++) {
    const dueDate = addMonthsSafely(startDate, i - 1);
    list.push({
      installmentNo: i,
      amount: amount,
      dueDate: dueDate,
      paid: false
    });
  }
  return list;
};

interface ExpenseModuleProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onEditExpense: (id: string, updated: Partial<Expense>) => void;
  onDeleteExpense: (id: string) => void;
  accentColor: string;
}

export default function ExpenseModule({
  expenses,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  accentColor
}: ExpenseModuleProps) {
  const { showAlert, showConfirm } = useDialog();
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    return String(new Date().getMonth() + 1).padStart(2, '0');
  });
  const [filterYear, setFilterYear] = useState<string>(() => {
    return String(new Date().getFullYear());
  });

  const [activeInspectorList, setActiveInspectorList] = useState<Expense[] | null>(null);
  const [inspectorTitle, setInspectorTitle] = useState('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState('');
  const [expName, setExpName] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('🏠 ที่พัก');
  const [expDate, setExpDate] = useState('');
  const [expDueDate, setExpDueDate] = useState('');
  const [expNote, setExpNote] = useState('');

  // Installment states
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState('12');
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

  const expenseCategories = [
    '🏠 ที่พัก', '💡 สาธารณูปโภค', '🛒 ของใช้/อาหาร', '🚗 การเดินทาง',
    '💊 สุขภาพ', '📱 สื่อสาร', '🎓 การศึกษา', '🎉 บันเทิง', '📦 อื่นๆ'
  ];

  const catColors: Record<string, string> = {
    '🏠 ที่พัก': 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
    '💡 สาธารณูปโภค': 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
    '🛒 ของใช้/อาหาร': 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
    '🚗 การเดินทาง': 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900',
    '💊 สุขภาพ': 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
    '📱 สื่อสาร': 'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900',
    '🎓 การศึกษา': 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900',
    '🎉 บันเทิง': 'bg-pink-50 text-pink-850 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-900',
    '📦 อื่นๆ': 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-750'
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

  const getDaysUntilDue = (dueDateStr?: string) => {
    if (!dueDateStr) return null;
    const due = new Date(dueDateStr);
    const today = new Date(todayStr);
    const timeDiff = due.getTime() - today.getTime();
    return Math.round(timeDiff / (1000 * 60 * 60 * 24));
  };

  // Filter calculation
  const filteredExpenses = expenses.filter(e => {
    if (filterYear && e.date.substring(0, 4) !== filterYear) return false;
    if (filterMonth && e.date.substring(5, 7) !== filterMonth) return false;
    return true;
  });

  // KPI aggregates
  let sumToday = 0;
  let sumMonth = 0;
  let countSoon = 0;
  let countOverdue = 0;

  filteredExpenses.forEach(e => {
    if (e.date === todayStr) sumToday += e.amount;
    sumMonth += e.amount;

    const daysLeft = getDaysUntilDue(e.dueDate);
    if (!e.paid && daysLeft !== null) {
      if (daysLeft < 0) {
        countOverdue++;
      } else if (daysLeft <= 3) {
        countSoon++;
      }
    }
  });

  const triggerAddModal = () => {
    setEditId('');
    setExpName('');
    setExpAmount('');
    setExpCategory('🏠 ที่พัก');
    setExpDate(todayStr);
    setExpDueDate('');
    setExpNote('');
    setIsInstallment(false);
    setTotalInstallments('12');
    setIsModalOpen(true);
  };

  const triggerEditModal = (e: Expense) => {
    setEditId(e.id);
    setExpName(e.name);
    setExpAmount(String(e.amount));
    setExpCategory(e.cat);
    setExpDate(e.date);
    setExpDueDate(e.dueDate || '');
    setExpNote(e.note || '');
    setIsInstallment(e.isInstallment || false);
    setTotalInstallments(String(e.totalInstallments || '12'));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expName.trim()) {
      await showAlert('กรุณาระบุชื่อรายการที่ถูกต้องสมเหตุสมผลก่อนดำเนินการบันทึกบัญชี', 'ระบุชื่อรายการ', 'warning');
      return;
    }
    const parsedAmt = parseFloat(expAmount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      await showAlert('กรุณาระบุจำนวนเงินค่าใช้จ่ายที่ถูกต้องและมากกว่าศูนย์บาท (> 0)', 'ข้อมูลไม่ถูกต้อง', 'warning');
      return;
    }

    const parsedTotalInstallments = parseInt(totalInstallments);
    if (isInstallment && (isNaN(parsedTotalInstallments) || parsedTotalInstallments <= 0)) {
      await showAlert('กรุณาระบุจำนวนงวดผ่อนชำระที่ถูกต้องตั้งแต่ 1 งวดขึ้นไป', 'ระบุจำนวนงวด', 'warning');
      return;
    }

    if (isInstallment && !expDueDate) {
      await showAlert('กรุณาระบุวันเริ่มชำระงวดแรก (วันครบกำหนด) เพื่อให้ระบบสามารถสร้างวันชำระเงินของแต่ละเดือนได้โดยอัตโนมัติค่ะ', 'ระบุวันครบกำหนดงวดแรก', 'warning');
      return;
    }

    if (editId) {
      const existing = expenses.find(item => item.id === editId);
      let updatedInstallments = existing?.installments;
      
      if (isInstallment && (!existing?.isInstallment || existing.totalInstallments !== parsedTotalInstallments || existing.amount !== parsedAmt || existing.dueDate !== expDueDate)) {
        updatedInstallments = generateInstallments(expDueDate, parsedTotalInstallments, parsedAmt);
      } else if (!isInstallment) {
        updatedInstallments = undefined;
      }

      const allPaid = isInstallment ? (updatedInstallments?.every(inst => inst.paid) || false) : (existing?.paid || false);

      onEditExpense(editId, {
        name: expName,
        amount: parsedAmt,
        cat: expCategory,
        date: expDate,
        dueDate: expDueDate,
        note: expNote,
        isInstallment,
        totalInstallments: isInstallment ? parsedTotalInstallments : undefined,
        installments: updatedInstallments,
        paid: allPaid
      });
    } else {
      let generatedInst = undefined;
      if (isInstallment) {
        generatedInst = generateInstallments(expDueDate, parsedTotalInstallments, parsedAmt);
      }

      onAddExpense({
        name: expName,
        amount: parsedAmt,
        cat: expCategory,
        date: expDate,
        dueDate: expDueDate,
        note: expNote,
        paid: false,
        userId: 'session',
        isInstallment,
        totalInstallments: isInstallment ? parsedTotalInstallments : undefined,
        installments: generatedInst
      });
    }
    setIsModalOpen(false);
  };

  const handleToggleInstallmentPaid = async (expense: Expense, installmentNo: number) => {
    if (!expense.installments) return;
    const updated = expense.installments.map(inst => {
      if (inst.installmentNo === installmentNo) {
        const nextPaid = !inst.paid;
        return {
          ...inst,
          paid: nextPaid,
          paidDate: nextPaid ? getThailandTodayStr() : undefined
        };
      }
      return inst;
    });

    const allPaid = updated.every(inst => inst.paid);
    onEditExpense(expense.id, {
      installments: updated,
      paid: allPaid
    });
  };

  const handleMarkPaid = async (id: string, name: string) => {
    const expense = expenses.find(e => e.id === id);
    const isConfirmed = await showConfirm(
      expense?.isInstallment
        ? `คุณต้องการทำเครื่องหมายว่าชำระครบทุกงวดเรียบร้อยแล้วสำหรับ "${name}" ใช่หรือไม่?`
        : `คุณทำรายการชำระค่าใช้จ่าย/บิลรวมสำหรับ "${name}" เสร็จเรียบร้อยครบถ้วนแล้วใช่หรือไม่?`,
      'ยืนยันการชำระเงิน',
      'success'
    );
    if (isConfirmed) {
      if (expense?.isInstallment && expense.installments) {
        const updated = expense.installments.map(inst => ({
          ...inst,
          paid: true,
          paidDate: inst.paidDate || getThailandTodayStr()
        }));
        onEditExpense(id, { paid: true, installments: updated });
      } else {
        onEditExpense(id, { paid: true });
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = await showConfirm(
      `คุณแน่ใจว่าต้องการลบรายการบัญชีค่าใช้จ่าย "${name}" ออกจากระบบถาวรใช่หรือไม่?`,
      'ยืนยันการลบ',
      'danger'
    );
    if (isConfirmed) {
      onDeleteExpense(id);
    }
  };

  const clearFilters = () => {
    setFilterMonth('');
    setFilterYear('');
  };

  // Inspect specific card clicks
  const inspectStatList = (type: 'today' | 'month' | 'soon' | 'overdue') => {
    let list: Expense[] = [];
    if (type === 'today') {
      setInspectorTitle('บิลวันนี้');
      list = filteredExpenses.filter(e => e.date === todayStr);
    } else if (type === 'month') {
      setInspectorTitle('บิลทั้งหมดของเดือนประเมิน');
      list = filteredExpenses;
    } else if (type === 'soon') {
      setInspectorTitle('บิลใกล้ครบกำหนด (ภายใน 3 วัน)');
      list = filteredExpenses.filter(e => {
        const days = getDaysUntilDue(e.dueDate);
        return !e.paid && days !== null && days >= 0 && days <= 3;
      });
    } else if (type === 'overdue') {
      setInspectorTitle('บิลชำระล่าช้าเลยกำหนด!');
      list = filteredExpenses.filter(e => {
        const days = getDaysUntilDue(e.dueDate);
        return !e.paid && days !== null && days < 0;
      });
    }
    setActiveInspectorList(list);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <span className="text-sm font-extrabold text-slate-700 flex items-center gap-2 dark:text-slate-200">
          <Coins className="w-5 h-5 text-accent" style={{ color: accentColor }} />
          คำนวณและติดตามประวัติค่าใช้จ่าย
        </span>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-print-modal', { detail: { initialTab: 'expenses' } }))}
            className="flex-1 sm:flex-none h-10 px-4 border border-slate-200 rounded-xl font-semibold text-xs text-slate-600 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-950 transition-all flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            พิมพ์สรุปบัญชี / PDF
          </button>

          <button
            type="button"
            onClick={triggerAddModal}
            className="flex-1 sm:flex-none h-10 px-5 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
            style={{ backgroundColor: accentColor }}
          >
            <Plus className="w-4 h-4" />
            เพิ่มรายการชำระเงิน
          </button>
        </div>
      </div>

      {/* Grid summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => inspectStatList('today')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:translate-y-[-2px] transition-all relative overflow-hidden dark:bg-slate-900 dark:border-slate-800"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-sky-500"></div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">ยอดรวมวันนี้</div>
          <div className="text-xl font-black text-sky-600 dark:text-sky-450 truncate">
            ฿{sumToday.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div
          onClick={() => inspectStatList('month')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:translate-y-[-2px] transition-all relative overflow-hidden dark:bg-slate-900 dark:border-slate-800"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500"></div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">ยอดรวมทั้งหมดที่คัดเลือก</div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-450 truncate">
            ฿{sumMonth.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div
          onClick={() => inspectStatList('soon')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:translate-y-[-2px] transition-all relative overflow-hidden dark:bg-slate-900 dark:border-slate-800"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500"></div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">ใกล้ครบกำหนดชำระ</div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400">
            {countSoon} รายการ
          </div>
        </div>

        <div
          onClick={() => inspectStatList('overdue')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:translate-y-[-2px] transition-all relative overflow-hidden dark:bg-slate-900 dark:border-slate-800"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-rose-500"></div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">ค้างชำระเกินกำหนด</div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-450">
            {countOverdue} รายการ
          </div>
        </div>
      </div>

      {/* Filters options toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center dark:bg-slate-900 dark:border-slate-800">
        <span className="text-xs font-bold text-slate-450">กรองรอบบิลประเมิน:</span>
        
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="h-9 px-3 border border-slate-200 bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none dark:bg-slate-950 dark:border-slate-800 dark:text-slate-350"
        >
          <option value="">ทุกเดือน</option>
          {['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map((m, i) => (
            <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
          ))}
        </select>

        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="h-9 px-3 border border-slate-200 bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none dark:bg-slate-950 dark:border-slate-800 dark:text-slate-350"
        >
          <option value="">ทุกปี</option>
          {Array.from({ length: 2057 - 2020 + 1 }, (_, k) => 2020 + k).map(y => (
            <option key={y} value={String(y)}>{y + 543} (พ.ศ.)</option>
          ))}
        </select>

        <button
          onClick={clearFilters}
          className="h-9 px-4 border border-slate-200 text-xs font-bold text-slate-500 rounded-xl hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950"
        >
          แสดงรายการทั้งหมด
        </button>
      </div>

      {/* Result lists */}
      <div className="space-y-2.5">
        {filteredExpenses.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-14 text-center text-xs text-slate-400 italic dark:bg-slate-900 dark:border-slate-800">
            ยังไม่มีบันทึกข้อมูลค่าใช้จ่ายและบิลในสโคปที่ประเมินอยู่ 🍵
          </div>
        ) : (
          filteredExpenses
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))
            .map(e => {
              const daysLeft = getDaysUntilDue(e.dueDate);
              const customCatStyle = catColors[e.cat] || catColors['📦 อื่นๆ'];
              const paidCount = e.installments ? e.installments.filter(inst => inst.paid).length : 0;

              return (
                <div
                  key={e.id}
                  className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-all dark:bg-slate-900 dark:border-slate-800"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                    <div className="min-w-0 flex-1 space-y-1.5 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${customCatStyle}`}>
                          {e.cat}
                        </span>
                        {e.isInstallment && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900">
                            📦 ผ่อนค่างวดรายเดือน
                          </span>
                        )}
                        {!e.paid && daysLeft !== null && (
                          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                            daysLeft < 0 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : daysLeft <= 3 
                                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {daysLeft < 0 ? `เลยกำหนดชำระ ${Math.abs(daysLeft)} วัน` : daysLeft === 0 ? 'ครบกำหนดวันวันนี้!' : `เหลืออีก ${daysLeft} วัน`}
                          </span>
                        )}
                      </div>

                      <p className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        {e.name}
                        {e.isInstallment && (
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-450">
                            (ชำระแล้ว {paidCount}/{e.totalInstallments} งวด)
                          </span>
                        )}
                      </p>
                      
                      <div className="flex gap-4 text-[10.5px] text-slate-400 font-mono flex-wrap">
                        <span>วันที่บันทึก: {e.date}</span>
                        {e.dueDate && <span>กำหนดชำระ: {e.dueDate}</span>}
                        {e.note && <span className="font-sans italic">({e.note})</span>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto border-t border-slate-100 pt-3 sm:pt-0 sm:border-none">
                      <span className="text-sm font-black text-accent" style={{ color: accentColor }}>
                        ฿{e.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        {e.isInstallment && <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500"> / งวด</span>}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {!e.paid ? (
                          <button
                            onClick={() => handleMarkPaid(e.id, e.name)}
                            title={e.isInstallment ? "ทำเครื่องหมายจ่ายครบทุกงวด" : "ทำเครื่องหมายจ่ายแล้ว"}
                            className="w-8 h-8 border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg flex items-center justify-center transition-all dark:border-slate-800 dark:bg-slate-900"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[9px] font-extrabold bg-emerald-150 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900">
                            จ่ายแล้วครบถ้วน
                          </span>
                        )}

                        <button
                          onClick={() => triggerEditModal(e)}
                          className="w-8 h-8 border border-slate-200 text-slate-400 hover:text-accent rounded-lg flex items-center justify-center transition-all dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:hover:text-slate-200"
                          style={{ '--accent': accentColor } as React.CSSProperties}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(e.id, e.name)}
                          className="w-8 h-8 border border-slate-200 text-slate-400 hover:text-rose-600 rounded-lg flex items-center justify-center transition-all dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Installment Toggle */}
                  {e.isInstallment && (
                    <div className="flex items-center justify-between text-left">
                      <button
                        type="button"
                        onClick={() => setExpandedExpenseId(expandedExpenseId === e.id ? null : e.id)}
                        className="text-[11px] font-bold flex items-center gap-1 hover:opacity-80 transition-all"
                        style={{ color: accentColor }}
                      >
                        {expandedExpenseId === e.id ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>ซ่อนรายละเอียดแผนการผ่อนชำระค่างวด</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>คลิกดูและจัดการตารางการจ่ายเงินค่างวดรายเดือน ({paidCount}/{e.totalInstallments} งวด)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Expanded Installment Table */}
                  {e.isInstallment && expandedExpenseId === e.id && (
                    <div className="w-full mt-1 pt-3 border-t border-slate-100 dark:border-slate-800/60 animate-in slide-in-from-top-1 duration-150">
                      <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        📅 ตารางแผนการผ่อนชำระทีละเดือน (คลิกปุ่มเพื่อบันทึกชำระแต่ละงวดแยกกัน)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                        {e.installments?.map(inst => (
                          <div
                            key={inst.installmentNo}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                              inst.paid
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-950/40'
                                : 'bg-slate-50/70 dark:bg-slate-950/25 border-slate-150 dark:border-slate-800'
                            }`}
                          >
                            <div className="min-w-0 text-left">
                              <div className="flex items-center gap-1">
                                <span className="font-extrabold text-[10px] text-slate-500">งวดที่ {inst.installmentNo}/{e.totalInstallments}</span>
                                {inst.paid && (
                                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100/50 px-1.5 py-0.2 rounded-full dark:text-emerald-400 dark:bg-emerald-950/60">จ่ายแล้ว</span>
                                )}
                              </div>
                              <p className="font-extrabold text-xs text-slate-800 dark:text-slate-100 mt-0.5">
                                ฿{inst.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                              </p>
                              <span className="text-[9.5px] text-slate-400 font-mono block mt-0.5">
                                กำหนด: {inst.dueDate}
                              </span>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => handleToggleInstallmentPaid(e, inst.installmentNo)}
                              className={`h-7 px-2.5 rounded-lg text-[10px] font-black transition-all ${
                                inst.paid
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-950'
                              }`}
                            >
                              {inst.paid ? 'ชำระแล้ว ✓' : 'ทำจ่าย'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>

      {/* Add / Edit Expense popup bill */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden dark:bg-slate-900 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 dark:bg-slate-950 dark:border-slate-800 font-bold dark:text-slate-100 text-sm flex-shrink-0">
              <span className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-accent" style={{ color: accentColor }} />
                {editId ? 'แก้ไขรายการบิลค่าใช้จ่าย' : 'เพิ่มรายการบิลค่าใช้จ่ายใหม่'}
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-400 hover:text-slate-700 bg-white dark:bg-slate-900 dark:border-slate-800 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm text-slate-700 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-400">ชื่อบิลชำระยอด/รายการ *</label>
                <input
                  type="text"
                  required
                  value={expName}
                  onChange={(e) => setExpName(e.target.value)}
                  placeholder="เช่น ค่าไฟประจำเดือนพฤษภาคม..."
                  className="w-full h-11 px-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-sm text-slate-800 focus:outline-none focus:border-accent dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-400">
                    {isInstallment ? 'จำนวนเงินต่องวด (บาท) *' : 'จำนวนเงินเงินยอด (บาท) *'}
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full h-11 px-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-sm text-slate-800 focus:outline-none focus:border-accent dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                    style={{ '--accent': accentColor } as React.CSSProperties}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-400">หมวดหมู่รอบบิล</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full h-11 px-3 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-accent dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                    style={{ '--accent': accentColor } as React.CSSProperties}
                  >
                    {expenseCategories.map(ec => (
                      <option key={ec} value={ec}>{ec}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-400">
                  {isInstallment ? 'เริ่มชำระงวดแรกวันที่ (วันครบกำหนดงวดที่ 1) *' : 'กำหนดชำระด่วน / วันครบกำหนด'}
                </label>
                <input
                  type="date"
                  value={expDueDate}
                  onChange={(e) => setExpDueDate(e.target.value)}
                  className="w-full h-11 px-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-sm text-slate-800 focus:outline-none focus:border-accent dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                />
              </div>

              {/* Checkbox option for installment */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-800 flex items-center justify-between">
                <div className="text-left">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-350">💰 บันทึกรายการนี้เป็นค่างวดผ่อนชำระ</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">ระบบจะช่วยประมวลผลและสร้างตารางค่างวดรายเดือนให้ทันที</span>
                </div>
                <input
                  type="checkbox"
                  checked={isInstallment}
                  onChange={(e) => setIsInstallment(e.target.checked)}
                  className="w-4.5 h-4.5 text-accent focus:ring-accent border-slate-300 rounded dark:bg-slate-900 dark:border-slate-850"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                />
              </div>

              {isInstallment && (
                <div className="grid grid-cols-2 gap-4 p-3.5 bg-violet-50/20 dark:bg-violet-950/10 border border-violet-100 dark:border-violet-950/30 rounded-xl animate-in slide-in-from-top-1 duration-150">
                  <div className="text-left">
                    <label className="block text-xs font-bold text-slate-600 mb-1 dark:text-slate-450">จำนวนงวดผ่อนชำระทั้งหมด *</label>
                    <input
                      type="number"
                      required={isInstallment}
                      min="1"
                      max="120"
                      value={totalInstallments}
                      onChange={(e) => setTotalInstallments(e.target.value)}
                      className="w-full h-11 px-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-sm text-slate-800 focus:outline-none focus:border-accent dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                      style={{ '--accent': accentColor } as React.CSSProperties}
                    />
                  </div>
                  
                  <div className="text-left">
                    <label className="block text-xs font-bold text-slate-600 mb-1 dark:text-slate-450">ยอดผ่อนรวม (โดยประมาณ)</label>
                    <div className="h-11 px-3 flex items-center bg-slate-100/60 border border-slate-200 rounded-lg text-xs text-slate-500 font-bold font-mono dark:bg-slate-950/40 dark:border-slate-800 dark:text-slate-400">
                      ฿{((parseFloat(expAmount) || 0) * (parseInt(totalInstallments) || 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-400">รายละเอียดบันทึกความจำสั้น</label>
                <textarea
                  value={expNote}
                  onChange={(e) => setExpNote(e.target.value)}
                  placeholder="เช่น ชำระผ่านบัตรเครดิต หรือ บัญชีกรอบธุรกรรม..."
                  rows={2}
                  className="w-full p-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-sm text-slate-800 focus:outline-none focus:border-accent dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 dark:bg-slate-950 dark:border-slate-800 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-10 px-4 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="h-10 px-5 text-white font-bold text-xs rounded-lg shadow-md hover:opacity-95"
                style={{ backgroundColor: accentColor }}
              >
                บันทึกรายการ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Metrics Inspect popups list */}
      {activeInspectorList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[80vh] dark:bg-slate-900 dark:border-slate-800 animate-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 dark:bg-slate-950 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-accent" style={{ color: accentColor }} />
                {inspectorTitle} ({activeInspectorList.length})
              </h3>
              <button
                onClick={() => setActiveInspectorList(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-400 hover:text-slate-800 bg-white dark:bg-slate-900 dark:border-slate-800 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {activeInspectorList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs italic">
                  ไม่มีบิลจัดในเงื่อนไขการกรองนี้
                </div>
              ) : (
                activeInspectorList.map(item => {
                  const daysLeft = getDaysUntilDue(item.dueDate);
                  const isDone = item.paid;
                  
                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4 dark:bg-slate-950 dark:border-slate-800"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-slate-800 dark:text-slate-100">{item.name}</p>
                        <p className="text-[10px] text-slate-455 mt-1 font-mono">
                          วันที่บิล: {item.date} {item.dueDate ? `· กำหนดชำระ: ${item.dueDate}` : ''} · หมวด: {item.cat}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                          ฿{item.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </span>
                        
                        {!isDone ? (
                          <button
                            onClick={() => {
                              handleMarkPaid(item.id, item.name);
                              setActiveInspectorList(null);
                            }}
                            className="h-8 px-3 bg-white hover:bg-slate-100 border border-slate-250 text-xs font-bold text-slate-600 rounded-lg dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
                          >
                            จ่ายเงิน
                          </button>
                        ) : (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full dark:bg-emerald-950/40 dark:text-emerald-400">
                            ครบถ้วน
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end dark:bg-slate-950 dark:border-slate-800">
              <button
                onClick={() => setActiveInspectorList(null)}
                className="h-10 px-5 border border-slate-200 bg-white rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:dark:border-slate-800 dark:text-slate-200"
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
