import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, 
  FileText, 
  Plus, 
  Trash2, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Info,
  Check,
  RotateCcw,
  Sparkles,
  Search,
  BookOpen,
  ArrowLeft,
  X
} from 'lucide-react';

interface PetitionDoc {
  id: string;
  title: string;
  createdAt: string;
  
  blackNo: string;
  redNo: string;
  court: string;
  dateDay: string;
  dateMonth: string;
  dateYear: string;
  caseTitle: string;
  plaintiff: string;
  defendant: string;
  
  applicantName: string;
  idCard: string; // 13 digits
  race: string;
  nationality: string;
  occupation: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  age: string;
  addressNo: string;
  moo: string;
  soi: string;
  road: string;
  subdistrict: string;
  inMueang: string;
  district: string;
  province: string;
  zipcode: string;
  phone: string;
  fax: string;
  email: string;
  
  docType: 'petition' | 'statement' | 'request'; // คำร้อง / คำแถลง / คำขอ
  clauseText: string;
  signatureName: string;
  bgImagePage1?: string;
  bgImagePage2?: string;
  useScannedBackground?: boolean;
  bgImageOpacity?: number;
}

const DEFAULT_DOC: PetitionDoc = {
  id: '',
  title: 'คำร้องขอขยายระยะเวลายื่นคำให้การ',
  createdAt: '',
  blackNo: '',
  redNo: '',
  court: 'ศาลอาญา',
  dateDay: new Date().getDate().toString(),
  dateMonth: getThaiMonthName(new Date().getMonth()),
  dateYear: (new Date().getFullYear() + 543).toString(),
  caseTitle: 'อาญา',
  plaintiff: 'พนักงานอัยการ สำนักงานอัยการสูงสุด',
  defendant: 'จำเลยในคดี',
  applicantName: 'สมชาย รักความยุติธรรม',
  idCard: '1100100200300',
  race: 'ไทย',
  nationality: 'ไทย',
  occupation: 'รับจ้าง',
  birthDay: '15',
  birthMonth: 'มกราคม',
  birthYear: '2535',
  age: '34',
  addressNo: '99/1',
  moo: '3',
  soi: 'ลาดพร้าว 101',
  road: 'ลาดพร้าว',
  subdistrict: 'คลองจั่น',
  inMueang: '',
  district: 'บางกะปิ',
  province: 'กรุงเทพมหานคร',
  zipcode: '10240',
  phone: '0812345678',
  fax: '',
  email: 'somchai.law@example.com',
  docType: 'petition',
  clauseText: 'ข้อ ๑. คดีนี้ โจทก์ได้ยื่นฟ้องจำเลยต่อศาลนี้ในข้อหาความผิดเกี่ยวกับพระราชบัญญัติคอมพิวเตอร์และฉ้อโกงประชาชน ซึ่งศาลได้กำหนดให้จำเลยยื่นคำให้การแก้ฟ้องภายในกำหนดระยะเวลาสามสิบวัน นับแต่วันที่ได้รับสำเนาคำฟ้อง\n\nเนื่องจากคดีนี้มีเอกสารพยานหลักฐานที่โจทก์อ้างอิงเป็นจำนวนมาก และจำเลยมีความจำเป็นต้องประสานงานกับผู้เชี่ยวชาญด้านเทคโนโลยีสารสนเทศเพื่อตรวจสอบความถูกต้องของข้อมูลจราจรทางคอมพิวเตอร์ ตลอดจนรวบรวมพยานเอกสารและพยานบุคคลที่เกี่ยวข้องเพื่อมาประกอบการจัดทำคำให้การให้มีความถูกต้องครบถ้วนสมบูรณ์เพื่อประโยชน์แห่งความยุติธรรม แต่เนื่องจากข้อจำกัดด้านเวลาและพยานหลักฐานบางส่วนอยู่ต่างจังหวัด ทำให้จำเลยไม่สามารถจัดเตรียมคำให้การได้เสร็จสิ้นทันภายในกำหนดระยะเวลา\n\nด้วยเหตุดังกล่าวข้างต้น จำเลยจึงกราบเรียนต่อศาลที่เคารพเพื่อขอความกรุณาจากศาลได้โปรดอนุญาตขยายระยะเวลายื่นคำให้การของจำเลยออกไปอีกเป็นเวลาสามสิบวัน นับแต่วันครบกำหนดเดิม ทั้งนี้เพื่อประโยชน์สูงสุดแห่งความยุติธรรม ขอศาลได้โปรดอนุญาต\n\nควรมิควรแล้วแต่จะโปรด',
  signatureName: 'สมชาย รักความยุติธรรม',
  bgImagePage1: '',
  bgImagePage2: '',
  useScannedBackground: true,
  bgImageOpacity: 100
};

function getThaiMonthName(index: number): string {
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  return months[index] || '';
}

interface FormDocumentModuleProps {
  accentColor: string;
  darkMode: boolean;
}

