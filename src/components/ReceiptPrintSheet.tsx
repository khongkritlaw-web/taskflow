import React from 'react';
import { ReceiptDoc, PaperSizeConfig } from '../types';

export const PAPER_SIZE_PRESETS: Record<string, { name: string; widthMm: number; heightMm: number; desc: string; isSlip?: boolean; icon?: string; orientation?: 'portrait' | 'landscape' }> = {
  a4: { name: 'A4', widthMm: 210, heightMm: 297, desc: 'มาตรฐาน (210 × 297 mm)', icon: '📄', orientation: 'portrait' },
  a5: { name: 'A5 แนวตั้ง', widthMm: 148, heightMm: 210, desc: 'ครึ่ง A4 แนวตั้ง (148 × 210 mm)', icon: '📑', orientation: 'portrait' },
  a5_landscape: { name: 'A5 แนวนอน', widthMm: 210, heightMm: 148, desc: 'ครึ่ง A4 แนวนอน (210 × 148 mm)', icon: '📃', orientation: 'landscape' },
  a6: { name: 'A6', widthMm: 105, heightMm: 148, desc: 'ขนาดเล็ก (105 × 148 mm)', icon: '📋', orientation: 'portrait' },
  letter: { name: 'US Letter', widthMm: 215.9, heightMm: 279.4, desc: 'มาตรฐาน US (8.5 × 11 นิ้ว)', icon: '📄', orientation: 'portrait' },
  slip_80: { name: 'สลิป 80mm', widthMm: 80, heightMm: 210, desc: 'POS สลิป (80 มม.)', isSlip: true, icon: '🧾', orientation: 'portrait' },
  slip_58: { name: 'สลิป 58mm', widthMm: 58, heightMm: 160, desc: 'Mini POS (58 มม.)', isSlip: true, icon: '🧾', orientation: 'portrait' }
};

export const PAPER_SIZE_PRESETS_LIST = Object.entries(PAPER_SIZE_PRESETS).map(([id, val]) => ({
  id: id as any,
  ...val
}));

export const DEFAULT_PAPER_CONFIG: PaperSizeConfig = {
  preset: 'a4',
  name: 'A4',
  widthMm: 210,
  heightMm: 297,
  unit: 'mm',
  customWidth: 210,
  customHeight: 297,
  orientation: 'portrait',
  marginMm: 10,
  scale: 1,
  isSlip: false
};

interface ReceiptPrintSheetProps {
  doc: ReceiptDoc;
  paperConfig?: PaperSizeConfig;
  printableId?: string;
  className?: string;
  isPrintMode?: boolean;
}

export function getDocTypeName(type: string) {
  switch (type) {
    case 'receipt': return 'ใบเสร็จรับเงิน (RECEIPT)';
    case 'tax_invoice': return 'ใบเสร็จรับเงิน / ใบกำกับภาษี (RECEIPT / TAX INVOICE)';
    case 'invoice': return 'ใบแจ้งหนี้ / ใบวางบิล (INVOICE)';
    case 'quotation': return 'ใบเสนอราคา (QUOTATION)';
    case 'temp_receipt': return 'ใบเสร็จรับเงินชั่วคราว (TEMPORARY RECEIPT)';
    default: return 'ใบเสร็จรับเงิน';
  }
}

