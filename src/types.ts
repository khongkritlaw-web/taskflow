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

export interface Installment {
  installmentNo: number;
  amount: number;
  dueDate: string;
  paid: boolean;
  paidDate?: string;
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
  isInstallment?: boolean;
  totalInstallments?: number;
  installments?: Installment[];
}

export interface CustomMenuLink {
  id: string;
  title: string;
  url: string;
  iconName?: string;
  visibility?: 'all' | 'specific';
  allowedUsers?: string[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  visibility: 'all' | 'specific';
  allowedUsers?: string[];
  createdAt: string;
  isActive: boolean;
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
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
  smtpSenderName?: string;
  autoSendEnabled?: boolean;
  lastAutoSentDate?: string;
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
  settingsPassword?: string;
  printTitle?: string;
  printSubtitle?: string;
  printTemplatePattern?: 'standard' | 'formal' | 'compact' | 'creative';
  printShowSignatures?: boolean;
  printFooterText?: string;
  soundEnabled?: boolean;
  soundType?: 'chime' | 'success' | 'alert' | 'bell' | 'pop';
  soundVolume?: number; // 0 to 100
  soundOnComplete?: boolean;
  soundOnAdd?: boolean;
  aiAssistantEnabled?: boolean;
  nativeNotificationsEnabled?: boolean;
  announcements?: Announcement[];
}
