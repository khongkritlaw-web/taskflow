import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, 
  Receipt, 
  FileText, 
  Plus, 
  Trash2, 
  Eye, 
  Save, 
  RotateCcw, 
  Sparkles, 
  Search, 
  Copy, 
  CheckCircle2, 
  Building2, 
  UserCheck, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  FileSpreadsheet, 
  X, 
  Check, 
  Upload, 
  Share2, 
  Clock, 
  AlertCircle,
  FileCheck,
  ChevronDown,
  Filter,
  ArrowRight,
  Download
} from 'lucide-react';
import { ReceiptDoc, ReceiptItem, AppSettings, Task, Expense } from '../types';

interface ReceiptModuleProps {
  accentColor: string;
  settings: AppSettings;
  sessionUser: any;
  tasks?: Task[];
  expenses?: Expense[];
}

// Thai Baht Text Conversion Utility
export function bahtText(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return 'ศูนย์บาทถ้วน';
  if (num === 0) return 'ศูนย์บาทถ้วน';

  const numbers = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  const convertGroup = (nStr: string): string => {
    let res = '';
    const len = nStr.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(nStr[i], 10);
      const pos = len - 1 - i;
      if (digit !== 0) {
        if (pos === 1 && digit === 1) {
          res += 'สิบ';
        } else if (pos === 1 && digit === 2) {
          res += 'ยี่สิบ';
        } else if (pos === 0 && digit === 1 && len > 1) {
          res += 'เอ็ด';
        } else {
          res += numbers[digit] + units[pos];
        }
      }
    }
    return res;
  };

  const split = num.toFixed(2).split('.');
  let integerPart = split[0];
  const decimalPart = split[1];

  let isNegative = false;
  if (integerPart.startsWith('-')) {
    isNegative = true;
    integerPart = integerPart.substring(1);
  }

  let bahtStr = '';
  if (parseInt(integerPart, 10) === 0) {
    bahtStr = 'ศูนย์บาท';
  } else {
    const groups: string[] = [];
    let temp = integerPart;
    while (temp.length > 0) {
      if (temp.length > 6) {
        groups.unshift(temp.slice(-6));
        temp = temp.slice(0, -6);
      } else {
        groups.unshift(temp);
        temp = '';
      }
    }

    for (let i = 0; i < groups.length; i++) {
      const groupText = convertGroup(groups[i]);
      bahtStr += groupText;
      if (i < groups.length - 1) {
        bahtStr += 'ล้าน';
      }
    }
    bahtStr += 'บาท';
  }

  let satangStr = '';
  const satangVal = parseInt(decimalPart, 10);
  if (satangVal === 0) {
    satangStr = 'ถ้วน';
  } else {
    satangStr = convertGroup(decimalPart) + 'สตางค์';
  }

  return (isNegative ? 'ลบ' : '') + bahtStr + satangStr;
}

const STORAGE_KEY = 'dekasuite_receipts_history_v1';

