import React from 'react';
import { motion } from 'motion/react';
import {
  X,
  FileCheck,
  Building2,
  UserCheck,
  CreditCard,
  DollarSign,
  Sparkles,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Upload,
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
  User,
  Info
} from 'lucide-react';
import { ReceiptItem, SavedIssuerProfile, SavedCustomerProfile } from '../types';

export interface ReceiptEditModalProps {
  activeStep: number;
  setActiveStep: (step: number) => void;
  onClose: () => void;
  
  // Step 1: Head & Doc
  docType: 'receipt' | 'tax_invoice' | 'invoice' | 'quotation' | 'temp_receipt';
  setDocType: (val: 'receipt' | 'tax_invoice' | 'invoice' | 'quotation' | 'temp_receipt') => void;
  receiptNo: string;
  setReceiptNo: (val: string) => void;
  generateAutoNo: (type: string) => string;
  issueDate: string;
  setIssueDate: (val: string) => void;
  dueDate: string;
  setDueDate: (val: string) => void;
  refNo: string;
  setRefNo: (val: string) => void;

  // Step 2: Issuer Profile
  issuerName: string;
  setIssuerName: (val: string) => void;
  issuerTaxId: string;
  setIssuerTaxId: (val: string) => void;
  issuerBranch: string;
  setIssuerBranch: (val: string) => void;
  issuerAddress: string;
  setIssuerAddress: (val: string) => void;
  issuerPhone: string;
  setIssuerPhone: (val: string) => void;
  issuerEmail: string;
  setIssuerEmail: (val: string) => void;
  issuerProfiles: SavedIssuerProfile[];
  selectedIssuerProfileId?: string;
  onSelectIssuerProfile: (id: string) => void;
  handleSaveIssuerInfo: () => void;
  onDeleteIssuerProfile: (id: string, e?: React.MouseEvent) => void;
  onClearIssuerForm: () => void;
  issuerSaveSuccessMsg: boolean;
  issuerSaveMessage?: string;

  // Step 3: Customer Profile
  customerName: string;
  setCustomerName: (val: string) => void;
  customerTaxId: string;
  setCustomerTaxId: (val: string) => void;
  customerBranch: string;
  setCustomerBranch: (val: string) => void;
  customerAddress: string;
  setCustomerAddress: (val: string) => void;
  customerPhone: string;
  setCustomerPhone: (val: string) => void;
  customerEmail: string;
  setCustomerEmail: (val: string) => void;
  customerProfiles: SavedCustomerProfile[];
  selectedCustomerProfileId?: string;
  onSelectCustomerProfile: (id: string) => void;
  handleSaveCustomerInfo: () => void;
  onDeleteCustomerProfile: (id: string, e?: React.MouseEvent) => void;
  onClearCustomerForm: () => void;
  customerSaveSuccessMsg: boolean;
  customerSaveMessage?: string;

  // Step 4: Items
  items: ReceiptItem[];
  handleAddItem: () => void;
  handleUpdateItem: (id: string, field: keyof ReceiptItem, val: any) => void;
  handleRemoveItem: (id: string) => void;
  handleApplyPreset: (preset: 'legal_service' | 'court_fee' | 'retainer' | 'general') => void;
  subtotal: number;

  // Step 5: Payment, Tax & Discount
  discountType: 'flat' | 'percent';
  setDiscountType: (val: 'flat' | 'percent') => void;
  discountValue: number;
  setDiscountValue: (val: number) => void;
  discountAmount: number;
  vatType: 'no_vat' | 'vat_7_add' | 'vat_7_included';
  setVatType: (val: 'no_vat' | 'vat_7_add' | 'vat_7_included') => void;
  vatAmount: number;
  withholdingTaxPercent: number;
  setWithholdingTaxPercent: (val: number) => void;
  withholdingTaxAmount: number;
  paymentMethod: 'cash' | 'transfer' | 'cheque' | 'credit' | 'qr';
  setPaymentMethod: (val: 'cash' | 'transfer' | 'cheque' | 'credit' | 'qr') => void;
  bankName: string;
  setBankName: (val: string) => void;
  bankAccountNo: string;
  setBankAccountNo: (val: string) => void;
  bankAccountName: string;
  setBankAccountName: (val: string) => void;
  chequeNo: string;
  setChequeNo: (val: string) => void;
  chequeDate: string;
  setChequeDate: (val: string) => void;
  grandTotal: number;
  grandTotalTextThai: string;

