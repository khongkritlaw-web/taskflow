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
const ISSUER_STORAGE_KEY = 'dekasuite_saved_issuer_info_v1';

export function ReceiptA4Sheet({ doc, printableId = 'printable-a4-receipt' }: { doc: ReceiptDoc; printableId?: string }) {
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

  return (
    <div 
      id={printableId}
      className="bg-white text-slate-900 p-8 rounded-sm shadow-2xl w-[210mm] min-w-[210mm] min-h-[297mm] text-xs space-y-5 border border-slate-300 relative font-sans leading-normal overflow-hidden flex-shrink-0 text-left"
      style={{ color: '#0f172a' }}
    >
      {/* Background Watermark Layer */}
      {doc.showWatermark !== false && (
        <div 
          className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 select-none"
          style={{ opacity: doc.watermarkOpacity ?? 0.12 }}
        >
          {doc.watermarkType === 'image' && (doc.watermarkImageUrl || doc.issuerLogoUrl) ? (
            <img 
              src={doc.watermarkImageUrl || doc.issuerLogoUrl} 
              alt="Watermark" 
              className="max-w-[340px] max-h-[340px] object-contain grayscale"
            />
          ) : (
            <div className="transform -rotate-30 text-center px-4">
              <span className="text-3xl sm:text-4xl font-black uppercase tracking-widest text-slate-800 border-4 border-slate-800 px-6 sm:px-8 py-3 sm:py-4 rounded-xl inline-block whitespace-nowrap">
                {doc.watermarkText || doc.issuerName || 'OFFICIAL RECEIPT'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Header: Issuer Logo & Doc Title */}
      <div className="flex justify-between items-start gap-4 pb-6 border-b-2 border-slate-900 relative z-10">
        <div className="flex items-start gap-3.5 max-w-md">
          {doc.showLogo !== false && doc.issuerLogoUrl && (
            <img 
              src={doc.issuerLogoUrl} 
              alt="Company Logo" 
              className="w-16 h-16 object-contain rounded-md border border-slate-200 p-0.5 bg-white flex-shrink-0"
            />
          )}
          <div className="space-y-1">
            <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
              {doc.issuerName || 'สำนักงานกฎหมาย'}
            </h2>
            <p className="text-[11px] text-slate-600 leading-snug">
              {doc.issuerAddress || '-'}
            </p>
            <div className="flex items-center gap-3 text-[10px] text-slate-600 font-medium pt-1">
              <span>เลขภาษี: {doc.issuerTaxId || '-'}</span>
              <span>({doc.issuerBranch || 'สำนักงานใหญ่'})</span>
              <span>โทร: {doc.issuerPhone || '-'}</span>
            </div>
          </div>
        </div>

        <div className="text-right space-y-2">
          <div className="inline-block px-4 py-2 rounded border-2 border-slate-900 bg-slate-50 text-slate-900 font-black text-sm uppercase tracking-wider">
            {getDocTypeName(doc.docType).split('(')[0]}
          </div>
          <div className="text-[11px] font-mono space-y-0.5 text-slate-700">
            <p><span className="font-bold">เลขที่:</span> {doc.receiptNo || '-'}</p>
            <p><span className="font-bold">วันที่:</span> {doc.issueDate || '-'}</p>
            {doc.refNo && <p><span className="font-bold">อ้างอิง:</span> {doc.refNo}</p>}
          </div>
        </div>
      </div>

      {/* Customer Box */}
      <div className="p-4 rounded border border-slate-300 bg-slate-50/50 grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">ชื่อผู้ว่าจ้าง / ลูกค้า (Customer):</span>
          <p className="font-bold text-sm text-slate-900">{doc.customerName || '(กรุณากรอกชื่อลูกค้า)'}</p>
          <p className="text-[11px] text-slate-600">{doc.customerAddress || 'ไม่ระบุที่อยู่'}</p>
        </div>

        <div className="space-y-1 text-left pl-4 border-l border-slate-200">
          <p className="text-[11px] text-slate-700"><span className="font-bold">เลขผู้เสียภาษี:</span> {doc.customerTaxId || '-'}</p>
          <p className="text-[11px] text-slate-700"><span className="font-bold">โทรศัพท์:</span> {doc.customerPhone || '-'}</p>
          <p className="text-[11px] text-slate-700"><span className="font-bold">อีเมล:</span> {doc.customerEmail || '-'}</p>
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
          {(doc.items || []).map((item, idx) => (
            <tr key={idx} className="text-slate-800">
              <td className="py-3 px-3 text-center font-mono">{idx + 1}</td>
              <td className="py-3 px-3 font-semibold">{item.description || '-'}</td>
              <td className="py-3 px-3 text-center font-mono">{item.quantity}</td>
              <td className="py-3 px-3 text-center">{item.unit}</td>
              <td className="py-3 px-3 text-right font-mono">{(item.unitPrice || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
              <td className="py-3 px-3 text-right font-mono font-bold">{(item.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Calculations & Total */}
      <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-12 gap-4">
        <div className="col-span-7 space-y-3">
          <div className="p-3 rounded border border-slate-200 bg-slate-50 text-[11px]">
            <span className="font-bold text-slate-700 block mb-1">จำนวนเงินตัวหนังสือ:</span>
            <p className="font-black text-slate-900 text-xs">({doc.grandTotalTextThai || 'ศูนย์บาทถ้วน'})</p>
          </div>

          <div className="text-[10px] text-slate-600 space-y-1">
            <p><span className="font-bold">วิธีการชำระเงิน:</span> {doc.paymentMethod === 'transfer' ? `โอนเงินผ่านธนาคาร ${doc.bankName || ''} เลขบัญชี ${doc.bankAccountNo || ''}` : doc.paymentMethod}</p>
            <p><span className="font-bold">หมายเหตุ:</span> {doc.notes || '-'}</p>
          </div>
        </div>

        <div className="col-span-5 space-y-1.5 text-right font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-slate-600 font-sans">รวมเงิน (Subtotal):</span>
            <span className="font-bold">{(doc.subtotal || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
          </div>

          {doc.discountAmount ? doc.discountAmount > 0 && (
            <div className="flex justify-between text-rose-600">
              <span className="font-sans">หัก ส่วนลด:</span>
              <span>-{(doc.discountAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
            </div>
          ) : null}

          {doc.vatAmount ? doc.vatAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-600 font-sans">ภาษีมูลค่าเพิ่ม 7%:</span>
              <span>+{(doc.vatAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
            </div>
          ) : null}

          {doc.withholdingTaxAmount ? doc.withholdingTaxAmount > 0 && (
            <div className="flex justify-between text-rose-600">
              <span className="font-sans">หัก ณ ที่จ่าย ({doc.withholdingTaxPercent}%):</span>
              <span>-{(doc.withholdingTaxAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
            </div>
          ) : null}

          <div className="pt-2 border-t-2 border-slate-900 flex justify-between font-black text-sm text-slate-900">
            <span className="font-sans">ยอดสุทธิ (Grand Total):</span>
            <span>{(doc.grandTotal || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="pt-8 sm:pt-10 grid grid-cols-2 gap-8 sm:gap-12 text-center text-xs">
        <div className="space-y-8">
          <div className="h-12 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
            <span className="text-slate-400 text-[10px]">ลงนาม / Signature</span>
          </div>
          <div>
            <p className="font-bold text-slate-900">({doc.collectorName || 'ผู้รับเงิน'})</p>
            <p className="text-[10px] text-slate-500">ผู้รับเงิน / Collector</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="h-12 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
            <span className="text-slate-400 text-[10px]">ลงนาม / Signature</span>
          </div>
          <div>
            <p className="font-bold text-slate-900">({doc.approverName || 'ผู้มีอำนาจลงนาม'})</p>
            <p className="text-[10px] text-slate-500">ผู้มีอำนาจลงนาม / Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
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

  // Form Accordion Sections State (Sections 2..6 collapsible)
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    sec2: false, // 2. ข้อมูลผู้ออกใบเสร็จ (ผู้ขาย/สำนักงาน)
    sec3: true,  // 3. ข้อมูลผู้ว่าจ้าง / ลูกค้า (ผู้ชำระเงิน)
    sec4: true,  // 4. รายการสินค้า / ค่าบริการ / ค่าใช้จ่าย
    sec5: false, // 5. วิธีการชำระเงิน และหมายเหตุ
    sec6: false  // 6. โลโก้บริษัทและลายน้ำ
  });

  const toggleSection = (secKey: string) => {
    setOpenSections(prev => ({ ...prev, [secKey]: !prev[secKey] }));
  };

  const setAllSections = (isOpen: boolean) => {
    setOpenSections({
      sec2: isOpen,
      sec3: isOpen,
      sec4: isOpen,
      sec5: isOpen,
      sec6: isOpen
    });
  };

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

  // Print Document Trigger
  const handlePrint = (doc: ReceiptDoc) => {
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
        <div className="space-y-6 text-left">
          {/* Top Sticky Live A4 Preview Card (Always Visible At Top) */}
          <div className="sticky top-2 z-30 p-4 sm:p-5 rounded-2xl border border-slate-700 dark:border-slate-800 bg-slate-900 text-white shadow-2xl space-y-3">
            {/* Live Preview Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                </span>
                <div>
                  <span className="text-xs font-black uppercase text-emerald-400 tracking-wider block">
                    พรีวิวเอกสาร A4 แบบเรียลไทม์ (Live Preview)
                  </span>
                  <span className="text-[11px] text-slate-300 font-medium">
                    {liveDoc.receiptNo || 'REC-AUTO'} • {liveDoc.customerName || 'ผู้ว่าจ้าง / ลูกค้า (กรอกด้านล่างเพื่ออัปเดต)'}
                  </span>
                </div>
              </div>

              {/* Grand Total Badge & Quick Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">ยอดรวมสุทธิ:</span>
                  <span className="text-sm sm:text-base font-mono font-black text-emerald-400">
                    {grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePreviewOnly}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                    title="ขยายพรีวิวใหญ่เต็มหน้าจอ"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>ขยายเต็มจอ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrint(liveDoc)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>สั่งพิมพ์ / PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowTopPreview(!showTopPreview)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer border border-slate-700"
                    title={showTopPreview ? "พับเก็บพรีวิว" : "ขยายพรีวิว"}
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showTopPreview ? 'rotate-180' : ''}`} />
                    <span>{showTopPreview ? 'ย่อพรีวิว' : 'แสดงพรีวิว'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Live Scaled A4 Sheet Container */}
            {showTopPreview && (
              <div className="space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
                  <span className="text-[10px] text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60 font-bold">
                    ({grandTotalTextThai})
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 mr-1">ปรับขนาดภาพ:</span>
                    {[
                      { scale: 0.45, label: '45%' },
                      { scale: 0.58, label: '58%' },
                      { scale: 0.72, label: '72%' },
                      { scale: 0.88, label: '88%' },
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

                <div className="w-full max-h-[360px] sm:max-h-[460px] overflow-y-auto overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-2 sm:p-4 flex justify-center items-start shadow-inner">
                  <div 
                    style={{ transform: `scale(${topPreviewScale})`, transformOrigin: 'top center' }}
                    className="my-1 transition-all duration-200"
                  >
                    <ReceiptA4Sheet doc={liveDoc} printableId="printable-a4-receipt-top" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Container (Full Width with Top Reset & Collapsible Accordions) */}
          <div className="w-full max-w-5xl mx-auto space-y-5">
            
            {/* Top Bar with Prominent Reset Form Button & Presets */}
            <div className="p-4 rounded-2xl border border-rose-200/90 dark:border-rose-900/50 bg-gradient-to-r from-rose-50/80 via-indigo-50/30 to-amber-50/40 dark:from-rose-950/20 dark:via-slate-900 dark:to-amber-950/10 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleResetForm()}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-all shadow-md shadow-rose-600/20 active:scale-95 flex items-center gap-2 cursor-pointer"
                  title="ล้างข้อมูลฟอร์มทั้งหมด (มีระบบยืนยันเสมอ)"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>ล้างฟอร์มสร้างใหม่</span>
                </button>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hidden sm:inline">
                  (กดยืนยันเพื่อเริ่มกรอกใหม่ทุกครั้ง)
                </span>
              </div>

              {/* Quick Presets & Expand All Toggle */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-1 hidden md:inline">แม่แบบด่วน:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('legal_service')}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200 text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1"
                >
                  <span>⚖️</span>
                  <span>ค่าว่าความ</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('court_fee')}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-200 text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900 transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1"
                >
                  <span>🏛️</span>
                  <span>ค่าธรรมเนียมศาล</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('retainer')}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-amber-900/60 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-200 text-xs font-bold hover:bg-amber-50 dark:hover:bg-amber-900 transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1"
                >
                  <span>💼</span>
                  <span>ที่ปรึกษา</span>
                </button>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

                <button
                  type="button"
                  onClick={() => setAllSections(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  ขยายหมด
                </button>
                <button
                  type="button"
                  onClick={() => setAllSections(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  ย่อหมด
                </button>
              </div>
            </div>

            {/* 1. ข้อมูลหัวเอกสารและเลขที่ (แสดงเลย ไม่ต้องย่อ) */}
            <div className="p-5 sm:p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-indigo-900 dark:text-indigo-300 flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-indigo-500" />
                  <span>1. ข้อมูลหัวเอกสารและเลขที่</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  แสดงเสมอ
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">ประเภทเอกสารที่ต้องการออก</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
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
                    className="w-full h-10 px-3 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-indigo-900 dark:text-indigo-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">วันที่ออกเอกสาร</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white font-bold text-slate-900 dark:text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">กำหนดชำระเงิน (ถ้ามี)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white font-bold text-slate-900 dark:text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">เลขที่อ้างอิง / คดี / ใบสั่งซื้อ</label>
                  <input
                    type="text"
                    value={refNo}
                    onChange={(e) => setRefNo(e.target.value)}
                    placeholder="อ้างอิงคดีดำที่ 123/2569"
                    className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white font-bold text-slate-900 dark:text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* 2. ข้อมูลผู้ออกใบเสร็จ (ผู้ขาย/สำนักงาน) - Collapsible */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => toggleSection('sec2')}
                className="w-full p-4 sm:p-5 bg-slate-50/80 hover:bg-slate-100/80 dark:bg-slate-950/60 dark:hover:bg-slate-950 flex items-center justify-between text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                      <span>2. ข้อมูลผู้ออกใบเสร็จ (ผู้ขาย/สำนักงาน)</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {issuerName ? `${issuerName} (ภาษี: ${issuerTaxId || 'ไม่ระบุ'})` : 'คลิกเพื่อกรอกข้อมูลชื่อสำนักงาน ที่อยู่ และเลขภาษีผู้ขาย'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {savedIssuerInfo && (
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full hidden sm:inline">
                      มีข้อมูลบันทึกไว้
                    </span>
                  )}
                  {openSections.sec2 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
              </button>

              {openSections.sec2 && (
                <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      ระบุรายละเอียดสำนักงาน/บริษัทของคุณ เพื่อแสดงบนหัวใบเสร็จ
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveIssuerInfo}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 flex-shrink-0 shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5 text-emerald-500" />
                      <span>บันทึกข้อมูลผู้ออก</span>
                    </button>
                  </div>

                  {issuerSaveSuccessMsg && (
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                      <span>บันทึกข้อมูลผู้ออกใบเสร็จสำเร็จ!</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">ชื่อสำนักงาน / บริษัท / ผู้ออก</label>
                      <input
                        type="text"
                        value={issuerName}
                        onChange={(e) => setIssuerName(e.target.value)}
                        className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">เลขประจำตัวผู้เสียภาษี</label>
                      <input
                        type="text"
                        value={issuerTaxId}
                        onChange={(e) => setIssuerTaxId(e.target.value)}
                        className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">สาขา</label>
                      <input
                        type="text"
                        value={issuerBranch}
                        onChange={(e) => setIssuerBranch(e.target.value)}
                        className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">ที่อยู่สถานประกอบการ</label>
                      <textarea
                        rows={2}
                        value={issuerAddress}
                        onChange={(e) => setIssuerAddress(e.target.value)}
                        className="w-full p-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">เบอร์โทรศัพท์</label>
                      <input
                        type="text"
                        value={issuerPhone}
                        onChange={(e) => setIssuerPhone(e.target.value)}
                        className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">อีเมล</label>
                      <input
                        type="text"
                        value={issuerEmail}
                        onChange={(e) => setIssuerEmail(e.target.value)}
                        className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. ข้อมูลผู้ว่าจ้าง / ลูกค้า (ผู้ชำระเงิน) - Collapsible */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => toggleSection('sec3')}
                className="w-full p-4 sm:p-5 bg-slate-50/80 hover:bg-slate-100/80 dark:bg-slate-950/60 dark:hover:bg-slate-950 flex items-center justify-between text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white">
                      3. ข้อมูลผู้ว่าจ้าง / ลูกค้า (ผู้ชำระเงิน)
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {customerName ? `${customerName} (โทร: ${customerPhone || 'ไม่ระบุ'})` : 'คลิกเพื่อระบุชื่อลูกค้า ที่อยู่สำหรับออกใบเสร็จ และเลขผู้เสียภาษี'}
                    </p>
                  </div>
                </div>
                {openSections.sec3 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>

              {openSections.sec3 && (
                <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">ชื่อลูกค้า / บริษัทผู้รับบริการ *</label>
                    <input
                      type="text"
                      required
                      placeholder="บริษัท เอสซีจี คอร์ปอเรชั่น จำกัด / นายสมชาย ใจดี"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">เลขประจำตัวผู้เสียภาษี/บัตรประชาชน</label>
                      <input
                        type="text"
                        placeholder="13 หลัก"
                        value={customerTaxId}
                        onChange={(e) => setCustomerTaxId(e.target.value)}
                        className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">สาขา</label>
                      <input
                        type="text"
                        placeholder="สำนักงานใหญ่ / สาขา 00001"
                        value={customerBranch}
                        onChange={(e) => setCustomerBranch(e.target.value)}
                        className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">ที่อยู่สำหรับออกใบเสร็จ</label>
                    <textarea
                      rows={2}
                      placeholder="ที่อยู่สำหรับลงในใบกำกับภาษี..."
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full p-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">เบอร์โทรศัพท์</label>
                      <input
                        type="text"
                        placeholder="081-234-5678"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">อีเมล</label>
                      <input
                        type="text"
                        placeholder="client@email.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. รายการสินค้า / ค่าบริการ / ค่าใช้จ่าย - Collapsible */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => toggleSection('sec4')}
                className="w-full p-4 sm:p-5 bg-slate-50/80 hover:bg-slate-100/80 dark:bg-slate-950/60 dark:hover:bg-slate-950 flex items-center justify-between text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white">
                      4. รายการสินค้า / ค่าบริการ / ค่าใช้จ่าย
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {items.length} รายการ (รวมสุทธิ: {grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿)
                    </p>
                  </div>
                </div>
                {openSections.sec4 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>

              {openSections.sec4 && (
                <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      กรอกชื่อรายการ จำนวน และราคาต่อหน่วย (มีแถวว่างให้กรอกเสมอ)
                    </span>
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
                      <div key={item.id}>
                        {/* Desktop View */}
                        <div className="hidden sm:grid grid-cols-12 gap-2 p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 items-center">
                          <div className="col-span-1 text-center font-mono text-xs font-bold text-slate-400">
                            {idx + 1}
                          </div>
                          <div className="col-span-5">
                            <input
                              type="text"
                              placeholder="พิมพ์ชื่อสินค้าหรือค่าบริการที่นี่..."
                              value={item.description}
                              onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                              className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              min="1"
                              placeholder="จำนวน"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                              className="w-full h-10 px-2 text-center text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs"
                            />
                          </div>
                          <div className="col-span-1">
                            <input
                              type="text"
                              placeholder="หน่วย"
                              value={item.unit}
                              onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                              className="w-full h-10 px-2 text-center text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="ราคา/หน่วย"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateItem(item.id, 'unitPrice', e.target.value)}
                              className="w-full h-10 px-2 text-right text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs"
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

                        {/* Mobile View */}
                        <div className="sm:hidden p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 space-y-2.5">
                          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {(item.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={items.length <= 1}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg disabled:opacity-30 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="รายละเอียดสินค้าหรือค่าบริการ..."
                              value={item.description}
                              onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                              className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <input
                                type="number"
                                min="1"
                                placeholder="จำนวน"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                                className="w-full h-9 px-2 text-center text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900"
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                placeholder="หน่วย"
                                value={item.unit}
                                onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                                className="w-full h-9 px-2 text-center text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900"
                              />
                            </div>
                            <div>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="ราคา/หน่วย"
                                value={item.unitPrice}
                                onChange={(e) => handleUpdateItem(item.id, 'unitPrice', e.target.value)}
                                className="w-full h-9 px-2 text-right text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tax & Discount Calculations */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">ส่วนลดพิเศษ (Discount)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(Number(e.target.value))}
                          className="w-full h-10 px-3 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900"
                        />
                        <select
                          value={discountType}
                          onChange={(e) => setDiscountType(e.target.value as any)}
                          className="h-10 px-2 text-xs rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900 font-bold"
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
                        className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900 font-bold"
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
                        className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900 font-bold"
                      >
                        <option value={0}>ไม่มีการหัก ณ ที่จ่าย (0%)</option>
                        <option value={1}>หัก ณ ที่จ่าย 1% (ขนส่ง/บริการเฉพาะ)</option>
                        <option value={3}>หัก ณ ที่จ่าย 3% (ค่าบริการวิชาชีพ/ว่าความ)</option>
                        <option value={5}>หัก ณ ที่จ่าย 5% (ค่าเช่า/รางวัล)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. วิธีการชำระเงิน และหมายเหตุ - Collapsible */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => toggleSection('sec5')}
                className="w-full p-4 sm:p-5 bg-slate-50/80 hover:bg-slate-100/80 dark:bg-slate-950/60 dark:hover:bg-slate-950 flex items-center justify-between text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white">
                      5. วิธีการชำระเงิน และหมายเหตุ
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      เลือกประเภทการชำระ ({paymentMethod}) และบันทึกหมายเหตุท้ายเอกสาร
                    </p>
                  </div>
                </div>
                {openSections.sec5 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>

              {openSections.sec5 && (
                <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-fadeIn">
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
                          className="w-full h-9 px-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">เลขที่บัญชี</label>
                        <input
                          type="text"
                          value={bankAccountNo}
                          onChange={(e) => setBankAccountNo(e.target.value)}
                          className="w-full h-9 px-2.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ชื่อบัญชี</label>
                        <input
                          type="text"
                          value={bankAccountName}
                          onChange={(e) => setBankAccountName(e.target.value)}
                          className="w-full h-9 px-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900 font-bold"
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
                      className="w-full p-2.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">ชื่อผู้รับเงิน / ผู้สร้างเอกสาร</label>
                      <input
                        type="text"
                        value={collectorName}
                        onChange={(e) => setCollectorName(e.target.value)}
                        className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">ชื่อผู้มีอำนาจลงนาม / อนุมัติ</label>
                      <input
                        type="text"
                        value={approverName}
                        onChange={(e) => setApproverName(e.target.value)}
                        className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6. โลโก้และลายน้ำ - Collapsible */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => toggleSection('sec6')}
                className="w-full p-4 sm:p-5 bg-slate-50/80 hover:bg-slate-100/80 dark:bg-slate-950/60 dark:hover:bg-slate-950 flex items-center justify-between text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white">
                      6. โลโก้และลายน้ำ
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      ตั้งค่าโลโก้บริษัท และลายน้ำพื้นหลังเอกสาร (Watermark)
                    </p>
                  </div>
                </div>
                {openSections.sec6 ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>

              {openSections.sec6 && (
                <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-fadeIn">
                  {/* Logo Config */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/70 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <Upload className="w-4 h-4 text-indigo-500" />
                        <span>แสดงโลโก้บริษัทบนเอกสาร</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={showLogo} 
                          onChange={(e) => setShowLogo(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        <span className="ml-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                          {showLogo ? 'เปิดใช้งาน' : 'ปิด'}
                        </span>
                      </label>
                    </div>

                    {showLogo && (
                      <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          {issuerLogoUrl ? (
                            <div className="relative group w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 flex items-center justify-center flex-shrink-0">
                              <img src={issuerLogoUrl} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                              <button
                                type="button"
                                onClick={() => setIssuerLogoUrl('')}
                                className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title="ลบรูปโลโก้"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 flex-shrink-0">
                              <Upload className="w-5 h-5" />
                            </div>
                          )}

                          <div className="flex-1 space-y-1.5">
                            <label className="px-3 py-1.5 rounded-lg bg-indigo-100/80 dark:bg-indigo-950/80 hover:bg-indigo-200 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 cursor-pointer transition-all inline-flex items-center gap-1.5">
                              <Upload className="w-3.5 h-3.5" />
                              <span>{issuerLogoUrl ? 'เปลี่ยนรูปโลโก้' : 'อัปโหลดรูปภาพโลโก้'}</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleImageUpload(e, (url) => setIssuerLogoUrl(url))} 
                              />
                            </label>
                            <input 
                              type="text" 
                              placeholder="หรือวาง URL รูปภาพโลโก้..." 
                              value={issuerLogoUrl}
                              onChange={(e) => setIssuerLogoUrl(e.target.value)}
                              className="w-full h-9 px-3 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Watermark Config */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/70 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>แสดงลายน้ำพื้นหลังเอกสาร (Watermark)</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={showWatermark} 
                          onChange={(e) => setShowWatermark(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                        <span className="ml-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                          {showWatermark ? 'เปิดใช้งาน' : 'ปิด'}
                        </span>
                      </label>
                    </div>

                    {showWatermark && (
                      <div className="space-y-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-slate-600 dark:text-slate-400">ชนิดลายน้ำ:</span>
                          <button
                            type="button"
                            onClick={() => setWatermarkType('text')}
                            className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                              watermarkType === 'text' 
                                ? 'bg-amber-500 text-white shadow-xs' 
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            ข้อความ (Text)
                          </button>
                          <button
                            type="button"
                            onClick={() => setWatermarkType('image')}
                            className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                              watermarkType === 'image' 
                                ? 'bg-amber-500 text-white shadow-xs' 
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            โลโก้/รูปภาพ (Image)
                          </button>
                        </div>

                        {watermarkType === 'text' ? (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ข้อความลายน้ำ</label>
                            <input 
                              type="text" 
                              value={watermarkText} 
                              onChange={(e) => setWatermarkText(e.target.value)}
                              placeholder="ตัวอย่าง: สำนักงานกฎหมาย / OFFICIAL RECEIPT" 
                              className="w-full h-9 px-3 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <label className="px-3 py-1.5 rounded-lg bg-amber-100/80 dark:bg-amber-950/80 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-400 font-bold text-xs border border-amber-200 dark:border-amber-800 cursor-pointer transition-all inline-flex items-center gap-1.5">
                                <Upload className="w-3.5 h-3.5" />
                                <span>อัปโหลดรูปภาพลายน้ำ</span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={(e) => handleImageUpload(e, (url) => setWatermarkImageUrl(url))} 
                                />
                              </label>
                              <span className="text-[10px] text-slate-400">(หากไม่ใส่ จะใช้รูปภาพโลโก้หลัก)</span>
                            </div>
                            <input 
                              type="text" 
                              placeholder="หรือวาง URL รูปภาพลายน้ำ..." 
                              value={watermarkImageUrl}
                              onChange={(e) => setWatermarkImageUrl(e.target.value)}
                              className="w-full h-9 px-3 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-400 bg-white dark:bg-white text-slate-900 dark:text-slate-900"
                            />
                          </div>
                        )}

                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                            <span>ความเข้มโปร่งแสงลายน้ำ (Opacity)</span>
                            <span>{Math.round(watermarkOpacity * 100)}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0.04" 
                            max="0.35" 
                            step="0.01" 
                            value={watermarkOpacity} 
                            onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                            className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Save & Actions Bottom Bar */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => handleResetForm()}
                className="h-11 px-4 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>ล้างฟอร์ม</span>
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
              <div className="p-3 sm:p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Printer className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-extrabold text-white flex flex-wrap items-center gap-2">
                      <span>ตัวอย่างเอกสาร A4 ก่อนสั่งพิมพ์</span>
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
                    <span>{isPreviewUnsaved ? 'สั่งพิมพ์และบันทึก (A4)' : 'สั่งพิมพ์ / บันทึก PDF (A4)'}</span>
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

              {/* Printable A4 Document Sheet View */}
              <div className="p-3 sm:p-8 overflow-y-auto overflow-x-auto flex-1 bg-slate-800/50 flex flex-col items-center justify-start min-w-0">
                {/* Mobile Scroll Hint Banner */}
                <div className="sm:hidden w-full max-w-[210mm] mb-2.5 px-3 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-200 text-[11px] font-bold flex items-center justify-between gap-2 flex-shrink-0">
                  <span className="flex items-center gap-1.5">
                    📄 แสดงผลสัดส่วนกระดาษ A4 จริง (ไม่ย่อส่วน)
                  </span>
                  <span className="text-[10px] text-indigo-300 font-semibold">
                    เลื่อนซ้าย-ขวาเพื่อดูเต็มฉบับ ↔️
                  </span>
                </div>

                <ReceiptA4Sheet doc={selectedReceiptForPreview} printableId="printable-a4-receipt" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
