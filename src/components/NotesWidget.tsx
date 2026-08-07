import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  StickyNote, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  Save, 
  ChevronRight, 
  Tag, 
  FileText, 
  Info,
  BookOpen,
  ArrowLeft,
  Eye
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  setDoc, 
  doc, 
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

interface NotesWidgetProps {
  sessionUser: {
    userId: string;
    email?: string;
  };
  accentColor: string;
  darkMode: boolean;
}

interface Note {
  id: string;
  title: string;
  category: string;
  details: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

const DEFAULT_CATEGORIES = ['ส่วนตัว', 'งาน', 'บันทึกด่วน', 'ไอเดีย', 'การเงิน'];

export default function NotesWidget({ sessionUser, accentColor, darkMode }: NotesWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  
  // Reading Mode State
  const [viewNote, setViewNote] = useState<Note | null>(null);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [details, setDetails] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCatInput, setShowCustomCatInput] = useState(false);

  // Load from firestore if logged in, otherwise use localStorage
  useEffect(() => {
    const userId = sessionUser.userId || 'guest';
    
    if (userId !== 'guest') {
      // Connect to Firestore subcollection users/{userId}/notes
      const notesRef = collection(db, 'users', userId, 'notes');
      const q = query(notesRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const loadedNotes: Note[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedNotes.push({
            id: docSnap.id,
            title: data.title || '',
            category: data.category || '',
            details: data.details || '',
            userId: data.userId || userId,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });
        setNotes(loadedNotes);
        // Also sync to local storage for quick offline access
        localStorage.setItem(`notes_backup_${userId}`, JSON.stringify(loadedNotes));
        
        // If currently viewing a note, update its content in viewNote state as well
        if (viewNote) {
          const updated = loadedNotes.find(n => n.id === viewNote.id);
          if (updated) {
            setViewNote(updated);
          }
        }
      }, (error) => {
        console.error('Firestore notes onSnapshot error, falling back to backup:', error);
        const cached = localStorage.getItem(`notes_backup_${userId}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setNotes(parsed);
            if (viewNote) {
              const updated = parsed.find((n: Note) => n.id === viewNote.id);
              if (updated) setViewNote(updated);
            }
          } catch (e) {
            console.error(e);
          }
        }
      });
      return () => unsubscribe();
    } else {
      // Guest mode or local mode
      const cached = localStorage.getItem(`notes_backup_guest`);
      if (cached) {
        try {
          setNotes(JSON.parse(cached));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [sessionUser.userId]);

  // Sync guest notes to local storage
  const saveGuestNotes = (updatedNotes: Note[]) => {
    if (!sessionUser.userId || sessionUser.userId === 'guest') {
      setNotes(updatedNotes);
      localStorage.setItem(`notes_backup_guest`, JSON.stringify(updatedNotes));
      
      if (viewNote) {
        const updated = updatedNotes.find(n => n.id === viewNote.id);
        if (updated) {
          setViewNote(updated);
        } else {
          setViewNote(null);
        }
      }
    }
  };

  // Unique categories gathered from notes + default categories
  const categoriesList = React.useMemo(() => {
    const activeCats = notes.map(n => n.category).filter(Boolean);
    const combined = Array.from(new Set([...DEFAULT_CATEGORIES, ...activeCats]));
    return ['ทั้งหมด', ...combined];
  }, [notes]);

  // Filter notes based on search query and selected category
  const filteredNotes = React.useMemo(() => {
    return notes.filter(note => {
      const matchSearch = 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.details.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCategory = selectedCategory === 'ทั้งหมด' || note.category === selectedCategory;
      
      return matchSearch && matchCategory;
    });
  }, [notes, searchQuery, selectedCategory]);

  const resetForm = () => {
    setTitle('');
    setCategory(DEFAULT_CATEGORIES[0]);
    setDetails('');
    setCustomCategory('');
    setShowCustomCatInput(false);
    setEditId(null);
    setIsEditing(false);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCategory = showCustomCatInput ? (customCategory.trim() || 'ทั่วไป') : (category || 'ทั่วไป');
    const userId = sessionUser.userId || 'guest';
    const noteId = editId || `note_${Date.now()}`;
    
    const noteData = {
      id: noteId,
      title: title.trim(),
      category: finalCategory,
      details: details.trim(),
      userId: userId,
      createdAt: editId ? (notes.find(n => n.id === editId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (userId !== 'guest') {
      // Save directly to Firestore under users/{userId}/notes/{noteId}
      try {
        const docRef = doc(db, 'users', userId, 'notes', noteId);
        await setDoc(docRef, {
          title: noteData.title,
          category: noteData.category,
          details: noteData.details,
          userId: noteData.userId,
          createdAt: editId ? (notes.find(n => n.id === editId)?.createdAt || serverTimestamp()) : serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.error('Error saving note to firestore:', err);
      }
    } else {
      // Local storage save
      let updated: Note[];
      if (editId) {
        updated = notes.map(n => n.id === editId ? { ...n, ...noteData } : n);
      } else {
        updated = [noteData as Note, ...notes];
      }
      saveGuestNotes(updated);
    }

    resetForm();
  };

  const handleEditNote = (note: Note) => {
    setEditId(note.id);
    setTitle(note.title);
    if (DEFAULT_CATEGORIES.includes(note.category)) {
      setCategory(note.category);
      setShowCustomCatInput(false);
    } else {
      setCategory('custom');
      setShowCustomCatInput(true);
      setCustomCategory(note.category);
    }
    setDetails(note.details);
    setIsEditing(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('คุณต้องการลบบันทึกนี้ใช่หรือไม่?')) return;
    
    const userId = sessionUser.userId || 'guest';
    if (userId !== 'guest') {
      try {
        const docRef = doc(db, 'users', userId, 'notes', noteId);
        await deleteDoc(docRef);
        if (viewNote?.id === noteId) {
          setViewNote(null);
        }
      } catch (err) {
        console.error('Error deleting note from firestore:', err);
      }
    } else {
      const updated = notes.filter(n => n.id !== noteId);
      saveGuestNotes(updated);
      if (viewNote?.id === noteId) {
        setViewNote(null);
      }
    }
  };

  return (
    <div className="relative">
      {/* Note Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          resetForm();
          setViewNote(null);
        }}
        className="w-10 h-10 border border-slate-200 text-slate-500 bg-white rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all relative dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400"
        title="สมุดบันทึกส่วนตัว"
        id="notes-trigger-btn"
      >
        <StickyNote className="w-4.5 h-4.5" />
        {notes.length > 0 && (
          <span 
            className="absolute -top-1 -right-1 text-white text-[9px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950"
            style={{ backgroundColor: accentColor }}
          >
            {notes.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40 bg-transparent" 
              onClick={() => setIsOpen(false)} 
            />

            {/* Note Panel Container */}
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden dark:bg-slate-900 dark:border-slate-800 flex flex-col max-h-[85vh]"
              style={{ minHeight: '460px' }}
              id="notes-panel"
            >
              {/* Panel Header */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" style={{ color: accentColor }} />
                  <span className="text-xs font-black text-slate-800 dark:text-white">
                    {viewNote ? 'อ่านบันทึกส่วนตัว' : isEditing ? 'แก้ไขจดบันทึก' : 'สมุดบันทึกย่อส่วนตัว'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {!isEditing && !viewNote && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditId(null);
                        setTitle('');
                        setCategory(DEFAULT_CATEGORIES[0]);
                        setDetails('');
                      }}
                      className="p-1 px-2.5 rounded-lg text-[11px] font-bold text-white flex items-center gap-1 hover:brightness-110 transition-all cursor-pointer"
                      style={{ backgroundColor: accentColor }}
                      title="จดบันทึกใหม่"
                    >
                      <Plus className="w-3 h-3" />
                      จดใหม่
                    </button>
                  )}
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Reading Mode Screen */}
              {viewNote ? (
                <div className="p-4 flex-1 overflow-hidden flex flex-col justify-between">
                  <div className="space-y-3.5 flex-1 flex flex-col overflow-hidden">
                    {/* Back Button */}
                    <div>
                      <button
                        onClick={() => setViewNote(null)}
                        className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>กลับไปรายการบันทึก</span>
                      </button>
                    </div>

                    {/* Meta info & Action controls */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                      <span 
                        className="px-2 py-0.5 rounded-md text-[10px] font-black text-white"
                        style={{ backgroundColor: accentColor }}
                      >
                        {viewNote.category}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            handleEditNote(viewNote);
                            setViewNote(null);
                          }}
                          className="p-1 px-2 text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Edit3 className="w-3 h-3" />
                          แก้ไข
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteNote(viewNote.id);
                          }}
                          className="p-1 px-2 text-[11px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                          ลบ
                        </button>
                      </div>
                    </div>

                    {/* Note Content Panel */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                      <h3 className="text-sm font-black text-slate-800 dark:text-white break-words leading-snug">
                        {viewNote.title}
                      </h3>
                      
                      <div className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words leading-relaxed font-normal bg-slate-50/50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                        {viewNote.details || <span className="italic text-slate-400">ไม่มีรายละเอียดเพิ่มเติม</span>}
                      </div>
                    </div>
                  </div>

                  {/* Footer Timestamp */}
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-3 shrink-0">
                    <Info className="w-3.5 h-3.5" />
                    <span>
                      {viewNote.updatedAt 
                        ? `แก้ไขล่าสุด: ${new Date(viewNote.updatedAt.toDate ? viewNote.updatedAt.toDate() : viewNote.updatedAt).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                        : viewNote.createdAt 
                        ? `บันทึกเมื่อ: ${new Date(viewNote.createdAt.toDate ? viewNote.createdAt.toDate() : viewNote.createdAt).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                        : 'ไม่มีประวัติเวลา'
                      }
                    </span>
                  </div>
                </div>
              ) : isEditing ? (
                /* Form Mode */
                <form onSubmit={handleSaveNote} className="p-4 flex-1 overflow-y-auto space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Note Title */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">หัวข้อบันทึก *</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="ระบุหัวข้อที่ต้องการจดจำ..."
                        className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400"
                      />
                    </div>

                    {/* Note Category */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">หมวดหมู่</label>
                        <select
                          value={showCustomCatInput ? 'custom' : category}
                          onChange={(e) => {
                            if (e.target.value === 'custom') {
                              setShowCustomCatInput(true);
                            } else {
                              setShowCustomCatInput(false);
                              setCategory(e.target.value);
                            }
                          }}
                          className="w-full text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none"
                        >
                          {DEFAULT_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="custom">+ ระบุเอง...</option>
                        </select>
                      </div>

                      {showCustomCatInput && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">ระบุหมวดหมู่ใหม่</label>
                          <input
                            type="text"
                            required
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            placeholder="ระบุหมวดหมู่..."
                            className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400"
                          />
                        </div>
                      )}
                    </div>

                    {/* Note Details */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">รายละเอียดบันทึก</label>
                      <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="รายละเอียดข้อความ หรือข้อมูลเสริม..."
                        rows={6}
                        className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-slate-400 resize-none"
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-lg text-xs text-white flex items-center gap-1 hover:brightness-110 transition-all font-bold cursor-pointer"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Save className="w-3.5 h-3.5" />
                      บันทึกข้อมูล
                    </button>
                  </div>
                </form>
              ) : (
                /* List & Search Mode */
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Search and filter controls */}
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800 space-y-2">
                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ค้นหา หัวข้อ, หมวดหมู่, รายละเอียด..."
                        className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-transparent"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                      {categoriesList.map(cat => {
                        const isSelected = selectedCategory === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-2.5 py-1 text-[10px] rounded-full whitespace-nowrap font-bold transition-all cursor-pointer ${
                              isSelected 
                                ? 'text-white' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                            }`}
                            style={isSelected ? { backgroundColor: accentColor } : {}}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes List */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                    {filteredNotes.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center space-y-2">
                        <StickyNote className="w-8 h-8 opacity-30 stroke-1" />
                        <span className="text-xs">ไม่พบรายการจดบันทึก</span>
                        {searchQuery || selectedCategory !== 'ทั้งหมด' ? (
                          <button 
                            onClick={() => { setSearchQuery(''); setSelectedCategory('ทั้งหมด'); }}
                            className="text-[10px] underline text-slate-500 dark:text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            ล้างการค้นหาและฟิลเตอร์
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      filteredNotes.map((note) => (
                        <div 
                          key={note.id}
                          onClick={() => setViewNote(note)}
                          className="p-3 rounded-xl border border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:border-slate-700 dark:bg-slate-950/40 dark:hover:bg-slate-950/80 cursor-pointer transition-all flex flex-col space-y-1.5 relative group"
                        >
                          {/* Note Top Bar */}
                          <div className="flex items-center justify-between gap-2">
                            <span 
                              className="px-1.5 py-0.5 rounded text-[9px] font-extrabold text-white"
                              style={{ backgroundColor: accentColor }}
                            >
                              {note.category}
                            </span>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditNote(note);
                                }}
                                className="p-1 hover:text-slate-800 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                title="แก้ไข"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNote(note.id);
                                }}
                                className="p-1 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                title="ลบ"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Note Title */}
                          <h4 className="text-xs font-black text-slate-800 dark:text-white leading-snug break-words pr-8">
                            {note.title}
                          </h4>

                          {/* Note Details (Truncated & Break words to prevent breaking layout) */}
                          {note.details && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3 overflow-hidden text-ellipsis break-words whitespace-pre-wrap leading-relaxed">
                              {note.details}
                            </p>
                          )}
                          
                          {/* Note Read More Tip (only visible on hover to make it feel premium) */}
                          <div className="text-[9px] text-slate-400 dark:text-slate-500 flex items-center justify-between pt-1 border-t border-dashed border-slate-100 dark:border-slate-800/80">
                            <div className="flex items-center gap-1">
                              <Info className="w-2.5 h-2.5" />
                              <span>
                                {note.updatedAt 
                                  ? `อัปเดต: ${new Date(note.updatedAt.toDate ? note.updatedAt.toDate() : note.updatedAt).toLocaleDateString('th-TH')}`
                                  : note.createdAt 
                                  ? `จดเมื่อ: ${new Date(note.createdAt.toDate ? note.createdAt.toDate() : note.createdAt).toLocaleDateString('th-TH')}`
                                  : 'ไม่มีเวลา'
                                }
                              </span>
                            </div>
                            <span className="text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5" style={{ color: accentColor }}>
                              <Eye className="w-2.5 h-2.5" />
                              อ่านบันทึก
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