  // Step 6: Signatures, Logo & Watermark
  notes: string;
  setNotes: (val: string) => void;
  showSignatures: boolean;
  setShowSignatures: (val: boolean) => void;
  collectorName: string;
  setCollectorName: (val: string) => void;
  approverName: string;
  setApproverName: (val: string) => void;
  showLogo: boolean;
  setShowLogo: (val: boolean) => void;
  issuerLogoUrl: string;
  setIssuerLogoUrl: (val: string) => void;
  showWatermark: boolean;
  setShowWatermark: (val: boolean) => void;
  watermarkType: 'text' | 'image';
  setWatermarkType: (val: 'text' | 'image') => void;
  watermarkText: string;
  setWatermarkText: (val: string) => void;
  watermarkImageUrl: string;
  setWatermarkImageUrl: (val: string) => void;
  watermarkOpacity: number;
  setWatermarkOpacity: (val: number) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => void;
  handleSaveLogoAndWatermark?: () => void;
  logoWatermarkSaveSuccessMsg?: boolean;
}

export const STEP_ITEMS = [
  { step: 1, title: 'หัวเอกสาร & วันที่', icon: FileCheck, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' },
  { step: 2, title: 'ผู้ออกเอกสาร (สำนักงาน)', icon: Building2, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
  { step: 3, title: 'ผู้ว่าจ้าง / ลูกค้า', icon: UserCheck, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30' },
  { step: 4, title: 'รายการสินค้า / บริการ', icon: CreditCard, color: 'text-purple-500 bg-purple-500/10 border-purple-500/30' },
  { step: 5, title: 'การชำระเงิน, ส่วนลด & ภาษี', icon: DollarSign, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
  { step: 6, title: 'ลายเซ็น, โลโก้ & ลายน้ำ', icon: Sparkles, color: 'text-rose-500 bg-rose-500/10 border-rose-500/30' },
];

export function ReceiptEditModal(props: ReceiptEditModalProps) {
  const { activeStep, setActiveStep, onClose } = props;
  const currentStepDef = STEP_ITEMS.find(s => s.step === activeStep) || STEP_ITEMS[0];
  const StepIcon = currentStepDef.icon;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-left shadow-2xl shadow-black/50 ring-1 ring-white/10"
      >
        {/* Modal Header with Step Badge & Quick Tabs */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xs flex-shrink-0 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold border shadow-xs ${currentStepDef.color}`}>
                <StepIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-600 dark:text-indigo-400 block">
                  ขั้นตอนที่ {activeStep} จาก 6
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-white">
                  ข้อ {activeStep}: {currentStepDef.title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step Quick Switcher Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {STEP_ITEMS.map((item) => {
              const isActive = item.step === activeStep;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setActiveStep(item.step)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    {item.step}
                  </span>
                  <span>{item.title.split('/')[0].split(',')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body: Active Step Fields */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* STEP 1: ข้อมูลหัวเอกสารและเลขที่ */}
          {activeStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ประเภทเอกสารที่ต้องการออก *
                </label>
                <select
                  value={props.docType}
                  onChange={(e) => props.setDocType(e.target.value as any)}
                  className="w-full h-11 px-3 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                >
                  <option value="receipt">🧾 ใบเสร็จรับเงิน (RECEIPT)</option>
                  <option value="tax_invoice">🏢 ใบเสร็จรับเงิน / ใบกำกับภาษี (RECEIPT / TAX INVOICE)</option>
                  <option value="invoice">📋 ใบแจ้งหนี้ / ใบวางบิล (INVOICE / BILL)</option>
                  <option value="quotation">💼 ใบเสนอราคา (QUOTATION)</option>
                  <option value="temp_receipt">⏳ ใบเสร็จรับเงินชั่วคราว (TEMPORARY RECEIPT)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">เลขที่เอกสาร (Document No.) *</label>
                    <button
                      type="button"
                      onClick={() => props.setReceiptNo(props.generateAutoNo(props.docType))}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      สุ่มเลขอัตโนมัติ
                    </button>
                  </div>
                  <input
                    type="text"
                    value={props.receiptNo}
                    onChange={(e) => props.setReceiptNo(e.target.value)}
                    placeholder="REC-202608-001"
                    className="w-full h-11 px-3 text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">วันที่ออกเอกสาร *</label>
                  <input
                    type="date"
                    value={props.issueDate}
                    onChange={(e) => props.setIssueDate(e.target.value)}
                    className="w-full h-11 px-3 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">กำหนดชำระเงิน (ถ้ามี)</label>
                  <input
                    type="date"
                    value={props.dueDate}
                    onChange={(e) => props.setDueDate(e.target.value)}
                    className="w-full h-11 px-3 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">เลขที่อ้างอิง / คดี / สัญญา</label>
                  <input
                    type="text"
                    value={props.refNo}
                    onChange={(e) => props.setRefNo(e.target.value)}
                    placeholder="อ้างอิงคดีดำที่ 123/2569"
                    className="w-full h-11 px-3 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ข้อมูลผู้ออกใบเสร็จ (ผู้ขาย/สำนักงาน) */}
          {activeStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Profile Selection & Action Bar */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5 shadow-xs">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  {/* Dropdown Selector */}
                  <div className="flex-1 flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <select
                        value={props.selectedIssuerProfileId || ''}
                        onChange={(e) => props.onSelectIssuerProfile(e.target.value)}
                        className="w-full h-10 pl-3 pr-8 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs cursor-pointer truncate"
                      >
                        <option value="">✨ เลือกโปรไฟล์ผู้ออกเอกสาร ({props.issuerProfiles.length} รายการ)</option>
                        {props.issuerProfiles.map((p) => (
                          <option key={p.id} value={p.id}>
                            🏢 {p.name} {p.taxId ? `(${p.taxId})` : ''} {p.branch ? `- ${p.branch}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {props.selectedIssuerProfileId && (
                      <button
                        type="button"
                        onClick={(e) => props.onDeleteIssuerProfile(props.selectedIssuerProfileId!, e)}
                        className="h-10 px-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all flex-shrink-0"
                        title="ลบโปรไฟล์ผู้ออกเอกสารที่เลือกนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">ลบ</span>
                      </button>
                    )}
                  </div>

                  {/* Buttons: Save & Clear */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={props.onClearIssuerForm}
                      className="flex-1 sm:flex-none h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                      title="ล้างข้อมูลในช่องกรอกออกทั้งหมด"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>เคลียร์ข้อมูล</span>
                    </button>

                    <button
                      type="button"
                      onClick={props.handleSaveIssuerInfo}
                      className="flex-1 sm:flex-none h-10 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shadow-emerald-600/20 active:scale-95 transition-all"
                      title="บันทึกข้อมูลเข้าสู่ระบบจดจำ"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>บันทึกจำไว้</span>
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>💡 ระบบจะจำข้อมูลล่าสุดไว้เสมอ และไม่บันทึกซ้ำหากข้อมูลตรงกัน</span>
                </div>
              </div>

              {props.issuerSaveSuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                  <span>{props.issuerSaveMessage || 'บันทึกข้อมูลผู้ออกใบเสร็จสำเร็จ! ระบบจะจดจำข้อมูลนี้ให้อัตโนมัติ'}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">ชื่อสำนักงาน / บริษัท / ผู้ออกเอกสาร *</label>
                <input
                  type="text"
                  value={props.issuerName}
                  onChange={(e) => props.setIssuerName(e.target.value)}
                  placeholder="สำนักงานกฎหมาย & ทนายความ เดชา นิติธรรม"
                  className="w-full h-11 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">เลขประจำตัวผู้เสียภาษี (13 หลัก)</label>
                  <input
                    type="text"
                    value={props.issuerTaxId}
                    onChange={(e) => props.setIssuerTaxId(e.target.value)}
                    placeholder="0105560000000"
                    className="w-full h-11 px-3 text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">สาขา</label>
                  <input
                    type="text"
                    value={props.issuerBranch}
                    onChange={(e) => props.setIssuerBranch(e.target.value)}
                    placeholder="สำนักงานใหญ่"
                    className="w-full h-11 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">ที่อยู่สถานประกอบการ</label>
                <textarea
                  rows={2}
                  value={props.issuerAddress}
                  onChange={(e) => props.setIssuerAddress(e.target.value)}
                  placeholder="เลขที่ 123/45 ถนนรัชดาภิเษก แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900"
                  className="w-full p-3 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={props.issuerPhone}
                    onChange={(e) => props.setIssuerPhone(e.target.value)}
                    placeholder="02-123-4567, 089-123-4567"
                    className="w-full h-11 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">อีเมล</label>
                  <input
                    type="text"
                    value={props.issuerEmail}
                    onChange={(e) => props.setIssuerEmail(e.target.value)}
                    placeholder="contact@lawfirm.co.th"
                    className="w-full h-11 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ข้อมูลผู้ว่าจ้าง / ลูกค้า */}
          {activeStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Customer Profile Selection & Action Bar */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5 shadow-xs">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  {/* Dropdown Selector */}
                  <div className="flex-1 flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <select
                        value={props.selectedCustomerProfileId || ''}
                        onChange={(e) => props.onSelectCustomerProfile(e.target.value)}
                        className="w-full h-10 pl-3 pr-8 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs cursor-pointer truncate"
                      >
                        <option value="">✨ เลือกลูกค้า / ผู้ว่าจ้างที่บันทึกไว้ ({props.customerProfiles.length} รายการ)</option>
                        {props.customerProfiles.map((p) => (
                          <option key={p.id} value={p.id}>
                            👤 {p.name} {p.taxId ? `(${p.taxId})` : ''} {p.branch ? `- ${p.branch}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {props.selectedCustomerProfileId && (
                      <button
                        type="button"
                        onClick={(e) => props.onDeleteCustomerProfile(props.selectedCustomerProfileId!, e)}
                        className="h-10 px-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all flex-shrink-0"
                        title="ลบรายชื่อผู้ว่าจ้างที่เลือกนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">ลบ</span>
                      </button>
                    )}
                  </div>

                  {/* Buttons: Save & Clear */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={props.onClearCustomerForm}
                      className="flex-1 sm:flex-none h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                      title="ล้างข้อมูลในช่องกรอกของลูกค้าออกทั้งหมด"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>เคลียร์ข้อมูล</span>
                    </button>

                    <button
                      type="button"
                      onClick={props.handleSaveCustomerInfo}
                      className="flex-1 sm:flex-none h-10 px-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shadow-cyan-600/20 active:scale-95 transition-all"
                      title="บันทึกข้อมูลผู้ว่าจ้างเข้าสู่ระบบจดจำ"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>บันทึกจำไว้</span>
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>💡 หากไม่กดบันทึก ข้อมูลจะไม่ถูกเพิ่มลงรายการ | ข้อมูลที่เลือกใช้ล่าสุดจะถูกจดจำไว้เสมอ</span>
                </div>
              </div>

              {props.customerSaveSuccessMsg && (
                <div className="p-3 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800 rounded-xl text-xs font-bold text-cyan-700 dark:text-cyan-300 flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-cyan-500" />
                  <span>{props.customerSaveMessage || 'บันทึกข้อมูลผู้ว่าจ้างสำเร็จ!'}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  ชื่อลูกค้า / บริษัทผู้ว่าจ้าง (ผู้ชำระเงิน) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="บริษัท เอบีซี จำกัด / นายสมชาย ใจดี"
                  value={props.customerName}
                  onChange={(e) => props.setCustomerName(e.target.value)}
                  className="w-full h-11 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">เลขประจำตัวผู้เสียภาษี / บัตรประชาชน</label>
                  <input
                    type="text"
                    placeholder="13 หลัก"
                    value={props.customerTaxId}
                    onChange={(e) => props.setCustomerTaxId(e.target.value)}
                    className="w-full h-11 px-3 text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">สาขา</label>
                  <input
                    type="text"
                    placeholder="สำนักงานใหญ่ / สาขา 00001"
                    value={props.customerBranch}
                    onChange={(e) => props.setCustomerBranch(e.target.value)}
                    className="w-full h-11 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">ที่อยู่สำหรับออกใบเสร็จ</label>
                <textarea
                  rows={2}
                  placeholder="ที่อยู่สำหรับลงในใบเสร็จ / ใบกำกับภาษี..."
                  value={props.customerAddress}
                  onChange={(e) => props.setCustomerAddress(e.target.value)}
                  className="w-full p-3 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    placeholder="081-234-5678"
                    value={props.customerPhone}
                    onChange={(e) => props.setCustomerPhone(e.target.value)}
                    className="w-full h-11 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">อีเมล</label>
                  <input
                    type="text"
                    placeholder="client@email.com"
                    value={props.customerEmail}
                    onChange={(e) => props.setCustomerEmail(e.target.value)}
                    className="w-full h-11 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: รายการสินค้า / ค่าบริการ */}
          {activeStep === 4 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Items List */}
              <div className="space-y-3">
                {props.items.map((item, idx) => (
                  <div key={item.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ={(item.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                        </span>
                        <button
                          type="button"
                          onClick={() => props.handleRemoveItem(item.id)}
                          disabled={props.items.length <= 1}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg disabled:opacity-30 cursor-pointer"
                          title="ลบแถว"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          placeholder="รายละเอียดสินค้าหรือค่าบริการ..."
                          value={item.description}
                          onChange={(e) => props.handleUpdateItem(item.id, 'description', e.target.value)}
                          className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="จำนวน"
                          value={item.quantity}
                          onChange={(e) => props.handleUpdateItem(item.id, 'quantity', e.target.value)}
                          className="w-full h-10 px-2 text-center text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="หน่วย"
                          value={item.unit}
                          onChange={(e) => props.handleUpdateItem(item.id, 'unit', e.target.value)}
                          className="w-full h-10 px-2 text-center text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="ราคา/หน่วย"
                          value={item.unitPrice}
                          onChange={(e) => props.handleUpdateItem(item.id, 'unitPrice', e.target.value)}
                          className="w-full h-10 px-2 text-right text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={props.handleAddItem}
                  className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ เพิ่มแถวรายการใหม่</span>
                </button>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">ยอดรวมเบื้องต้น (Subtotal)</span>
                  <span className="text-base font-mono font-black text-indigo-600 dark:text-indigo-400">
                    {props.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: การชำระเงิน, ส่วนลด & ภาษี */}
          {activeStep === 5 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Payment Method Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">ช่องทางการชำระเงิน</label>
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
                      onClick={() => props.setPaymentMethod(m.id as any)}
                      className={`h-11 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        props.paymentMethod === m.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {props.paymentMethod === 'transfer' && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">ธนาคาร</label>
                    <input
                      type="text"
                      placeholder="เช่น กสิกรไทย, ไทยพาณิชย์"
                      value={props.bankName}
                      onChange={(e) => props.setBankName(e.target.value)}
                      className="w-full h-10 px-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">เลขที่บัญชี</label>
                    <input
                      type="text"
                      placeholder="xxx-x-xxxxx-x"
                      value={props.bankAccountNo}
                      onChange={(e) => props.setBankAccountNo(e.target.value)}
                      className="w-full h-10 px-2.5 text-xs font-mono font-bold rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">ชื่อบัญชี</label>
                    <input
                      type="text"
                      placeholder="ชื่อบัญชีรับเงิน"
                      value={props.bankAccountName}
                      onChange={(e) => props.setBankAccountName(e.target.value)}
                      className="w-full h-10 px-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-bold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                    />
                  </div>
                </div>
              )}

              {/* Discount, VAT, WHT */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* Discount */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">ส่วนลด (Discount)</label>
                    <div className="flex items-center gap-1 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => props.setDiscountType('flat')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${props.discountType === 'flat' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                      >
                        บาท
                      </button>
                      <button
                        type="button"
                        onClick={() => props.setDiscountType('percent')}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${props.discountType === 'percent' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                      >
                        %
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={props.discountValue}
                    onChange={(e) => props.setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-full h-9 px-2.5 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                  <div className="text-[10px] text-right font-mono text-slate-500">
                    ลด: -{props.discountAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                  </div>
                </div>

                {/* VAT */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">ภาษีมูลค่าเพิ่ม (VAT 7%)</label>
                  <select
                    value={props.vatType}
                    onChange={(e) => props.setVatType(e.target.value as any)}
                    className="w-full h-9 px-2 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="no_vat">ไม่มี VAT (0%)</option>
                    <option value="vat_7_add">+ VAT 7% (บวกเพิ่ม)</option>
                    <option value="vat_7_included">รวม VAT 7% (ในราคาแล้ว)</option>
                  </select>
                  <div className="text-[10px] text-right font-mono text-slate-500">
                    VAT: +{props.vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                  </div>
                </div>

                {/* Withholding Tax */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">หัก ณ ที่จ่าย (WHT)</label>
                  <select
                    value={props.withholdingTaxPercent}
                    onChange={(e) => props.setWithholdingTaxPercent(Number(e.target.value))}
                    className="w-full h-9 px-2 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    <option value={0}>ไม่มีการหัก (0%)</option>
                    <option value={1}>หัก 1% (ค่าขนส่ง)</option>
                    <option value={2}>หัก 2% (ค่าโฆษณา)</option>
                    <option value={3}>หัก 3% (ค่าบริการ / ทนายความ)</option>
                    <option value={5}>หัก 5% (ค่าเช่า)</option>
                  </select>
                  <div className="text-[10px] text-right font-mono text-slate-500">
                    หัก: -{props.withholdingTaxAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                  </div>
                </div>
              </div>

              {/* Grand Total Summary Box */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                <div>
                  <span className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider block">ยอดรวมสุทธิทั้งสิ้น (GRAND TOTAL)</span>
                  <span className="text-xs text-slate-300 font-bold">({props.grandTotalTextThai || '-'})</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                  {props.grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: ลายเซ็น, โลโก้ & ลายน้ำ */}
          {activeStep === 6 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">หมายเหตุท้ายเอกสาร</label>
                <textarea
                  rows={2}
                  value={props.notes}
                  onChange={(e) => props.setNotes(e.target.value)}
                  placeholder="ข้อความหมายเหตุ เช่น ขอบคุณที่ใช้บริการ / กรุณาเก็บเอกสารนี้ไว้..."
                  className="w-full p-3 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs resize-none"
                />
              </div>

              {/* Signatures Toggle & Fields */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <UserCheck className="w-4 h-4 text-indigo-500" />
                    <span>แสดงส่วนลงนาม / ลายเซ็นท้ายเอกสาร</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={props.showSignatures} 
                      onChange={(e) => props.setShowSignatures(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {props.showSignatures && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">ชื่อผู้รับเงิน / ผู้จัดทำ</label>
                      <input
                        type="text"
                        value={props.collectorName}
                        onChange={(e) => props.setCollectorName(e.target.value)}
                        placeholder="ชื่อผู้รับเงิน"
                        className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">ชื่อผู้มีอำนาจลงนาม / อนุมัติ</label>
                      <input
                        type="text"
                        value={props.approverName}
                        onChange={(e) => props.setApproverName(e.target.value)}
                        placeholder="ชื่อผู้มีอำนาจลงนาม"
                        className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Logo Settings */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Building2 className="w-4 h-4 text-emerald-500" />
                    <span>แสดงตราสัญลักษณ์ / โลโก้หัวเอกสาร</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={props.showLogo} 
                      onChange={(e) => props.setShowLogo(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {props.showLogo && (
                  <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      {props.issuerLogoUrl ? (
                        <img 
                          src={props.issuerLogoUrl} 
                          alt="Logo" 
                          className="w-12 h-12 rounded-lg object-contain border border-slate-300 dark:border-slate-700 bg-white p-1"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-[10px] text-slate-400 text-center">
                          ไม่มีโลโก้
                        </div>
                      )}

                      <div className="flex-1">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold cursor-pointer hover:bg-indigo-100">
                          <Upload className="w-3.5 h-3.5" />
                          <span>อัปโหลดรูปโลโก้</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => props.handleImageUpload(e, props.setIssuerLogoUrl)} 
                            className="hidden" 
                          />
                        </label>
                        {props.issuerLogoUrl && (
                          <button
                            type="button"
                            onClick={() => props.setIssuerLogoUrl('')}
                            className="ml-2 text-xs text-rose-500 hover:underline cursor-pointer"
                          >
                            ลบรูป
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Watermark Settings */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>แสดงลายน้ำพื้นหลังเอกสาร (Watermark)</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={props.showWatermark} 
                      onChange={(e) => props.setShowWatermark(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {props.showWatermark && (
                  <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">ข้อความลายน้ำ</label>
                      <input 
                        type="text" 
                        value={props.watermarkText} 
                        onChange={(e) => props.setWatermarkText(e.target.value)}
                        placeholder="ตัวอย่าง: OFFICIAL RECEIPT / สำนักงานกฎหมาย" 
                        className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 shadow-xs"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        <span>ความโปร่งแสงลายน้ำ: {Math.round(props.watermarkOpacity * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.04" 
                        max="0.35" 
                        step="0.01" 
                        value={props.watermarkOpacity} 
                        onChange={(e) => props.setWatermarkOpacity(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Save Logo & Watermark Settings Button */}
              {props.handleSaveLogoAndWatermark && (
                <div className="pt-1 flex items-center justify-between bg-amber-50/70 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50">
                  <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                    💾 บันทึกการตั้งค่า โลโก้ และ ลายน้ำ เป็นค่าเริ่มต้นของระบบ
                  </div>
                  <button
                    type="button"
                    onClick={props.handleSaveLogoAndWatermark}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>บันทึกโลโก้ & ลายน้ำ</span>
                  </button>
                </div>
              )}

              {props.logoWatermarkSaveSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                  <span>บันทึกการตั้งค่าโลโก้และลายน้ำสำเร็จ!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer: Navigation Controls */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xs flex items-center justify-between gap-2 flex-shrink-0">
          <div>
            {activeStep > 1 && (
              <button
                type="button"
                onClick={() => setActiveStep(activeStep - 1)}
                className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ข้อก่อนหน้า ({activeStep - 1})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeStep < 6 ? (
              <button
                type="button"
                onClick={() => setActiveStep(activeStep + 1)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
              >
                <span>ข้อถัดไป ({activeStep + 1})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>เสร็จสิ้น & ดูพรีวิว</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
