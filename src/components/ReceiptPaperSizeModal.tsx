import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sliders, 
  Check, 
  X, 
  RotateCw, 
  FileText, 
  Receipt, 
  Maximize2, 
  Sparkles,
  Maximize,
  Minimize2
} from 'lucide-react';
import { PaperSizeConfig, PaperSizePreset } from '../types';
import { PAPER_SIZE_PRESETS } from './ReceiptPrintSheet';

interface ReceiptPaperSizeModalProps {
  isOpen?: boolean;
  paperConfig: PaperSizeConfig;
  onSaveConfig: (config: PaperSizeConfig) => void;
  onClose: () => void;
}

const COMMON_CUSTOM_PRESETS = [
  { name: 'สลิปความร้อน 58mm', w: 58, h: 160, unit: 'mm' as const, isSlip: true },
  { name: 'สลิปความร้อน 80mm', w: 80, h: 210, unit: 'mm' as const, isSlip: true },
  { name: 'นามบัตร / การ์ด', w: 90, h: 54, unit: 'mm' as const },
  { name: 'โปสการ์ด / รูป 4x6"', w: 100, h: 150, unit: 'mm' as const },
  { name: 'A6 (105 × 148 mm)', w: 105, h: 148, unit: 'mm' as const },
  { name: 'A5 แนวตั้ง (148 × 210 mm)', w: 148, h: 210, unit: 'mm' as const },
  { name: 'A5 แนวนอน (210 × 148 mm)', w: 210, h: 148, unit: 'mm' as const },
  { name: 'B5 (176 × 250 mm)', w: 176, h: 250, unit: 'mm' as const },
  { name: 'A4 มาตรฐาน', w: 210, h: 297, unit: 'mm' as const },
  { name: 'US Letter (8.5 × 11")', w: 215.9, h: 279.4, unit: 'mm' as const },
  { name: 'กระดาษต่อเนื่อง 9 × 5.5"', w: 228.6, h: 139.7, unit: 'mm' as const },
  { name: 'กระดาษต่อเนื่อง 9 × 11"', w: 228.6, h: 279.4, unit: 'mm' as const },
];