export default function FormDocumentModule({ accentColor, darkMode }: FormDocumentModuleProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [savedDocs, setSavedDocs] = useState<PetitionDoc[]>([]);
  const [currentDoc, setCurrentDoc] = useState<PetitionDoc>({ ...DEFAULT_DOC });
  const [searchQuery, setSearchQuery] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(100);
  const [isEditingClause, setIsEditingClause] = useState(false);
  const [printMode, setPrintMode] = useState<'blank-paper' | 'pre-printed'>('blank-paper');
  const [inkColor, setInkColor] = useState<'navy' | 'black'>('navy');

  // Load saved forms on mount
  useEffect(() => {
    const saved = localStorage.getItem('dekasuite_saved_petitions');
    if (saved) {
      try {
        setSavedDocs(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved petitions', e);
      }
    }
  }, []);

  const saveToLocalStorage = (docs: PetitionDoc[]) => {
    localStorage.setItem('dekasuite_saved_petitions', JSON.stringify(docs));
    setSavedDocs(docs);
  };

  // Create a new blank petition form
  const handleCreateNew = () => {
    const newDoc: PetitionDoc = {
      ...DEFAULT_DOC,
      id: 'doc_' + Date.now(),
      title: 'คำร้องใหม่ - ' + new Date().toLocaleDateString('th-TH'),
      createdAt: new Date().toISOString(),
      // Default to empty except base court and date info
      blackNo: '',
      redNo: '',
      plaintiff: '',
      defendant: '',
      applicantName: '',
      idCard: '',
      race: 'ไทย',
      nationality: 'ไทย',
      occupation: '',
      age: '',
      addressNo: '',
      moo: '',
      soi: '',
      road: '',
      subdistrict: '',
      inMueang: '',
      district: '',
      province: '',
      zipcode: '',
      phone: '',
      fax: '',
      email: '',
      clauseText: 'ข้อ ๑. ',
      signatureName: ''
    };
    setCurrentDoc(newDoc);
    setEditorOpen(true);
  };

  // Open an existing saved document
  const handleOpenDoc = (doc: PetitionDoc) => {
    setCurrentDoc({ ...doc });
    setEditorOpen(true);
  };

  // Delete a saved document
  const handleDeleteDoc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบแบบฟอร์มคำร้องนี้ออกจากระบบ?')) {
      const updated = savedDocs.filter(d => d.id !== id);
      saveToLocalStorage(updated);
    }
  };

  // Save the active document
  const handleSaveDoc = () => {
    let updated: PetitionDoc[];
    const docToSave = {
      ...currentDoc,
      title: currentDoc.title || `คำร้อง (${currentDoc.court || 'ไม่ระบุศาล'})`,
      createdAt: currentDoc.createdAt || new Date().toISOString()
    };
    
    if (!docToSave.id) {
      docToSave.id = 'doc_' + Date.now();
      updated = [docToSave, ...savedDocs];
    } else {
      updated = savedDocs.map(d => d.id === docToSave.id ? docToSave : d);
    }
    
    saveToLocalStorage(updated);
    setCurrentDoc(docToSave);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Helper function to split text for legal forms taking account of Thai vowels
  const wrapThaiText = (text: string, charsPerLine: number = 70): string[] => {
    if (!text) return [];
    const rawLines = text.split('\n');
    const resultLines: string[] = [];
    
    // Thai non-spacing characters (above/below vowels and tone marks)
    const nonSpacingRegex = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0300-\u036F]/;
    
    for (const rawLine of rawLines) {
      if (rawLine === '') {
        resultLines.push('');
        continue;
      }
      
      let currentLine = '';
      let visualLength = 0;
      
      for (let i = 0; i < rawLine.length; i++) {
        const char = rawLine[i];
        currentLine += char;
        
        if (!nonSpacingRegex.test(char)) {
          visualLength++;
        }
        
        if (visualLength >= charsPerLine) {
          resultLines.push(currentLine);
          currentLine = '';
          visualLength = 0;
        }
      }
      if (currentLine !== '') {
        resultLines.push(currentLine);
      }
    }
    return resultLines;
  };

  // Dynamic distribution of Clause 1 lines across pages
  const clauseLines = wrapThaiText(currentDoc.clauseText, 68);
  const page1MaxLines = 4;
  const subsequentPageMaxLines = 24;

  const getPagesData = (): string[][] => {
    const pages: string[][] = [];
    // Page 1 holds up to 4 lines
    pages.push(clauseLines.slice(0, page1MaxLines));
    
    // Subsequent pages hold 24 lines each
    let index = page1MaxLines;
    while (index < clauseLines.length || (index === page1MaxLines && clauseLines.length === 0)) {
      pages.push(clauseLines.slice(index, index + subsequentPageMaxLines));
      index += subsequentPageMaxLines;
      if (pages.length > 25) break; // Infinite safety check
    }
    return pages;
  };

  const pagesData = getPagesData();

  // Print current document
  const handlePrint = () => {
    window.print();
  };

  const filteredDocs = savedDocs.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.court.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.applicantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Thai Number Converter for Page Numberings and Case numbers
  const toThaiNumber = (numStr: string): string => {
    const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
    return numStr.replace(/\d/g, (d) => thaiDigits[parseInt(d, 10)]);
  };

  // Helper to split ID Card into 13 blocks
  const renderIdCardBlocks = (idStr: string, isTemplateClassFaded: boolean) => {
    const blocks = Array(13).fill('');
    const cleanId = idStr.replace(/\D/g, '');
    for (let i = 0; i < Math.min(13, cleanId.length); i++) {
      blocks[i] = cleanId[i];
    }
    
    return (
      <div className="flex items-center gap-[2px]">
        {blocks.map((char, idx) => (
          <React.Fragment key={idx}>
            <div 
              className={`w-[14px] h-[18px] flex items-center justify-center font-bold text-xs bg-transparent transition-all ${
                isTemplateClassFaded ? 'border-transparent' : 'border border-black'
              }`}
            >
              {toThaiNumber(char)}
            </div>
            {(idx === 0 || idx === 4 || idx === 9 || idx === 11) && (
              <span className={`font-semibold text-[10px] mx-[1px] transition-all ${isTemplateClassFaded ? 'opacity-0' : 'text-black'}`}>-</span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Print styles exclusively added inside the component to prevent leakages */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide everything except the print-container */
          body * {
            visibility: hidden !important;
          }
          #print-area, #print-area * {
            visibility: visible !important;
          }
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            z-index: 9999999 !important;
          }
          .a4-page-print {
            display: block !important;
            width: 210mm !important;
            height: 297mm !important;
            page-break-after: always !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
            position: relative !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
          }
          /* Hide official template elements if printing on pre-printed paper */
          ${printMode === 'pre-printed' ? `
          .print-template-element {
            visibility: hidden !important;
            opacity: 0 !important;
          }
          .print-background-image {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
          }
          ` : ''}

          /* Hide dashed borders on preview and printing if in pre-printed or custom background mode */
          ${(printMode === 'pre-printed' || ((currentDoc.useScannedBackground ?? true) && (!!currentDoc.bgImagePage1 || !!currentDoc.bgImagePage2))) ? `
          #print-area .border-b.border-black.border-dashed {
            border-color: transparent !important;
          }
          ` : ''}
          /* Custom interactive elements printing styling */
          input, textarea, select {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            outline: none !important;
            color: ${inkColor === 'navy' ? '#1b365d' : '#000000'} !important;
            font-family: inherit !important;
            font-size: inherit !important;
            font-weight: inherit !important;
            resize: none !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
          }
          ::placeholder {
            color: transparent !important;
            opacity: 0 !important;
          }
          @page {
            size: A4;
            margin: 0 !important;
          }
        }
      `}} />

      <AnimatePresence mode="wait">
        {!editorOpen ? (
          /* ==========================================
             MODE 1: MAIN BLANK MENU PAGE (EMPTY LIST & LAUNCH BUTTON)
             ========================================== */
          <motion.div
            key="main-menu"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 text-left"
          >
            {/* Upper Header Banner */}
            <div className="p-6 bg-slate-900/40 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ระบบแบบฟอร์มศาลอิเล็กทรอนิกส์</span>
                </div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white">
                  ออกเอกสารแบบฟอร์ม
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
                  เครื่องมือร่างและสร้างแบบคำร้องคำแถลงคำขอต่อศาลไทย รองรับการพิมพ์ข้อความต่อเนื่องและปันหน้าขึ้นหน้าใหม่อัตโนมัติ พร้อมพิมพ์ส่งออกขนาด A4 ได้ทันทีอย่างเป็นทางการ
                </p>
              </div>

              {/* Exact One Button Trigger as requested */}
              <button
                onClick={handleCreateNew}
                style={{ backgroundColor: accentColor }}
                className="h-14 px-8 rounded-2xl text-slate-950 text-sm font-black transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg active:scale-95 text-center shrink-0 self-start md:self-center"
              >
                <Plus className="w-5 h-5 stroke-[3px]" />
                <span>คำร้อง</span>
              </button>
            </div>

            {/* Grid display with saved docs / instructions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left col: list of saved docs */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black text-slate-800 dark:text-slate-200">
                    แบบฟอร์มคำร้องที่บันทึกไว้ในระบบ ({filteredDocs.length})
                  </h2>
                  
                  {savedDocs.length > 0 && (
                    <div className="relative w-48 sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="ค้นหาตามชื่อ/ศาล..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  )}
                </div>

                {filteredDocs.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-3xl p-12 text-center bg-slate-50/20 dark:bg-slate-950/5">
                    <FileText className="w-12 h-12 text-slate-350 dark:text-slate-700 mx-auto stroke-[1.5] mb-4" />
                    <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-300">ไม่มีแบบฟอร์มที่ร่างค้างไว้</h3>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                      กดปุ่ม <strong className="text-amber-500">"+ คำร้อง"</strong> ด้านบน เพื่อเริ่มต้นสร้างและแก้ไขเอกสารแบบฟอร์มศาลชุดใหม่ในระบบ
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredDocs.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => handleOpenDoc(doc)}
                        className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-amber-500/40 hover:bg-amber-500/[0.01] transition-all cursor-pointer text-left space-y-3 relative group"
                      >
                        <div className="space-y-1 pr-8">
                          <h4 className="text-xs font-black text-slate-800 dark:text-white truncate">
                            {doc.title}
                          </h4>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-bold">
                              {doc.court || 'ไม่ระบุชื่อศาล'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/10 text-[10px] font-bold">
                              {doc.docType === 'petition' ? 'คำร้อง' : doc.docType === 'statement' ? 'คำแถลง' : 'คำขอ'}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {doc.clauseText}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-850">
                          <span>โดย: {doc.applicantName || 'ไม่ระบุชื่อ'}</span>
                          <span>{new Date(doc.createdAt).toLocaleDateString('th-TH')}</span>
                        </div>

                        {/* Delete action */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteDoc(doc.id, e)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 absolute right-3 top-3 transition-all opacity-0 group-hover:opacity-100"
                          title="ลบเอกสารนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Col: Standard guidance */}
              <div className="space-y-4">
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-200">
                  คู่มือและสเปคแบบฟอร์มศาล (๗)
                </h2>

                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/10 space-y-4 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex gap-2 text-left">
                    <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-850 dark:text-slate-200">ข้อกำหนดของฟอร์มกฎหมาย</p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        ฟอร์มคำร้อง คำแถลง คำขอชุดนี้ ได้รับการออกแบบตามประกาศของสำนักงานศาลยุติธรรม ขนาดตราครุฑ อัตราส่วนฟอนต์ และโครงร่างเป็นรูปแบบทางราชการที่ได้รับการยอมรับ 100%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                      <p className="text-[11px] leading-relaxed text-slate-450">
                        <strong>การปันหน้าอัตโนมัติ:</strong> พิมพ์ข้อความคดีใน ข้อ ๑. ได้ต่อเนื่อง โดยไม่ต้องกังวลเรื่องล้นหน้า ระบบจะตัดคำและดึงไปขึ้นหน้า ๒, หน้า ๓ ให้อัตโนมัติทันที
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                      <p className="text-[11px] leading-relaxed text-slate-450">
                        <strong>ไม่เปลืองกระดาษ:</strong> หากพิมพ์ไม่ล้นเกินหน้าแรก หน้าที่ ๒ เป็นต้นไปจะไม่ถูกแสดงและจะไม่ถูกพิมพ์ออกเครื่องพิมพ์โดยเด็ดขาดตามมาตรฐานศาลไทย
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                      <p className="text-[11px] leading-relaxed text-slate-450">
                        <strong>พิมพ์ได้จริง:</strong> เชื่อมต่อปุ่มพิมพ์โดยตรงเพื่อส่งออกไฟล์เป็น PDF หรือสั่งพิมพ์ลงบนกระดาษ A4 เพื่อยื่นศาลได้ทันทีตัวอักษรจะอยู่ตรงตำแหน่งจุดไข่ปลา
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ==========================================
             MODE 2: PETITION EDITOR & REAL-TIME PREVIEW
             ========================================== */
          <motion.div
            key="form-editor"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            className="flex flex-col space-y-4 text-left"
          >
            {/* Editor Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-200 transition-all cursor-pointer"
                  title="ย้อนกลับหน้าเมนู"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                </button>
                <div>
                  <input
                    type="text"
                    value={currentDoc.title}
                    onChange={(e) => setCurrentDoc({ ...currentDoc, title: e.target.value })}
                    className="bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-amber-500 focus:outline-none text-sm font-black text-slate-800 dark:text-white pb-0.5 w-48 sm:w-80"
                    placeholder="ชื่อรายการบันทึก..."
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">แก้ไขชื่อเพื่อความสะดวกในการเรียกดูภายหลัง</p>
                </div>
              </div>

              {/* Right tool buttons */}
              <div className="flex items-center gap-2 self-end md:self-center">
                {/* Print Trigger */}
                <button
                  onClick={handlePrint}
                  className="h-10 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all active:scale-95 border border-slate-200 dark:border-slate-750"
                >
                  <Printer className="w-4 h-4 text-amber-500" />
                  <span>พิมพ์เอกสาร / บันทึก PDF</span>
                </button>

                {/* Save Document */}
                <button
                  onClick={handleSaveDoc}
                  className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3px]" />
                      <span>บันทึกสำเร็จแล้ว</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 stroke-[2.5]" />
                      <span>บันทึกแบบร่าง</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Centered WYSIWYG Editor Workspace */}
            <div className="w-full flex flex-col items-center space-y-4">
              
              {/* LEFT PANEL: HIDDEN (Inputs are now edited directly on A4 in-place) */}
              <div className="hidden">
                
                {/* Category 1: Case Details */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/40 space-y-4">
                  <h3 className="text-xs font-black text-amber-500 uppercase tracking-wide flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>ข้อมูลคดีและหมายเลขคดี</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400">คดีหมายเลขดำที่</label>
                      <input
                        type="text"
                        placeholder="ด. 123/2569"
                        value={currentDoc.blackNo}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, blackNo: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400">คดีหมายเลขแดงที่</label>
                      <input
                        type="text"
                        placeholder="ดร. 456/2569"
                        value={currentDoc.redNo}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, redNo: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400">ศาล</label>
                    <input
                      type="text"
                      placeholder="ศาลอาญา, ศาลแพ่ง, ศาลจังหวัด..."
                      value={currentDoc.court}
                      onChange={(e) => setCurrentDoc({ ...currentDoc, court: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400">วันที่ยื่น</label>
                      <input
                        type="text"
                        value={currentDoc.dateDay}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, dateDay: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400">เดือน</label>
                      <input
                        type="text"
                        value={currentDoc.dateMonth}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, dateMonth: e.target.value })}
                        className="w-full h-10 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400">พ.ศ. (พุทธศักราช)</label>
                      <input
                        type="text"
                        value={currentDoc.dateYear}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, dateYear: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold text-center"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400">ความ (ข้อหา/ลักษณะคดีเช่น อาญา, แพ่ง, ล้มละลาย)</label>
                    <input
                      type="text"
                      placeholder="อาญา หรือ แพ่ง"
                      value={currentDoc.caseTitle}
                      onChange={(e) => setCurrentDoc({ ...currentDoc, caseTitle: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400">โจทก์ / ผู้ร้องเรียน</label>
                      <textarea
                        rows={2}
                        placeholder="ระบุชื่อโจทก์"
                        value={currentDoc.plaintiff}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, plaintiff: e.target.value })}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold resize-none leading-relaxed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400">จำเลย / ผู้ถูกร้อง</label>
                      <textarea
                        rows={2}
                        placeholder="ระบุชื่อจำเลย"
                        value={currentDoc.defendant}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, defendant: e.target.value })}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold resize-none leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* Category 2: Applicant Information */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/40 space-y-4">
                  <h3 className="text-xs font-black text-amber-500 uppercase tracking-wide flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>ข้อมูลข้าพเจ้า (ผู้ยื่นเอกสารต่อศาล)</span>
                  </h3>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400">ชื่อ-นามสกุล ข้าพเจ้า</label>
                      <input
                        type="text"
                        placeholder="ระบุชื่อจริง-นามสกุล..."
                        value={currentDoc.applicantName}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, applicantName: e.target.value, signatureName: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400">ประเภทเอกสาร</label>
                      <select
                        value={currentDoc.docType}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, docType: e.target.value as any })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-black cursor-pointer"
                      >
                        <option value="petition">คำร้อง</option>
                        <option value="statement">คำแถลง</option>
                        <option value="request">คำขอ</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400">เลขประจำตัวประชาชน (13 หลัก)</label>
                    <input
                      type="text"
                      maxLength={13}
                      placeholder="1100100200300"
                      value={currentDoc.idCard}
                      onChange={(e) => setCurrentDoc({ ...currentDoc, idCard: e.target.value.replace(/\D/g, '') })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold tracking-widest"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400">เชื้อชาติ</label>
                      <input
                        type="text"
                        value={currentDoc.race}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, race: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400">สัญชาติ</label>
                      <input
                        type="text"
                        value={currentDoc.nationality}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, nationality: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400">อาชีพ</label>
                      <input
                        type="text"
                        placeholder="รับจ้าง, ค้าขาย, ทนายความ"
                        value={currentDoc.occupation}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, occupation: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400">เกิดวันที่</label>
                      <input
                        type="text"
                        value={currentDoc.birthDay}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, birthDay: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold text-center"
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <label className="text-[10px] font-extrabold text-slate-400">เดือนเกิด</label>
                      <input
                        type="text"
                        value={currentDoc.birthMonth}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, birthMonth: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400">ปี พ.ศ. เกิด</label>
                      <input
                        type="text"
                        value={currentDoc.birthYear}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, birthYear: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold text-center"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400">อายุ (ปี)</label>
                      <input
                        type="text"
                        value={currentDoc.age}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, age: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold text-center"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400">อยู่บ้านเลขที่</label>
                      <input
                        type="text"
                        placeholder="123/45"
                        value={currentDoc.addressNo}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, addressNo: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400">หมู่ที่</label>
                      <input
                        type="text"
                        placeholder="3"
                        value={currentDoc.moo}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, moo: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold text-center"
                      />
                    </div>
                    <div className="space-y-1 col-span-3">
                      <label className="text-[10px] font-extrabold text-slate-400">ตรอก/ซอย</label>
                      <input
                        type="text"
                        placeholder="สุขุมวิท 23"
                        value={currentDoc.soi}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, soi: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400">ถนน</label>
                      <input
                        type="text"
                        placeholder="สุขุมวิท"
                        value={currentDoc.road}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, road: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400">ตำบล/แขวง</label>
                      <input
                        type="text"
                        placeholder="คลองเตย"
                        value={currentDoc.subdistrict}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, subdistrict: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1 col-span-1">
                      <label className="text-[10px] font-extrabold text-slate-400">ในเมือง (ถ้ามี)</label>
                      <input
                        type="text"
                        placeholder="ในเมือง"
                        value={currentDoc.inMueang}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, inMueang: e.target.value })}
                        className="w-full h-10 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1 col-span-1">
                      <label className="text-[10px] font-extrabold text-slate-400">อำเภอ/เขต</label>
                      <input
                        type="text"
                        placeholder="คลองเตย"
                        value={currentDoc.district}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, district: e.target.value })}
                        className="w-full h-10 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1 col-span-1">
                      <label className="text-[10px] font-extrabold text-slate-400">จังหวัด</label>
                      <input
                        type="text"
                        placeholder="กรุงเทพมหานคร"
                        value={currentDoc.province}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, province: e.target.value })}
                        className="w-full h-10 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400">รหัสไปรษณีย์</label>
                      <input
                        type="text"
                        placeholder="10110"
                        value={currentDoc.zipcode}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, zipcode: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold text-center"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400">เบอร์โทรศัพท์</label>
                      <input
                        type="text"
                        placeholder="081-234-5678"
                        value={currentDoc.phone}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, phone: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400">โทรสาร (ถ้ามี)</label>
                      <input
                        type="text"
                        placeholder="02-123-4567"
                        value={currentDoc.fax}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, fax: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-400">ไปรษณีย์อิเล็กทรอนิกส์</label>
                      <input
                        type="email"
                        placeholder="lawyer@example.com"
                        value={currentDoc.email}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, email: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Category 3: Clause text area */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-amber-500 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                      <span>รายละเอียด ข้อ ๑. (พิมพ์ต่อเนื่องได้ไม่จำกัด)</span>
                    </h3>
                    
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-850 text-[10px] text-slate-500 font-bold">
                      {clauseLines.length} บรรทัด ({pagesData.length} หน้า)
                    </span>
                  </div>

                  <div className="space-y-1 text-left">
                    <textarea
                      rows={14}
                      value={currentDoc.clauseText}
                      onChange={(e) => setCurrentDoc({ ...currentDoc, clauseText: e.target.value })}
                      placeholder="พิมพ์รายละเอียดเนื้อหาร่างคำร้องที่นี่ตามปกติ ข้อความยาวๆ จะไหลข้ามไปยังหน้า ๒, หน้า ๓ และสร้างแผ่นต่อให้อัตโนมัติในทันที..."
                      className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-xs font-bold leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <p className="text-[10px] text-slate-400 leading-normal">
                      💡 <strong>เทคนิคการพิมพ์ต่อเนื่อง:</strong> ระบบแบ่งคำด้วยขนาดความกว้างเฉลี่ยของตัวอักษรภาษาไทยโดยละเว้นสระบน-ล่างและวรรณยุกต์เพื่อให้แน่ใจว่าตัวหนังสือจะพิมพ์ตกบนจุดไข่ปลาได้อย่างแม่นยำสูงสุด
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400">ลงชื่อ ผู้ร้อง / ผู้แถลง / ผู้ขอ (ลงชื่อตัวบรรจงด้านล่างขวา)</label>
                    <input
                      type="text"
                      placeholder="นายสมชาย รักความยุติธรรม"
                      value={currentDoc.signatureName}
                      onChange={(e) => setCurrentDoc({ ...currentDoc, signatureName: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Category 4: Custom Scanned Background Form */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-amber-500 uppercase tracking-wide flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-amber-500" />
                      <span>ภาพพื้นหลังฟอร์มศาลจริง (Background Image)</span>
                    </h3>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-normal text-left">
                    อัปโหลดรูปภาพแบบฟอร์มเปล่าของท่าน (รองรับ JPG, PNG, WebP) เพื่อนำมาใช้เป็นรูปภาพพื้นหลังในการกรอกข้อมูลได้อย่างสมบูรณ์แบบ
                  </p>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">เปิดใช้รูปภาพพื้นหลัง</span>
                    <button
                      onClick={() => setCurrentDoc({
                        ...currentDoc,
                        useScannedBackground: !(currentDoc.useScannedBackground ?? true)
                      })}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        (currentDoc.useScannedBackground ?? true) ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          (currentDoc.useScannedBackground ?? true) ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {(currentDoc.useScannedBackground ?? true) && (
                    <div className="space-y-4 text-left">
                      {/* Opacity Slider */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                          <span>ความจางของภาพพื้นหลัง (Opacity)</span>
                          <span className="text-amber-500">{currentDoc.bgImageOpacity ?? 100}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={currentDoc.bgImageOpacity ?? 100}
                          onChange={(e) => setCurrentDoc({
                            ...currentDoc,
                            bgImageOpacity: parseInt(e.target.value)
                          })}
                          className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>

                      {/* Upload fields for Page 1 and Page 2 */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Page 1 Background */}
                        <div className="space-y-1.5 text-center">
                          <label className="text-[10px] font-extrabold text-slate-400 block text-left">รูปพื้นหลังหน้า ๑ (คำร้อง)</label>
                          {currentDoc.bgImagePage1 ? (
                            <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-24 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                              <img src={currentDoc.bgImagePage1} alt="Page 1 Background" className="max-h-full max-w-full object-contain opacity-80" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setCurrentDoc({ ...currentDoc, bgImagePage1: '' })}
                                  className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all cursor-pointer"
                                  title="ลบรูปภาพ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 h-24 flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-950/20 cursor-pointer relative transition-all group">
                              <Plus className="w-5 h-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
                              <span className="text-[9px] text-slate-400 mt-1 font-bold">เลือกไฟล์หน้า ๑</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      setCurrentDoc({
                                        ...currentDoc,
                                        bgImagePage1: event.target?.result as string
                                      });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </div>
                          )}
                        </div>

                        {/* Page 2 Background (Lined page 40-kor) */}
                        <div className="space-y-1.5 text-center">
                          <label className="text-[10px] font-extrabold text-slate-400 block text-left">รูปพื้นหลังหน้า ๒+ (แผ่นต่อ)</label>
                          {currentDoc.bgImagePage2 ? (
                            <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-24 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                              <img src={currentDoc.bgImagePage2} alt="Page 2 Background" className="max-h-full max-w-full object-contain opacity-80" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setCurrentDoc({ ...currentDoc, bgImagePage2: '' })}
                                  className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all cursor-pointer"
                                  title="ลบรูปภาพ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 h-24 flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-950/20 cursor-pointer relative transition-all group">
                              <Plus className="w-5 h-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
                              <span className="text-[9px] text-slate-400 mt-1 font-bold">เลือกไฟล์แผ่นต่อ</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      setCurrentDoc({
                                        ...currentDoc,
                                        bgImagePage2: event.target?.result as string
                                      });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* RIGHT PANEL: DYNAMIC LIVE A4 WYSIWYG PREVIEW */}
              <div className="w-full max-w-5xl flex flex-col items-center space-y-4">
                
                {/* Scale & Page Indicator Controls */}
                <div className="w-full p-4 rounded-2xl bg-slate-900/5 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 pr-4">
                      <Eye className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                        A4 ({pagesData.length} หน้า)
                      </span>
                    </div>

                    {/* Print Mode Toggles */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-950/60 p-0.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
                      <button
                        onClick={() => setPrintMode('blank-paper')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                          printMode === 'blank-paper'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                        }`}
                        title="พิมพ์ทั้งแบบฟอร์มครุฑและข้อความลงกระดาษขาวเปล่า"
                      >
                        พิมพ์พร้อมแบบฟอร์มศาล (กระดาษขาว)
                      </button>
                      <button
                        onClick={() => setPrintMode('pre-printed')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                          printMode === 'pre-printed'
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                        }`}
                        title="ซ่อนหัวกระดาษ เส้น และคำสั่งของศาล เพื่อจัดพิมพ์ตัวหนังสือให้ตรงช่องบนแผ่นคำร้องสำเร็จรูปของจริง"
                      >
                        พิมพ์เฉพาะข้อความ (ลงฟอร์มศาลจริง)
                      </button>
                    </div>

                    {/* Ink Color Selection */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-950/60 p-0.5 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
                      <button
                        onClick={() => setInkColor('navy')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                          inkColor === 'navy'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        หมึกซึมสีน้ำเงิน
                      </button>
                      <button
                        onClick={() => setInkColor('black')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                          inkColor === 'black'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-850'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-black" />
                        หมึกพิมพ์สีดำ
                      </button>
                    </div>
                  </div>

                  {/* Zoom controls */}
                  <div className="flex items-center gap-1.5 self-end md:self-auto">
                    <button
                      onClick={() => setPreviewZoom(prev => Math.max(50, prev - 10))}
                      className="w-8 h-8 rounded-lg border border-slate-250 dark:border-slate-850 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center font-extrabold text-xs text-slate-600 dark:text-slate-200"
                      title="ซูมออก"
                    >
                      -
                    </button>
                    <span className="text-[11px] font-black w-10 text-center text-slate-700 dark:text-slate-200">{previewZoom}%</span>
                    <button
                      onClick={() => setPreviewZoom(prev => Math.min(150, prev + 10))}
                      className="w-8 h-8 rounded-lg border border-slate-250 dark:border-slate-850 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center font-extrabold text-xs text-slate-600 dark:text-slate-200"
                      title="ซูมเข้า"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* LIVE PREVIEW CANVAS */}
                <div 
                  className="w-full overflow-auto max-h-[calc(100vh-210px)] p-6 bg-slate-200 dark:bg-slate-950/60 rounded-3xl border border-slate-300 dark:border-slate-850 flex flex-col gap-8 items-center"
                  id="print-area"
                >
                  
                  {/* Dynamic Render Pages */}
                  {pagesData.map((pLines, pageIdx) => {
                    const pageNo = pageIdx + 1;
                    const isFirstPage = pageNo === 1;
                    const hasCustomBg = isFirstPage ? !!currentDoc.bgImagePage1 : !!currentDoc.bgImagePage2;
                    const showScannedBg = (currentDoc.useScannedBackground ?? true) && hasCustomBg;
                    
                    const templateClass = printMode === 'pre-printed' 
                      ? 'print-template-element opacity-0 pointer-events-none transition-all duration-300' 
                      : showScannedBg
                        ? 'print-template-element opacity-0 pointer-events-none transition-all duration-300'
                        : 'print-template-element transition-all duration-300';
                        
                    const typedTextClass = inkColor === 'navy' ? 'text-[#1b365d]' : 'text-slate-900';
                    
                    return (
                      <div
                        key={pageIdx}
                        className="a4-page-print bg-white shadow-2xl relative select-text text-black flex-shrink-0"
                        style={{
                          width: '210mm',
                          height: '297mm',
                          padding: '24mm 15mm 20mm 20mm', // standard legal margin: top 2.4cm, bottom 2cm, left 2cm, right 1.5cm
                          fontFamily: '"Sarabun", "TH Sarabun New", sans-serif',
                          transform: `scale(${previewZoom / 100})`,
                          transformOrigin: 'top center',
                          marginBottom: previewZoom < 100 ? `-${297 * (1 - previewZoom / 100)}mm` : '0px'
                        }}
                      >
                        {/* 0. Scanned Background Image */}
                        {(currentDoc.useScannedBackground ?? true) && isFirstPage && currentDoc.bgImagePage1 && (
                          <img 
                            src={currentDoc.bgImagePage1} 
                            alt="Scanned Background Page 1" 
                            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none z-0 print-background-image"
                            style={{ opacity: (currentDoc.bgImageOpacity ?? 100) / 100 }}
                            referrerPolicy="no-referrer"
                          />
                        )}
                        {(currentDoc.useScannedBackground ?? true) && !isFirstPage && currentDoc.bgImagePage2 && (
                          <img 
                            src={currentDoc.bgImagePage2} 
                            alt={`Scanned Background Page ${pageNo}`} 
                            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none z-0 print-background-image"
                            style={{ opacity: (currentDoc.bgImageOpacity ?? 100) / 100 }}
                            referrerPolicy="no-referrer"
                          />
                        )}

                        {/* 1. Header Portion (Only on page 1) */}
                        {isFirstPage ? (
                          <div className="space-y-4">
                            {/* Line 1: (๗) and black/red case */}
                            <div className="flex justify-between items-start text-sm relative">
                              <div className="flex flex-col items-start pt-1">
                                <div className={`${templateClass} font-bold text-xs select-none leading-none`}>(๗)</div>
                                <div className={`${templateClass} font-bold text-base select-none leading-normal mt-1`}>คำร้อง/คำแถลง/คำขอ</div>
                              </div>
                              
                              <div className="absolute right-0 top-0 text-[13px] font-bold space-y-1 text-right z-30">
                                <div className="flex items-center justify-end gap-1">
                                  <span className={`${templateClass} select-none`}>คดีหมายเลขดำที่</span>
                                  <div className="border-b border-black border-dashed min-w-[110px] text-center relative pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="text"
                                      placeholder="ดำ ...."
                                      value={currentDoc.blackNo}
                                      onChange={(e) => setCurrentDoc({ ...currentDoc, blackNo: e.target.value })}
                                      className={`bg-transparent border-none outline-none text-center w-full font-bold text-[14px] placeholder:text-slate-300 focus:bg-amber-500/5 ${typedTextClass}`}
                                    />
                                  </div>
                                  <span className={`${templateClass} select-none`}>/๒๕</span>
                                  <div className="border-b border-black border-dashed min-w-[35px] text-center relative pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="text"
                                      maxLength={2}
                                      placeholder="๖๙"
                                      value={currentDoc.dateYear.length > 2 ? currentDoc.dateYear.slice(-2) : currentDoc.dateYear}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setCurrentDoc({ ...currentDoc, dateYear: val ? `๒๕${val}` : '' });
                                      }}
                                      className={`bg-transparent border-none outline-none text-center w-full font-bold text-[14px] placeholder:text-slate-300 focus:bg-amber-500/5 ${typedTextClass}`}
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center justify-end gap-1">
                                  <span className={`${templateClass} select-none`}>คดีหมายเลขแดงที่</span>
                                  <div className="border-b border-black border-dashed min-w-[110px] text-center relative pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="text"
                                      placeholder="แดง ...."
                                      value={currentDoc.redNo}
                                      onChange={(e) => setCurrentDoc({ ...currentDoc, redNo: e.target.value })}
                                      className={`bg-transparent border-none outline-none text-center w-full font-bold text-[14px] placeholder:text-slate-300 focus:bg-amber-500/5 ${typedTextClass}`}
                                    />
                                  </div>
                                  <span className={`${templateClass} select-none`}>/๒๕</span>
                                  <div className="border-b border-black border-dashed min-w-[35px] text-center relative pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="text"
                                      maxLength={2}
                                      placeholder="๖๙"
                                      value={currentDoc.dateYear.length > 2 ? currentDoc.dateYear.slice(-2) : currentDoc.dateYear}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setCurrentDoc({ ...currentDoc, dateYear: val ? `๒๕${val}` : '' });
                                      }}
                                      className={`bg-transparent border-none outline-none text-center w-full font-bold text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Garuda Center Emblem */}
                            <div className={`flex justify-center pt-2 ${templateClass}`}>
                              {/* Standard high-fidelity vector representation of Thai court garuda emblem */}
                              <svg viewBox="0 0 512 512" className="w-[50px] h-[55px] fill-black select-none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M256,16 C250,30 240,40 230,45 C235,55 235,65 240,75 C242,72 245,70 248,72 C251,75 253,78 256,80 C259,78 261,75 264,72 C267,70 270,72 272,75 C277,65 277,55 282,45 C272,40 262,30 256,16 Z" />
                                <path d="M256,85 C242,105 220,120 190,125 C195,135 190,145 180,150 C185,155 195,155 200,165 C170,175 140,170 110,160 C120,185 140,210 160,225 C140,240 120,250 90,255 C110,270 135,280 160,285 C140,305 110,320 80,325 C110,340 140,350 170,355 C175,365 170,375 160,380 C180,390 190,400 195,410 C215,405 235,395 245,385 C240,410 230,430 210,450 C230,460 250,470 256,480 C262,470 282,460 302,450 C282,430 272,410 267,385 C277,395 297,405 317,410 C322,400 332,390 352,380 C342,375 337,365 342,355 C372,350 402,340 432,325 C402,320 372,305 352,285 C377,280 402,270 422,255 C392,250 372,240 352,225 C372,210 392,185 402,160 C372,170 342,175 312,165 C317,155 327,155 332,150 C322,145 317,135 322,125 C292,120 270,105 256,85 Z" />
                                <path d="M256,150 C240,165 240,185 245,210 C250,220 262,220 267,210 C272,185 272,165 256,150 Z" />
                                <path d="M225,230 C200,240 180,260 170,290 C185,285 200,285 215,290 C220,270 230,250 245,240 C235,235 230,232 225,230 Z" />
                                <path d="M287,230 C282,232 277,235 267,240 C282,250 292,270 297,290 C312,285 327,285 342,290 C332,260 312,240 287,230 Z" />
                                <path d="M256,260 C245,280 240,305 235,335 C242,340 250,342 256,345 C262,342 270,340 277,335 C272,305 267,280 256,260 Z" />
                                <path d="M200,320 C180,335 160,355 150,380 C165,385 180,380 195,370 C200,350 205,335 210,320 C205,320 202,320 200,320 Z" />
                                <path d="M312,320 C307,335 312,350 317,370 C332,380 347,385 362,380 C352,355 332,335 312,320 Z" />
                              </svg>
                            </div>

                            {/* Court Title Lines */}
                            <div className="space-y-1 pl-[150px] pr-2 text-[14px]">
                              <div className="flex items-center gap-1">
                                <span className={`${templateClass} font-bold select-none shrink-0`}>ศาล</span>
                                <div className="border-b border-black border-dashed flex-grow font-bold pl-2 pb-[1px] hover:bg-amber-500/5 transition-all">
                                  <input
                                    type="text"
                                    placeholder="ระบุชื่อศาล (เช่น ศาลอาญา, ศาลจังหวัดนนทบุรี)"
                                    value={currentDoc.court}
                                    onChange={(e) => setCurrentDoc({ ...currentDoc, court: e.target.value })}
                                    className={`bg-transparent border-none outline-none font-bold text-left w-full text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[14px] gap-2 pt-1">
                                <div className="flex items-center gap-1 w-[120px]">
                                  <span className={`${templateClass} font-bold select-none shrink-0`}>วันที่</span>
                                  <div className="border-b border-black border-dashed flex-grow text-center font-bold pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="text"
                                      placeholder="วันที่"
                                      value={currentDoc.dateDay}
                                      onChange={(e) => setCurrentDoc({ ...currentDoc, dateDay: e.target.value })}
                                      className={`bg-transparent border-none outline-none font-bold text-center w-full text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-grow">
                                  <span className={`${templateClass} font-bold select-none shrink-0 pl-1`}>เดือน</span>
                                  <div className="border-b border-black border-dashed flex-grow text-center font-bold pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="text"
                                      placeholder="ระบุเดือน"
                                      value={currentDoc.dateMonth}
                                      onChange={(e) => setCurrentDoc({ ...currentDoc, dateMonth: e.target.value })}
                                      className={`bg-transparent border-none outline-none font-bold text-center w-full text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 w-[180px]">
                                  <span className={`${templateClass} font-bold select-none shrink-0 pl-1`}>พุทธศักราช ๒๕</span>
                                  <div className="border-b border-black border-dashed flex-grow text-center font-bold pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="text"
                                      maxLength={2}
                                      placeholder="๖๙"
                                      value={currentDoc.dateYear.length > 2 ? currentDoc.dateYear.slice(-2) : currentDoc.dateYear}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setCurrentDoc({ ...currentDoc, dateYear: val ? `๒๕${val}` : '' });
                                      }}
                                      className={`bg-transparent border-none outline-none font-bold text-center w-full text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <span className={`${templateClass} font-bold select-none shrink-0`}>ความ</span>
                                <div className="border-b border-black border-dashed flex-grow font-bold pl-2 pb-[1px] hover:bg-amber-500/5 transition-all">
                                  <input
                                    type="text"
                                    placeholder="ระบุประเภทคดี (เช่น อาญา, แพ่ง)"
                                    value={currentDoc.caseTitle}
                                    onChange={(e) => setCurrentDoc({ ...currentDoc, caseTitle: e.target.value })}
                                    className={`bg-transparent border-none outline-none font-bold text-left w-full text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Litigants brace bracket section ("ระหว่าง") */}
                            <div className="flex items-stretch text-[14px] pt-1 select-text">
                              <div className={`${templateClass} w-[80px] font-bold flex items-center justify-center select-none`}>
                                ระหว่าง
                              </div>
                              
                              {/* Left Brace Representation using high-contrast borders */}
                              <div className={`flex items-center mr-3 ${templateClass}`}>
                                <div className="w-[12px] h-full border-y-[2px] border-l-[2px] border-black rounded-l-[6px] relative">
                                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-4 border-y-[2px] border-r-[2px] border-black rounded-r-[4px] bg-white translate-x-[4px]" />
                                </div>
                              </div>

                              {/* Plaintiff and Defendant */}
                              <div className="flex-grow space-y-1 text-left z-30">
                                <div className="flex items-end min-h-[22px] hover:bg-amber-500/5 transition-all relative">
                                  <input
                                    type="text"
                                    placeholder="ระบุชื่อโจทก์ / ผู้ร้องเรียน"
                                    value={currentDoc.plaintiff}
                                    onChange={(e) => setCurrentDoc({ ...currentDoc, plaintiff: e.target.value })}
                                    className={`bg-transparent border-none outline-none font-bold text-left w-full text-[14px] placeholder:text-slate-300 pr-12 pb-[1px] ${typedTextClass}`}
                                  />
                                  <span className={`${templateClass} font-bold shrink-0 text-right w-12 select-none absolute right-0 bottom-0 bg-white pl-2`}>โจทก์</span>
                                  <div className={`${templateClass} absolute left-0 bottom-0 right-12 h-[1px] border-b border-black border-dashed pointer-events-none`} />
                                </div>
                                <div className="flex items-end min-h-[22px] hover:bg-amber-500/5 transition-all relative">
                                  <input
                                    type="text"
                                    placeholder="ระบุชื่อจำเลย / ผู้ถูกฟ้อง"
                                    value={currentDoc.defendant}
                                    onChange={(e) => setCurrentDoc({ ...currentDoc, defendant: e.target.value })}
                                    className={`bg-transparent border-none outline-none font-bold text-left w-full text-[14px] placeholder:text-slate-300 pr-12 pb-[1px] ${typedTextClass}`}
                                  />
                                  <span className={`${templateClass} font-bold shrink-0 text-right w-12 select-none absolute right-0 bottom-0 bg-white pl-2`}>จำเลย</span>
                                  <div className={`${templateClass} absolute left-0 bottom-0 right-12 h-[1px] border-b border-black border-dashed pointer-events-none`} />
                                </div>
                              </div>
                            </div>

                            {/* Applicant Info portion */}
                            <div className="space-y-1.5 text-[14px] text-left pt-1 z-30">
                              
                              {/* Row: ข้าพเจ้า */}
                              <div className="flex items-center gap-1">
                                <span className={`${templateClass} font-bold select-none shrink-0`}>ข้าพเจ้า</span>
                                <div className="border-b border-black border-dashed flex-grow font-bold pl-2 pb-[1px] hover:bg-amber-500/5 transition-all">
                                  <input
                                    type="text"
                                    placeholder="ระบุชื่อจริง-นามสกุล ข้าพเจ้า"
                                    value={currentDoc.applicantName}
                                    onChange={(e) => {
                                      const name = e.target.value;
                                      setCurrentDoc({
                                        ...currentDoc,
                                        applicantName: name,
                                        signatureName: currentDoc.signatureName === currentDoc.applicantName || !currentDoc.signatureName ? name : currentDoc.signatureName
                                      });
                                    }}
                                    className={`bg-transparent border-none outline-none font-bold text-left w-full text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                  />
                                </div>
                              </div>

                              {/* Row: ID Card Blocks */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <div className="flex items-center gap-2 relative">
                                  <span className={`${templateClass} font-bold select-none shrink-0`}>เลขประจำตัวประชาชน</span>
                                  <div className="relative flex items-center">
                                    <div>{renderIdCardBlocks(currentDoc.idCard, printMode === 'pre-printed' || showScannedBg)}</div>
                                    <input
                                      type="text"
                                      maxLength={13}
                                      placeholder="คลิกแก้ไขเลขประจำตัว"
                                      value={currentDoc.idCard}
                                      onChange={(e) => setCurrentDoc({ ...currentDoc, idCard: e.target.value.replace(/\D/g, '') })}
                                      className={`absolute inset-0 opacity-0 hover:opacity-30 focus:opacity-100 bg-amber-50/95 hover:bg-amber-50/20 focus:border focus:border-amber-500 focus:outline-none font-mono text-[11px] tracking-[4px] pl-2 rounded transition-all text-center select-text z-40 ${typedTextClass}`}
                                      style={{ letterSpacing: '4.5px' }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Row: เชื้อชาติ สัญชาติ อาชีพ เกิดวันที่ */}
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <div className="flex items-center gap-1 w-[120px]">
                                  <span className={`${templateClass} font-bold select-none shrink-0`}>เชื้อชาติ</span>
                                  <div className="border-b border-black border-dashed flex-grow text-center font-bold pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="text"
                                      placeholder="ไทย"
                                      value={currentDoc.race}
                                      onChange={(e) => setCurrentDoc({ ...currentDoc, race: e.target.value })}
                                      className={`bg-transparent border-none outline-none font-bold text-center w-full text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 w-[120px]">
                                  <span className={`${templateClass} font-bold select-none shrink-0 pl-1`}>สัญชาติ</span>
                                  <div className="border-b border-black border-dashed flex-grow text-center font-bold pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="text"
                                      placeholder="ไทย"
                                      value={currentDoc.nationality}
                                      onChange={(e) => setCurrentDoc({ ...currentDoc, nationality: e.target.value })}
                                      className={`bg-transparent border-none outline-none font-bold text-center w-full text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-grow">
                                  <span className={`${templateClass} font-bold select-none shrink-0 pl-1`}>อาชีพ</span>
                                  <div className="border-b border-black border-dashed flex-grow text-center font-bold pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="text"
                                      placeholder="ระบุอาชีพ"
                                      value={currentDoc.occupation}
                                      onChange={(e) => setCurrentDoc({ ...currentDoc, occupation: e.target.value })}
                                      className={`bg-transparent border-none outline-none font-bold text-center w-full text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 w-[130px]">
                                  <span className={`${templateClass} font-bold select-none shrink-0 pl-1`}>เกิดวันที่</span>
                                  <div className="border-b border-black border-dashed flex-grow text-center font-bold pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="text"
                                      placeholder="วันที่"
                                      value={currentDoc.birthDay}
                                      onChange={(e) => setCurrentDoc({ ...currentDoc, birthDay: e.target.value })}
                                      className={`bg-transparent border-none outline-none font-bold text-center w-full text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Row: เดือน พ.ศ. */}
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1 flex-grow">
                                  <span className={`${templateClass} font-bold select-none shrink-0`}>เดือน</span>
                                  <div className="border-b border-black border-dashed flex-grow text-center font-bold pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="text"
                                      placeholder="มกราคม"
                                      value={currentDoc.birthMonth}
                                      onChange={(e) => setCurrentDoc({ ...currentDoc, birthMonth: e.target.value })}
                                      className={`bg-transparent border-none outline-none font-bold text-center w-full text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 w-[100px]">
                                  <span className={`${templateClass} font-bold select-none shrink-0 pl-1`}>พ.ศ.</span>
                                  <div className="border-b border-black border-dashed flex-grow text-center font-bold pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="text"
                                      placeholder="พ.ศ."
                                      value={currentDoc.birthYear}
                                      onChange={(e) => setCurrentDoc({ ...currentDoc, birthYear: e.target.value })}
                                      className={`bg-transparent border-none outline-none font-bold text-center w-full text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 w-[100px]">
                                  <span className={`${templateClass} font-bold select-none shrink-0 pl-1`}>อายุ</span>
                                  <div className="border-b border-black border-dashed flex-grow text-center font-bold pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="text"
                                      placeholder="อายุ"
                                      value={currentDoc.age}
                                      onChange={(e) => setCurrentDoc({ ...currentDoc, age: e.target.value })}
                                      className={`bg-transparent border-none outline-none font-bold text-center w-full text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                    />
                                  </div>
                                  <span className={`${templateClass} font-bold select-none shrink-0`}>ปี</span>
                                </div>
                                <div className="flex items-center gap-1 flex-grow-[2]">
                                  <span className={`${templateClass} font-bold select-none shrink-0 pl-1`}>อยู่บ้านเลขที่</span>
                                  <div className="border-b border-black border-dashed flex-grow text-center font-bold pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="text"
                                      placeholder="เลขที่"
                                      value={currentDoc.addressNo}
                                      onChange={(e) => setCurrentDoc({ ...currentDoc, addressNo: e.target.value })}
                                      className={`bg-transparent border-none outline-none font-bold text-center w-full text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Row: ตรอก/ซอย, ตำบล/แขวง, ในเมือง, อำเภอ/เขต */}
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1 flex-grow">
                                  <span className={`${templateClass} font-bold select-none shrink-0`}>ตรอก/ซอย</span>
                                  <div className="border-b border-black border-dashed flex-grow text-center font-bold pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="text"
                                      placeholder="ระบุซอย"
                                      value={currentDoc.soi}
                                      onChange={(e) => setCurrentDoc({ ...currentDoc, soi: e.target.value })}
                                      className={`bg-transparent border-none outline-none font-bold text-center w-full text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-grow">
                                  <span className={`${templateClass} font-bold select-none shrink-0 pl-1`}>ตำบล/แขวง</span>
                                  <div className="border-b border-black border-dashed flex-grow text-center font-bold pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="text"
                                      placeholder="ระบุตำบล"
                                      value={currentDoc.subdistrict}
                                      onChange={(e) => setCurrentDoc({ ...currentDoc, subdistrict: e.target.value })}
                                      className={`bg-transparent border-none outline-none font-bold text-center w-full text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-grow">
                                  <span className={`${templateClass} font-bold select-none shrink-0 pl-1`}>ในเมือง</span>
                                  <div className="border-b border-black border-dashed flex-grow text-center font-bold pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="text"
                                      placeholder="ระบุ"
                                      value={currentDoc.inMueang}
                                      onChange={(e) => setCurrentDoc({ ...currentDoc, inMueang: e.target.value })}
                                      className={`bg-transparent border-none outline-none font-bold text-center w-full text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 w-[160px]">
                                  <span className={`${templateClass} font-bold select-none shrink-0 pl-1`}>อำเภอ/เขต</span>
                                  <div className="border-b border-black border-dashed flex-grow text-center font-bold pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="text"
                                      placeholder="ระบุอำเภอ"
                                      value={currentDoc.district}
                                      onChange={(e) => setCurrentDoc({ ...currentDoc, district: e.target.value })}
                                      className={`bg-transparent border-none outline-none font-bold text-center w-full text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Row: จังหวัด, รหัสไปรษณีย์, โทรศัพท์ */}
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1 flex-grow">
                                  <span className={`${templateClass} font-bold select-none shrink-0`}>จังหวัด</span>
                                  <div className="border-b border-black border-dashed flex-grow text-center font-bold pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="text"
                                      placeholder="ระบุจังหวัด"
                                      value={currentDoc.province}
                                      onChange={(e) => setCurrentDoc({ ...currentDoc, province: e.target.value })}
                                      className={`bg-transparent border-none outline-none font-bold text-center w-full text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 w-[120px]">
                                  <span className={`${templateClass} font-bold select-none shrink-0 pl-1`}>รหัสไปรษณีย์</span>
                                  <div className="border-b border-black border-dashed flex-grow text-center font-bold pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="text"
                                      placeholder="รหัสไปรษณีย์"
                                      value={currentDoc.zipcode}
                                      onChange={(e) => setCurrentDoc({ ...currentDoc, zipcode: e.target.value })}
                                      className={`bg-transparent border-none outline-none font-bold text-center w-full text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-grow">
                                  <span className={`${templateClass} font-bold select-none shrink-0 pl-1`}>โทรศัพท์</span>
                                  <div className="border-b border-black border-dashed flex-grow text-center font-bold pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="text"
                                      placeholder="เบอร์โทรศัพท์"
                                      value={currentDoc.phone}
                                      onChange={(e) => setCurrentDoc({ ...currentDoc, phone: e.target.value })}
                                      className={`bg-transparent border-none outline-none font-bold text-center w-full text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Row: โทรสาร, ไปรษณีย์อิเล็กทรอนิกส์ */}
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1 w-[160px]">
                                  <span className={`${templateClass} font-bold select-none shrink-0`}>โทรสาร</span>
                                  <div className="border-b border-black border-dashed flex-grow text-center font-bold pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="text"
                                      placeholder="โทรสาร (ถ้ามี)"
                                      value={currentDoc.fax}
                                      onChange={(e) => setCurrentDoc({ ...currentDoc, fax: e.target.value })}
                                      className={`bg-transparent border-none outline-none font-bold text-center w-full text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-grow">
                                  <span className={`${templateClass} font-bold select-none shrink-0 pl-1`}>ไปรษณีย์อิเล็กทรอนิกส์</span>
                                  <div className="border-b border-black border-dashed flex-grow text-center font-bold pb-[1px] hover:bg-amber-500/5 transition-all">
                                    <input
                                      type="email"
                                      placeholder="อีเมล"
                                      value={currentDoc.email}
                                      onChange={(e) => setCurrentDoc({ ...currentDoc, email: e.target.value })}
                                      className={`bg-transparent border-none outline-none font-bold text-center w-full text-[14px] placeholder:text-slate-300 ${typedTextClass}`}
                                    />
                                  </div>
                                </div>
                              </div>
                              </div>

                              {/* Preface block text */}
                              <div className={`${templateClass} font-black pt-1 select-none`}>
                                ขอยื่น{currentDoc.docType === 'petition' ? 'คำร้อง' : currentDoc.docType === 'statement' ? 'คำแถลง' : 'คำขอ'} มีข้อความตามที่จะกล่าวต่อไปนี้
                              </div>
                            </div>
                        ) : null}

                        {/* 2. Dotted Lines Writing Area (ข้อ ๑. text flow) */}
                        <div 
                          onClick={() => setIsEditingClause(true)}
                          className="pt-2 select-text cursor-pointer hover:bg-amber-500/5 active:bg-amber-500/10 transition-all rounded-lg p-1 group/clause relative"
                          style={{ marginTop: isFirstPage ? '8px' : '0px' }}
                          title="คลิกเพื่อพิมพ์รายละเอียดเนื้อความ ข้อ ๑."
                        >
                          {/* Floating instruction tooltip */}
                          <div className="absolute right-4 top-2 bg-amber-500 text-slate-950 px-2 py-1 rounded text-[10px] font-black opacity-0 group-hover/clause:opacity-100 transition-opacity pointer-events-none select-none z-30 shadow-md">
                            📝 คลิกเพื่อพิมพ์รายละเอียดเนื้อหา ข้อ ๑.
                          </div>
                          
                          {/* Page Title for inner continuations */}
                          {!isFirstPage && (
                            <div className="relative flex items-center justify-center text-xs pb-4 font-bold select-none h-6">
                              {/* Odd pages get "( ๔๐ ก. )" as standard on the left */}
                              {pageNo % 2 !== 0 && (
                                <div className="absolute left-0 text-xs font-bold">( ๔๐ ก. )</div>
                              )}
                              <div className="text-sm font-black">{toThaiNumber(pageNo.toString())}</div>
                            </div>
                          )}

                          {/* Line rows rendered perfectly on top of underlying dotted layouts */}
                          <div className="space-y-[10.5px]">
                            {isFirstPage && (
                              /* Page 1: 4 Rows of Dotted Lines */
                              Array(page1MaxLines).fill(0).map((_, lineIdx) => {
                                const textLine = pLines[lineIdx] || '';
                                return (
                                  <div key={lineIdx} className="flex items-end h-[24px] relative text-[14.5px]">
                                    
                                    {/* Line Header Prefix */}
                                    {lineIdx === 0 && (
                                      <span className={`${templateClass} font-bold select-none pr-1.5 shrink-0`}>ข้อ ๑.</span>
                                    )}

                                    {/* Real-time text layered over dots */}
                                    <div 
                                      className={`absolute left-0 bottom-0 w-full z-10 font-bold px-1 whitespace-pre-wrap truncate bg-transparent select-text text-left ${typedTextClass}`}
                                      style={{ textIndent: lineIdx === 0 ? '45px' : '0px' }}
                                    >
                                      {textLine}
                                    </div>

                                    {/* Aesthetic underlying dotted lines representation */}
                                    <div className={`w-full border-b border-black border-dotted select-none opacity-50 relative bottom-[3px] h-[1px] ${templateClass}`} />
                                  </div>
                                );
                              })
                            )}

                            {!isFirstPage && (
                              /* Page 2+: 24 Rows of Dotted Lines */
                              Array(subsequentPageMaxLines).fill(0).map((_, lineIdx) => {
                                const textLine = pLines[lineIdx] || '';
                                return (
                                  <div key={lineIdx} className="flex items-end h-[24px] relative text-[14.5px]">
                                    
                                    {/* Real-time text layered over dots */}
                                    <div className={`absolute left-0 bottom-0 w-full z-10 font-bold px-1 whitespace-pre-wrap truncate bg-transparent select-text text-left ${typedTextClass}`}>
                                      {textLine}
                                    </div>

                                    {/* Aesthetic underlying dotted lines representation */}
                                    <div className={`w-full border-b border-black border-dotted select-none opacity-50 relative bottom-[3px] h-[1px] ${templateClass}`} />
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* 3. Footer Portion (Only on page 1) */}
                        {isFirstPage && (
                          <div className="absolute bottom-[20mm] left-[20mm] right-[15mm] space-y-4 text-[13.5px] select-text">
                            
                            {/* Line divider */}
                            <div className={`w-full border-t border-black select-none ${templateClass}`} />

                            <div className="flex justify-between items-start pt-1">
                              {/* Left footer note */}
                              <div className="font-semibold select-none leading-relaxed text-left max-w-[320px]">
                                <span className={`${templateClass} underline font-bold mr-1`}>หมายเหตุ</span>
                                <span className={`${templateClass}`}>ข้าพเจ้ารอฟังคำสั่งอยู่ ถ้าไม่รอให้ถือว่าทราบแล้ว</span>
                              </div>

                              {/* Right signature box */}
                              <div className="text-center space-y-4 pr-6 min-w-[220px] z-30">
                                <div className="flex items-end justify-center min-h-[22px] hover:bg-amber-500/[0.04] transition-all">
                                  <div className={`border-b border-black border-dashed flex-grow font-bold px-2 pb-[1px] text-center max-w-[200px] ${templateClass}`}>
                                    <input
                                      type="text"
                                      placeholder="ลงชื่อผู้ร้อง"
                                      value={currentDoc.signatureName}
                                      onChange={(e) => setCurrentDoc({ ...currentDoc, signatureName: e.target.value })}
                                      className={`bg-transparent border-none outline-none font-bold text-center w-full text-[13.5px] placeholder:text-slate-300 ${typedTextClass}`}
                                    />
                                  </div>
                                </div>
                                <div className={`font-bold select-none text-[13px] ${templateClass}`}>
                                  ........................................................ ผู้ร้อง / ผู้แถลง / ผู้ขอ
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}

                </div>

              </div>

            </div>

            {/* Immersive Floating Dialog for Writing/Editing Clause Body Text */}
            <AnimatePresence>
              {isEditingClause && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 15 }}
                    className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                  >
                    {/* Modal Header */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                          <FileText className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-base font-black text-slate-800 dark:text-white">
                            พิมพ์รายละเอียดเนื้อความคำร้อง (ข้อ ๑.)
                          </h3>
                          <p className="text-xs text-slate-400">
                            พิมพ์ข้อมูลคดี ความยาวไม่จำกัด ระบบจะจัดเรียงและตัดคำขึ้นบรรทัดใหม่บนจุดไข่ปลาให้อัตโนมัติ
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setIsEditingClause(false)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 flex items-center justify-center text-slate-500 dark:text-slate-350 cursor-pointer transition-all"
                      >
                        <X className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 flex-grow overflow-y-auto space-y-4">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                        <span>พิมพ์คำบรรยายข้อเท็จจริง คดี หรือเหตุผลที่ร้องขอต่อศาลที่นี่:</span>
                        <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          รวม {clauseLines.length} บรรทัด ({pagesData.length} หน้ากระดาษที่จะพิมพ์)
                        </span>
                      </div>

                      <textarea
                        rows={14}
                        value={currentDoc.clauseText}
                        onChange={(e) => setCurrentDoc({ ...currentDoc, clauseText: e.target.value })}
                        placeholder="เริ่มต้นพิมพ์ที่นี่... (เช่น คดีนี้ โจทก์ได้ยื่นฟ้องจำเลยต่อศาลนี้...)"
                        className="w-full p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-sm font-bold leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100 min-h-[300px]"
                        style={{ fontFamily: 'var(--font-sans)' }}
                      />

                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850/60 text-[11px] text-slate-400 leading-relaxed text-left flex gap-2.5 items-start">
                        <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <strong>ระบบปันหน้าและตัดคำภาษาไทยอัตโนมัติ:</strong> คุณไม่จำเป็นต้องกดเคาะเว้นวรรคยาวๆ หรือใส่จุดไข่ปลาเองใดๆ ทั้งสิ้น พิมพ์ข้อความต่อเนื่องไปได้เลยตามธรรมชาติ เมื่อล้น 4 บรรทัดแรกในหน้า 1 ระบบจะเริ่มจัดกลุ่มและสร้าง "หน้า 2" หรือ "หน้า 3" ทรง ๔๐ ก. ยอดฮิตของศาลไทยให้อัตโนมัติทันที
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 flex items-center justify-end gap-3">
                      <button
                        onClick={() => setIsEditingClause(false)}
                        className="h-11 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-md"
                      >
                        เสร็จสิ้นและตรวจดูบนแบบฟอร์ม
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