export function ReceiptModule({ accentColor, settings, sessionUser, tasks = [], expenses = [] }: ReceiptModuleProps) {
  const [receipts, setReceipts] = useState<ReceiptDoc[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [activeSubTab, setActiveSubTab] = useState<'create' | 'history'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedReceiptForPreview, setSelectedReceiptForPreview] = useState<ReceiptDoc | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [themeStyle, setThemeStyle] = useState<'navy' | 'slate' | 'emerald' | 'monochrome'>('navy');

  // Form States
  const [docType, setDocType] = useState<'receipt' | 'tax_invoice' | 'invoice' | 'quotation' | 'temp_receipt'>('receipt');
  const [receiptNo, setReceiptNo] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [refNo, setRefNo] = useState('');

  // Issuer Info
  const [issuerName, setIssuerName] = useState(settings.appName || 'สำนักงานกฎหมาย และที่ปรึกษา');
  const [issuerTaxId, setIssuerTaxId] = useState('0105560000000');
  const [issuerBranch, setIssuerBranch] = useState('สำนักงานใหญ่');
  const [issuerAddress, setIssuerAddress] = useState('123/45 ถนนรัชดาภิเษก แขวงจอมพล เขตจตุจักร กรุงเทพมหานคร 10900');
  const [issuerPhone, setIssuerPhone] = useState('02-123-4567');
  const [issuerEmail, setIssuerEmail] = useState(settings.emailRecipient || 'contact@firm.com');
  const [issuerLogoUrl, setIssuerLogoUrl] = useState(settings.appLogoUrl || '');

  // Customer Info
  const [customerName, setCustomerName] = useState('');
  const [customerTaxId, setCustomerTaxId] = useState('');
  const [customerBranch, setCustomerBranch] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Items
  const [items, setItems] = useState<ReceiptItem[]>([
    { id: '1', description: 'ค่าบริการทางกฎหมาย และค่าตอบแทนวิชาชีพ', quantity: 1, unit: 'งวด', unitPrice: 15000, amount: 15000 }
  ]);

  // Tax & Discount
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [vatType, setVatType] = useState<'no_vat' | 'vat_7_add' | 'vat_7_included'>('no_vat');
  const [withholdingTaxPercent, setWithholdingTaxPercent] = useState<number>(0);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'cheque' | 'credit' | 'qr'>('transfer');
  const [bankName, setBankName] = useState('ธนาคารกสิกรไทย (KBANK)');
  const [bankAccountNo, setBankAccountNo] = useState('123-4-56789-0');
  const [bankAccountName, setBankAccountName] = useState('สำนักงานกฎหมาย');
  const [chequeNo, setChequeNo] = useState('');
  const [chequeDate, setChequeDate] = useState('');

  // Signatures & Notes
  const [notes, setNotes] = useState('ขอบคุณที่ใช้บริการ / กรุณาเก็บเอกสารนี้ไว้เป็นหลักฐาน');
  const [collectorName, setCollectorName] = useState(sessionUser.userId || 'ผู้รับเงิน');
  const [approverName, setApproverName] = useState('ผู้มีอำนาจลงนาม');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Generate Auto Document Number
  const generateAutoNo = (type: string) => {
    const prefixMap: Record<string, string> = {
      receipt: 'REC',
      tax_invoice: 'TAX',
      invoice: 'INV',
      quotation: 'QUO',
      temp_receipt: 'T-REC'
    };
    const prefix = prefixMap[type] || 'REC';
    const ym = new Date().toISOString().slice(0, 7).replace('-', '');
    const count = receipts.length + 1;
    const seq = String(count).padStart(3, '0');
    return `${prefix}-${ym}-${seq}`;
  };

  useEffect(() => {
    if (!receiptNo || editingId === null) {
      setReceiptNo(generateAutoNo(docType));
    }
  }, [docType]);

  // Save Receipts to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
    } catch (e) {}
  }, [receipts]);

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  let discountAmount = 0;
  if (discountType === 'percent') {
    discountAmount = (subtotal * (discountValue || 0)) / 100;
  } else {
    discountAmount = discountValue || 0;
  }

  const priceAfterDiscount = Math.max(0, subtotal - discountAmount);

  let vatAmount = 0;
  let basePriceForVat = priceAfterDiscount;

  if (vatType === 'vat_7_add') {
    vatAmount = priceAfterDiscount * 0.07;
  } else if (vatType === 'vat_7_included') {
    vatAmount = priceAfterDiscount - (priceAfterDiscount / 1.07);
    basePriceForVat = priceAfterDiscount - vatAmount;
  }

  const withholdingTaxAmount = (priceAfterDiscount * (withholdingTaxPercent || 0)) / 100;

  const grandTotal = vatType === 'vat_7_add'
    ? priceAfterDiscount + vatAmount - withholdingTaxAmount
    : priceAfterDiscount - withholdingTaxAmount;

  const grandTotalTextThai = bahtText(grandTotal);

  // Item Handler
  const handleAddItem = () => {
    const newItem: ReceiptItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit: 'รายการ',
      unitPrice: 0,
      amount: 0
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof ReceiptItem, val: any) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: val };
      if (field === 'quantity' || field === 'unitPrice') {
        const q = field === 'quantity' ? Number(val) || 0 : item.quantity;
        const p = field === 'unitPrice' ? Number(val) || 0 : item.unitPrice;
        updated.amount = q * p;
      }
      return updated;
    }));
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter(i => i.id !== id));
  };

  // Quick Preset Templates
  const handleApplyPreset = (preset: 'legal_service' | 'court_fee' | 'retainer' | 'general') => {
    if (preset === 'legal_service') {
      setItems([
        { id: '1', description: 'ค่าว่าความและค่าบริการทางกฎหมาย (คดีแพ่ง/อาญา)', quantity: 1, unit: 'งวด', unitPrice: 30000, amount: 30000 },
        { id: '2', description: 'ค่าจัดทำคำร้อง คำแถลง และร่างนิติกรรมสัญญา', quantity: 1, unit: 'ชุด', unitPrice: 5000, amount: 5000 }
      ]);
      setNotes('ชำระค่างวดตามสัญญาว่าจ้างว่าความ / ขอขอบคุณที่ใช้บริการ');
    } else if (preset === 'court_fee') {
      setItems([
        { id: '1', description: 'ค่าธรรมเนียมศาล / ค่า ขึ้นศาลตามใบเสร็จศาล', quantity: 1, unit: 'รายการ', unitPrice: 4500, amount: 4500 },
        { id: '2', description: 'ค่าพาหนะและค่าใช้จ่ายในการเดินทางดำเนินคดี', quantity: 1, unit: 'ครั้ง', unitPrice: 1500, amount: 1500 }
      ]);
      setNotes('เป็นค่าธรรมเนียมที่จ่ายจริงแก่ศาลและหน่วยงานราชการ');
    } else if (preset === 'retainer') {
      setItems([
        { id: '1', description: 'ค่าบริการที่ปรึกษากฎหมายประจำเดือน (Retainer Fee)', quantity: 1, unit: 'เดือน', unitPrice: 10000, amount: 10000 }
      ]);
      setNotes('ค่าที่ปรึกษากฎหมายประจำเดือนประจำงวด');
    } else {
      setItems([
        { id: '1', description: 'ค่าสินค้าและบริการทั่วไป', quantity: 1, unit: 'รายการ', unitPrice: 1000, amount: 1000 }
      ]);
    }
  };

  // Import from Tasks or Expenses
  const handleImportFromExpense = (exp: Expense) => {
    setCustomerName(exp.userId || 'ลูกค้า');
    setItems([
      { id: Date.now().toString(), description: `${exp.name} (${exp.cat})`, quantity: 1, unit: 'รายการ', unitPrice: exp.amount, amount: exp.amount }
    ]);
    setRefNo(`EXP-${exp.id}`);
  };

  const handleImportFromTask = (task: Task) => {
    setItems([
      { id: Date.now().toString(), description: `ค่าบริการดำเนินงาน: ${task.title} (${task.category})`, quantity: 1, unit: 'เคส', unitPrice: 5000, amount: 5000 }
    ]);
    setRefNo(`TASK-${task.id}`);
  };

  // Save / Update Receipt
  const handleSaveReceipt = () => {
    if (!customerName.trim()) {
      alert('กรุณากรอกชื่อผู้รับบริการ / ลูกค้า');
      return;
    }

    const doc: ReceiptDoc = {
      id: editingId || Date.now().toString(),
      receiptNo: receiptNo || generateAutoNo(docType),
      docType,
      issueDate,
      dueDate,
      refNo,
      issuerName,
      issuerTaxId,
      issuerBranch,
      issuerAddress,
      issuerPhone,
      issuerEmail,
      issuerLogoUrl,
      customerName,
      customerTaxId,
      customerBranch,
      customerAddress,
      customerPhone,
      customerEmail,
      items,
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      vatType,
      vatAmount,
      withholdingTaxPercent,
      withholdingTaxAmount,
      grandTotal,
      grandTotalTextThai,
      paymentMethod,
      bankName,
      bankAccountNo,
      bankAccountName,
      chequeNo,
      chequeDate,
      notes,
      collectorName,
      approverName,
      userId: sessionUser.userId || 'admin',
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    if (editingId) {
      setReceipts(receipts.map(r => r.id === editingId ? doc : r));
    } else {
      setReceipts([doc, ...receipts]);
    }

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);

    // Open preview modal
    setSelectedReceiptForPreview(doc);
  };

  // Edit Existing Receipt
  const handleEditReceipt = (doc: ReceiptDoc) => {
    setEditingId(doc.id);
    setDocType(doc.docType);
    setReceiptNo(doc.receiptNo);
    setIssueDate(doc.issueDate);
    setDueDate(doc.dueDate || '');
    setRefNo(doc.refNo || '');

    setIssuerName(doc.issuerName);
    setIssuerTaxId(doc.issuerTaxId || '');
    setIssuerBranch(doc.issuerBranch || '');
    setIssuerAddress(doc.issuerAddress || '');
    setIssuerPhone(doc.issuerPhone || '');
    setIssuerEmail(doc.issuerEmail || '');
    setIssuerLogoUrl(doc.issuerLogoUrl || '');

    setCustomerName(doc.customerName);
    setCustomerTaxId(doc.customerTaxId || '');
    setCustomerBranch(doc.customerBranch || '');
    setCustomerAddress(doc.customerAddress || '');
    setCustomerPhone(doc.customerPhone || '');
    setCustomerEmail(doc.customerEmail || '');

    setItems(doc.items || []);
    setDiscountType(doc.discountType || 'flat');
    setDiscountValue(doc.discountValue || 0);
    setVatType(doc.vatType || 'no_vat');
    setWithholdingTaxPercent(doc.withholdingTaxPercent || 0);

    setPaymentMethod(doc.paymentMethod);
    setBankName(doc.bankName || '');
    setBankAccountNo(doc.bankAccountNo || '');
    setBankAccountName(doc.bankAccountName || '');
    setChequeNo(doc.chequeNo || '');
    setChequeDate(doc.chequeDate || '');

    setNotes(doc.notes || '');
    setCollectorName(doc.collectorName || '');
    setApproverName(doc.approverName || '');

    setActiveSubTab('create');
  };

  // Reset Form
  const handleResetForm = () => {
    setEditingId(null);
    setReceiptNo(generateAutoNo(docType));
    setIssueDate(new Date().toISOString().slice(0, 10));
    setDueDate('');
    setRefNo('');
    setCustomerName('');
    setCustomerTaxId('');
    setCustomerBranch('');
    setCustomerAddress('');
    setCustomerPhone('');
    setCustomerEmail('');
    setItems([{ id: '1', description: 'ค่าบริการทางกฎหมาย', quantity: 1, unit: 'งวด', unitPrice: 10000, amount: 10000 }]);
    setDiscountValue(0);
    setVatType('no_vat');
    setWithholdingTaxPercent(0);
    setNotes('ขอบคุณที่ใช้บริการ / กรุณาเก็บเอกสารนี้ไว้เป็นหลักฐาน');
  };

  // Void/Delete Receipt
  const handleVoidReceipt = (id: string) => {
    if (confirm('คุณต้องการยกเลิก (Void) ใบเสร็จรับเงินรายการนี้ใช่หรือไม่?')) {
      setReceipts(receipts.map(r => r.id === id ? { ...r, status: 'void' } : r));
    }
  };

  const handleDeleteReceipt = (id: string) => {
    if (confirm('คุณต้องการลบข้อมูลใบเสร็จนี้ถาวรใช่หรือไม่?')) {
      setReceipts(receipts.filter(r => r.id !== id));
    }
  };

  // Print Document Trigger
  const handlePrint = (doc: ReceiptDoc) => {
    setSelectedReceiptForPreview(doc);
    setShowPrintModal(true);
    setTimeout(() => {
      window.print();
    }, 400);
  };

  const getDocTypeName = (type: string) => {
    switch (type) {
      case 'receipt': return 'ใบเสร็จรับเงิน (RECEIPT)';
      case 'tax_invoice': return 'ใบเสร็จรับเงิน / ใบกำกับภาษี (RECEIPT / TAX INVOICE)';
      case 'invoice': return 'ใบแจ้งหนี้ / ใบวางบิล (INVOICE)';
      case 'quotation': return 'ใบเสนอราคา (QUOTATION)';
      case 'temp_receipt': return 'ใบเสร็จรับเงินชั่วคราว (TEMPORARY RECEIPT)';
      default: return 'ใบเสร็จรับเงิน';
    }
  };

  const filteredReceipts = receipts.filter(r => {
    const matchesSearch = !searchTerm || 
      r.receiptNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.issuerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || r.docType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white border border-slate-800 shadow-xl relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" />
                ระบบออกเอกสารการเงิน
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                A4 Printable
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
              <span>ออกใบเสร็จรับเงิน / ใบกำกับภาษี</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              ออกใบเสร็จรับเงิน, ใบเสนอราคา, ใบแจ้งหนี้ และใบกำกับภาษีมาตรฐาน ปรับแต่งข้อมูลผู้รับ คำนวณ VAT และภาษีหัก ณ ที่จ่ายอัตโนมัติ สั่งพิมพ์ได้ทันที
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { handleResetForm(); setActiveSubTab('create'); }}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'create'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>สร้างใบเสร็จใหม่</span>
            </button>

            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>ประวัติใบเสร็จ ({receipts.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Section: Create or History */}
      {activeSubTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          {/* Left / Main Form Column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Quick Templates Bar */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">แม่แบบรายการด่วน:</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('legal_service')}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold hover:bg-indigo-100 transition-all cursor-pointer"
                >
                  ⚖️ ค่าว่าความ/กฎหมาย
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('court_fee')}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold hover:bg-emerald-100 transition-all cursor-pointer"
                >
                  🏛️ ค่าธรรมเนียมศาล
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('retainer')}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px] font-bold hover:bg-amber-100 transition-all cursor-pointer"
                >
                  💼 ค่าที่ปรึกษารายเดือน
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('general')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-200 transition-all cursor-pointer"
                >
                  📦 บริการทั่วไป
                </button>
              </div>
            </div>

            {/* Document Type & Config */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <FileCheck className="w-4 h-4 text-indigo-500" />
                <span>1. ข้อมูลหัวเอกสารและเลขที่</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">ประเภทเอกสารที่ต้องการออก</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="receipt">🧾 ใบเสร็จรับเงิน (RECEIPT)</option>
                    <option value="tax_invoice">🏢 ใบเสร็จรับเงิน / ใบกำกับภาษี (RECEIPT / TAX INVOICE)</option>
                    <option value="invoice">📋 ใบแจ้งหนี้ / ใบวางบิล (INVOICE / BILL)</option>
                    <option value="quotation">💼 ใบเสนอราคา (QUOTATION)</option>
                    <option value="temp_receipt">⏳ ใบเสร็จรับเงินชั่วคราว (TEMPORARY RECEIPT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">เลขที่เอกสาร (Document No.)</label>
                  <input
                    type="text"
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                    placeholder="REC-202608-001"
                    className="w-full h-10 px-3 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">วันที่ออกเอกสาร</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">กำหนดชำระเงิน (ถ้ามี)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">เลขที่อ้างอิง / คดี / ใบสั่งซื้อ</label>
                  <input
                    type="text"
                    value={refNo}
                    onChange={(e) => setRefNo(e.target.value)}
                    placeholder="อ้างอิงคดีดำที่ 123/2569"
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Issuer & Customer Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Issuer Info */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Building2 className="w-4 h-4 text-emerald-500" />
                  <span>2. ข้อมูลผู้ออกใบเสร็จ (ผู้ขาย/สำนักงาน)</span>
                </h3>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ชื่อสำนักงาน / บริษัท / ผู้ออก</label>
                  <input
                    type="text"
                    value={issuerName}
                    onChange={(e) => setIssuerName(e.target.value)}
                    className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">เลขประจำตัวผู้เสียภาษี</label>
                    <input
                      type="text"
                      value={issuerTaxId}
                      onChange={(e) => setIssuerTaxId(e.target.value)}
                      className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">สาขา</label>
                    <input
                      type="text"
                      value={issuerBranch}
                      onChange={(e) => setIssuerBranch(e.target.value)}
                      className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ที่อยู่สถานประกอบการ</label>
                  <textarea
                    rows={2}
                    value={issuerAddress}
                    onChange={(e) => setIssuerAddress(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">เบอร์โทรศัพท์</label>
                    <input
                      type="text"
                      value={issuerPhone}
                      onChange={(e) => setIssuerPhone(e.target.value)}
                      className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">อีเมล</label>
                    <input
                      type="text"
                      value={issuerEmail}
                      onChange={(e) => setIssuerEmail(e.target.value)}
                      className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <UserCheck className="w-4 h-4 text-cyan-500" />
                  <span>3. ข้อมูลผู้ว่าจ้าง / ลูกค้า (ผู้ชำระเงิน)</span>
                </h3>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ชื่อลูกค้า / บริษัทผู้รับบริการ *</label>
                  <input
                    type="text"
                    required
                    placeholder="บริษัท เอสซีจี คอร์ปอเรชั่น จำกัด / นายสมชาย ใจดี"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">เลขประจำตัวผู้เสียภาษี/บัตร</label>
                    <input
                      type="text"
                      placeholder="13 หลัก"
                      value={customerTaxId}
                      onChange={(e) => setCustomerTaxId(e.target.value)}
                      className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">สาขา</label>
                    <input
                      type="text"
                      placeholder="สำนักงานใหญ่ / สาขา 00001"
                      value={customerBranch}
                      onChange={(e) => setCustomerBranch(e.target.value)}
                      className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ที่อยู่สำหรับออกใบเสร็จ</label>
                  <textarea
                    rows={2}
                    placeholder="ที่อยู่สำหรับลงในใบกำกับภาษี..."
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">เบอร์โทรศัพท์</label>
                    <input
                      type="text"
                      placeholder="081-234-5678"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">อีเมล</label>
                    <input
                      type="text"
                      placeholder="client@email.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-500" />
                  <span>4. รายการสินค้า / ค่าบริการ / ค่าใช้จ่าย</span>
                </h3>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มแถวรายการ</span>
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div 
                    key={item.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-1 text-center font-mono text-xs font-bold text-slate-400">
                      {idx + 1}
                    </div>

                    <div className="col-span-11 sm:col-span-5">
                      <input
                        type="text"
                        placeholder="รายละเอียดสินค้าหรือค่าบริการ..."
                        value={item.description}
                        onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                        className="w-full h-9 px-3 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="จำนวน"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                        className="w-full h-9 px-2 text-center text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div className="col-span-3 sm:col-span-1">
                      <input
                        type="text"
                        placeholder="หน่วย"
                        value={item.unit}
                        onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                        className="w-full h-9 px-2 text-center text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="ราคา/หน่วย"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateItem(item.id, 'unitPrice', e.target.value)}
                        className="w-full h-9 px-2 text-right text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div className="col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={items.length <= 1}
                        className="p-2 text-slate-400 hover:text-rose-500 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tax & Calculation Settings */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">ส่วนลดพิเศษ (Discount)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="w-full h-9 px-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                    />
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="h-9 px-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold"
                    >
                      <option value="flat">บาท</option>
                      <option value="percent">%</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">ภาษีมูลค่าเพิ่ม (VAT 7%)</label>
                  <select
                    value={vatType}
                    onChange={(e) => setVatType(e.target.value as any)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold"
                  >
                    <option value="no_vat">ไม่มี VAT (No VAT)</option>
                    <option value="vat_7_add">+ VAT 7% (แยกจากราคาสินค้า)</option>
                    <option value="vat_7_included">รวม VAT 7% แล้ว (In-VAT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">ภาษีหัก ณ ที่จ่าย (Withholding Tax)</label>
                  <select
                    value={withholdingTaxPercent}
                    onChange={(e) => setWithholdingTaxPercent(Number(e.target.value))}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold"
                  >
                    <option value={0}>ไม่มีการหัก ณ ที่จ่าย (0%)</option>
                    <option value={1}>หัก ณ ที่จ่าย 1% (ขนส่ง/บริการเฉพาะ)</option>
                    <option value={3}>หัก ณ ที่จ่าย 3% (ค่าบริการวิชาชีพ/ว่าความ)</option>
                    <option value={5}>หัก ณ ที่จ่าย 5% (ค่าเช่า/รางวัล)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Method & Bank Info */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>5. วิธีการชำระเงิน และหมายเหตุ</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'transfer', label: '🏦 โอนผ่านธนาคาร' },
                  { id: 'cash', label: '💵 เงินสด' },
                  { id: 'qr', label: '📱 สแกน QR' },
                  { id: 'cheque', label: '📜 เช็คสั่งจ่าย' },
                  { id: 'credit', label: '💳 บัตรเครดิต' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`h-10 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      paymentMethod === m.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {paymentMethod === 'transfer' && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ธนาคาร</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">เลขที่บัญชี</label>
                    <input
                      type="text"
                      value={bankAccountNo}
                      onChange={(e) => setBankAccountNo(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ชื่อบัญชี</label>
                    <input
                      type="text"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">หมายเหตุท้ายใบเสร็จ / เงื่อนไขชำระเงิน</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">ชื่อผู้รับเงิน / ผู้สร้างเอกสาร</label>
                  <input
                    type="text"
                    value={collectorName}
                    onChange={(e) => setCollectorName(e.target.value)}
                    className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">ชื่อผู้มีอำนาจลงนาม / อนุมัติ</label>
                  <input
                    type="text"
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Save & Actions */}
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleResetForm}
                className="h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                ล้างฟอร์ม
              </button>

              <div className="flex items-center gap-3">
                {saveSuccessMsg && (
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> บันทึกสำเร็จ!
                  </span>
                )}
                
                <button
                  type="button"
                  onClick={handleSaveReceipt}
                  className="h-12 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกและพรีวิวเอกสาร A4</span>
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Live Summary Calculation Box */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white shadow-xl space-y-5 sticky top-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-black uppercase text-indigo-400 tracking-wider">สรุปยอดรวมสุทธิ</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                  {docType.toUpperCase()}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>รวมเป็นเงิน (Subtotal):</span>
                  <span className="font-mono font-bold text-white">{subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>หัก ส่วนลดพิเศษ:</span>
                    <span className="font-mono font-bold">-{discountAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
                  </div>
                )}

                {vatAmount > 0 && (
                  <div className="flex justify-between text-indigo-300">
                    <span>ภาษีมูลค่าเพิ่ม VAT (7%):</span>
                    <span className="font-mono font-bold">+{vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
                  </div>
                )}

                {withholdingTaxAmount > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>หัก ณ ที่จ่าย ({withholdingTaxPercent}%):</span>
                    <span className="font-mono font-bold">-{withholdingTaxAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-800 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">จำนวนเงินรวมทั้งสิ้น (Grand Total)</span>
                  <span className="text-2xl font-black font-mono text-emerald-400">
                    {grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                  </span>
                  <span className="text-[11px] font-bold text-slate-300 bg-slate-800/80 p-2 rounded-lg border border-slate-700/50 mt-1">
                    ({grandTotalTextThai})
                  </span>
                </div>
              </div>

              {/* Quick Preview Button */}
              <button
                type="button"
                onClick={handleSaveReceipt}
                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>เปิดดูตัวอย่างก่อนพิมพ์</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History SubTab */}
      {activeSubTab === 'history' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-5 text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">ประวัติเอกสารใบเสร็จที่เคยออก</h3>
                <p className="text-[11px] text-slate-400">เรียกดู พิมพ์ซ้ำ หรือแก้ไขใบเสร็จรับเงินย้อนหลัง</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาเลขที่, ชื่อลูกค้า..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-800 dark:text-slate-200"
              >
                <option value="all">ทุกประเภทเอกสาร</option>
                <option value="receipt">ใบเสร็จรับเงิน</option>
                <option value="tax_invoice">ใบกำกับภาษี</option>
                <option value="invoice">ใบแจ้งหนี้</option>
                <option value="quotation">ใบเสนอราคา</option>
              </select>
            </div>
          </div>

          {filteredReceipts.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-500">ยังไม่มีรายการใบเสร็จที่บันทึกไว้</p>
              <button
                type="button"
                onClick={() => setActiveSubTab('create')}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold transition-all cursor-pointer"
              >
                + ออกใบเสร็จใบแรก
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-left text-slate-600 dark:text-slate-400">
                <thead className="text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <tr>
                    <th className="px-4 py-3">เลขที่เอกสาร</th>
                    <th className="px-4 py-3">ประเภท</th>
                    <th className="px-4 py-3">ผู้รับบริการ / ลูกค้า</th>
                    <th className="px-4 py-3">วันที่ออก</th>
                    <th className="px-4 py-3">ยอดรวมสุทธิ</th>
                    <th className="px-4 py-3">สถานะ</th>
                    <th className="px-4 py-3 text-center">จัดการ / พิมพ์</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredReceipts.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-all">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{r.receiptNo}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{getDocTypeName(r.docType).split('(')[0]}</td>
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{r.customerName}</td>
                      <td className="px-4 py-3 font-mono">{r.issueDate}</td>
                      <td className="px-4 py-3 font-mono font-black text-emerald-500">{r.grandTotal?.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          r.status === 'void' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {r.status === 'void' ? 'ยกเลิก (Void)' : 'สมบูรณ์'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handlePrint(r)}
                            title="พิมพ์ / ดู PDF"
                            className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEditReceipt(r)}
                            title="แก้ไข"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleVoidReceipt(r.id)}
                            title="ยกเลิกใบเสร็จ"
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500 hover:bg-rose-100 transition-all cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteReceipt(r.id)}
                            title="ลบ"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* A4 PRINT & PREVIEW MODAL */}
      <AnimatePresence>
        {selectedReceiptForPreview && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-left shadow-2xl"
            >
              {/* Modal Top Control Bar */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Printer className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-extrabold text-white">ตัวอย่างเอกสารขนาด A4 ก่อนสั่งพิมพ์</h3>
                    <p className="text-[10px] text-slate-400 font-mono">เลขที่: {selectedReceiptForPreview.receiptNo}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePrint(selectedReceiptForPreview)}
                    className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>สั่งพิมพ์ / บันทึก PDF (A4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedReceiptForPreview(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable A4 Document Sheet View */}
              <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-800/50 flex justify-center">
                <div 
                  id="printable-a4-receipt"
                  className="bg-white text-slate-900 p-8 sm:p-12 rounded-sm shadow-2xl w-full max-w-[210mm] min-h-[297mm] text-xs space-y-6 border border-slate-300 relative font-sans leading-normal"
                  style={{ color: '#0f172a' }}
                >
                  {/* Header: Issuer Logo & Doc Title */}
                  <div className="flex justify-between items-start gap-4 pb-6 border-b-2 border-slate-900">
                    <div className="space-y-1 max-w-md">
                      <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
                        {selectedReceiptForPreview.issuerName}
                      </h2>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {selectedReceiptForPreview.issuerAddress}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-600 font-medium pt-1">
                        <span>เลขภาษี: {selectedReceiptForPreview.issuerTaxId || '-'}</span>
                        <span>({selectedReceiptForPreview.issuerBranch || 'สำนักงานใหญ่'})</span>
                        <span>โทร: {selectedReceiptForPreview.issuerPhone}</span>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="inline-block px-4 py-2 rounded border-2 border-slate-900 bg-slate-50 text-slate-900 font-black text-sm uppercase tracking-wider">
                        {getDocTypeName(selectedReceiptForPreview.docType).split('(')[0]}
                      </div>
                      <div className="text-[11px] font-mono space-y-0.5 text-slate-700">
                        <p><span className="font-bold">เลขที่:</span> {selectedReceiptForPreview.receiptNo}</p>
                        <p><span className="font-bold">วันที่:</span> {selectedReceiptForPreview.issueDate}</p>
                        {selectedReceiptForPreview.refNo && <p><span className="font-bold">อ้างอิง:</span> {selectedReceiptForPreview.refNo}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Customer Box */}
                  <div className="p-4 rounded border border-slate-300 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">ชื่อผู้ว่าจ้าง / ลูกค้า (Customer):</span>
                      <p className="font-bold text-sm text-slate-900">{selectedReceiptForPreview.customerName}</p>
                      <p className="text-[11px] text-slate-600">{selectedReceiptForPreview.customerAddress || 'ไม่ระบุที่อยู่'}</p>
                    </div>

                    <div className="space-y-1 text-right sm:text-left sm:pl-4 sm:border-l sm:border-slate-200">
                      <p className="text-[11px] text-slate-700"><span className="font-bold">เลขผู้เสียภาษี:</span> {selectedReceiptForPreview.customerTaxId || '-'}</p>
                      <p className="text-[11px] text-slate-700"><span className="font-bold">โทรศัพท์:</span> {selectedReceiptForPreview.customerPhone || '-'}</p>
                      <p className="text-[11px] text-slate-700"><span className="font-bold">อีเมล:</span> {selectedReceiptForPreview.customerEmail || '-'}</p>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-y-2 border-slate-900 bg-slate-100 text-slate-900 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3 text-center w-12">ลำดับ</th>
                        <th className="py-2.5 px-3 text-left">รายการ (Description)</th>
                        <th className="py-2.5 px-3 text-center w-16">จำนวน</th>
                        <th className="py-2.5 px-3 text-center w-16">หน่วย</th>
                        <th className="py-2.5 px-3 text-right w-24">ราคา/หน่วย</th>
                        <th className="py-2.5 px-3 text-right w-28">จำนวนเงิน (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedReceiptForPreview.items.map((item, idx) => (
                        <tr key={idx} className="text-slate-800">
                          <td className="py-3 px-3 text-center font-mono">{idx + 1}</td>
                          <td className="py-3 px-3 font-semibold">{item.description}</td>
                          <td className="py-3 px-3 text-center font-mono">{item.quantity}</td>
                          <td className="py-3 px-3 text-center">{item.unit}</td>
                          <td className="py-3 px-3 text-right font-mono">{item.unitPrice?.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                          <td className="py-3 px-3 text-right font-mono font-bold">{item.amount?.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Calculations & Total */}
                  <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-12 gap-4">
                    <div className="col-span-7 space-y-3">
                      <div className="p-3 rounded border border-slate-200 bg-slate-50 text-[11px]">
                        <span className="font-bold text-slate-700 block mb-1">จำนวนเงินตัวหนังสือ:</span>
                        <p className="font-black text-slate-900 text-xs">({selectedReceiptForPreview.grandTotalTextThai})</p>
                      </div>

                      <div className="text-[10px] text-slate-600 space-y-1">
                        <p><span className="font-bold">วิธีการชำระเงิน:</span> {selectedReceiptForPreview.paymentMethod === 'transfer' ? `โอนเงินผ่านธนาคาร ${selectedReceiptForPreview.bankName} เลขบัญชี ${selectedReceiptForPreview.bankAccountNo}` : selectedReceiptForPreview.paymentMethod}</p>
                        <p><span className="font-bold">หมายเหตุ:</span> {selectedReceiptForPreview.notes}</p>
                      </div>
                    </div>

                    <div className="col-span-5 space-y-1.5 text-right font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-sans">รวมเงิน (Subtotal):</span>
                        <span className="font-bold">{selectedReceiptForPreview.subtotal?.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
                      </div>

                      {selectedReceiptForPreview.discountAmount ? selectedReceiptForPreview.discountAmount > 0 && (
                        <div className="flex justify-between text-rose-600">
                          <span className="font-sans">หัก ส่วนลด:</span>
                          <span>-{selectedReceiptForPreview.discountAmount?.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
                        </div>
                      ) : null}

                      {selectedReceiptForPreview.vatAmount ? selectedReceiptForPreview.vatAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-600 font-sans">ภาษีมูลค่าเพิ่ม 7%:</span>
                          <span>+{selectedReceiptForPreview.vatAmount?.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
                        </div>
                      ) : null}

                      {selectedReceiptForPreview.withholdingTaxAmount ? selectedReceiptForPreview.withholdingTaxAmount > 0 && (
                        <div className="flex justify-between text-rose-600">
                          <span className="font-sans">หัก ณ ที่จ่าย ({selectedReceiptForPreview.withholdingTaxPercent}%):</span>
                          <span>-{selectedReceiptForPreview.withholdingTaxAmount?.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
                        </div>
                      ) : null}

                      <div className="pt-2 border-t-2 border-slate-900 flex justify-between font-black text-sm text-slate-900">
                        <span className="font-sans">ยอดสุทธิ (Grand Total):</span>
                        <span>{selectedReceiptForPreview.grandTotal?.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
                      </div>
                    </div>
                  </div>

                  {/* Signature Section */}
                  <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs">
                    <div className="space-y-8">
                      <div className="h-12 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                        <span className="text-slate-400 text-[10px]">ลงนาม / Signature</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">({selectedReceiptForPreview.collectorName || 'ผู้รับเงิน'})</p>
                        <p className="text-[10px] text-slate-500">ผู้รับเงิน / Collector</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="h-12 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                        <span className="text-slate-400 text-[10px]">ลงนาม / Signature</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">({selectedReceiptForPreview.approverName || 'ผู้มีอำนาจลงนาม'})</p>
                        <p className="text-[10px] text-slate-500">ผู้มีอำนาจลงนาม / Authorized Signature</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
