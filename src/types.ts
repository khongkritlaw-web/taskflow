export interface Task {
  id: string;
  title: string;
  desc?: string;
  category: string;
  dueDate: string;
  dueTime?: string;
  status: 'pending' | 'completed';
  userId: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  cat: string;
  date: string;
  dueDate: string;
  note?: string;
  paid: boolean;
  userId: string;
}

export interface CustomMenuLink {
  id: string;
  title: string;
  url: string;
}

export interface AppSettings {
  appName: string;
  appDesc: string;
  appLogoUrl?: string;
  bgStyle: 'default' | 'indigo' | 'slate' | 'custom' | 'theme-custom';
  customBgUrl?: string;
  darkMode: boolean;
  categories: string[];
  emailRecipient?: string;
  emailNotificationEnabled?: boolean;
  emailMessageTemplate?: string;
  alertDays: number[];
  themePreset: string;
  // Custom theme colors
  colorAccent: string;
  colorAccentHover: string;
  colorAccentLight: string;
  colorAccentText: string;
  colorSidebarBg: string;
  colorSidebarText: string;
  colorSidebarActive: string;
  colorBgAppStart: string;
  colorBgAppEnd: string;
  bgType: 'solid' | 'gradient'; // 'solid' or 'gradient'
  customMenuLinks?: CustomMenuLink[];
}
