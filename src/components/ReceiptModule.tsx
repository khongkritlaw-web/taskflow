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
  ChevronUp,
  Filter,
  ArrowRight,
  Download,
  Sliders,
  Maximize2
} from 'lucide-react';
import { ReceiptDoc, ReceiptItem, AppSettings, Task, Expense, PaperSizeConfig, PaperSizePreset } from '../types';
import { ReceiptEditModal, STEP_ITEMS } from './ReceiptEditModal';
import { 
  ReceiptPrintSheet, 
  PAPER_SIZE_PRESETS, 
  PAPER_SIZE_PRESETS_LIST,
  DEFAULT_PAPER_CONFIG,
  getDocTypeName 
} from './ReceiptPrintSheet';
import { ReceiptPaperSizeModal } from './ReceiptPaperSizeModal';

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
const ISSUER_STORAGE_KEY = 'dekasuite_saved_issuer_info_v1';
const PAPER_STORAGE_KEY = 'dekasuite_receipt_paper_config_v1';

export function ReceiptA4Sheet({ doc, printableId = 'printable-a4-receipt' }: { doc: ReceiptDoc; printableId?: string }) {
  return <ReceiptPrintSheet doc={doc} paperConfig={DEFAULT_PAPER_CONFIG} printableId={printableId} />;
}

