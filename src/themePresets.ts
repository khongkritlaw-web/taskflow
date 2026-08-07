export interface ThemePreset {
  id: string;
  name: string;
  nameTh: string;
  category: 'executive' | 'dark' | 'vibrant' | 'nature' | 'cyber' | 'pastel';
  colorAccent: string;
  colorAccentHover: string;
  colorAccentLight: string;
  colorAccentText: string;
  colorSidebarBg: string;
  colorSidebarText: string;
  colorSidebarActive: string;
  colorBgAppStart: string;
  colorBgAppEnd: string;
  darkColorBgAppStart?: string;
  darkColorBgAppEnd?: string;
  darkColorSidebarBg?: string;
  bgType: 'solid' | 'gradient';
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'indigo-dream',
    name: 'Classic Indigo',
    nameTh: 'ไลแลค อินดิโก้ (ดั้งเดิม)',
    category: 'executive',
    colorAccent: '#2563eb',
    colorAccentHover: '#1d4ed8',
    colorAccentLight: '#dbeafe',
    colorAccentText: '#ffffff',
    colorSidebarBg: '#0f172a',
    colorSidebarText: '#94a3b8',
    colorSidebarActive: '#2563eb',
    colorBgAppStart: '#f8fafc',
    colorBgAppEnd: '#e2e8f0',
    darkColorBgAppStart: '#0f172a',
    darkColorBgAppEnd: '#020617',
    darkColorSidebarBg: '#0b0f19',
    bgType: 'gradient',
  },
  {
    id: 'royal-sapphire',
    name: 'Royal Sapphire',
    nameTh: 'นาวีแซฟไฟร์ (ผู้บริหารระดับสูง)',
    category: 'executive',
    colorAccent: '#1d4ed8',
    colorAccentHover: '#1e40af',
    colorAccentLight: '#e0e7ff',
    colorAccentText: '#ffffff',
    colorSidebarBg: '#030712',
    colorSidebarText: '#93c5fd',
    colorSidebarActive: '#2563eb',
    colorBgAppStart: '#f0f3ff',
    colorBgAppEnd: '#dbe2fe',
    darkColorBgAppStart: '#030712',
    darkColorBgAppEnd: '#0b1329',
    darkColorSidebarBg: '#02050e',
    bgType: 'gradient',
  },
  {
    id: 'emerald-garden',
    name: 'Emerald Garden',
    nameTh: 'สวนมรกต (เขียวธรรมชาติ)',
    category: 'nature',
    colorAccent: '#059669',
    colorAccentHover: '#047857',
    colorAccentLight: '#d1fae5',
    colorAccentText: '#ffffff',
    colorSidebarBg: '#064e3b',
    colorSidebarText: '#a7f3d0',
    colorSidebarActive: '#059669',
    colorBgAppStart: '#f0fdf4',
    colorBgAppEnd: '#d1fae5',
    darkColorBgAppStart: '#022c22',
    darkColorBgAppEnd: '#064e3b',
    darkColorSidebarBg: '#011913',
    bgType: 'gradient',
  },
  {
    id: 'dark-emerald-mode',
    name: 'Dark Forest Emerald',
    nameTh: 'มรกตเข้มยามค่ำคืน (เขียวดาร์กโหมด)',
    category: 'dark',
    colorAccent: '#10b981',
    colorAccentHover: '#059669',
    colorAccentLight: '#064e3b',
    colorAccentText: '#ffffff',
    colorSidebarBg: '#021812',
    colorSidebarText: '#a7f3d0',
    colorSidebarActive: '#10b981',
    colorBgAppStart: '#022119',
    colorBgAppEnd: '#01120d',
    darkColorBgAppStart: '#022119',
    darkColorBgAppEnd: '#01120d',
    darkColorSidebarBg: '#010e0a',
    bgType: 'gradient',
  },
  {
    id: 'warm-amber',
    name: 'Warm Amber Gold',
    nameTh: 'แอมเบอร์โกลด์ (หรูหราไม้)',
    category: 'executive',
    colorAccent: '#d97706',
    colorAccentHover: '#b45309',
    colorAccentLight: '#fef3c7',
    colorAccentText: '#ffffff',
    colorSidebarBg: '#451a03',
    colorSidebarText: '#fde68a',
    colorSidebarActive: '#d97706',
    colorBgAppStart: '#fffbeb',
    colorBgAppEnd: '#fef3c7',
    darkColorBgAppStart: '#1c1305',
    darkColorBgAppEnd: '#0a0601',
    darkColorSidebarBg: '#130c03',
    bgType: 'gradient',
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    nameTh: 'ลมทะเลพัดพริ้ว (ฟ้าคราม)',
    category: 'nature',
    colorAccent: '#0284c7',
    colorAccentHover: '#0369a1',
    colorAccentLight: '#e0f2fe',
    colorAccentText: '#ffffff',
    colorSidebarBg: '#0c4a6e',
    colorSidebarText: '#bae6fd',
    colorSidebarActive: '#0284c7',
    colorBgAppStart: '#f0f9ff',
    colorBgAppEnd: '#e0f2fe',
    darkColorBgAppStart: '#082f49',
    darkColorBgAppEnd: '#031828',
    darkColorSidebarBg: '#041d2e',
    bgType: 'gradient',
  },
  {
    id: 'deep-obsidian',
    name: 'Deep Obsidian OLED',
    nameTh: 'ดำโอบซิเดียน (มืดสนิทถนอมสายตา)',
    category: 'dark',
    colorAccent: '#6366f1',
    colorAccentHover: '#4f46e5',
    colorAccentLight: '#312e81',
    colorAccentText: '#ffffff',
    colorSidebarBg: '#000000',
    colorSidebarText: '#c7d2fe',
    colorSidebarActive: '#6366f1',
    colorBgAppStart: '#000000',
    colorBgAppEnd: '#09090b',
    darkColorBgAppStart: '#000000',
    darkColorBgAppEnd: '#09090b',
    darkColorSidebarBg: '#050505',
    bgType: 'solid',
  },
  {
    id: 'midnight-violet',
    name: 'Midnight Violet',
    nameTh: 'ม่วงไวโอเล็ตราตรี (มีเสน่ห์ลุ่มลึก)',
    category: 'dark',
    colorAccent: '#7c3aed',
    colorAccentHover: '#6d28d9',
    colorAccentLight: '#2e1065',
    colorAccentText: '#ffffff',
    colorSidebarBg: '#1e1b4b',
    colorSidebarText: '#ddd6fe',
    colorSidebarActive: '#7c3aed',
    colorBgAppStart: '#1e1b4b',
    colorBgAppEnd: '#0f0d2e',
    darkColorBgAppStart: '#1e1b4b',
    darkColorBgAppEnd: '#0f0d2e',
    darkColorSidebarBg: '#120f33',
    bgType: 'gradient',
  },
  {
    id: 'rose-petal',
    name: 'Rose & Red Wine',
    nameTh: 'กลีบกุหลาบและไวน์แดง (ชมพูงาม)',
    category: 'vibrant',
    colorAccent: '#db2777',
    colorAccentHover: '#be185d',
    colorAccentLight: '#fce7f3',
    colorAccentText: '#ffffff',
    colorSidebarBg: '#4c0519',
    colorSidebarText: '#fbcfe8',
    colorSidebarActive: '#db2777',
    colorBgAppStart: '#fff1f2',
    colorBgAppEnd: '#ffe4e6',
    darkColorBgAppStart: '#310413',
    darkColorBgAppEnd: '#120107',
    darkColorSidebarBg: '#21020c',
    bgType: 'gradient',
  },
  {
    id: 'cyber-sunset',
    name: 'Cyberpunk Neon',
    nameTh: 'ไซเบอร์พังก์ นีออน (ส้มอมชมพู)',
    category: 'cyber',
    colorAccent: '#f43f5e',
    colorAccentHover: '#e11d48',
    colorAccentLight: '#ffe4e6',
    colorAccentText: '#ffffff',
    colorSidebarBg: '#18041c',
    colorSidebarText: '#f472b6',
    colorSidebarActive: '#f43f5e',
    colorBgAppStart: '#faf5ff',
    colorBgAppEnd: '#fae8ff',
    darkColorBgAppStart: '#18041c',
    darkColorBgAppEnd: '#0d0210',
    darkColorSidebarBg: '#110214',
    bgType: 'gradient',
  },
  {
    id: 'slate-modern',
    name: 'Modern Slate',
    nameTh: 'สเลทโมเดิร์น (เทาสุขุมมินิมอล)',
    category: 'executive',
    colorAccent: '#475569',
    colorAccentHover: '#334155',
    colorAccentLight: '#f1f5f9',
    colorAccentText: '#ffffff',
    colorSidebarBg: '#1e293b',
    colorSidebarText: '#cbd5e1',
    colorSidebarActive: '#475569',
    colorBgAppStart: '#f8fafc',
    colorBgAppEnd: '#cbd5e1',
    darkColorBgAppStart: '#0f172a',
    darkColorBgAppEnd: '#1e293b',
    darkColorSidebarBg: '#0a0f1d',
    bgType: 'gradient',
  },
  {
    id: 'titanium-charcoal',
    name: 'Titanium Charcoal',
    nameTh: 'ชาร์โคลไทเทเนียม (ลักชัวรี่มืด)',
    category: 'dark',
    colorAccent: '#3b82f6',
    colorAccentHover: '#2563eb',
    colorAccentLight: '#1e293b',
    colorAccentText: '#ffffff',
    colorSidebarBg: '#111827',
    colorSidebarText: '#9ca3af',
    colorSidebarActive: '#3b82f6',
    colorBgAppStart: '#111827',
    colorBgAppEnd: '#030712',
    darkColorBgAppStart: '#111827',
    darkColorBgAppEnd: '#030712',
    darkColorSidebarBg: '#0b0f19',
    bgType: 'gradient',
  },
  {
    id: 'matcha-cream',
    name: 'Matcha Cream',
    nameTh: 'มัทฉะครีมนุ่มนวล (ผ่อนคลายตา)',
    category: 'nature',
    colorAccent: '#65a30d',
    colorAccentHover: '#4d7c0f',
    colorAccentLight: '#ecfccb',
    colorAccentText: '#ffffff',
    colorSidebarBg: '#1a2e05',
    colorSidebarText: '#bef264',
    colorSidebarActive: '#65a30d',
    colorBgAppStart: '#f7fee7',
    colorBgAppEnd: '#ecfccb',
    darkColorBgAppStart: '#142308',
    darkColorBgAppEnd: '#070d03',
    darkColorSidebarBg: '#0e1805',
    bgType: 'gradient',
  },
  {
    id: 'sunset-copper',
    name: 'Sunset Copper',
    nameTh: 'ทองแดงอาทิตย์อัสดง (อบอุ่นโดดเด่น)',
    category: 'vibrant',
    colorAccent: '#ea580c',
    colorAccentHover: '#c2410c',
    colorAccentLight: '#ffedd5',
    colorAccentText: '#ffffff',
    colorSidebarBg: '#431407',
    colorSidebarText: '#fed7aa',
    colorSidebarActive: '#ea580c',
    colorBgAppStart: '#fff7ed',
    colorBgAppEnd: '#ffedd5',
    darkColorBgAppStart: '#1f0b03',
    darkColorBgAppEnd: '#0d0401',
    darkColorSidebarBg: '#140702',
    bgType: 'gradient',
  },
  {
    id: 'nordic-frost',
    name: 'Nordic Frost',
    nameTh: 'นอร์ดิกฟรอสต์ (ฟ้าหิมะสะอาดตา)',
    category: 'pastel',
    colorAccent: '#0891b2',
    colorAccentHover: '#0e7490',
    colorAccentLight: '#cffaff',
    colorAccentText: '#ffffff',
    colorSidebarBg: '#164e63',
    colorSidebarText: '#a5f3fc',
    colorSidebarActive: '#0891b2',
    colorBgAppStart: '#ecfeff',
    colorBgAppEnd: '#cffaff',
    darkColorBgAppStart: '#083344',
    darkColorBgAppEnd: '#021a24',
    darkColorSidebarBg: '#05222e',
    bgType: 'gradient',
  },
  {
    id: 'sakura-blossom',
    name: 'Sakura Blossom',
    nameTh: 'ซากุระสีหวาน (ซอฟต์พาสเทล)',
    category: 'pastel',
    colorAccent: '#ec4899',
    colorAccentHover: '#db2777',
    colorAccentLight: '#fce7f3',
    colorAccentText: '#ffffff',
    colorSidebarBg: '#500724',
    colorSidebarText: '#fbcfe8',
    colorSidebarActive: '#ec4899',
    colorBgAppStart: '#fdf2f8',
    colorBgAppEnd: '#fce7f3',
    darkColorBgAppStart: '#240a1b',
    darkColorBgAppEnd: '#12030c',
    darkColorSidebarBg: '#190612',
    bgType: 'gradient',
  },
  {
    id: 'cosmic-space',
    name: 'Cosmic Nebula',
    nameTh: 'เนบิวลาอวกาศ (ม่วงน้ำเงินเรืองแสง)',
    category: 'cyber',
    colorAccent: '#a855f7',
    colorAccentHover: '#9333ea',
    colorAccentLight: '#f3e8ff',
    colorAccentText: '#ffffff',
    colorSidebarBg: '#0b0726',
    colorSidebarText: '#e9d5ff',
    colorSidebarActive: '#a855f7',
    colorBgAppStart: '#faf5ff',
    colorBgAppEnd: '#f3e8ff',
    darkColorBgAppStart: '#0b0726',
    darkColorBgAppEnd: '#030112',
    darkColorSidebarBg: '#060317',
    bgType: 'gradient',
  },
  {
    id: 'teal-synergy',
    name: 'Teal Synergy',
    nameTh: 'ทีลเอไอโปร (เขียวอมฟ้าทรงพลัง)',
    category: 'vibrant',
    colorAccent: '#0d9488',
    colorAccentHover: '#0f766e',
    colorAccentLight: '#ccfbf1',
    colorAccentText: '#ffffff',
    colorSidebarBg: '#042f2e',
    colorSidebarText: '#99f6e4',
    colorSidebarActive: '#0d9488',
    colorBgAppStart: '#f0fdfa',
    colorBgAppEnd: '#ccfbf1',
    darkColorBgAppStart: '#042f2e',
    darkColorBgAppEnd: '#011717',
    darkColorSidebarBg: '#021e1d',
    bgType: 'gradient',
  }
];

export function hexToRgb(hex: string): string {
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
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent / 100))));

  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');
  return `#${rHex}${gHex}${bHex}`;
}

export function getDarkToneFromColor(hex: string, depth = 90): string {
  // Generates a subtle dark tint background based on accent hex color
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  let r = parseInt(c.substring(0, 2), 16);
  let g = parseInt(c.substring(2, 4), 16);
  let b = parseInt(c.substring(4, 6), 16);

  r = Math.max(2, Math.min(40, Math.floor(r * (1 - depth / 100))));
  g = Math.max(2, Math.min(40, Math.floor(g * (1 - depth / 100))));
  b = Math.max(2, Math.min(40, Math.floor(b * (1 - depth / 100))));

  const rHex = r.toString(16).padStart(2, '0');
  const gHex = g.toString(16).padStart(2, '0');
  const bHex = b.toString(16).padStart(2, '0');
  return `#${rHex}${gHex}${bHex}`;
}
