import React, { useState, useEffect } from 'react';
import { Receipt, Plus, CheckCircle, Trash2, Edit3, Circle, Coins, Calendar, Tag, Printer, ChevronDown, ChevronUp, Upload, Eye, X, Image, History, Search } from 'lucide-react';
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
  expenseCategories?: string[];
  onAddExpenseCategory?: (category: string) => void;
}

export default function ExpenseModule({
  expenses,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  accentColor,
  expenseCategories: propExpenseCategories,
  onAddExpenseCategory
}: ExpenseModuleProps) {
  const { showAlert, showConfirm } = useDialog();
  const [highlightedExpenseId, setHighlightedExpenseId] = useState<string | null>(null);

  useEffect(() => {
    const handleFocusExpense = (e: Event) => {
      const customEvent = e as CustomEvent<{ expenseId: string }>;
      const { expenseId } = customEvent.detail;
      if (!expenseId) return;
      
      setHighlightedExpenseId(expenseId);
      
      // Scroll to element
      setTimeout(() => {
        const el = document.getElementById(`expense-card-${expenseId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      // Reset highlight after 5 seconds
      setTimeout(() => {
        setHighlightedExpenseId(curr => curr === expenseId ? null : curr);
      }, 5000);
    };

    window.addEventListener('focus-expense', handleFocusExpense);
    return () => {
      window.removeEventListener('focus-expense', handleFocusExpense);
    };
  }, []);

  // Custom categories creation on-the-fly
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  const defaultExpenseCategories = [
    '🏠 ที่พัก', '💡 สาธารณูปโภค', '🛒 ของใช้/อาหาร', '🚗 การเดินทาง',
    '💊 สุขภาพ', '📱 สื่อสาร', '🎓 การศึกษา', '🎉 บันเทิง', '📦 อื่นๆ'
  ];
  const expenseCategories = propExpenseCategories || defaultExpenseCategories;

  const [filterMonth, setFilterMonth] = useState<string>(() => {
    return String(new Date().getMonth() + 1).padStart(2, '0');
  });
  const [filterYear, setFilterYear] = useState<string>(() => {
    return String(new Date().getFullYear());
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

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
  const [tempInstallments, setTempInstallments] = useState<Installment[]>([]);
  const [actualPaidAmount, setActualPaidAmount] = useState<string>('');

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
  const [viewSlipPaidDate, setViewSlipPaidDate] = useState('');

  // Payment History Modal states
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyCategory, setHistoryCategory] = useState('');
  const [historyMonth, setHistoryMonth] = useState('');
  const [historyYear, setHistoryYear] = useState('');

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

  // Flatten installments into individual items for display
  const allDisplayItems = React.useMemo(() => {
    const list: (Expense & { 
      isVirtualInstallment?: boolean; 
      parentExpense?: Expense; 
      installmentNo?: number;
    })[] = [];
    
    expenses.forEach(e => {
      if (e.isInstallment && e.installments && e.installments.length > 0) {
        e.installments.forEach(inst => {
          list.push({
            id: `${e.id}-inst-${inst.installmentNo}`,
            name: `${e.name} (ผ่อนงวดที่ ${inst.installmentNo}/${e.totalInstallments})`,
            amount: inst.amount,
            cat: e.cat,
            date: inst.dueDate, // Use installment due date as the primary date for filtering and sorting
            dueDate: inst.dueDate,
            note: e.note,
            paid: inst.paid,
            paidDate: inst.paidDate,
            userId: e.userId,
            slipBase64: inst.slipBase64,
            isInstallment: true,
            isVirtualInstallment: true,
            parentExpense: e,
            installmentNo: inst.installmentNo,
            totalInstallments: e.totalInstallments,
          });
        });
      } else {
        list.push(e);
      }
    });
    
    return list;
  }, [expenses]);

  // Filter calculation
  const filteredExpenses = allDisplayItems.filter(e => {
    if (filterYear && e.date.substring(0, 4) !== filterYear) return false;
    if (filterMonth && e.date.substring(5, 7) !== filterMonth) return false;
    if (filterCategory && e.cat !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = e.name.toLowerCase().includes(q);
      const noteMatch = e.note?.toLowerCase().includes(q) || false;
      if (!nameMatch && !noteMatch) return false;
    }
    return true;
  });

  // Filtered History calculation
  const filteredHistoryItems = React.useMemo(() => {
    return allDisplayItems
      .filter(e => e.paid)
      .filter(e => {
        if (historySearchQuery) {
          const q = historySearchQuery.toLowerCase();
          const nameMatch = e.name.toLowerCase().includes(q);
          const noteMatch = e.note?.toLowerCase().includes(q) || false;
          if (!nameMatch && !noteMatch) return false;
        }
        if (historyCategory && e.cat !== historyCategory) return false;
        
        const dateToUse = e.paidDate || e.date;
        if (historyYear && dateToUse.substring(0, 4) !== historyYear) return false;
        if (historyMonth && dateToUse.substring(5, 7) !== historyMonth) return false;
        return true;
      });
  }, [allDisplayItems, historySearchQuery, historyCategory, historyMonth, historyYear]);

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

  const handleAmountChange = (val: string) => {
    setExpAmount(val);
    if (isInstallment) {
      const parsedTotal = parseInt(totalInstallments) || 0;
      const parsedAmt = parseFloat(val) || 0;
      setTempInstallments(generateInstallments(expDueDate || todayStr, parsedTotal, parsedAmt));
    }
  };

  const handleTotalInstallmentsChange = (val: string) => {
    setTotalInstallments(val);
    if (isInstallment) {
      const parsedTotal = parseInt(val) || 0;
      const parsedAmt = parseFloat(expAmount) || 0;
      setTempInstallments(generateInstallments(expDueDate || todayStr, parsedTotal, parsedAmt));
    }
  };

  const handleDueDateChange = (val: string) => {
    setExpDueDate(val);
    if (isInstallment) {
      const parsedTotal = parseInt(totalInstallments) || 0;
      const parsedAmt = parseFloat(expAmount) || 0;
      setTempInstallments(generateInstallments(val || todayStr, parsedTotal, parsedAmt));
    }
  };

  const handleIsInstallmentToggle = (checked: boolean) => {
    setIsInstallment(checked);
    if (checked) {
      const parsedTotal = parseInt(totalInstallments) || 0;
      const parsedAmt = parseFloat(expAmount) || 0;
      setTempInstallments(generateInstallments(expDueDate || todayStr, parsedTotal, parsedAmt));
    } else {
      setTempInstallments([]);
    }
  };

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
    setTempInstallments([]);
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
    if (e.isInstallment && e.installments) {
      setTempInstallments(e.installments);
    } else {
      setTempInstallments([]);
    }
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

    const isConfirmed = await showConfirm(
      editId ? 'คุณต้องการบันทึกการแก้ไขรายการค่าใช้จ่ายนี้ใช่หรือไม่?' : 'คุณต้องการบันทึกรายการค่าใช้จ่ายใหม่นี้ใช่หรือไม่?',
      'ยืนยันการบันทึกข้อมูล',
      'success'
    );
    if (!isConfirmed) return;

    if (editId) {
      const existing = expenses.find(item => item.id === editId);
      const allPaid = isInstallment ? (tempInstallments?.every(inst => inst.paid) || false) : (existing?.paid || false);

      onEditExpense(editId, {
        name: expName,
        amount: parsedAmt,
        cat: expCategory,
        date: expDate,
        dueDate: expDueDate,
        note: expNote,
        isInstallment,
        totalInstallments: isInstallment ? parsedTotalInstallments : undefined,
        installments: isInstallment ? tempInstallments : undefined,
        paid: allPaid
      });
    } else {
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
        installments: isInstallment ? tempInstallments : undefined
      });
    }
    setIsModalOpen(false);
    await showAlert(editId ? 'บันทึกการแก้ไขรายการค่าใช้จ่ายสำเร็จเรียบร้อยแล้ว!' : 'บันทึกรายการค่าใช้จ่ายใหม่สำเร็จเรียบร้อยแล้ว!', 'สำเร็จ', 'success');
  };

  const handleToggleInstallmentPaid = async (expense: Expense, installmentNo: number) => {
    const inst = expense.installments?.find(i => i.installmentNo === installmentNo);
    if (inst?.paid) {
      setViewSlipTitle(`${expense.name} (ผ่อนงวดที่ ${installmentNo}/${expense.totalInstallments})`);
      setViewSlipBase64(inst.slipBase64 || '');
      setViewSlipAmount(inst.amount);
      setViewSlipDate(inst.dueDate);
      setViewSlipPaidDate(inst.paidDate || '');
      setIsViewSlipModalOpen(true);
      return;
    }

    setPaySlipExpense(expense);
    setPaySlipInstallmentNo(installmentNo);
    const targetAmount = inst?.amount ?? expense.amount;
    setActualPaidAmount(String(targetAmount));
    setPaySlipBase64('');
    setPaySlipFileName('');
    setIsPaySlipModalOpen(true);
  };

  const handleMarkPaid = async (id: string, name: string) => {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return;

    if (expense.paid) {
      setViewSlipTitle(expense.name);
      setViewSlipBase64(expense.slipBase64 || '');
      setViewSlipAmount(expense.amount);
      setViewSlipDate(expense.dueDate);
      setViewSlipPaidDate(expense.paidDate || '');
      setIsViewSlipModalOpen(true);
      return;
    }

    setPaySlipExpense(expense);
    setPaySlipInstallmentNo(null);
    setActualPaidAmount(String(expense.amount));
    setPaySlipBase64('');
    setPaySlipFileName('');
    setIsPaySlipModalOpen(true);
  };

  const handleSavePaymentWithSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paySlipExpense) return;

    const parsedActualPaid = parseFloat(actualPaidAmount);
    if (isNaN(parsedActualPaid) || parsedActualPaid < 0) {
      await showAlert('กรุณาระบุจำนวนเงินที่ชำระจริงให้ถูกต้อง', 'ยอดเงินไม่ถูกต้อง', 'warning');
      return;
    }

    const targetAmount = paySlipInstallmentNo !== null
      ? (paySlipExpense.installments?.find(i => i.installmentNo === paySlipInstallmentNo)?.amount ?? paySlipExpense.amount)
      : paySlipExpense.amount;

    const isConfirmed = await showConfirm(
      `คุณต้องการบันทึกการชำระเงินสำหรับ "${paySlipExpense.name}" ${
        paySlipInstallmentNo ? `งวดที่ ${paySlipInstallmentNo}` : ''
      } ยอดเงินชำระจริง ฿${parsedActualPaid.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ใช่หรือไม่? (เมื่อกดยืนยันแล้วจะไม่สามารถแก้ไขสลิปหรือยกเลิกการจ่ายเงินได้)`,
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
            amount: parsedActualPaid, // Save actual paid amount
            paidDate: getThailandTodayStr(),
            slipBase64: paySlipBase64 || undefined
          };
        } else if (inst.installmentNo === paySlipInstallmentNo + 1) {
          const diff = targetAmount - parsedActualPaid;
          return {
            ...inst,
            amount: Math.max(0, inst.amount + diff) // Automatically carry over the difference
          };
        }
        return inst;
      });
      const allPaid = updated?.every(inst => inst.paid) || false;
      onEditExpense(paySlipExpense.id, {
        installments: updated,
        paid: allPaid,
        paidDate: allPaid ? getThailandTodayStr() : undefined
      });
    } else {
      onEditExpense(paySlipExpense.id, {
        amount: parsedActualPaid, // Save actual paid amount
        paid: true,
        paidDate: getThailandTodayStr(),
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

  const handleRevertPayment = async (item: Expense & { isVirtualInstallment?: boolean; parentExpense?: Expense; installmentNo?: number }) => {
    const isConfirmed = await showConfirm(
      `คุณแน่ใจว่าต้องการยกเลิกสถานะการชำระเงินของรายการ "${item.name}" และเปลี่ยนกลับเป็น "ค้างชำระ" ใช่หรือไม่?`,
      'ยืนยันการยกเลิกการชำระเงิน',
      'warning'
    );
    if (!isConfirmed) return;

    if (item.isVirtualInstallment && item.parentExpense && item.installmentNo !== undefined) {
      const parent = item.parentExpense;
      const updatedInstallments = parent.installments?.map(inst => {
        if (inst.installmentNo === item.installmentNo) {
          return { ...inst, paid: false, paidDate: undefined, slipBase64: undefined };
        }
        return inst;
      }) || [];
      
      onEditExpense(parent.id, {
        installments: updatedInstallments,
        paid: false,
        paidDate: undefined
      });
    } else {
      onEditExpense(item.id, {
        paid: false,
        paidDate: undefined,
        slipBase64: undefined
      });
    }
    showAlert('ยกเลิกสถานะการชำระเงินเรียบร้อยแล้ว', 'สำเร็จ');
  };

  const handleRevertAllFilteredHistory = async (filteredHistory: typeof allDisplayItems) => {
    if (filteredHistory.length === 0) return;
    const isConfirmed = await showConfirm(
      `คุณแน่ใจว่าต้องการยกเลิกสถานะการชำระเงินของรายการทั้งหมดที่กำลังกรองอยู่ (${filteredHistory.length} รายการ) กลับเป็น "ค้างชำระ" ใช่หรือไม่?`,
      'ยืนยันยกเลิกการชำระเงินทั้งหมด',
      'warning'
    );
    if (!isConfirmed) return;

    // We group by parent expense so we edit each parent expense once!
    const editsToMake: Record<string, Partial<Expense>> = {};
    
    filteredHistory.forEach(item => {
      if (item.isVirtualInstallment && item.parentExpense && item.installmentNo !== undefined) {
        const parentId = item.parentExpense.id;
        const parentExpenseInDb = expenses.find(e => e.id === parentId);
        if (!parentExpenseInDb) return;
        
        const currentInstallments = editsToMake[parentId]?.installments || parentExpenseInDb.installments || [];
        const updatedInsts = currentInstallments.map(inst => {
          if (inst.installmentNo === item.installmentNo) {
            return { ...inst, paid: false, paidDate: undefined, slipBase64: undefined };
          }
          return inst;
        });
        
        editsToMake[parentId] = {
          ...editsToMake[parentId],
          installments: updatedInsts,
          paid: false,
          paidDate: undefined
        };
      } else {
        editsToMake[item.id] = {
          paid: false,
          paidDate: undefined,
          slipBase64: undefined
        };
      }
    });

    // Execute all edits
    for (const [id, updated] of Object.entries(editsToMake)) {
      onEditExpense(id, updated);
    }
    
    showAlert('ยกเลิกสถานะการชำระเงินของรายการทั้งหมดที่กรองอยู่สำเร็จ', 'สำเร็จ');
  };

  const handleDeleteAllFilteredHistory = async (filteredHistory: typeof allDisplayItems) => {
    if (filteredHistory.length === 0) return;
    const isConfirmed = await showConfirm(
      `คุณแน่ใจว่าต้องการลบรายการบัญชีค่าใช้จ่ายทั้งหมดที่กำลังกรองอยู่ (${filteredHistory.length} รายการ) ออกจากระบบอย่างถาวรใช่หรือไม่?\n*คำเตือน: หากลบค่างวดผ่อนชำระ จะเป็นการลบรายการแม่และแผนผ่อนงวดทั้งหมดออกไป`,
      'ยืนยันการลบรายการทั้งหมดถาวร',
      'danger'
    );
    if (!isConfirmed) return;

    const idsToDelete = new Set<string>();
    filteredHistory.forEach(item => {
      if (item.isVirtualInstallment && item.parentExpense) {
        idsToDelete.add(item.parentExpense.id);
      } else {
        idsToDelete.add(item.id);
      }
    });

    idsToDelete.forEach(id => {
      onDeleteExpense(id);
    });

    showAlert('ลบรายการทั้งหมดที่กรองอยู่เสร็จสิ้น', 'สำเร็จ');
  };

  const handleDeleteHistoryItem = async (item: Expense & { isVirtualInstallment?: boolean; parentExpense?: Expense; installmentNo?: number }) => {
    const isConfirmed = await showConfirm(
      `คุณแน่ใจว่าต้องการลบรายการ "${item.name}" ออกจากระบบถาวรใช่หรือไม่?${item.isVirtualInstallment ? '\n*คำเตือน: จะเป็นการลบรายการแม่และแผนผ่อนชำระงวดอื่นทั้งหมดด้วย' : ''}`,
      'ยืนยันการลบ',
      'danger'
    );
    if (!isConfirmed) return;

    if (item.isVirtualInstallment && item.parentExpense) {
      onDeleteExpense(item.parentExpense.id);
    } else {
      onDeleteExpense(item.id);
    }
    showAlert('ลบรายการสำเร็จแล้ว', 'สำเร็จ');
  };

  const highlightText = (text: string, search: string) => {
    if (!search) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 text-slate-900 rounded-[2px] px-0.5 font-extrabold dark:bg-yellow-500/45 dark:text-yellow-100">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const clearFilters = () => {
    setFilterMonth('');
    setFilterYear('');
    setFilterCategory('');
    setSearchQuery('');
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
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex-1 sm:flex-none h-10 px-4 border border-slate-200 rounded-xl font-semibold text-xs text-slate-600 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-950 transition-all flex items-center justify-center gap-2"
          >
            <History className="w-4 h-4 text-emerald-600" />
            ประวัติการชำระเงินทั้งหมด
          </button>

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div
          onClick={() => inspectStatList('today')}
          className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:translate-y-[-2px] transition-all relative overflow-hidden dark:bg-slate-900 dark:border-slate-800"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-sky-500"></div>
          <div className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">ยอดรวมวันนี้</div>
          <div className="text-sm sm:text-base md:text-lg lg:text-xl font-black text-sky-600 dark:text-sky-450 truncate">
            ฿{sumToday.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div
          onClick={() => inspectStatList('month')}
          className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:translate-y-[-2px] transition-all relative overflow-hidden dark:bg-slate-900 dark:border-slate-800"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500"></div>
          <div className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">ยอดรวมทั้งหมดที่คัดเลือก</div>
          <div className="text-sm sm:text-base md:text-lg lg:text-xl font-black text-emerald-600 dark:text-emerald-450 truncate">
            ฿{sumMonth.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div
          onClick={() => inspectStatList('soon')}
          className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:translate-y-[-2px] transition-all relative overflow-hidden dark:bg-slate-900 dark:border-slate-800"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500"></div>
          <div className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">ใกล้ครบกำหนดชำระ</div>
          <div className="text-sm sm:text-base md:text-lg lg:text-xl font-black text-amber-600 dark:text-amber-400">
            {countSoon} รายการ
          </div>
        </div>

        <div
          onClick={() => inspectStatList('overdue')}
          className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:translate-y-[-2px] transition-all relative overflow-hidden dark:bg-slate-900 dark:border-slate-800"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-rose-500"></div>
          <div className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">ค้างชำระเกินกำหนด</div>
          <div className="text-sm sm:text-base md:text-lg lg:text-xl font-black text-rose-600 dark:text-rose-450">
            {countOverdue} รายการ
          </div>
        </div>
      </div>

      {/* Filters options toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3.5 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
          {/* Left Block: Search and Category */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
            {/* Search Input with visual search button */}
            <div className="relative flex-1 min-w-0 sm:min-w-[240px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหารายการ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-14 border border-slate-200 bg-slate-50/50 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500/30 focus:border-purple-500 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-350"
              />
              <button
                type="button"
                className="absolute right-1 top-1 bottom-1 px-3 bg-purple-600 text-white rounded-lg text-[10px] font-extrabold hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center shadow-sm"
              >
                ค้นหา
              </button>
            </div>

            {/* Category Select Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 shrink-0">หมวดหมู่:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="h-9 px-3 border border-slate-200 bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none dark:bg-slate-950 dark:border-slate-800 dark:text-slate-350 min-w-[120px]"
              >
                <option value="">ทั้งหมด</option>
                {expenseCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Block: Month and Year and Clear Button */}
          <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
            <span className="text-[11px] font-bold text-slate-400">รอบบิล:</span>
            
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

            {(filterMonth || filterYear || filterCategory || searchQuery) && (
              <button
                onClick={clearFilters}
                className="h-9 px-3.5 border border-rose-200 text-xs font-extrabold text-rose-600 rounded-xl hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950 transition-all"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>
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
              const parentPaidCount = e.isVirtualInstallment && e.parentExpense?.installments 
                ? e.parentExpense.installments.filter(inst => inst.paid).length 
                : 0;
              const isEditDisabled = e.isVirtualInstallment 
                ? (e.parentExpense?.paid || parentPaidCount > 0)
                : (e.paid || paidCount > 0);

              const isSearchMatched = searchQuery && (
                e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                (e.note?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
              );

              const isHighlighted = e.id === highlightedExpenseId;

              return (
                <div
                  key={e.id}
                  id={`expense-card-${e.id}`}
                  className={`border p-4 rounded-xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-all dark:bg-slate-900 ${
                    isHighlighted
                      ? 'ring-2 ring-offset-2 dark:ring-offset-slate-950 animate-pulse'
                      : isSearchMatched 
                        ? 'bg-purple-50/20 border-purple-500 ring-2 ring-purple-500/20 shadow-purple-100 dark:border-purple-800 dark:ring-purple-900/40 scale-[1.01] animate-pulse duration-1000' 
                        : 'bg-white border-slate-200 dark:border-slate-800'
                  }`}
                  style={isHighlighted ? { borderColor: accentColor, borderRadius: '12px', boxShadow: `0 0 20px ${accentColor}`, transform: 'scale(1.03)', zIndex: 10, '--tw-ring-color': accentColor } : {}}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full">
                    <div className="min-w-0 flex-1 space-y-1.5 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${customCatStyle}`}>
                          {e.cat}
                        </span>
                        {e.isVirtualInstallment ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900">
                            📦 ค่างวดผ่อนชำระ ({e.installmentNo}/{e.totalInstallments})
                          </span>
                        ) : e.isInstallment ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900">
                            📦 ผ่อนค่างวดรายเดือน
                          </span>
                        ) : null}
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
                        {highlightText(e.name, searchQuery)}
                        {e.isInstallment && !e.isVirtualInstallment && (
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-450">
                            (ชำระแล้ว {paidCount}/{e.totalInstallments} งวด)
                          </span>
                        )}
                      </p>
                      
                      <div className="flex gap-4 text-[10.5px] text-slate-400 font-mono flex-wrap">
                        <span>วันที่บันทึก: {e.date}</span>
                        {e.dueDate && <span>กำหนดชำระ: {e.dueDate}</span>}
                        {e.note && <span className="font-sans italic">({highlightText(e.note, searchQuery)})</span>}
                      </div>

                      {/* สรุปยอดรวมและยอดคงเหลือสำหรับค่างวด */}
                      {(e.isVirtualInstallment || e.isInstallment) && (() => {
                        const parentInsts = e.isVirtualInstallment ? (e.parentExpense?.installments || []) : (e.installments || []);
                        const totalContractAmount = parentInsts.reduce((acc, inst) => acc + inst.amount, 0);
                        const remainingContractBalance = parentInsts.filter(inst => !inst.paid).reduce((acc, inst) => acc + inst.amount, 0);
                        const paidContractAmount = parentInsts.filter(inst => inst.paid).reduce((acc, inst) => acc + inst.amount, 0);
                        const paidInstCount = parentInsts.filter(inst => inst.paid).length;
                        const totalInstCount = parentInsts.length;
                        
                        return (
                          <div className="mt-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/80 rounded-xl p-3 space-y-1 text-xs text-left">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-1.5 font-bold">
                              <span className="text-slate-500">📊 สรุปสัญญาผ่อนชำระ:</span>
                              <span className="text-accent" style={{ color: accentColor }}>{e.isVirtualInstallment ? e.parentExpense?.name : e.name}</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 pt-1 font-semibold text-[11px]">
                              <div>
                                <span className="text-slate-400">ยอดรวมทุกงวด: </span>
                                <span className="text-slate-700 dark:text-slate-300">฿{totalContractAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div>
                                <span className="text-slate-400">ชำระไปแล้ว: </span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">฿{paidContractAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ({paidInstCount}/{totalInstCount} งวด)</span>
                              </div>
                              <div>
                                <span className="text-rose-500 font-extrabold">ยอดคงเหลือ: </span>
                                <span className="text-rose-600 dark:text-rose-400 font-black">฿{remainingContractBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
 
                    <div className="flex items-center justify-between md:justify-start gap-4 w-full md:w-auto border-t border-slate-100 pt-3 md:pt-0 md:border-none">
                      <span className="text-sm font-black text-accent" style={{ color: accentColor }}>
                        ฿{e.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        {e.isInstallment && !e.isVirtualInstallment && <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500"> / งวด</span>}
                      </span>
 
                      <div className="flex items-center gap-1.5">
                        {!e.paid ? (
                          <button
                            onClick={() => {
                              if (e.isVirtualInstallment && e.parentExpense && e.installmentNo !== undefined) {
                                handleToggleInstallmentPaid(e.parentExpense, e.installmentNo);
                              } else {
                                handleMarkPaid(e.id, e.name);
                              }
                            }}
                            title={e.isVirtualInstallment ? `บันทึกชำระเงินงวดที่ ${e.installmentNo}` : "ทำเครื่องหมายจ่ายแล้ว"}
                            className="w-8 h-8 border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg flex items-center justify-center transition-all dark:border-slate-800 dark:bg-slate-900"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900">
                              จ่ายแล้ว ✓
                            </span>
                            {e.slipBase64 && (
                              <button
                                onClick={() => {
                                  setViewSlipTitle(e.name);
                                  setViewSlipBase64(e.slipBase64 || '');
                                  setViewSlipAmount(e.amount);
                                  setViewSlipDate(e.dueDate);
                                  setViewSlipPaidDate(e.paidDate || '');
                                  setIsViewSlipModalOpen(true);
                                }}
                                className="h-6 px-2 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold rounded-lg hover:bg-purple-100 transition-all flex items-center gap-1 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900"
                              >
                                <Eye className="w-3 h-3" /> ดูสลิป
                              </button>
                            )}
                          </div>
                        )}
 
                        <button
                          onClick={() => {
                            if (e.isVirtualInstallment && e.parentExpense) {
                              triggerEditModal(e.parentExpense);
                            } else {
                              triggerEditModal(e);
                            }
                          }}
                          disabled={isEditDisabled}
                          className={`w-8 h-8 border border-slate-200 text-slate-400 hover:text-accent rounded-lg flex items-center justify-center transition-all dark:border-slate-800 bg-slate-50 dark:bg-slate-950 dark:hover:text-slate-200 ${
                            isEditDisabled ? 'opacity-40 cursor-not-allowed' : ''
                          }`}
                          style={{ '--accent': accentColor } as React.CSSProperties}
                          title={isEditDisabled ? "ไม่สามารถแก้ไขรายการที่ชำระเงินแล้วได้ (ต้องลบออกแล้วบันทึกใหม่)" : "แก้ไขรายละเอียดค่าใช้จ่าย"}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
 
                        <button
                          onClick={() => {
                            if (e.isVirtualInstallment && e.parentExpense) {
                              handleDelete(e.parentExpense.id, e.parentExpense.name);
                            } else {
                              handleDelete(e.id, e.name);
                            }
                          }}
                          className="w-8 h-8 border border-slate-200 text-slate-400 hover:text-rose-600 rounded-lg flex items-center justify-center transition-all dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
 
                  {/* Expanded Installment Details for Virtual Installment */}
                  {e.isVirtualInstallment && (
                    <div className="flex flex-col gap-2 mt-1 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
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
                              <span>ซ่อนรายละเอียดแผนผ่อนชำระค่างวด</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              <span>คลิกดูรายละเอียดสัญญาและแผนผ่อนชำระค่างวด</span>
                            </>
                          )}
                        </button>
                      </div>

                      {expandedExpenseId === e.id && (
                        <div className="p-3 bg-slate-50 rounded-xl dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 space-y-2 mt-1 animate-in slide-in-from-top-1 duration-150 text-left">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">ชื่อรายการสัญญาแม่:</span>
                              <span className="font-extrabold text-xs text-slate-700 dark:text-slate-350">{e.parentExpense?.name}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">งวดผ่อนชำระ:</span>
                              <span className="font-extrabold text-xs text-slate-700 dark:text-slate-350">งวดที่ {e.installmentNo} จากทั้งหมด {e.totalInstallments} งวด</span>
                            </div>
                            <div>
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">กำหนดวันครบดีลชำระ:</span>
                              <span className="font-semibold text-xs text-slate-700 dark:text-slate-350 font-mono">{e.dueDate}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">ยอดเงินประจำงวด:</span>
                              <span className="font-extrabold text-xs text-accent" style={{ color: accentColor }}>฿{e.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                          {e.note && (
                            <div className="text-left border-t border-slate-200 dark:border-slate-800 pt-2">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">บันทึกเพิ่มเติมของบิล:</span>
                              <p className="text-xs text-slate-650 dark:text-slate-400 italic font-sans">{e.note}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expanded Installment Toggle */}
                  {e.isInstallment && !e.isVirtualInstallment && (
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
                  {e.isInstallment && !e.isVirtualInstallment && expandedExpenseId === e.id && (
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
                              className={`h-7 px-2.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 ${
                                inst.paid
                                  ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-900'
                                  : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-950'
                              }`}
                            >
                              {inst.paid ? (
                                <>
                                  <Eye className="w-3.5 h-3.5" /> ดูสลิป
                                </>
                              ) : 'ทำจ่าย'}
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
                    {isInstallment ? 'จำนวนเงินต่องวดเริ่มต้น (บาท) *' : 'จำนวนเงินเงินยอด (บาท) *'}
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={expAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-full h-11 px-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-sm text-slate-800 focus:outline-none focus:border-accent dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                    style={{ '--accent': accentColor } as React.CSSProperties}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">หมวดหมู่รอบบิล</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomCategory(!isAddingCustomCategory)}
                      className="text-[10px] font-bold hover:underline flex items-center gap-0.5"
                      style={{ color: accentColor }}
                    >
                      {isAddingCustomCategory ? '❌ ยกเลิก' : '➕ เพิ่มหมวดหมู่'}
                    </button>
                  </div>
                  
                  {isAddingCustomCategory ? (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="ชื่อหมวดหมู่ใหม่..."
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                        className="flex-1 h-11 px-3 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-accent dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                        style={{ '--accent': accentColor } as React.CSSProperties}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const name = customCategoryName.trim();
                          if (!name) return;
                          if (expenseCategories.includes(name)) {
                            showAlert('หมวดหมู่นี้มีอยู่แล้ว', 'มีอยู่แล้ว', 'warning');
                            setExpCategory(name);
                            setIsAddingCustomCategory(false);
                            setCustomCategoryName('');
                            return;
                          }
                          if (onAddExpenseCategory) {
                            onAddExpenseCategory(name);
                          }
                          setExpCategory(name);
                          setIsAddingCustomCategory(false);
                          setCustomCategoryName('');
                        }}
                        className="px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center"
                      >
                        บันทึก
                      </button>
                    </div>
                  ) : (
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
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 dark:text-slate-400">
                  {isInstallment ? 'เริ่มชำระงวดแรกวันที่ (วันครบกำหนดงวดที่ 1) *' : 'กำหนดชำระด่วน / วันครบกำหนด'}
                </label>
                <input
                  type="date"
                  value={expDueDate}
                  onChange={(e) => handleDueDateChange(e.target.value)}
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
                  onChange={(e) => handleIsInstallmentToggle(e.target.checked)}
                  className="w-4.5 h-4.5 text-accent focus:ring-accent border-slate-300 rounded dark:bg-slate-900 dark:border-slate-850"
                  style={{ '--accent': accentColor } as React.CSSProperties}
                />
              </div>

              {isInstallment && (
                <>
                  <div className="grid grid-cols-2 gap-4 p-3.5 bg-violet-50/20 dark:bg-violet-950/10 border border-violet-100 dark:border-violet-950/30 rounded-xl animate-in slide-in-from-top-1 duration-150">
                    <div className="text-left">
                      <label className="block text-xs font-bold text-slate-600 mb-1 dark:text-slate-450">จำนวนงวดทั้งหมด *</label>
                      <input
                        type="number"
                        required={isInstallment}
                        min="1"
                        max="120"
                        value={totalInstallments}
                        onChange={(e) => handleTotalInstallmentsChange(e.target.value)}
                        className="w-full h-11 px-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-sm text-slate-800 focus:outline-none focus:border-accent dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
                        style={{ '--accent': accentColor } as React.CSSProperties}
                      />
                    </div>
                    
                    <div className="text-left">
                      <label className="block text-xs font-bold text-slate-600 mb-1 dark:text-slate-450">ยอดผ่อนรวมจริง</label>
                      <div className="h-11 px-3 flex items-center bg-slate-100/60 border border-slate-200 rounded-lg text-xs text-slate-500 font-bold font-mono dark:bg-slate-950/40 dark:border-slate-800 dark:text-slate-400">
                        ฿{tempInstallments.reduce((sum, inst) => sum + inst.amount, 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* ปรับแต่งจำนวนเงิน / กำหนดส่งของแต่ละงวดแยกกันได้ที่นี่ */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-950/20 max-h-52 overflow-y-auto space-y-2">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                      ✍️ ปรับแต่งยอดเงินและวันครบกำหนดของแต่ละงวดได้ที่นี่:
                    </label>
                    <div className="space-y-2.5">
                      {tempInstallments.map((inst, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <span className="w-16 font-extrabold shrink-0 text-slate-500">งวดที่ {inst.installmentNo}:</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={inst.amount}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setTempInstallments(prev => prev.map((item, idx) => idx === index ? { ...item, amount: isNaN(val) ? 0 : val } : item));
                            }}
                            className="w-24 h-9 px-2 border border-slate-200 bg-white dark:border-slate-850 dark:bg-slate-950 rounded-lg text-xs focus:outline-none focus:border-accent font-bold text-slate-700 dark:text-slate-300"
                            placeholder="0.00"
                          />
                          <input
                            type="date"
                            value={inst.dueDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTempInstallments(prev => prev.map((item, idx) => idx === index ? { ...item, dueDate: val } : item));
                            }}
                            className="flex-1 h-9 px-2 border border-slate-200 bg-white dark:border-slate-850 dark:bg-slate-950 rounded-lg text-xs focus:outline-none focus:border-accent font-bold text-slate-700 dark:text-slate-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
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
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left dark:bg-slate-950 dark:border-slate-800"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-slate-800 dark:text-slate-100">{item.name}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">
                          วันที่บิล: {item.date} {item.dueDate ? `· กำหนดชำระ: ${item.dueDate}` : ''} · หมวด: {item.cat}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-none border-slate-100 dark:border-slate-800/60 pt-2 sm:pt-0">
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
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full dark:bg-emerald-950/40 dark:text-emerald-400">
                              ครบถ้วน
                            </span>
                            {item.slipBase64 && (
                              <button
                                onClick={() => {
                                  setViewSlipTitle(item.name);
                                  setViewSlipBase64(item.slipBase64 || '');
                                  setViewSlipAmount(item.amount);
                                  setViewSlipDate(item.dueDate);
                                  setViewSlipPaidDate(item.paidDate || '');
                                  setIsViewSlipModalOpen(true);
                                  setActiveInspectorList(null);
                                }}
                                className="h-6 px-2 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold rounded-lg hover:bg-purple-100 flex items-center gap-1 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900"
                              >
                                <Eye className="w-3 h-3" /> ดูสลิป
                              </button>
                            )}
                          </div>
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

      {/* Payment & Slip Upload Modal */}
      {isPaySlipModalOpen && paySlipExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh] dark:bg-slate-900 dark:border-slate-800 animate-in zoom-in duration-150 text-left">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 dark:bg-slate-950 dark:border-slate-800 flex-shrink-0">
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

            <form onSubmit={handleSavePaymentWithSlip} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 dark:bg-purple-950/10 dark:border-purple-900/50 space-y-1">
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider dark:text-purple-400">
                    {paySlipInstallmentNo ? `ค่างวดผ่อนรายเดือน (งวดที่ ${paySlipInstallmentNo}/${paySlipExpense.totalInstallments})` : 'รายการบิล/ค่าใช้จ่าย'}
                  </span>
                  <h4 className="font-extrabold text-sm text-slate-850 dark:text-slate-100">
                    {paySlipExpense.name}
                  </h4>
                  <div className="text-sm font-black text-purple-700 dark:text-purple-400 pt-1">
                    ยอดชำระตามดีล: ฿{(paySlipInstallmentNo 
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

                {/* Actual Paid Amount Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">
                    ยอดเงินที่ชำระจริง (บาท) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={actualPaidAmount}
                    onChange={(e) => setActualPaidAmount(e.target.value)}
                    className="w-full h-11 px-3 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg text-sm text-slate-800 focus:outline-none focus:border-accent dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 font-bold"
                    style={{ '--accent': accentColor } as React.CSSProperties}
                  />
                  {(() => {
                    const targetAmount = paySlipInstallmentNo !== null
                      ? (paySlipExpense.installments?.find(i => i.installmentNo === paySlipInstallmentNo)?.amount ?? paySlipExpense.amount)
                      : paySlipExpense.amount;
                    const parsedVal = parseFloat(actualPaidAmount);
                    if (isNaN(parsedVal) || parsedVal === targetAmount) return null;
                    
                    if (paySlipInstallmentNo !== null) {
                      if (paySlipInstallmentNo === paySlipExpense.totalInstallments) {
                        return (
                          <p className="text-[10.5px] font-semibold text-amber-600 dark:text-amber-400 mt-1">
                            💡 นี่คืองวดสุดท้ายแล้ว ยอดต่างจะไม่สามารถทดไปงวดถัดไปได้
                          </p>
                        );
                      }
                      
                      const diff = targetAmount - parsedVal;
                      return (
                        <p className="text-[10.5px] font-semibold text-purple-600 dark:text-purple-400 mt-1">
                          💡 ชำระ{parsedVal > targetAmount ? 'มากกว่า' : 'น้อยกว่า'}ที่กำหนด: ส่วนต่าง ฿{Math.abs(diff).toLocaleString('th-TH', { minimumFractionDigits: 2 })} จะถูก{diff < 0 ? 'ลบออก' : 'บวกเพิ่ม'}ในค่างวดเดือนถัดไป (งวดที่ {paySlipInstallmentNo + 1}) โดยอัตโนมัติ
                        </p>
                      );
                    }
                    return null;
                  })()}
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

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 dark:bg-slate-950 dark:border-slate-800 flex-shrink-0">
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm">
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
                {viewSlipPaidDate && (
                  <div className="text-[11px] text-emerald-600 font-bold">
                    วันที่ทำรายการชำระจริง: {viewSlipPaidDate}
                  </div>
                )}
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

      {/* Payment History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] dark:bg-slate-900 dark:border-slate-800 animate-in zoom-in duration-150 text-left">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 dark:bg-slate-950 dark:border-slate-800 flex-shrink-0">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-600" />
                  ประวัติการชำระเงินทั้งหมด
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-1">
                  รายการค่าใช้จ่ายและงวดผ่อนชำระที่บันทึกชำระเงินสำเร็จแล้ว
                </p>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-400 hover:text-slate-800 bg-white dark:bg-slate-900 dark:border-slate-800 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Content & Filters */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 dark:bg-slate-950/10 dark:border-slate-800/80 flex-shrink-0 space-y-4">
              {/* Responsive Filters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อรายการ..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-600 focus:outline-none dark:bg-slate-950 dark:border-slate-800 dark:text-slate-350"
                  />
                </div>

                {/* Category */}
                <select
                  value={historyCategory}
                  onChange={(e) => setHistoryCategory(e.target.value)}
                  className="h-9 px-3 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-600 focus:outline-none dark:bg-slate-950 dark:border-slate-800 dark:text-slate-350"
                >
                  <option value="">ทุกหมวดหมู่</option>
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Month */}
                <select
                  value={historyMonth}
                  onChange={(e) => setHistoryMonth(e.target.value)}
                  className="h-9 px-3 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-600 focus:outline-none dark:bg-slate-950 dark:border-slate-800 dark:text-slate-350"
                >
                  <option value="">ทุกเดือน</option>
                  {['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'].map((m, i) => (
                    <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                  ))}
                </select>

                {/* Year */}
                <select
                  value={historyYear}
                  onChange={(e) => setHistoryYear(e.target.value)}
                  className="h-9 px-3 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-600 focus:outline-none dark:bg-slate-950 dark:border-slate-800 dark:text-slate-350"
                >
                  <option value="">ทุกปี</option>
                  {Array.from({ length: 2057 - 2020 + 1 }, (_, k) => 2020 + k).map(y => (
                    <option key={y} value={String(y)}>{y + 543} (พ.ศ.)</option>
                  ))}
                </select>
              </div>

              {/* Action Toolbar Inside Modal */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="text-xs space-y-1">
                  <span className="font-bold text-slate-500 dark:text-slate-400">
                    แสดงผลลัพธ์: <span className="text-slate-800 dark:text-slate-200 font-extrabold">{filteredHistoryItems.length} รายการ</span>
                  </span>
                  <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    ยอดรวมชำระแล้ว: ฿{filteredHistoryItems.reduce((sum, item) => sum + item.amount, 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(historySearchQuery || historyCategory || historyMonth || historyYear) && (
                    <button
                      onClick={() => {
                        setHistorySearchQuery('');
                        setHistoryCategory('');
                        setHistoryMonth('');
                        setHistoryYear('');
                      }}
                      className="h-8 px-3 border border-slate-200 text-[11px] font-bold text-slate-500 rounded-lg hover:bg-white bg-transparent dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950 transition-all"
                    >
                      ล้างตัวกรอง
                    </button>
                  )}

                  {filteredHistoryItems.length > 0 && (
                    <>
                      <button
                        onClick={() => handleRevertAllFilteredHistory(filteredHistoryItems)}
                        className="h-8 px-3 border border-amber-200 hover:bg-amber-50 text-amber-600 rounded-lg text-[11px] font-extrabold transition-all dark:border-amber-900/50 dark:hover:bg-amber-950/20"
                      >
                        ยกเลิกการจ่ายทั้งหมดที่กรอง
                      </button>
                      <button
                        onClick={() => handleDeleteAllFilteredHistory(filteredHistoryItems)}
                        className="h-8 px-3 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg text-[11px] font-extrabold transition-all dark:border-rose-900/50 dark:hover:bg-rose-950/20"
                      >
                        ลบทั้งหมดที่กรองถาวร
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {filteredHistoryItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 italic">
                  ไม่พบประวัติการชำระเงินที่ตรงตามเงื่อนไขการค้นหา/ตัวกรอง 🍵
                </div>
              ) : (
                filteredHistoryItems
                  .slice()
                  .sort((a, b) => {
                    const dateA = a.paidDate || a.date;
                    const dateB = b.paidDate || b.date;
                    return dateB.localeCompare(dateA);
                  })
                  .map(item => {
                    const customCatStyle = catColors[item.cat] || catColors['📦 อื่นๆ'];
                    return (
                      <div
                        key={item.id}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-left dark:bg-slate-950 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                      >
                        {/* Info Block */}
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full border ${customCatStyle}`}>
                              {item.cat}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              กำหนดเดิม: {item.dueDate || item.date}
                            </span>
                            {item.paidDate && (
                              <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                                จ่ายเมื่อ: {item.paidDate}
                              </span>
                            )}
                          </div>
                          
                          <p className="font-extrabold text-sm text-slate-850 dark:text-slate-100">
                            {item.name}
                          </p>
                          
                          {item.note && (
                            <p className="text-[11px] text-slate-500 italic max-w-full truncate">
                              บันทึก: {item.note}
                            </p>
                          )}
                        </div>

                        {/* Cost & Action Block */}
                        <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 dark:border-slate-800/60 w-full md:w-auto">
                          {/* Amount */}
                          <div className="text-right">
                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                              ฿{item.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5">
                            {item.slipBase64 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setViewSlipTitle(item.name);
                                  setViewSlipBase64(item.slipBase64 || '');
                                  setViewSlipAmount(item.amount);
                                  setViewSlipDate(item.dueDate || item.date);
                                  setViewSlipPaidDate(item.paidDate || '');
                                  setIsViewSlipModalOpen(true);
                                }}
                                className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/50 rounded-lg text-slate-600 text-[10.5px] font-bold flex items-center gap-1 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-750"
                                title="ดูสลิป"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                สลิป
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRevertPayment(item)}
                              className="h-8 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/50 rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition-all dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-950/40"
                              title="ยกเลิกสถานะชำระเงิน กลับเป็นค้างจ่าย"
                            >
                              ยกเลิกจ่าย
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteHistoryItem(item)}
                              className="h-8 w-8 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 rounded-lg flex items-center justify-center transition-all dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-950/40"
                              title="ลบรายการถาวร"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end dark:bg-slate-950 dark:border-slate-800 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="h-10 px-5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
              >
                ปิดหน้าต่างประวัติ
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
