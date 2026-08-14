export interface TaskAttachment {
  name: string;
  type: string; // 'image' | 'file'
  base64: string;
}

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
  attachments?: TaskAttachment[];
  completedAttachments?: TaskAttachment[];
  completedAt?: string;
  isRecurring?: boolean;
  recurringDays?: string[]; // e.g. ['Sunday', 'Monday', etc.] or ['0', '1', etc.] for week days or specific options
  assignedByAdmin?: boolean;
  approvalStatus?: 'assigned' | 'pending_review' | 'approved' | 'needs_revision';
  adminFeedback?: string;
  completionNotes?: string;
}

export interface Installment {
  installmentNo: number;
  amount: number;
  dueDate: string;
  paid: boolean;
  paidDate?: string;
  slipBase64?: string;
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
  slipBase64?: string;
  paidDate?: string;
}

export interface CustomMenuLink {
  id: string;
  title: string;
  url: string;
  iconName?: string;
  visibility?: 'all' | 'specific';
  allowedUsers?: string[];
  openDirectly?: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  visibility: 'all' | 'specific';
  allowedUsers?: string[];
  createdAt: string;
  author?: string;
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
  expenseCategories?: string[];
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
  darkColorBgAppStart?: string;
  darkColorBgAppEnd?: string;
  darkColorSidebarBg?: string;
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

export interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

export interface ReceiptDoc {
  id: string;
  receiptNo: string;
  docType: 'receipt' | 'tax_invoice' | 'invoice' | 'quotation' | 'temp_receipt';
  issueDate: string;
  dueDate?: string;
  refNo?: string;
  
  // Issuer details
  issuerName: string;
  issuerTaxId?: string;
  issuerBranch?: string;
  issuerAddress?: string;
  issuerPhone?: string;
  issuerEmail?: string;
  issuerLogoUrl?: string;
  showLogo?: boolean;

  // Watermark details
  showWatermark?: boolean;
  watermarkType?: 'text' | 'image';
  watermarkText?: string;
  watermarkImageUrl?: string;
  watermarkOpacity?: number;

  // Customer details
  customerName: string;
  customerTaxId?: string;
  customerBranch?: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;

  // Items and Calculation
  items: ReceiptItem[];
  subtotal: number;
  discountType?: 'flat' | 'percent';
  discountValue?: number;
  discountAmount?: number;
  
  vatType: 'no_vat' | 'vat_7_add' | 'vat_7_included';
  vatAmount?: number;
  
  withholdingTaxPercent?: number; // e.g., 0, 1, 3, 5
  withholdingTaxAmount?: number;
  
  grandTotal: number;
  grandTotalTextThai?: string;

  // Payment
  paymentMethod: 'cash' | 'transfer' | 'cheque' | 'credit' | 'qr';
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  chequeNo?: string;
  chequeDate?: string;

  // Notes & Signatures
  notes?: string;
  showSignatures?: boolean;
  collectorName?: string;
  collectorSignatureUrl?: string;
  approverName?: string;
  approverSignatureUrl?: string;

  userId: string;
  createdAt: string;
  status: 'active' | 'void';
}

export type PaperSizePreset = 
  | 'a4' 
  | 'a5' 
  | 'a5_landscape' 
  | 'a6' 
  | 'letter' 
  | 'slip_80' 
  | 'slip_58' 
  | 'custom';

export interface PaperSizeConfig {
  preset: PaperSizePreset;
  name: string;
  widthMm: number; // width in mm
  heightMm: number; // height in mm
  unit: 'mm' | 'cm' | 'in';
  customWidth: number;
  customHeight: number;
  orientation: 'portrait' | 'landscape';
  marginMm: number;
  scale: number; // 0.5 - 1.2
  isSlip?: boolean;
}

export interface SavedIssuerProfile {
  id: string;
  name: string;
  taxId: string;
  branch: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  showLogo?: boolean;
  createdAt: string;
  lastUsedAt: string;
}

export interface SavedCustomerProfile {
  id: string;
  name: string;
  taxId: string;
  branch: string;
  address: string;
  phone: string;
  email: string;
  createdAt: string;
  lastUsedAt: string;
}