export function ReceiptModule({ accentColor, settings, sessionUser, tasks = [], expenses = [] }: ReceiptModuleProps) {
  const [receipts, setReceipts] = useState<ReceiptDoc[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Load Saved Issuer Info
  const [savedIssuerInfo, setSavedIssuerInfo] = useState<any>(() => {
    try {
      const saved = localStorage.getItem(ISSUER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const [activeSubTab, setActiveSubTab] = useState<'create' | 'history'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedReceiptForPreview, setSelectedReceiptForPreview] = useState<ReceiptDoc | null>(null);
  const [isPreviewUnsaved, setIsPreviewUnsaved] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [themeStyle, setThemeStyle] = useState<'navy' | 'slate' | 'emerald' | 'monochrome'>('navy');

  // Form States
  const [docType, setDocType] = useState<'receipt' | 'tax_invoice' | 'invoice' | 'quotation' | 'temp_receipt'>('receipt');
  const [receiptNo, setReceiptNo] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [refNo, setRefNo] = useState('');

  // Issuer Info (Defaults to saved issuer info if available)
  const [issuerName, setIssuerName] = useState(() => savedIssuerInfo?.issuerName || settings.appName || 'สำนักงานกฎหมาย และที่ปรึกษา');
  const [issuerTaxId, setIssuerTaxId] = useState(() => savedIssuerInfo?.issuerTaxId || '0105560000000');
  const [issuerBranch, setIssuerBranch] = useState(() => savedIssuerInfo?.issuerBranch || 'สำนักงานใหญ่');
  const [issuerAddress, setIssuerAddress] = useState(() => savedIssuerInfo?.issuerAddress || '123/45 ถนนรัชดาภิเษก แขวงจอมพล เขตจตุจักร กรุงเทพมหานคร 10900');
  const [issuerPhone, setIssuerPhone] = useState(() => savedIssuerInfo?.issuerPhone || '02-123-4567');
  const [issuerEmail, setIssuerEmail] = useState(() => savedIssuerInfo?.issuerEmail || settings.emailRecipient || 'contact@firm.com');
  const [issuerLogoUrl, setIssuerLogoUrl] = useState(() => savedIssuerInfo?.issuerLogoUrl || settings.appLogoUrl || '');
  const [showLogo, setShowLogo] = useState(() => savedIssuerInfo?.showLogo !== undefined ? savedIssuerInfo.showLogo : true);
  const [issuerSaveSuccessMsg, setIssuerSaveSuccessMsg] = useState(false);

  // Save Issuer Info explicitly to LocalStorage
  const handleSaveIssuerInfo = () => {
    const issuerData = {
      issuerName,
      issuerTaxId,
      issuerBranch,
      issuerAddress,
      issuerPhone,
      issuerEmail,
      issuerLogoUrl,
      showLogo
    };
    try {
      localStorage.setItem(ISSUER_STORAGE_KEY, JSON.stringify(issuerData));
      setSavedIssuerInfo(issuerData);
      setIssuerSaveSuccessMsg(true);
      setTimeout(() => setIssuerSaveSuccessMsg(false), 3000);
    } catch (e) {
      alert('ไม่สามารถบันทึกข้อมูลผู้ออกใบเสร็จได้');
    }
  };

  // Paper Size & Printing Configuration
  const [paperConfig, setPaperConfig] = useState<PaperSizeConfig>(() => {
    try {
      const saved = localStorage.getItem(PAPER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_PAPER_CONFIG;
  });
  const [showPaperSizeModal, setShowPaperSizeModal] = useState(false);

  // Save paper config on change
  useEffect(() => {
    try {
      localStorage.setItem(PAPER_STORAGE_KEY, JSON.stringify(paperConfig));
    } catch (e) {}
  }, [paperConfig]);

  // Apply dynamic print styles into document head before printing
  const applyPrintStyles = (config: PaperSizeConfig) => {
    let styleTag = document.getElementById('dynamic-print-paper-size');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'dynamic-print-paper-size';
      document.head.appendChild(styleTag);
    }

    let width = config.widthMm;
    let height = config.heightMm;
    if (config.preset === 'custom') {
      let rawW = config.customWidth;
      let rawH = config.customHeight;
      if (config.unit === 'cm') { rawW *= 10; rawH *= 10; }
      else if (config.unit === 'in') { rawW *= 25.4; rawH *= 25.4; }
      if (config.orientation === 'landscape' && rawW < rawH) {
        width = rawH; height = rawW;
      } else if (config.orientation === 'portrait' && rawW > rawH) {
        width = rawH; height = rawW;
      } else {
        width = rawW; height = rawH;
      }
    } else if (config.orientation === 'landscape' && config.preset !== 'a5_landscape') {
      if (width < height) { const t = width; width = height; height = t; }
    }

    const margin = config.marginMm ?? 10;
    const isSlip = config.isSlip || config.preset === 'slip_80' || config.preset === 'slip_58' || width <= 85;

    styleTag.innerHTML = `
      @media print {
        @page {
          size: ${width}mm ${height}mm;
          margin: ${margin}mm;
        }
        #printable-active-receipt, 
        #printable-active-receipt-top,
        #printable-a4-receipt, 
        .printable-active-sheet {
          width: ${width}mm !important;
          min-height: ${height}mm !important;
          padding: ${isSlip ? '3mm 2mm' : `${margin}mm`} !important;
          box-shadow: none !important;
          border: none !important;
        }
      }
    `;
  };

  // Top Live Preview Settings
  const [topPreviewScale, setTopPreviewScale] = useState<number>(0.58);
  const [showTopPreview, setShowTopPreview] = useState<boolean>(true);

  // Watermark Settings
  const [showWatermark, setShowWatermark] = useState(true);
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  const [watermarkText, setWatermarkText] = useState('สำนักงานกฎหมาย / OFFICIAL RECEIPT');
  const [watermarkImageUrl, setWatermarkImageUrl] = useState('');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.12);

  // Helper for image upload (Logo / Watermark)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('ขนาดไฟล์ต้องไม่เกิน 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          callback(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Customer Info
  const [customerName, setCustomerName] = useState('');
  const [customerTaxId, setCustomerTaxId] = useState('');
  const [customerBranch, setCustomerBranch] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Items (Default empty row for filling)
  const [items, setItems] = useState<ReceiptItem[]>([
    { id: '1', description: '', quantity: 1, unit: 'รายการ', unitPrice: 0, amount: 0 }
  ]);

  // Form Active Edit Modal Section (null = closed, 1..6 = popup open for that step)
  const [activeEditModalSection, setActiveEditModalSection] = useState<number | null>(null);

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

  // Helper to build document from current form state
  const buildCurrentDoc = (): ReceiptDoc => {
    return {
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
      showLogo,
      showWatermark,
      watermarkType,
      watermarkText,
      watermarkImageUrl,
      watermarkOpacity,
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
  };

  // Preview only (Does NOT save history until user prints or saves)
  const handlePreviewOnly = () => {
    if (!customerName.trim()) {
      alert('กรุณากรอกชื่อผู้รับบริการ / ลูกค้า');
      return;
    }

    const doc = buildCurrentDoc();
    setIsPreviewUnsaved(true);
    setSelectedReceiptForPreview(doc);
  };

  // Save / Update Receipt to History
  const handleSaveReceipt = () => {
    if (!customerName.trim()) {
      alert('กรุณากรอกชื่อผู้รับบริการ / ลูกค้า');
      return;
    }

    const doc = buildCurrentDoc();

    if (editingId) {
      setReceipts(receipts.map(r => r.id === editingId ? doc : r));
    } else {
      setReceipts([doc, ...receipts]);
    }

    // Auto-save current issuer info into storage as well for future use
    try {
      const issuerData = {
        issuerName,
        issuerTaxId,
        issuerBranch,
        issuerAddress,
        issuerPhone,
        issuerEmail,
        issuerLogoUrl,
        showLogo
      };
      localStorage.setItem(ISSUER_STORAGE_KEY, JSON.stringify(issuerData));
      setSavedIssuerInfo(issuerData);
    } catch (e) {}

    setIsPreviewUnsaved(false);
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
    setShowLogo(doc.showLogo !== undefined ? doc.showLogo : true);
    setShowWatermark(doc.showWatermark !== undefined ? doc.showWatermark : true);
    setWatermarkType(doc.watermarkType || 'text');
    setWatermarkText(doc.watermarkText || 'สำนักงานกฎหมาย / OFFICIAL RECEIPT');
    setWatermarkImageUrl(doc.watermarkImageUrl || '');
    setWatermarkOpacity(doc.watermarkOpacity !== undefined ? doc.watermarkOpacity : 0.12);

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
    setActiveEditModalSection(1);
  };

  // Reset Form (always requests confirmation unless skipConfirm = true)
  const handleResetForm = (skipConfirm = false) => {
    if (!skipConfirm) {
      const isConfirmed = window.confirm(
        '⚠️ คุณต้องการล้างข้อมูลในฟอร์มออกทั้งหมดใช่หรือไม่?\n\n' +
        'ข้อมูลลูกค้า รายการ และตัวเลขทั้งหมดจะถูกล้างเพื่อให้คุณเริ่มออกใบเสร็จใหม่\n' +
        '(ข้อมูลผู้ออกใบเสร็จที่บันทึกไว้จะยังคงอยู่)'
      );
      if (!isConfirmed) return;
    }

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
    setItems([{ id: Date.now().toString(), description: '', quantity: 1, unit: 'รายการ', unitPrice: 0, amount: 0 }]);
    setDiscountValue(0);
    setVatType('no_vat');
    setWithholdingTaxPercent(0);
    setShowLogo(savedIssuerInfo?.showLogo !== undefined ? savedIssuerInfo.showLogo : true);
    setShowWatermark(true);
    setWatermarkType('text');
    setWatermarkText(issuerName || 'สำนักงานกฎหมาย / OFFICIAL RECEIPT');
    setWatermarkImageUrl(issuerLogoUrl || '');
    setWatermarkOpacity(0.12);
    setNotes('ขอบคุณที่ใช้บริการ / กรุณาเก็บเอกสารนี้ไว้เป็นหลักฐาน');

    // Restore saved issuer info if available
    if (savedIssuerInfo) {
      if (savedIssuerInfo.issuerName) setIssuerName(savedIssuerInfo.issuerName);
      if (savedIssuerInfo.issuerTaxId) setIssuerTaxId(savedIssuerInfo.issuerTaxId);
      if (savedIssuerInfo.issuerBranch) setIssuerBranch(savedIssuerInfo.issuerBranch);
      if (savedIssuerInfo.issuerAddress) setIssuerAddress(savedIssuerInfo.issuerAddress);
      if (savedIssuerInfo.issuerPhone) setIssuerPhone(savedIssuerInfo.issuerPhone);
      if (savedIssuerInfo.issuerEmail) setIssuerEmail(savedIssuerInfo.issuerEmail);
      if (savedIssuerInfo.issuerLogoUrl) setIssuerLogoUrl(savedIssuerInfo.issuerLogoUrl);
    }
  };

  // Void/Delete Receipt
  const handleVoidReceipt = (id: string) => {
    if (confirm('คุณต้องการยกเลิก (Void) ใบเสร็จรับเงินรายการนี้ใช่หรือไม่?')) {
      setReceipts(receipts.map(r => r.id === id ? { ...r, status: 'void' } : r));
    }
  };

  const handleDeleteReceipt = (id: string) => {
    if (confirm('คุณต้องการลบข้อมูลใบเสร็จนี้ถาวรใช่หรือไม่?')) {
      setReceipts(prev => prev.filter(r => r.id !== id));
      setSelectedIds(prev => prev.filter(sId => sId !== id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredReceipts.map(r => r.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`คุณต้องการลบประวัติใบเสร็จที่เลือกจำนวน ${selectedIds.length} รายการถาวรใช่หรือไม่?`)) {
      setReceipts(prev => prev.filter(r => !selectedIds.includes(r.id)));
      setSelectedIds([]);
    }
  };

  const handleDeleteAllHistory = () => {
    if (receipts.length === 0) return;
    if (confirm(`⚠️ ยืนยันลบประวัติเอกสารใบเสร็จทั้งหมดจำนวน ${receipts.length} รายการ ถาวรหรือไม่? (ไม่สามารถกู้คืนได้)`)) {
      setReceipts([]);
      setSelectedIds([]);
    }
  };

  // Print Document Trigger with dynamic paper sizing support
  const handlePrint = (doc: ReceiptDoc, overrideConfig?: PaperSizeConfig) => {
    const activeConfig = overrideConfig || paperConfig;
    applyPrintStyles(activeConfig);

    if (isPreviewUnsaved) {
      setReceipts(prev => {
        const exists = prev.some(r => r.id === doc.id);
        if (exists) {
          return prev.map(r => r.id === doc.id ? doc : r);
        } else {
          return [doc, ...prev];
        }
      });
      setIsPreviewUnsaved(false);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    }

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

  const liveDoc = buildCurrentDoc();

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
              <button
                type="button"
                onClick={() => setShowPaperSizeModal(true)}
                className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1"
                title="คลิกเพื่อเปลี่ยนหรือกำหนดขนาดพิมพ์"
              >
                <span>📄 ขนาดพิมพ์: {paperConfig.name}</span>
                <Sliders className="w-2.5 h-2.5" />
              </button>
            </div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
              <span>ออกใบเสร็จรับเงิน / ใบกำกับภาษี</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              ออกใบเสร็จรับเงิน, ใบเสนอราคา, ใบแจ้งหนี้ และใบกำกับภาษีมาตรฐาน ปรับแต่งข้อมูลผู้รับ คำนวณ VAT และภาษีหัก ณ ที่จ่ายอัตโนมัติ สั่งพิมพ์ได้ทันที
            </p>
          </div>

          <div className="w-full md:w-auto grid grid-cols-2 md:flex items-center gap-2">
            <button
              onClick={() => { handleResetForm(); setActiveSubTab('create'); }}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
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
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeSubTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>ประวัติ ({receipts.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Section: Create or History */}
      {activeSubTab === 'create' && (
        <div className="space-y-5 text-left">
          {/* CENTER STAGE LIVE PREVIEW (พรีวิวเอกสารตามขนาดกระดาษที่เลือกแบบเรียลไทม์) */}
          <div className="p-4 sm:p-5 rounded-2xl border border-slate-700 dark:border-slate-800 bg-slate-900 text-white shadow-2xl space-y-4">
            {/* Live Preview Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                      พรีวิวเอกสารแบบเรียลไทม์ (Live Preview)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60 text-[10px] font-bold">
                      {liveDoc.receiptNo || 'REC-AUTO'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono">
                      {paperConfig.preset === 'custom' ? `กำหนดเอง (${paperConfig.customWidth}×${paperConfig.customHeight} ${paperConfig.unit})` : paperConfig.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-300 font-medium">
                    ลูกค้า: {liveDoc.customerName || '(กดปุ่ม "กรอกเอกสาร" เพื่อใส่ชื่อลูกค้าและรายการ)'}
                  </span>
                </div>
              </div>

              {/* Grand Total Badge & Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">ยอดรวมสุทธิ:</span>
                  <span className="text-sm sm:text-base font-mono font-black text-emerald-400">
                    {grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Primary Action: กรอกเอกสาร */}
                  <button
                    type="button"
                    onClick={() => setActiveEditModalSection(1)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-95"
                  >
                    <FileText className="w-4 h-4" />
                    <span>กรอกเอกสาร</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePreviewOnly}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 border border-slate-700"
                    title="ขยายพรีวิวใหญ่เต็มหน้าจอ"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>ขยายเต็มจอ</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveReceipt}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                    title="บันทึกลงประวัติ"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>บันทึกประวัติ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrint(liveDoc)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-400 hover:to-emerald-400 text-white font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>พิมพ์ ({paperConfig.name})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Template Presets Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
                  <span>⚡ แม่แบบด่วน:</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('legal_service')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-800/80 text-indigo-300 text-xs font-bold hover:bg-indigo-900 cursor-pointer shadow-2xs active:scale-95"
                >
                  ⚖️ ค่าว่าความ
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('court_fee')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs font-bold hover:bg-emerald-900 cursor-pointer shadow-2xs active:scale-95"
                >
                  🏛️ ค่าธรรมเนียมศาล
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('retainer')}
                  className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-800/80 text-amber-300 text-xs font-bold hover:bg-amber-900 cursor-pointer shadow-2xs active:scale-95"
                >
                  💼 ที่ปรึกษา
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('general')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer shadow-2xs active:scale-95"
                >
                  📦 สินค้าทั่วไป
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleResetForm()}
                  className="px-3 py-1 rounded-lg border border-rose-800/80 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                  title="ล้างข้อมูลฟอร์มและเริ่มใหม่"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>ล้างฟอร์ม</span>
                </button>
              </div>
            </div>

            {/* Paper Size Preset Selection Bar & Zoom Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
                  <Printer className="w-3.5 h-3.5 text-indigo-400" />
                  <span>ขนาดกระดาษพิมพ์:</span>
                </span>
                
                {PAPER_SIZE_PRESETS_LIST.map((preset) => {
                  const isActive = paperConfig.preset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setPaperConfig({
                          preset: preset.id,
                          name: preset.name,
                          widthMm: preset.widthMm,
                          heightMm: preset.heightMm,
                          orientation: preset.orientation || 'portrait',
                          customWidth: preset.widthMm,
                          customHeight: preset.heightMm,
                          unit: 'mm',
                          isSlip: preset.isSlip,
                          marginMm: preset.isSlip ? 3 : 10
                        });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <span>{preset.icon}</span>
                      <span>{preset.name}</span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setShowPaperSizeModal(true)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    paperConfig.preset === 'custom'
                      ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400'
                      : 'bg-slate-800/80 text-amber-300 hover:bg-slate-700 hover:text-amber-200 border border-amber-500/30'
                  }`}
                >
                  <Sliders className="w-3 h-3 text-amber-400" />
                  <span>⚙️ กำหนดขนาดเอง...</span>
                </button>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-[10px] text-slate-400">สเกลพรีวิว:</span>
                {[
                  { scale: 0.50, label: '50%' },
                  { scale: 0.65, label: '65%' },
                  { scale: 0.80, label: '80%' },
                  { scale: 1.00, label: '100%' },
                ].map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setTopPreviewScale(s.scale)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      topPreviewScale === s.scale
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Thai Baht Text Badge */}
            <div className="flex items-center justify-between gap-2 px-1 text-[11px]">
              <span className="text-[10px] text-indigo-300 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-800/60 font-bold">
                ({grandTotalTextThai})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                สัดส่วนกระดาษ: {paperConfig.widthMm} × {paperConfig.heightMm} mm ({paperConfig.orientation === 'landscape' ? 'แนวนอน' : 'แนวตั้ง'})
              </span>
            </div>

            {/* Sheet Container */}
            <div className="w-full min-h-[550px] max-h-[750px] overflow-y-auto overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-3 sm:p-6 flex justify-center items-start shadow-inner">
              <div 
                style={{ transform: `scale(${topPreviewScale})`, transformOrigin: 'top center' }}
                className="my-2 transition-all duration-200"
              >
                <ReceiptPrintSheet 
                  doc={liveDoc} 
                  paperConfig={paperConfig} 
                  printableId="printable-active-receipt-top" 
                />
              </div>
            </div>
          </div>

          {/* 3. EDIT POPUP MODAL (เด้งขึ้นมาเมื่อคลิกข้อ 1-6 ด้านบน) */}
          <AnimatePresence>
            {activeEditModalSection !== null && (
              <ReceiptEditModal
                activeStep={activeEditModalSection}
                setActiveStep={setActiveEditModalSection}
                onClose={() => setActiveEditModalSection(null)}
                
                // Step 1
                docType={docType}
                setDocType={setDocType}
                receiptNo={receiptNo}
                setReceiptNo={setReceiptNo}
                generateAutoNo={generateAutoNo}
                issueDate={issueDate}
                setIssueDate={setIssueDate}
                dueDate={dueDate}
                setDueDate={setDueDate}
                refNo={refNo}
                setRefNo={setRefNo}

                // Step 2
                issuerName={issuerName}
                setIssuerName={setIssuerName}
                issuerTaxId={issuerTaxId}
                setIssuerTaxId={setIssuerTaxId}
                issuerBranch={issuerBranch}
                setIssuerBranch={setIssuerBranch}
                issuerAddress={issuerAddress}
                setIssuerAddress={setIssuerAddress}
                issuerPhone={issuerPhone}
                setIssuerPhone={setIssuerPhone}
                issuerEmail={issuerEmail}
                setIssuerEmail={setIssuerEmail}
                handleSaveIssuerInfo={handleSaveIssuerInfo}
                savedIssuerInfo={savedIssuerInfo}
                issuerSaveSuccessMsg={issuerSaveSuccessMsg}

                // Step 3
                customerName={customerName}
                setCustomerName={setCustomerName}
                customerTaxId={customerTaxId}
                setCustomerTaxId={setCustomerTaxId}
                customerBranch={customerBranch}
                setCustomerBranch={setCustomerBranch}
                customerAddress={customerAddress}
                setCustomerAddress={setCustomerAddress}
                customerPhone={customerPhone}
                setCustomerPhone={setCustomerPhone}
                customerEmail={customerEmail}
                setCustomerEmail={setCustomerEmail}

                // Step 4
                items={items}
                handleAddItem={handleAddItem}
                handleUpdateItem={handleUpdateItem}
                handleRemoveItem={handleRemoveItem}
                handleApplyPreset={handleApplyPreset}
                subtotal={subtotal}

                // Step 5
                discountType={discountType}
                setDiscountType={setDiscountType}
                discountValue={discountValue}
                setDiscountValue={setDiscountValue}
                discountAmount={discountAmount}
                vatType={vatType}
                setVatType={setVatType}
                vatAmount={vatAmount}
                withholdingTaxPercent={withholdingTaxPercent}
                setWithholdingTaxPercent={setWithholdingTaxPercent}
                withholdingTaxAmount={withholdingTaxAmount}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                bankName={bankName}
                setBankName={setBankName}
                bankAccountNo={bankAccountNo}
                setBankAccountNo={setBankAccountNo}
                bankAccountName={bankAccountName}
                setBankAccountName={setBankAccountName}
                chequeNo={chequeNo}
                setChequeNo={setChequeNo}
                chequeDate={chequeDate}
                setChequeDate={setChequeDate}
                grandTotal={grandTotal}
                grandTotalTextThai={grandTotalTextThai}

                // Step 6
                notes={notes}
                setNotes={setNotes}
                collectorName={collectorName}
                setCollectorName={setCollectorName}
                approverName={approverName}
                setApproverName={setApproverName}
                showLogo={showLogo}
                setShowLogo={setShowLogo}
                issuerLogoUrl={issuerLogoUrl}
                setIssuerLogoUrl={setIssuerLogoUrl}
                showWatermark={showWatermark}
                setShowWatermark={setShowWatermark}
                watermarkType={watermarkType}
                setWatermarkType={setWatermarkType}
                watermarkText={watermarkText}
                setWatermarkText={setWatermarkText}
                watermarkImageUrl={watermarkImageUrl}
                setWatermarkImageUrl={setWatermarkImageUrl}
                watermarkOpacity={watermarkOpacity}
                setWatermarkOpacity={setWatermarkOpacity}
                handleImageUpload={handleImageUpload}
              />
            )}
          </AnimatePresence>
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

          {/* Bulk Selection & Deletion Bar */}
          {receipts.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                >
                  <input 
                    type="checkbox" 
                    checked={filteredReceipts.length > 0 && filteredReceipts.every(r => selectedIds.includes(r.id))}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer pointer-events-none"
                  />
                  <span>เลือกทั้งหมด ({filteredReceipts.length})</span>
                </button>

                {selectedIds.length > 0 && (
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                    เลือกอยู่ {selectedIds.length} รายการ
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {selectedIds.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบรายการที่เลือก ({selectedIds.length})</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSelectedIds([])}
                      className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium cursor-pointer"
                    >
                      ยกเลิกการเลือก
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleDeleteAllHistory}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 font-bold transition-all cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบประวัติทั้งหมด ({receipts.length})</span>
                </button>
              </div>
            </div>
          )}

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
            <>
              {/* Mobile Card List View (md:hidden) */}
              <div className="block md:hidden space-y-3">
                {filteredReceipts.map(r => {
                  const isSelected = selectedIds.includes(r.id);
                  return (
                    <div 
                      key={r.id} 
                      className={`p-4 rounded-xl border text-xs space-y-3 transition-all ${
                        isSelected 
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-800' 
                          : 'bg-white dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 shadow-xs'
                      }`}
                    >
                      {/* Top Bar: Checkbox, Receipt No & Status */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(r.id)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                            {r.receiptNo}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          r.status === 'void' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {r.status === 'void' ? 'ยกเลิก (Void)' : 'สมบูรณ์'}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[10px]">ลูกค้า / ผู้ชำระเงิน</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{r.customerName || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">ประเภทเอกสาร</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{getDocTypeName(r.docType).split('(')[0]}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">วันที่ออก</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">{r.issueDate}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">ยอดรวมสุทธิ</span>
                          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                            {r.grandTotal?.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                          </span>
                        </div>
                      </div>

                      {/* Touch Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePrint(r)}
                          className="py-2 px-2 rounded-lg bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>พิมพ์ A4</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditReceipt(r)}
                          className="py-2 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>แก้ไข</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleVoidReceipt(r.id)}
                          className="py-2 px-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-[10px] flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>ยกเลิก</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteReceipt(r.id)}
                          className="py-2 px-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500 font-bold text-[10px] flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบ</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-xs text-left text-slate-600 dark:text-slate-400">
                  <thead className="text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <tr>
                      <th className="px-3 py-3 w-10 text-center">
                        <input 
                          type="checkbox"
                          checked={filteredReceipts.length > 0 && filteredReceipts.every(r => selectedIds.includes(r.id))}
                          onChange={handleSelectAllFiltered}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          title="เลือกทั้งหมด / ยกเลิกทั้งหมด"
                        />
                      </th>
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
                    {filteredReceipts.map(r => {
                      const isSelected = selectedIds.includes(r.id);
                      return (
                        <tr 
                          key={r.id} 
                          className={`transition-all ${
                            isSelected 
                              ? 'bg-indigo-50/60 dark:bg-indigo-950/40' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-950/50'
                          }`}
                        >
                          <td className="px-3 py-3 text-center">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(r.id)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* DYNAMIC PAPER PRINT & PREVIEW MODAL */}
      <AnimatePresence>
        {selectedReceiptForPreview && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden text-left shadow-2xl"
            >
              {/* Modal Top Control Bar */}
              <div className="p-3 sm:p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Printer className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-extrabold text-white flex flex-wrap items-center gap-2">
                      <span>ตัวอย่างเอกสารก่อนสั่งพิมพ์</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                        {paperConfig.name} ({paperConfig.widthMm}×{paperConfig.heightMm} mm)
                      </span>
                      {isPreviewUnsaved && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-400" />
                          ยังไม่บันทึกประวัติ
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono truncate">เลขที่: {selectedReceiptForPreview.receiptNo}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handlePrint(selectedReceiptForPreview)}
                    className="flex-1 sm:flex-none h-10 sm:h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <Printer className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    <span>{isPreviewUnsaved ? `สั่งพิมพ์ & บันทึก (${paperConfig.name})` : `สั่งพิมพ์ / บันทึก PDF (${paperConfig.name})`}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReceiptForPreview(null);
                      setIsPreviewUnsaved(false);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Paper Presets Selector Bar */}
              <div className="px-3 py-2 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto flex-shrink-0 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                    <Printer className="w-3 h-3 text-indigo-400" />
                    <span>เปลี่ยนขนาดกระดาษ:</span>
                  </span>
                  {PAPER_SIZE_PRESETS_LIST.map((preset) => {
                    const isActive = paperConfig.preset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setPaperConfig({
                            preset: preset.id,
                            name: preset.name,
                            widthMm: preset.widthMm,
                            heightMm: preset.heightMm,
                            orientation: preset.orientation || 'portrait',
                            customWidth: preset.widthMm,
                            customHeight: preset.heightMm,
                            unit: 'mm',
                            isSlip: preset.isSlip,
                            marginMm: preset.isSlip ? 3 : 10
                          });
                        }}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.name}</span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setShowPaperSizeModal(true)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                      paperConfig.preset === 'custom'
                        ? 'bg-amber-600 text-white ring-1 ring-amber-400'
                        : 'bg-slate-800/80 text-amber-300 hover:bg-slate-700 border border-amber-500/30'
                    }`}
                  >
                    <Sliders className="w-3 h-3 text-amber-400" />
                    <span>⚙️ กำหนดขนาดเอง</span>
                  </button>
                </div>

                <span className="text-[10px] text-slate-400 font-mono hidden md:inline-block">
                  ระยะขอบ: {paperConfig.marginMm ?? 10} mm
                </span>
              </div>

              {/* Printable Document Sheet View */}
              <div className="p-3 sm:p-8 overflow-y-auto overflow-x-auto flex-1 bg-slate-800/50 flex flex-col items-center justify-start min-w-0">
                <ReceiptPrintSheet 
                  doc={selectedReceiptForPreview} 
                  paperConfig={paperConfig} 
                  printableId="printable-active-receipt" 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM PAPER SIZE CONFIGURATION MODAL */}
      <ReceiptPaperSizeModal
        isOpen={showPaperSizeModal}
        onClose={() => setShowPaperSizeModal(false)}
        paperConfig={paperConfig}
        onSaveConfig={(newConfig) => {
          setPaperConfig(newConfig);
          applyPrintStyles(newConfig);
        }}
      />

      {/* FULL DATA ENTRY POPUP MODAL (เปิดเมื่อกดปุ่ม "กรอกเอกสาร" หรือคลิกแก้ไข) */}
      <AnimatePresence>
        {activeEditModalSection !== null && (
          <ReceiptEditModal
            activeStep={activeEditModalSection}
            setActiveStep={setActiveEditModalSection}
            onClose={() => setActiveEditModalSection(null)}
            docType={docType}
            setDocType={setDocType}
            receiptNo={receiptNo}
            setReceiptNo={setReceiptNo}
            generateAutoNo={generateAutoNo}
            issueDate={issueDate}
            setIssueDate={setIssueDate}
            dueDate={dueDate}
            setDueDate={setDueDate}
            refNo={refNo}
            setRefNo={setRefNo}
            issuerName={issuerName}
            setIssuerName={setIssuerName}
            issuerTaxId={issuerTaxId}
            setIssuerTaxId={setIssuerTaxId}
            issuerBranch={issuerBranch}
            setIssuerBranch={setIssuerBranch}
            issuerAddress={issuerAddress}
            setIssuerAddress={setIssuerAddress}
            issuerPhone={issuerPhone}
            setIssuerPhone={setIssuerPhone}
            issuerEmail={issuerEmail}
            setIssuerEmail={setIssuerEmail}
            handleSaveIssuerInfo={handleSaveIssuerInfo}
            savedIssuerInfo={savedIssuerInfo}
            issuerSaveSuccessMsg={issuerSaveSuccessMsg}
            customerName={customerName}
            setCustomerName={setCustomerName}
            customerTaxId={customerTaxId}
            setCustomerTaxId={setCustomerTaxId}
            customerBranch={customerBranch}
            setCustomerBranch={setCustomerBranch}
            customerAddress={customerAddress}
            setCustomerAddress={setCustomerAddress}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
            customerEmail={customerEmail}
            setCustomerEmail={setCustomerEmail}
            items={items}
            handleAddItem={handleAddItem}
            handleUpdateItem={handleUpdateItem}
            handleRemoveItem={handleRemoveItem}
            handleApplyPreset={handleApplyPreset}
            subtotal={subtotal}
            discountType={discountType}
            setDiscountType={setDiscountType}
            discountValue={discountValue}
            setDiscountValue={setDiscountValue}
            discountAmount={discountAmount}
            vatType={vatType}
            setVatType={setVatType}
            vatAmount={vatAmount}
            withholdingTaxPercent={withholdingTaxPercent}
            setWithholdingTaxPercent={setWithholdingTaxPercent}
            withholdingTaxAmount={withholdingTaxAmount}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            bankName={bankName}
            setBankName={setBankName}
            bankAccountNo={bankAccountNo}
            setBankAccountNo={setBankAccountNo}
            bankAccountName={bankAccountName}
            setBankAccountName={setBankAccountName}
            chequeNo={chequeNo}
            setChequeNo={setChequeNo}
            chequeDate={chequeDate}
            setChequeDate={setChequeDate}
            grandTotal={grandTotal}
            grandTotalTextThai={grandTotalTextThai}
            notes={notes}
            setNotes={setNotes}
            collectorName={collectorName}
            setCollectorName={setCollectorName}
            approverName={approverName}
            setApproverName={setApproverName}
            showLogo={showLogo}
            setShowLogo={setShowLogo}
            issuerLogoUrl={issuerLogoUrl}
            setIssuerLogoUrl={setIssuerLogoUrl}
            showWatermark={showWatermark}
            setShowWatermark={setShowWatermark}
            watermarkType={watermarkType}
            setWatermarkType={setWatermarkType}
            watermarkText={watermarkText}
            setWatermarkText={setWatermarkText}
            watermarkImageUrl={watermarkImageUrl}
            setWatermarkImageUrl={setWatermarkImageUrl}
            watermarkOpacity={watermarkOpacity}
            setWatermarkOpacity={setWatermarkOpacity}
            handleImageUpload={handleImageUpload}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