export function ReceiptPaperSizeModal({
  isOpen = true,
  paperConfig,
  onSaveConfig,
  onClose
}: ReceiptPaperSizeModalProps) {
  const [config, setConfig] = useState<PaperSizeConfig>({ ...paperConfig });

  if (isOpen === false) return null;

  const handleSelectPreset = (presetKey: PaperSizePreset) => {
    const presetInfo = PAPER_SIZE_PRESETS[presetKey];
    if (!presetInfo) return;

    if (presetKey === 'custom') {
      setConfig(prev => ({
        ...prev,
        preset: 'custom',
        name: 'กำหนดขนาดเอง'
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        preset: presetKey,
        name: presetInfo.name,
        widthMm: presetInfo.widthMm,
        heightMm: presetInfo.heightMm,
        customWidth: presetInfo.widthMm,
        customHeight: presetInfo.heightMm,
        unit: 'mm',
        orientation: presetKey === 'a5_landscape' ? 'landscape' : 'portrait',
        isSlip: presetInfo.isSlip || false
      }));
    }
  };

  const handleApplyCustomPreset = (cp: { name: string; w: number; h: number; unit: 'mm' | 'cm' | 'in'; isSlip?: boolean }) => {
    setConfig(prev => ({
      ...prev,
      preset: 'custom',
      name: cp.name,
      customWidth: cp.w,
      customHeight: cp.h,
      widthMm: cp.w,
      heightMm: cp.h,
      unit: cp.unit,
      orientation: cp.w > cp.h ? 'landscape' : 'portrait',
      isSlip: cp.isSlip || false
    }));
  };

  const handleSave = () => {
    // Calculate final mm dimensions
    let finalW = config.customWidth;
    let finalH = config.customHeight;
    if (config.unit === 'cm') {
      finalW *= 10;
      finalH *= 10;
    } else if (config.unit === 'in') {
      finalW *= 25.4;
      finalH *= 25.4;
    }

    const updated: PaperSizeConfig = {
      ...config,
      widthMm: config.preset === 'custom' ? finalW : config.widthMm,
      heightMm: config.preset === 'custom' ? finalH : config.heightMm
    };

    onSaveConfig(updated);
    onClose();
  };

  // Convert for display
  const effectiveWidthMm = config.preset === 'custom'
    ? config.unit === 'cm' ? config.customWidth * 10 : config.unit === 'in' ? config.customWidth * 25.4 : config.customWidth
    : config.widthMm;

  const effectiveHeightMm = config.preset === 'custom'
    ? config.unit === 'cm' ? config.customHeight * 10 : config.unit === 'in' ? config.customHeight * 25.4 : config.customHeight
    : config.heightMm;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-left shadow-2xl"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                <span>ตั้งค่าขนาดกระดาษ & การพิมพ์</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Custom Paper Size
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">เลือกขนาดมาตรฐาน หรือกำหนดขนาด กว้าง × สูง ได้เองตามต้องการ</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-300">
          {/* Preset Grid */}
          <div className="space-y-2.5">
            <label className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>1. เลือกขนาดกระดาษสำเร็จรูป (Presets)</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(PAPER_SIZE_PRESETS).map(([key, item]) => {
                const isSelected = config.preset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectPreset(key as PaperSizePreset)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-400/40'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1">
                      <span className="font-bold text-xs">{item.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-[10px] ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {key === 'custom' ? 'กำหนดอิสระ' : `${item.widthMm} × ${item.heightMm} mm`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Size Form (Shown or highlighted when 'custom' or any preset) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>2. กำหนดขนาดกระดาษเอง (Custom Dimensions)</span>
              </label>

              {config.preset !== 'custom' && (
                <button
                  type="button"
                  onClick={() => handleSelectPreset('custom')}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
                >
                  สลับเป็นโหมดกำหนดเอง
                </button>
              )}
            </div>

            {/* Quick Dimensions Helpers */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold block">เทมเพลตขนาดยอดนิยม (คลิกเพื่อนำไปใช้):</span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_CUSTOM_PRESETS.map((cp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyCustomPreset(cp)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-medium transition-all cursor-pointer"
                  >
                    {cp.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Width, Height, Unit Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">ความกว้าง (Width)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="1000"
                    value={config.customWidth}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setConfig(prev => ({
                        ...prev,
                        preset: 'custom',
                        customWidth: val,
                        widthMm: config.unit === 'cm' ? val * 10 : config.unit === 'in' ? val * 25.4 : val
                      }));
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-[10px] uppercase font-bold">
                    {config.unit}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">ความสูง (Height / Length)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="2000"
                    value={config.customHeight}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setConfig(prev => ({
                        ...prev,
                        preset: 'custom',
                        customHeight: val,
                        heightMm: config.unit === 'cm' ? val * 10 : config.unit === 'in' ? val * 25.4 : val
                      }));
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-[10px] uppercase font-bold">
                    {config.unit}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">หน่วยวัด (Unit)</label>
                <select
                  value={config.unit}
                  onChange={(e) => {
                    const newUnit = e.target.value as 'mm' | 'cm' | 'in';
                    setConfig(prev => ({ ...prev, unit: newUnit }));
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-bold text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="mm">มิลลิเมตร (mm)</option>
                  <option value="cm">เซนติเมตร (cm)</option>
                  <option value="in">นิ้ว (inches)</option>
                </select>
              </div>
            </div>

            {/* Orientation & Margin */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">ทิศทางกระดาษ (Orientation)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, orientation: 'portrait' }))}
                    className={`h-9 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      config.orientation === 'portrait'
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>↕️ แนวตั้ง (Portrait)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, orientation: 'landscape' }))}
                    className={`h-9 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      config.orientation === 'landscape'
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>↔️ แนวนอน (Landscape)</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">ระยะขอบกระดาษ (Margin)</label>
                <select
                  value={config.marginMm}
                  onChange={(e) => setConfig(prev => ({ ...prev, marginMm: Number(e.target.value) }))}
                  className="w-full h-9 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white font-bold text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value={0}>0 mm (ชิดขอบ / สลิปความร้อน)</option>
                  <option value={5}>5 mm (แคบพิเศษ)</option>
                  <option value={10}>10 mm (มาตรฐาน)</option>
                  <option value={15}>15 mm (กว้าง)</option>
                  <option value={20}>20 mm (กว้างพิเศษ)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Visual Ratio Preview Box */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">ขนาดที่คำนวณได้จริง:</span>
              <div className="text-sm font-black text-emerald-400 font-mono">
                {effectiveWidthMm.toFixed(1)} × {effectiveHeightMm.toFixed(1)} mm ({config.orientation === 'portrait' ? 'แนวตั้ง' : 'แนวนอน'})
              </div>
              <p className="text-[10px] text-slate-400">
                {effectiveWidthMm <= 85 ? '🧾 รูปแบบสลิปความร้อน POS (Thermal Slip)' : '📄 รูปแบบเอกสารใบเสร็จมาตรฐาน (Standard Sheet)'}
              </p>
            </div>

            {/* Proportional Box */}
            <div className="flex items-center justify-center p-2 bg-slate-900 rounded-lg border border-slate-700 w-28 h-28">
              <div
                className="border-2 border-emerald-400 bg-emerald-500/10 rounded flex items-center justify-center text-[9px] font-bold text-emerald-300 font-mono"
                style={{
                  width: effectiveWidthMm > effectiveHeightMm ? '80px' : `${Math.max(24, Math.min(80, (effectiveWidthMm / effectiveHeightMm) * 80))}px`,
                  height: effectiveWidthMm > effectiveHeightMm ? `${Math.max(24, Math.min(80, (effectiveHeightMm / effectiveWidthMm) * 80))}px` : '80px'
                }}
              >
                {config.name || 'Doc'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 flex items-center justify-end gap-2.5 bg-slate-950 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs cursor-pointer"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-95 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>ยืนยันและนำไปใช้</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
