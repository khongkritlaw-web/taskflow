import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ColorWheelPickerProps {
  color: string;
  onChange: (hex: string) => void;
  label?: string;
  description?: string;
  presetColors?: string[];
}

// Convert Hex to HSV
function hexToHsv(hex: string): { h: number; s: number; v: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) {
    return { h: 210, s: 80, v: 90 };
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100)
  };
}

// Convert HSV to Hex
function hsvToHex(h: number, s: number, v: number): string {
  const hNorm = (h % 360) / 360;
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const vNorm = Math.max(0, Math.min(100, v)) / 100;

  const i = Math.floor(hNorm * 6);
  const f = hNorm * 6 - i;
  const p = vNorm * (1 - sNorm);
  const q = vNorm * (1 - f * sNorm);
  const t = vNorm * (1 - (1 - f) * sNorm);

  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = vNorm; g = t; b = p; break;
    case 1: r = q; g = vNorm; b = p; break;
    case 2: r = p; g = vNorm; b = t; break;
    case 3: r = p; g = q; b = vNorm; break;
    case 4: r = t; g = p; b = vNorm; break;
    case 5: r = vNorm; g = p; b = q; break;
  }

  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const DEFAULT_PRESETS = [
  '#2563eb', '#3b82f6', '#0284c7', '#0891b2', '#0d9488',
  '#059669', '#10b981', '#84cc16', '#eab308', '#d97706',
  '#ea580c', '#e11d48', '#f43f5e', '#db2777', '#c026d3',
  '#9333ea', '#7c3aed', '#6366f1', '#475569', '#0f172a',
  '#1e293b', '#f8fafc', '#ffffff', '#000000', '#f43f5e'
];

export const ColorWheelPicker: React.FC<ColorWheelPickerProps> = ({
  color,
  onChange,
  label,
  description,
  presetColors = DEFAULT_PRESETS
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hsv, setHsv] = useState(() => hexToHsv(color || '#2563eb'));
  const [hexInput, setHexInput] = useState(color || '#2563eb');

  // Keep internal HSV in sync when external color changes
  useEffect(() => {
    if (color && color !== hsvToHex(hsv.h, hsv.s, hsv.v)) {
      setHsv(hexToHsv(color));
      setHexInput(color);
    }
  }, [color]);

  // Draw Color Wheel Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 4;

    ctx.clearRect(0, 0, width, height);

    // Draw Wheel Pixels
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= radius) {
          let angle = Math.atan2(dy, dx) * (180 / Math.PI);
          if (angle < 0) angle += 360;

          const sat = (dist / radius) * 100;
          const hex = hsvToHex(angle, sat, hsv.v);

          const r = parseInt(hex.substring(1, 3), 16);
          const g = parseInt(hex.substring(3, 5), 16);
          const b = parseInt(hex.substring(5, 7), 16);

          const index = (y * width + x) * 4;
          data[index] = r;
          data[index + 1] = g;
          data[index + 2] = b;
          data[index + 3] = 255;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Outer border ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw Selection Handle Pointer
    const currentAngle = (hsv.h * Math.PI) / 180;
    const currentDist = (hsv.s / 100) * radius;
    const handleX = centerX + Math.cos(currentAngle) * currentDist;
    const handleY = centerY + Math.sin(currentAngle) * currentDist;

    ctx.beginPath();
    ctx.arc(handleX, handleY, 7, 0, 2 * Math.PI);
    ctx.fillStyle = hsvToHex(hsv.h, hsv.s, hsv.v);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(handleX, handleY, 8.5, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, [hsv]);

  const updateColorFromCoordinates = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const width = canvas.width;
    const height = canvas.height;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = rect.width / 2 - 4;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    const sat = Math.min(100, Math.max(0, (dist / radius) * 100));
    const newHsv = { ...hsv, h: Math.round(angle), s: Math.round(sat) };
    
    setHsv(newHsv);
    const newHex = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
    setHexInput(newHex);
    onChange(newHex);
  }, [hsv, onChange]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    updateColorFromCoordinates(e.clientX, e.clientY);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      updateColorFromCoordinates(e.clientX, e.clientY);
    }
  }, [isDragging, updateColorFromCoordinates]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      setIsDragging(true);
      updateColorFromCoordinates(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging && e.touches.length > 0) {
      updateColorFromCoordinates(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const newHsv = { ...hsv, v: val };
    setHsv(newHsv);
    const newHex = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
    setHexInput(newHex);
    onChange(newHex);
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
      setHsv(hexToHsv(val));
      onChange(val);
    }
  };

  const handlePresetClick = (presetHex: string) => {
    setHsv(hexToHsv(presetHex));
    setHexInput(presetHex);
    onChange(presetHex);
  };

  const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3 transition-all">
      {label && (
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div>
            <h5 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>🎡</span> {label}
            </h5>
            {description && (
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span 
              className="w-6 h-6 rounded-lg border border-black/15 shadow-inner flex-shrink-0"
              style={{ backgroundColor: currentHex }}
            />
            <span className="font-mono text-xs font-extrabold text-slate-700 dark:text-slate-300">
              {currentHex.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Main Wheel Canvas + Brightness Slider Area */}
      <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
        {/* Interactive Conic Color Wheel */}
        <div className="relative flex-shrink-0 select-none">
          <canvas
            ref={canvasRef}
            width={160}
            height={160}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="cursor-crosshair rounded-full shadow-md touch-none hover:scale-[1.02] transition-transform"
            title="คลิกหรือลากบนวงล้อเพื่อเลือกเฉดสี"
          />
        </div>

        {/* Sliders & Inputs Controls */}
        <div className="flex-1 w-full space-y-3 text-left">
          {/* Brightness / Value Slider */}
          <div>
            <div className="flex items-center justify-between text-[10.5px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              <span>💡 ความสว่าง (Lightness):</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{hsv.v}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={hsv.v}
              onChange={handleValueChange}
              className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              style={{
                background: `linear-gradient(to right, #000000, ${hsvToHex(hsv.h, hsv.s, 100)})`
              }}
            />
          </div>

          {/* Hex Input & Color Picker Backup */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">#</span>
              <input
                type="text"
                maxLength={7}
                value={hexInput.replace('#', '')}
                onChange={(e) => handleHexInputChange({ ...e, target: { ...e.target, value: '#' + e.target.value.replace('#', '') } })}
                placeholder="2563eb"
                className="w-full h-9 pl-6 pr-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Native fallback color trigger */}
            <div className="relative">
              <input
                type="color"
                value={currentHex}
                onChange={(e) => {
                  const val = e.target.value;
                  setHsv(hexToHsv(val));
                  setHexInput(val);
                  onChange(val);
                }}
                className="w-9 h-9 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 cursor-pointer shadow-xs"
                title="เลือกสีจากจานสีระบบเบราว์เซอร์"
              />
            </div>
          </div>

          {/* Quick Presets Swatches */}
          {presetColors && presetColors.length > 0 && (
            <div>
              <span className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                จานสีแนะนำยอดนิยม (Palette Swatches)
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {presetColors.slice(0, 14).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePresetClick(p)}
                    className={`w-5 h-5 rounded-md border transition-transform cursor-pointer flex-shrink-0 ${
                      currentHex.toLowerCase() === p.toLowerCase()
                        ? 'scale-125 border-slate-900 dark:border-white ring-2 ring-indigo-500 z-10'
                        : 'border-black/10 hover:scale-110'
                    }`}
                    style={{ backgroundColor: p }}
                    title={p}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
