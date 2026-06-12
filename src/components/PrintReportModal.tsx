import React, { useState, useEffect } from 'react';
import { Printer, FileText, Check, Calendar, Coins, ArrowRight, Layout, Info } from 'lucide-react';
import { Task, Expense, AppSettings } from '../types';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  expenses: Expense[];
  settings: AppSettings;
}

export function PrintReportModal({ isOpen, onClose, tasks, expenses, settings }: PrintReportModalProps) {
  const accentColor = settings.colorAccent || '#6366f1';

  // State management for printer selection
  const [modules, setModules] = useState({
    tasks: true,
    expenses: true,
    summary: true
  });

  const [dateScope, setDateScope] = useState<'all' | 'day' | 'month' | 'year' | 'range'>('all');
  
  // Pre-populate with Bangkok timezone dates
  const getBkkDateString = (date: Date) => {
    const offset = 7 * 60; // BKK is UTC+7
    const bkkTime = new Date(date.getTime() + (date.getTimezoneOffset() + offset) * 60000);
    return bkkTime.toISOString().split('T')[0];
  };

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(() => getBkkDateString(today));
  const [selectedMonth, setSelectedMonth] = useState(() => String(today.getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(() => String(today.getFullYear()));
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // First day of current month
    return getBkkDateString(d);
  });
  const [endDate, setEndDate] = useState(() => getBkkDateString(today));
  
  const [includeNotes, setIncludeNotes] = useState(true);
  const [sortBy, setSortBy] = useState<'date-asc' | 'date-desc' | 'amount-desc'>('date-asc');

  // React to system dispatch events in the background for cross-module launches
  useEffect(() => {
    const handleOpenEvent = (event: any) => {
      const initialTab = event.detail?.initialTab;
      if (initialTab === 'tasks') {
        setModules({ tasks: true, expenses: false, summary: false });
      } else if (initialTab === 'expenses') {
        setModules({ tasks: false, expenses: true, summary: false });
      } else if (initialTab === 'calendar') {
        setModules({ tasks: true, expenses: false, summary: false });
        setDateScope('month');
      } else {
        setModules({ tasks: true, expenses: true, summary: true });
      }
    };

    window.addEventListener('open-print-modal', handleOpenEvent);
    return () => {
      window.removeEventListener('open-print-modal', handleOpenEvent);
    };
  }, []);

  if (!isOpen) return null;

  // Month dictionary for formatting
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const formatThaiDateStr = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const day = parseInt(parts[2]);
      const monthIndex = parseInt(parts[1]) - 1;
      const year = parseInt(parts[0]) + 543;
      return `${day} ${thaiMonths[monthIndex]} ${year}`;
    } catch (_) {
      return dateStr;
    }
  };

  const handlePrint = () => {
    // 1. Core Filtering logic matching user date criteria perfectly
    const filterByDate = (dateString: string) => {
      if (!dateString) return false;
      
      switch (dateScope) {
        case 'day':
          return dateString === selectedDate;
        case 'month':
          return dateString.substring(0, 7) === `${selectedYear}-${selectedMonth}`;
        case 'year':
          return dateString.substring(0, 4) === selectedYear;
        case 'range':
          return dateString >= startDate && dateString <= endDate;
        case 'all':
        default:
          return true;
      }
    };

    // Filter Tasks
    const filteredTasks = tasks.filter(t => filterByDate(t.dueDate));
    
    // Filter Expenses
    const filteredExpenses = expenses.filter(e => filterByDate(e.date || e.dueDate));

    // Sort entries accordingly
    if (sortBy === 'date-asc') {
      filteredTasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      filteredExpenses.sort((a, b) => (a.date || a.dueDate).localeCompare(b.date || b.dueDate));
    } else if (sortBy === 'date-desc') {
      filteredTasks.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
      filteredExpenses.sort((a, b) => (b.date || b.dueDate).localeCompare(a.date || a.dueDate));
    } else if (sortBy === 'amount-desc') {
      filteredExpenses.sort((a, b) => b.amount - a.amount);
    }

    // Build the verbal scope summary
    let scopeLabel = '';
    if (dateScope === 'all') {
      scopeLabel = 'ข้อมูลสะสมทั้งหมดในระบบ';
    } else if (dateScope === 'day') {
      scopeLabel = `รายงานวันที่ ${formatThaiDateStr(selectedDate)}`;
    } else if (dateScope === 'month') {
      scopeLabel = `รายงานประจำเดือน ${thaiMonths[parseInt(selectedMonth) - 1]} พ.ศ. ${parseInt(selectedYear) + 543}`;
    } else if (dateScope === 'year') {
      scopeLabel = `รายงานประจำปี พ.ศ. ${parseInt(selectedYear) + 543}`;
    } else if (dateScope === 'range') {
      scopeLabel = `รายงานช่วงระหว่างวันที่ ${formatThaiDateStr(startDate)} ถึง ${formatThaiDateStr(endDate)}`;
    }

    // Task and Expense stats overview
    const totalTasksCount = filteredTasks.length;
    const completedTasksCount = filteredTasks.filter(t => t.status === 'completed').length;
    const pendingTasksCount = totalTasksCount - completedTasksCount;
    
    const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const paidExpenseAmount = filteredExpenses.filter(e => e.paid).reduce((sum, e) => sum + e.amount, 0);
    const unpaidExpenseAmount = totalExpenseAmount - paidExpenseAmount;

    // Build complete report HTML documents with professional typesetting
    const reportHtml = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="utf-8" />
        <title>รายงานสรุปการดำเนินงานแบบบูรณาการ - ${settings.appName || 'TaskFlow Space'}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&display=swap');
          
          body {
            font-family: 'Sarabun', 'Helvetica Neue', sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 40px;
            line-height: 1.5;
            background-color: #ffffff;
            font-size: 13px;
          }

          @media print {
            body {
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: A4;
              margin: 1.5cm;
            }
          }

          .header-box {
            text-align: center;
            border-bottom: 3px double #0f172a;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }

          .header-box h1 {
            font-size: 24px;
            font-weight: 800;
            margin: 0 0 5px 0;
            color: #0f172a;
          }

          .header-box p {
            font-size: 12px;
            color: #64748b;
            margin: 0;
          }

          .meta-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 30px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 15px;
            border-radius: 8px;
            font-size: 12px;
          }

          .meta-item {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px dashed #e2e8f0;
            padding-bottom: 4px;
          }

          .meta-item:last-child {
            border-none: none;
          }

          .meta-label {
            font-weight: 600;
            color: #475569;
          }

          .section-title {
            font-size: 15px;
            font-weight: 700;
            background-color: #f1f5f9;
            color: #0f172a;
            padding: 8px 12px;
            border-left: 5px solid ${accentColor};
            border-radius: 4px;
            margin-top: 30px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          /* Stat metrics grids */
          .stats-container {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 25px;
          }

          .stat-card {
            border: 1px solid #e2e8f0;
            background-color: #ffffff;
            border-radius: 6px;
            padding: 12px;
            text-align: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          }

          .stat-label {
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 3px;
          }

          .stat-val {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
          }

          /* Tables formatting */
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11.5px;
            margin-bottom: 25px;
          }

          th {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            color: #0f172a;
            font-weight: 700;
            text-align: left;
            padding: 9px;
          }

          td {
            border: 1px solid #cbd5e1;
            padding: 8px;
            vertical-align: top;
          }

          tr:nth-child(even) {
            background-color: #fcfdfe;
          }

          .text-center {
            text-align: center;
          }

          .text-right {
            text-align: right;
          }

          /* Badges styling */
          .badge {
            font-size: 10px;
            font-weight: bold;
            padding: 2.5px 7px;
            border-radius: 4px;
            display: inline-block;
            text-align: center;
          }

          .badge-pending {
            background-color: #fef3c7;
            color: #b45309;
            border: 1px solid #fde68a;
          }

          .badge-completed {
            background-color: #d1fae5;
            color: #047857;
            border: 1px solid #a7f3d0;
          }

          .badge-paid {
            background-color: #d1fae5;
            color: #047857;
            border: 1px solid #a7f3d0;
          }

          .badge-unpaid {
            background-color: #fee2e2;
            color: #b91c1c;
            border: 1px solid #fca5a5;
          }

          /* Signatures blocks */
          .signatures-block {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
          }

          .sig-column {
            width: 44%;
            text-align: center;
          }

          .dotted-line {
            border-bottom: 1px dotted #94a3b8;
            height: 40px;
            width: 80%;
            margin: 0 auto 10px auto;
          }

          .footer-note {
            font-size: 9px;
            color: #94a3b8;
            text-align: center;
            margin-top: 50px;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>

        <div class="header-box">
          <h1>รายงานสรุปสารสนเทศและการดำเนินงานแบบบูรณาการ</h1>
          <p>${settings.appName || 'TaskFlow Space (โปรแกรมผู้จัดการส่วนตัว)'} — ${settings.appDesc || 'ระบบบริหารจัดการประสิทธิภาพงานส่วนบุคคล'}</p>
        </div>

        <div class="meta-info-grid">
          <div>
            <div class="meta-item">
              <span class="meta-label">ขอบเขตระยะเวลาข้อมูล:</span>
              <span>${scopeLabel}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">ชั้นความลับเอกสาร:</span>
              <span>เอกสารส่วนบุคคล (Internal Data)</span>
            </div>
          </div>
          <div>
            <div class="meta-item">
              <span class="meta-label">พิมพ์เมื่อวันที่:</span>
              <span>${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} น.</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">ผู้จัดทำการรายงาน:</span>
              <span>บัญชีผู้ใช้งานระบบสิทธิ์ตรง</span>
            </div>
          </div>
        </div>

        ${modules.summary ? `
          <div class="section-title">📊 สถิติพารามิเตอร์สาระสำคัญ (Key Performance Metrics)</div>
          <div class="stats-container">
            <div class="stat-card" style="border-top: 3px solid #6366f1;">
              <div class="stat-label">จำนวนงานทั้งหมดตามเงื่อนไข</div>
              <div class="stat-val" style="color: #4f46e5;">${totalTasksCount} รายการ</div>
            </div>
            <div class="stat-card" style="border-top: 3px solid #10b981;">
              <div class="stat-label">งานดำเนินเสร็จสิ้น (สำเร็จ)</div>
              <div class="stat-val" style="color: #059669;">${completedTasksCount} รายการ</div>
            </div>
            <div class="stat-card" style="border-top: 3px solid #f59e0b;">
              <div class="stat-label">รวมค่าใช้จ่ายเฉลี่ยสะสม</div>
              <div class="stat-val" style="color: #d97706;">฿${totalExpenseAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div class="stat-card" style="border-top: 3px solid #ef4444;">
              <div class="stat-label font-bold text-red-500">รวมค่าใช้จ่ายที่ค้างชำระ</div>
              <div class="stat-val" style="color: #dc2626;">฿${unpaidExpenseAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
        ` : ''}

        ${modules.tasks ? `
          <div class="section-title">
            <span>📋 สรุปความคืบหน้าด้านงานและภารกิจ (Task Board Summary List)</span>
            <span style="font-size: 11px; font-weight: normal;">รวมทั้งสิ้น ${totalTasksCount} รายการ</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 6%; text-align: center;">ลำดับ</th>
                <th style="width: 28%;">หัวข้อมติ/ภารกิจหลัก</th>
                ${includeNotes ? '<th style="width: 32%;">รายละเอียดข้อมูลและเป้าหมายย่อย</th>' : ''}
                <th style="width: 14%;">ประเภทหมวดหมู่</th>
                <th style="width: 11%;">กำหนดส่ง</th>
                <th style="width: 9%; text-align: center;">สถานะการดำเนินงาน</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTasks.length === 0 ? `
                <tr>
                  <td colspan="${includeNotes ? 6 : 5}" style="text-align: center; padding: 25px; color: #94a3b8;">
                    <i>- ไม่พบข้อมูลรายการกิจกรรมงานที่สอดคล้องตามเงื่อนไขระบุข้างต้น -</i>
                  </td>
                </tr>
              ` : filteredTasks.map((t, idx) => `
                <tr>
                  <td class="text-center font-bold">${idx + 1}</td>
                  <td><strong>${t.title}</strong></td>
                  ${includeNotes ? `<td>${t.desc ? t.desc.replace(/\n/g, '<br/>') : '<span style="color:#cbd5e1">-</span>'}</td>` : ''}
                  <td>${t.category}</td>
                  <td>
                    ${formatThaiDateStr(t.dueDate)}
                    ${t.dueTime ? `<div style="font-size: 9.5px; color:#64748b; margin-top:2px;">⏰ ${t.dueTime} น.</div>` : ''}
                  </td>
                  <td class="text-center">
                    <span class="badge ${t.status === 'completed' ? 'badge-completed' : 'badge-pending'}">
                      ${t.status === 'completed' ? 'เสร็จสิ้น' : 'รอคิวปฏิบัติ'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        ${modules.expenses ? `
          <div style="page-break-before: auto;"></div>
          <div class="section-title">
            <span>💰 สรุปบัญชีรายรับ-รายจ่ายและค่าครองชีพ (Financial Ledger Summary)</span>
            <span style="font-size: 11px; font-weight: normal;">รวมทั้งสิ้น ${filteredExpenses.length} รายการ</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 6%; text-align: center;">ลำดับ</th>
                <th style="width: 25%;">ชื่อธุรกรรม / เรื่องการชำระเงิน</th>
                ${includeNotes ? '<th style="width: 32%;">รายละเอียดจำเพาะเจาะจง / ประวัติการบันทึกย่อ</th>' : ''}
                <th style="width: 13%;">สังกัดกลุ่มค่าใช้จ่าย</th>
                <th style="width: 12%; text-align: right;">จำนวนเงินรวม</th>
                <th style="width: 12%; text-align: center;">สถานะชำระเงิน</th>
              </tr>
            </thead>
            <tbody>
              ${filteredExpenses.length === 0 ? `
                <tr>
                  <td colspan="${includeNotes ? 6 : 5}" style="text-align: center; padding: 25px; color: #94a3b8;">
                    <i>- ไม่พบรายการบันทึกรายจ่ายธุรกรรมที่ประเมินผ่านตัวกรองเวลาชุดนี้ -</i>
                  </td>
                </tr>
              ` : filteredExpenses.map((e, idx) => `
                <tr>
                  <td class="text-center font-bold">${idx + 1}</td>
                  <td><strong>${e.name}</strong></td>
                  ${includeNotes ? `<td>${e.note ? e.note.replace(/\n/g, '<br/>') : '<span style="color:#cbd5e1">-</span>'}</td>` : ''}
                  <td>${e.cat}</td>
                  <td class="text-right" style="font-weight: 600;">฿${e.amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td class="text-center">
                    <span class="badge ${e.paid ? 'badge-paid' : 'badge-unpaid'}">
                      ${e.paid ? 'ชำระแล้ว' : 'ค้างชำระ'}
                    </span>
                  </td>
                </tr>
              `).join('')}
              ${filteredExpenses.length > 0 ? `
                <tr style="background-color: #f8fafc; font-weight: bold;">
                  <td colspan="${includeNotes ? 4 : 3}" class="text-right" style="padding: 10px;">ยอดเงินรวมทั้งสิ้นสะสม:</td>
                  <td class="text-right" style="color: #0f172a; padding: 10px; font-size: 13px;">฿${totalExpenseAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style="background-color:#f1f5f9; padding: 10px;" class="text-center">
                    <div style="font-size: 8.5px; color:#475569;">จ่ายแล้ว: ฿${paidExpenseAmount.toLocaleString('th-TH', { maximumFractionDigits: 0 })}<br/>ค้าง: ฿${unpaidExpenseAmount.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</div>
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        ` : ''}

        <div class="signatures-block">
          <div class="sig-column">
            <div class="dotted-line"></div>
            <p style="font-size: 11px; margin: 0; font-weight: 600;">ลงลายมือชื่อผู้จัดทำเอกสาร (Reporter)</p>
            <p style="font-size: 9.5px; color: #64748b; margin-top: 3.5px;">ตำแหน่ง เจ้าหน้าที่ผู้บริหารสถานบริการงานส่วนบุคคล</p>
          </div>
          <div class="sig-column">
            <div class="dotted-line"></div>
            <p style="font-size: 11px; margin: 0; font-weight: 600;">ลงลายมือชื่อผู้ตรวจประเมินประสานงาน (Auditor)</p>
            <p style="font-size: 9.5px; color: #64748b; margin-top: 3.5px;">( ผู้ตรวจสอบการปฏิบัติหน้าที่ความปลอดภัยระบบ )</p>
          </div>
        </div>

        <p class="footer-note">
          สร้างขึ้นโดยกลไกอัตโนมัติจากแอปพลิเคชันระบบภารกิจ TaskFlow Space คลาวด์เรียลไทม์ ซิงโครไนซ์สมบูรณ์ข้อมูลความมั่นคงสูงสุด
        </p>

      </body>
      </html>
    `;

    // Print processing via standard hidden iframe mechanism
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    // Inject the fully compiled HTML report to allow standard browser rendering & Thai fonts
    iframe.contentWindow?.document.open();
    iframe.contentWindow?.document.write(reportHtml);
    iframe.contentWindow?.document.close();

    // Focus and call native print engine (or OS PDF export directly)
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 450);

    onClose();
  };

  return (
    <div id="universal-print-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 dark:bg-slate-900 dark:border-slate-800">
        
        {/* Header container */}
        <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50 dark:bg-slate-950 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center border border-indigo-100 dark:border-indigo-900">
              <Printer className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                ระบบจัดการและส่งออกเอกสารรายงาน (PDF / Printer)
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">คัดกรองข้อมูลสรุปสถิติจัดระเบียบอย่างเป็นทางการ</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 text-slate-400 hover:text-slate-800 bg-white dark:bg-slate-900 dark:border-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content container */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs scrollbar-thin">
          
          {/* Part 1: Targets to include */}
          <div className="space-y-2.5">
            <span className="block font-bold text-slate-700 dark:text-slate-350">
              📌 1. เลือกข้อมูลสำคัญที่ต้องการพิมพ์สรุป (Selected Data Topics)
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setModules(prev => ({ ...prev, tasks: !prev.tasks }))}
                className={`py-2.5 px-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all relative ${
                  modules.tasks 
                    ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/20 dark:text-indigo-400' 
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="font-bold text-[11px]">รายการภารกิจ</span>
                {modules.tasks && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-500 text-white rounded-full flex items-center justify-center text-[8px] font-black">✓</span>}
              </button>

              <button
                type="button"
                onClick={() => setModules(prev => ({ ...prev, expenses: !prev.expenses }))}
                className={`py-2.5 px-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all relative ${
                  modules.expenses 
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400' 
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span className="font-bold text-[11px]">รายจ่ายและบิล</span>
                {modules.expenses && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[8px] font-black">✓</span>}
              </button>

              <button
                type="button"
                onClick={() => setModules(prev => ({ ...prev, summary: !prev.summary }))}
                className={`py-2.5 px-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all relative ${
                  modules.summary 
                    ? 'border-amber-500 bg-amber-50/50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-400' 
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                }`}
              >
                <Layout className="w-4 h-4" />
                <span className="font-bold text-[11px]">สถิติสรุปหน้าแรก</span>
                {modules.summary && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[8px] font-black">✓</span>}
              </button>
            </div>
          </div>

          {/* Part 2: Time frames */}
          <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="block font-bold text-slate-700 dark:text-slate-350">
              ⏳ 2. กรองขอบข่ายเวลากำหนดสรุป (Scope & Date Filtering)
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { val: 'all', label: 'ทั้งหมด' },
                { val: 'day', label: 'ตามวัน' },
                { val: 'month', label: 'เป็นรายเดือน' },
                { val: 'year', label: 'รายปี' },
                { val: 'range', label: 'เลือกช่วง' }
              ].map((scope) => (
                <button
                  key={scope.val}
                  type="button"
                  onClick={() => setDateScope(scope.val as any)}
                  className={`py-2 rounded-lg border font-bold text-[10.5px] transition-all text-center ${
                    dateScope === scope.val 
                      ? 'border-indigo-500 text-white dark:border-indigo-800' 
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-400'
                  }`}
                  style={dateScope === scope.val ? { backgroundColor: accentColor } : {}}
                >
                  {scope.label}
                </button>
              ))}
            </div>

            {/* Inputs based on selection */}
            {dateScope === 'day' && (
              <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5 dark:bg-slate-950 dark:border-slate-850 animate-in fade-in duration-100">
                <span className="text-[10px] font-bold text-slate-400">ระบุวันที่เจาะจงที่ประสงค์พิมพ์ข้อมูล:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-indigo-500 font-medium font-mono dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                />
              </div>
            )}

            {dateScope === 'month' && (
              <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl grid grid-cols-2 gap-2.5 dark:bg-slate-950 dark:border-slate-850 animate-in fade-in duration-100">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400">เลือกเดือนปฏิบัติงาน:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-indigo-500 font-bold dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                  >
                    {thaiMonths.map((mn, idx) => (
                      <option key={mn} value={String(idx + 1).padStart(2, '0')}>{mn}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400">ระบุปี ค.ศ. (พ.ศ.):</span>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    placeholder="เช่น 2026"
                    className="w-full h-10 px-3 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-indigo-500 font-bold font-mono dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            )}

            {dateScope === 'year' && (
              <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5 dark:bg-slate-950 dark:border-slate-850 animate-in fade-in duration-100">
                <span className="text-[10px] font-bold text-slate-400">กรอกประเมินปี ค.ศ. ของระเบียนข้อมูลที่คัดเก็บ:</span>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  placeholder="เช่น 2026"
                  className="w-full h-10 px-3 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-indigo-500 font-bold font-mono dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                />
              </div>
            )}

            {dateScope === 'range' && (
              <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-2 dark:bg-slate-950 dark:border-slate-850 animate-in fade-in duration-100">
                <span className="text-[10px] font-bold text-slate-400">กำหนดเงื่อนไขช่วงเวลาเริ่มต้นแบบกำหนดเอง:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 h-10 px-3 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-indigo-500 font-medium font-mono dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                  />
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 h-10 px-3 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-indigo-500 font-medium font-mono dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Part 3: Other parameters */}
          <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="block font-bold text-slate-700 dark:text-slate-350">
              ⚙️ 3. ตั้งค่าการเรียงลำดับ & รูปแบบเอกสาร (Report Format & Sorting)
            </span>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400">เกณฑ์การเรียงลำดับรายการ:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full h-10 px-3 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-indigo-500 font-semibold text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300"
                >
                  <option value="date-asc">🗓️ กำหนดส่ง (เก่า ➔ ใหม่)</option>
                  <option value="date-desc">🗓️ กำหนดส่ง (ใหม่ ➔ เก่า)</option>
                  <option value="amount-desc">💵 ยอดเงินสูงสุด (เรียงลง)</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2.5 h-10 px-3 cursor-pointer select-none bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 dark:bg-slate-950 dark:border-slate-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeNotes}
                    onChange={(e) => setIncludeNotes(e.target.checked)}
                    className="w-4.5 h-4.5 text-indigo-600 border-slate-300 rounded focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">พิมพ์ส่วนรายละเอียด</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Helpful safety guidelines for iOS / macOS iframe limits */}
          <div className="p-3 bg-amber-50/70 border border-amber-150 rounded-xl text-amber-800 text-[10.5px] leading-relaxed dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400 flex items-start gap-2.5">
            <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p>
              <strong>ข้อแนะนำทางการพิมพ์:</strong> กระบวนการนี้ทำสรุปสลิปและใบรายงานแบบไร้ข้อผิดพลาด หากคุณใช้งานบนบราวเซอร์ของระบบ สามารถดาวน์โหลดเป็นเอกสาร <strong>PDF</strong> โดยคลิกเปลี่ยนเครื่องพิมพ์ในโปรแกรมตัวเลือกของระบบปฏิบัติการเป็น <strong>"Save as PDF" (บันทึกเป็น PDF)</strong>
            </p>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-150 flex items-center justify-end gap-3 dark:bg-slate-950 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-4 border border-slate-200 text-slate-500 hover:text-slate-800 bg-white font-bold text-xs rounded-xl dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            ยกเลิกฟอร์ม
          </button>
          <button
            type="button"
            disabled={!modules.tasks && !modules.expenses && !modules.summary}
            onClick={handlePrint}
            className="h-11 px-6 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: accentColor }}
          >
            <Printer className="w-4 h-4" />
            ตกลง พิมพ์ / บันทึกไฟล์ PDF
          </button>
        </div>

      </div>
    </div>
  );
}
