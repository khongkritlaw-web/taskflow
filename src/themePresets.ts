export interface ThemePreset {
  id: string;
  name: string;
  nameTh: string;
  colorAccent: string;
  colorAccentHover: string;
  colorAccentLight: string;
  colorAccentText: string;
  colorSidebarBg: string;
  colorSidebarText: string;
  colorSidebarActive: string;
  colorBgAppStart: string;
  colorBgAppEnd: string;
  bgType: 'solid' | 'gradient';
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'indigo-dream',
    name: 'Classic Indigo',
    nameTh: 'ไลแลค อินดิโก้ (ดั้งเดิม)',
    colorAccent: '#2563eb',
    colorAccentHover: '#1d4ed8',
    colorAccentLight: '#dbeafe',
    colorAccentText: '#fff',
    colorSidebarBg: '#0f172a',
    colorSidebarText: '#94a3b8',
    colorSidebarActive: '#2563eb',
    colorBgAppStart: '#f8fafc',
    colorBgAppEnd: '#e2e8f0',
    bgType: 'gradient',
  },
  {
    id: 'emerald-garden',
    name: 'Emerald Garden',
    nameTh: 'สวนมรกต (เขียวธรรมชาติ)',
    colorAccent: '#059669',
    colorAccentHover: '#047857',
    colorAccentLight: '#d1fae5',
    colorAccentText: '#fff',
    colorSidebarBg: '#064e3b',
    colorSidebarText: '#a7f3d0',
    colorSidebarActive: '#059669',
    colorBgAppStart: '#f0fdf4',
    colorBgAppEnd: '#d1fae5',
    bgType: 'gradient',
  },
  {
    id: 'warm-amber',
    name: 'Warm Amber',
    nameTh: 'แอมเบอร์ อุ่น (หรูหราไม้)',
    colorAccent: '#d97706',
    colorAccentHover: '#b45309',
    colorAccentLight: '#fef3c7',
    colorAccentText: '#fff',
    colorSidebarBg: '#451a03',
    colorSidebarText: '#fde68a',
    colorSidebarActive: '#d97706',
    colorBgAppStart: '#fffbeb',
    colorBgAppEnd: '#fef3c7',
    bgType: 'gradient',
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    nameTh: 'ลมทะเลพัดพริ้ว (ฟ้าคราม)',
    colorAccent: '#0369a1',
    colorAccentHover: '#0284c7',
    colorAccentLight: '#e0f2fe',
    colorAccentText: '#fff',
    colorSidebarBg: '#0c4a6e',
    colorSidebarText: '#bae6fd',
    colorSidebarActive: '#0369a1',
    colorBgAppStart: '#f0f9ff',
    colorBgAppEnd: '#e0f2fe',
    bgType: 'gradient',
  },
  {
    id: 'rose-petal',
    name: 'Rose Petal',
    nameTh: 'กลีบผกากุหลาบ (ชมพูงาม)',
    colorAccent: '#db2777',
    colorAccentHover: '#be185d',
    colorAccentLight: '#fce7f3',
    colorAccentText: '#fff',
    colorSidebarBg: '#4c0519',
    colorSidebarText: '#fbcfe8',
    colorSidebarActive: '#db2777',
    colorBgAppStart: '#fff1f2',
    colorBgAppEnd: '#ffe4e6',
    bgType: 'gradient',
  },
  {
    id: 'cyber-sunset',
    name: 'Cyber Sunset',
    nameTh: 'ยามราตรีไซเบอร์ (ม่วงส้ม)',
    colorAccent: '#f43f5e',
    colorAccentHover: '#e11d48',
    colorAccentLight: '#ffe4e6',
    colorAccentText: '#fff',
    colorSidebarBg: '#2e1065',
    colorSidebarText: '#ddd6fe',
    colorSidebarActive: '#f43f5e',
    colorBgAppStart: '#faf5ff',
    colorBgAppEnd: '#fae8ff',
    bgType: 'gradient',
  },
  {
    id: 'slate-modern',
    name: 'Modern Slate',
    nameTh: 'สเลทโมเดิร์น (เทาสุขุม)',
    colorAccent: '#475569',
    colorAccentHover: '#334155',
    colorAccentLight: '#f1f5f9',
    colorAccentText: '#fff',
    colorSidebarBg: '#1e293b',
    colorSidebarText: '#cbd5e1',
    colorSidebarActive: '#475569',
    colorBgAppStart: '#f8fafc',
    colorBgAppEnd: '#cbd5e1',
    bgType: 'gradient',
  }
];

export function hexToRgb(hex: string): string {
  // Convert hex color to comma separated rgb for tailwind use, e.g. "37, 99, 235"
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return isNaN(r) || isNaN(g) || isNaN(b) ? '37, 99, 235' : `${r}, ${g}, ${b}`;
}

export function getDarkerColor(hex: string, percent = 15): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  let r = parseInt(c.substring(0, 2), 16);
  let g = parseInt(c.substring(2, 4), 16);
  let b = parseInt(c.substring(4, 6), 16);

  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent / 100))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent / 100))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent / 100))));

  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');
  return `#${rHex}${gHex}${bHex}`;
}

export function getLighterColor(hex: string, percent = 80): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  let r = parseInt(c.substring(0, 2), 16);
  let g = parseInt(c.substring(2, 4), 16);
  let b = parseInt(c.substring(4, 6), 16);

  r = Math.max(0, Math.min(255, Math.floor(r + (255 - r) * (percent / 100))));
  g = Math.max(0, Math.min(255, Math.floor(g + (255 - g) * (percent / 100))));
  b = Math.max(0, Math.min(255, Math.floor(b + (255 - b) * (percent / 100))));

  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');
  return `#${rHex}${gHex}${bHex}`;
}