export function ReceiptPrintSheet({
  doc,
  paperConfig = DEFAULT_PAPER_CONFIG,
  printableId = 'printable-active-receipt',
  className = '',
  isPrintMode = false
}: ReceiptPrintSheetProps) {
  // Determine effective dimensions
  let effectiveWidth = paperConfig.widthMm;
  let effectiveHeight = paperConfig.heightMm;

  if (paperConfig.preset === 'custom') {
    let rawW = paperConfig.customWidth;
    let rawH = paperConfig.customHeight;
    if (paperConfig.unit === 'cm') {
      rawW *= 10;
      rawH *= 10;
    } else if (paperConfig.unit === 'in') {
      rawW *= 25.4;
      rawH *= 25.4;
    }

    if (paperConfig.orientation === 'landscape' && rawW < rawH) {
      effectiveWidth = rawH;
      effectiveHeight = rawW;
    } else if (paperConfig.orientation === 'portrait' && rawW > rawH) {
      effectiveWidth = rawH;
      effectiveHeight = rawW;
    } else {
      effectiveWidth = rawW;
      effectiveHeight = rawH;
    }
  } else {
    if (paperConfig.orientation === 'landscape' && paperConfig.preset !== 'a5_landscape') {
      if (effectiveWidth < effectiveHeight) {
        const temp = effectiveWidth;
        effectiveWidth = effectiveHeight;
        effectiveHeight = temp;
      }
    } else if (paperConfig.orientation === 'portrait' && paperConfig.preset === 'a5_landscape') {
      // If user forced portrait on a5_landscape
      effectiveWidth = 148;
      effectiveHeight = 210;
    }
  }

  const isThermalSlip = paperConfig.isSlip || paperConfig.preset === 'slip_80' || paperConfig.preset === 'slip_58' || effectiveWidth <= 85;
  const isCompact = effectiveWidth <= 150 && !isThermalSlip;
  const isLandscape = effectiveWidth > effectiveHeight;

  // Render POS Thermal Slip Layout
  if (isThermalSlip) {
    const slipWidth = effectiveWidth || 80;
    const isUltraNarrow = slipWidth <= 60; // 58mm
    
    return (
      <div
        id={printableId}
        data-print-width={`${slipWidth}mm`}
        data-print-height={`${effectiveHeight || 200}mm`}
        data-print-margin={`${paperConfig.marginMm || 3}mm`}
        className={`bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 font-mono select-text flex-shrink-0 text-left overflow-hidden printable-active-sheet ${className}`}
        style={{
          width: `${slipWidth}mm`,
          minWidth: `${slipWidth}mm`,
          minHeight: `${effectiveHeight || 180}mm`,
          padding: isUltraNarrow ? '3mm 2mm' : '4mm 3mm',
          fontSize: isUltraNarrow ? '9px' : '10px',
          lineHeight: '1.25',
          color: '#000000'
        }}
      >
        {/* Slip Header */}
        <div className="text-center space-y-1 pb-2 border-b border-dashed border-slate-800">
          {doc.showLogo !== false && doc.issuerLogoUrl && (
            <img 
              src={doc.issuerLogoUrl} 
              alt="Logo" 
              className="w-10 h-10 object-contain mx-auto mb-1 filter grayscale"
            />
          )}
          <h2 className="font-bold text-xs uppercase tracking-tight text-black">
            {doc.issuerName || 'สำนักงานกฎหมาย'}
          </h2>
          <p className="text-[9px] text-slate-700 leading-tight">
            {doc.issuerAddress || '-'}
          </p>
          <div className="text-[9px] text-slate-700">
            {doc.issuerTaxId && <span>TAX: {doc.issuerTaxId} </span>}
            {doc.issuerPhone && <span>โทร: {doc.issuerPhone}</span>}
          </div>
          <div className="pt-1">
            <span className="inline-block px-2 py-0.5 border border-black font-bold text-[9px] uppercase">
              {getDocTypeName(doc.docType).split('(')[0]}
            </span>
          </div>
        </div>

        {/* Doc Info & Customer */}
        <div className="py-2 border-b border-dashed border-slate-800 text-[9px] space-y-0.5">
          <div className="flex justify-between">
            <span className="text-slate-600">เลขที่:</span>
            <span className="font-bold text-black">{doc.receiptNo || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">วันที่:</span>
            <span className="text-black">{doc.issueDate || '-'}</span>
          </div>
          {doc.refNo && (
            <div className="flex justify-between">
              <span className="text-slate-600">อ้างอิง:</span>
              <span className="text-black">{doc.refNo}</span>
            </div>
          )}
          <div className="pt-1 border-t border-dotted border-slate-400">
            <span className="text-slate-600 block">ลูกค้า:</span>
            <span className="font-bold text-black block">{doc.customerName || '-'}</span>
            {doc.customerTaxId && <span className="text-slate-700 block">TAX: {doc.customerTaxId}</span>}
            {doc.customerPhone && <span className="text-slate-700 block">โทร: {doc.customerPhone}</span>}
          </div>
        </div>

        {/* Items List */}
        <div className="py-2 border-b border-dashed border-slate-800">
          <div className="flex justify-between text-[9px] font-bold pb-1 border-b border-dotted border-slate-400">
            <span>รายการ</span>
            <span>จำนวนเงิน</span>
          </div>
          <div className="divide-y divide-dotted divide-slate-300 py-1 space-y-1">
            {(doc.items || []).map((item, idx) => (
              <div key={idx} className="pt-1">
                <div className="font-bold text-[9px] text-black">
                  {idx + 1}. {item.description || '-'}
                </div>
                <div className="flex justify-between text-[9px] text-slate-700 pl-2">
                  <span>{item.quantity} {item.unit} × {(item.unitPrice || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                  <span className="font-bold text-black">{(item.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calculations */}
        <div className="py-2 border-b border-dashed border-slate-800 text-[9px] space-y-1 font-mono">
          <div className="flex justify-between">
            <span>รวมเงิน (Subtotal):</span>
            <span>{(doc.subtotal || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
          </div>
          {doc.discountAmount ? doc.discountAmount > 0 && (
            <div className="flex justify-between text-slate-700">
              <span>ส่วนลด:</span>
              <span>-{(doc.discountAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>
          ) : null}
          {doc.vatAmount ? doc.vatAmount > 0 && (
            <div className="flex justify-between text-slate-700">
              <span>VAT 7%:</span>
              <span>+{(doc.vatAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>
          ) : null}
          {doc.withholdingTaxAmount ? doc.withholdingTaxAmount > 0 && (
            <div className="flex justify-between text-slate-700">
              <span>หัก ณ ที่จ่าย ({doc.withholdingTaxPercent}%):</span>
              <span>-{(doc.withholdingTaxAmount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>
          ) : null}
          <div className="flex justify-between font-bold text-xs pt-1 border-t border-black text-black">
            <span>ยอดสุทธิ (Total):</span>
            <span>{(doc.grandTotal || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
          </div>
          <div className="text-[8px] text-center pt-0.5 text-slate-700 font-sans">
            ({doc.grandTotalTextThai || 'ศูนย์บาทถ้วน'})
          </div>
        </div>

        {/* Payment & Signatures */}
        <div className="py-2 text-[9px] text-center space-y-2">
          <div className="text-left text-[8px] text-slate-700 space-y-0.5">
            <div><span className="font-bold">ชำระโดย:</span> {doc.paymentMethod === 'transfer' ? `โอนเงิน ${doc.bankName || ''}` : doc.paymentMethod}</div>
            {doc.notes && <div><span className="font-bold">หมายเหตุ:</span> {doc.notes}</div>}
          </div>

          <div className="pt-2 border-t border-dashed border-slate-400 grid grid-cols-2 gap-2 text-[8px]">
            <div>
              <div className="h-6 border-b border-dotted border-slate-500 mb-1" />
              <span>({doc.collectorName || 'ผู้รับเงิน'})</span>
              <div className="text-[7px] text-slate-500">ผู้รับเงิน</div>
            </div>
            <div>
              <div className="h-6 border-b border-dotted border-slate-500 mb-1" />
              <span>({doc.approverName || 'ผู้มีอำนาจลงนาม'})</span>
              <div className="text-[7px] text-slate-500">ผู้มีอำนาจลงนาม</div>
            </div>
          </div>

          <p className="text-[8px] text-slate-500 pt-2">
            *** ขอบคุณที่ใช้บริการ / THANK YOU ***
          </p>
        </div>
      </div>
    );
  }

  // Standard Sheet Layout (A4, A5, A5 Landscape, A6, Letter, Custom)
  const paddingStyle = isCompact 
    ? 'p-4 space-y-3 text-[10px]' 
    : isLandscape
      ? 'p-6 space-y-3 text-[11px]'
      : 'p-8 space-y-5 text-xs';

  return (
    <div
      id={printableId}
      data-print-width={`${effectiveWidth}mm`}
      data-print-height={`${effectiveHeight}mm`}
      data-print-margin={`${paperConfig.marginMm || 10}mm`}
      className={`bg-white text-slate-900 rounded-sm shadow-2xl border border-slate-300 relative font-sans leading-normal overflow-hidden flex-shrink-0 text-left printable-active-sheet ${paddingStyle} ${className}`}
      style={{
        width: `${effectiveWidth}mm`,
        minWidth: `${effectiveWidth}mm`,
        minHeight: `${effectiveHeight}mm`,
        color: '#0f172a'
      }}
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
              className="max-w-[320px] max-h-[320px] object-contain grayscale"
            />
          ) : (
            <div className="transform -rotate-30 text-center px-4">
              <span className={`font-black uppercase tracking-widest text-slate-800 border-4 border-slate-800 px-6 py-3 rounded-xl inline-block whitespace-nowrap ${isCompact ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>
                {doc.watermarkText || doc.issuerName || 'OFFICIAL RECEIPT'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Header: Issuer Logo & Doc Title */}
      <div className={`flex justify-between items-start gap-4 border-b-2 border-slate-900 relative z-10 ${isCompact ? 'pb-3' : 'pb-5'}`}>
        <div className="flex items-start gap-3 max-w-[65%]">
          {doc.showLogo !== false && doc.issuerLogoUrl && (
            <img 
              src={doc.issuerLogoUrl} 
              alt="Company Logo" 
              className={`object-contain rounded-md border border-slate-200 p-0.5 bg-white flex-shrink-0 ${isCompact ? 'w-11 h-11' : 'w-16 h-16'}`}
            />
          )}
          <div className="space-y-0.5">
            <h2 className={`font-black tracking-tight text-slate-900 uppercase ${isCompact ? 'text-xs' : 'text-base'}`}>
              {doc.issuerName || 'สำนักงานกฎหมาย'}
            </h2>
            <p className={`text-slate-600 leading-snug ${isCompact ? 'text-[9px]' : 'text-[11px]'}`}>
              {doc.issuerAddress || '-'}
            </p>
            <div className={`flex items-center gap-2 text-slate-600 font-medium pt-0.5 flex-wrap ${isCompact ? 'text-[8px]' : 'text-[10px]'}`}>
              <span>เลขภาษี: {doc.issuerTaxId || '-'}</span>
              <span>({doc.issuerBranch || 'สำนักงานใหญ่'})</span>
              <span>โทร: {doc.issuerPhone || '-'}</span>
            </div>
          </div>
        </div>

        <div className="text-right space-y-1.5 flex-shrink-0">
          <div className={`inline-block rounded border-2 border-slate-900 bg-slate-50 text-slate-900 font-black uppercase tracking-wider ${isCompact ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs sm:text-sm'}`}>
            {getDocTypeName(doc.docType).split('(')[0]}
          </div>
          <div className={`font-mono space-y-0.5 text-slate-700 ${isCompact ? 'text-[9px]' : 'text-[11px]'}`}>
            <p><span className="font-bold">เลขที่:</span> {doc.receiptNo || '-'}</p>
            <p><span className="font-bold">วันที่:</span> {doc.issueDate || '-'}</p>
            {doc.refNo && <p><span className="font-bold">อ้างอิง:</span> {doc.refNo}</p>}
          </div>
        </div>
      </div>

      {/* Customer Box */}
      <div className={`rounded border border-slate-300 bg-slate-50/50 grid grid-cols-2 gap-3 relative z-10 ${isCompact ? 'p-2.5 text-[9px]' : 'p-3.5'}`}>
        <div className="space-y-0.5">
          <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">ชื่อผู้ว่าจ้าง / ลูกค้า (Customer):</span>
          <p className={`font-bold text-slate-900 ${isCompact ? 'text-xs' : 'text-sm'}`}>{doc.customerName || '(กรุณากรอกชื่อลูกค้า)'}</p>
          <p className={`text-slate-600 leading-snug ${isCompact ? 'text-[9px]' : 'text-[11px]'}`}>{doc.customerAddress || 'ไม่ระบุที่อยู่'}</p>
        </div>

        <div className={`space-y-0.5 text-left pl-3 border-l border-slate-200 ${isCompact ? 'text-[9px]' : 'text-[11px]'}`}>
          <p className="text-slate-700"><span className="font-bold">เลขผู้เสียภาษี:</span> {doc.customerTaxId || '-'}</p>
          <p className="text-slate-700"><span className="font-bold">โทรศัพท์:</span> {doc.customerPhone || '-'}</p>
          <p className="text-slate-700"><span className="font-bold">อีเมล:</span> {doc.customerEmail || '-'}</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="relative z-10">
        <table className={`w-full border-collapse ${isCompact ? 'text-[9px]' : 'text-xs'}`}>
          <thead>
            <tr className={`border-y-2 border-slate-900 bg-slate-100 text-slate-900 font-bold uppercase ${isCompact ? 'text-[8px]' : 'text-[10px]'}`}>
              <th className="py-1.5 px-2 text-center w-8">#</th>
              <th className="py-1.5 px-2 text-left">รายการ (Description)</th>
              <th className="py-1.5 px-2 text-center w-12">จำนวน</th>
              <th className="py-1.5 px-2 text-center w-12">หน่วย</th>
              <th className="py-1.5 px-2 text-right w-20">ราคา/หน่วย</th>
              <th className="py-1.5 px-2 text-right w-24">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {(doc.items || []).map((item, idx) => (
              <tr key={idx} className="text-slate-800">
                <td className="py-2 px-2 text-center font-mono">{idx + 1}</td>
                <td className="py-2 px-2 font-semibold">{item.description || '-'}</td>
                <td className="py-2 px-2 text-center font-mono">{item.quantity}</td>
                <td className="py-2 px-2 text-center">{item.unit}</td>
                <td className="py-2 px-2 text-right font-mono">{(item.unitPrice || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                <td className="py-2 px-2 text-right font-mono font-bold">{(item.amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Calculations & Total */}
      <div className={`border-t-2 border-slate-900 grid grid-cols-12 gap-3 relative z-10 ${isCompact ? 'pt-2' : 'pt-3.5'}`}>
        <div className="col-span-7 space-y-2">
          <div className={`rounded border border-slate-200 bg-slate-50 ${isCompact ? 'p-1.5 text-[9px]' : 'p-2.5 text-[11px]'}`}>
            <span className="font-bold text-slate-700 block mb-0.5">จำนวนเงินตัวหนังสือ:</span>
            <p className={`font-black text-slate-900 ${isCompact ? 'text-[10px]' : 'text-xs'}`}>({doc.grandTotalTextThai || 'ศูนย์บาทถ้วน'})</p>
          </div>

          <div className={`text-slate-600 space-y-0.5 ${isCompact ? 'text-[8px]' : 'text-[10px]'}`}>
            <p><span className="font-bold">วิธีการชำระเงิน:</span> {doc.paymentMethod === 'transfer' ? `โอนเงินผ่านธนาคาร ${doc.bankName || ''} เลขบัญชี ${doc.bankAccountNo || ''}` : doc.paymentMethod}</p>
            <p><span className="font-bold">หมายเหตุ:</span> {doc.notes || '-'}</p>
          </div>
        </div>

        <div className={`col-span-5 space-y-1 text-right font-mono ${isCompact ? 'text-[9px]' : 'text-xs'}`}>
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

          <div className={`pt-1.5 border-t-2 border-slate-900 flex justify-between font-black text-slate-900 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            <span className="font-sans">ยอดสุทธิ (Grand Total):</span>
            <span>{(doc.grandTotal || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className={`grid grid-cols-2 gap-6 text-center relative z-10 ${isCompact ? 'pt-4 text-[9px]' : isLandscape ? 'pt-4 text-[10px]' : 'pt-7 text-xs'}`}>
        <div className="space-y-3">
          <div className={`border-b border-dashed border-slate-400 flex items-end justify-center pb-0.5 ${isCompact ? 'h-8' : 'h-10'}`}>
            <span className="text-slate-400 text-[9px]">ลงนาม / Signature</span>
          </div>
          <div>
            <p className="font-bold text-slate-900">({doc.collectorName || 'ผู้รับเงิน'})</p>
            <p className="text-[9px] text-slate-500">ผู้รับเงิน / Collector</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className={`border-b border-dashed border-slate-400 flex items-end justify-center pb-0.5 ${isCompact ? 'h-8' : 'h-10'}`}>
            <span className="text-slate-400 text-[9px]">ลงนาม / Signature</span>
          </div>
          <div>
            <p className="font-bold text-slate-900">({doc.approverName || 'ผู้มีอำนาจลงนาม'})</p>
            <p className="text-[9px] text-slate-500">ผู้มีอำนาจลงนาม / Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}
