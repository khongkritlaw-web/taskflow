import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, CornerDownLeft, Sparkles, AlertCircle, RefreshCw, Layers, Mic, MicOff } from 'lucide-react';
import { Task, Expense, AppSettings } from '../types';
import { playNotificationSound } from '../lib/soundUtils';

interface AiAssistantProps {
  tasks: Task[];
  expenses: Expense[];
  categories: string[];
  todayStr: string;
  onExecuteActions: (actions: any[]) => void;
  soundEnabled?: boolean;
  soundVolume?: number;
  soundType?: string;
  settings?: AppSettings;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isError?: boolean;
}

export default function AiAssistant({
  tasks,
  expenses,
  categories,
  todayStr,
  onExecuteActions,
  soundEnabled = true,
  soundVolume = 80,
  soundType = 'chime',
  settings
}: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'สวัสดีค่ะคุณท่าน! หนูชื่อ "น้องฉลาด" เป็นเลขาเอไอส่วนตัวของระบบค่ะ หนูเรียนรู้ไวและพร้อมช่วยบันทึกภารกิจ จัดการบิลลบ ค้นหา หรือคำนวณยอดต่าง ๆ เพียงแค่บอกหนูได้เลยนะคะ ยินดีรับใช้ค่ะ ✨',
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('เบราว์เซอร์ของคุณไม่รองรับการสั่งงานด้วยเสียงค่ะ แนะนำให้ใช้งานบน Google Chrome, Safari หรือ Microsoft Edge นะคะ');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'th-TH';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert('กรุณาอนุญาตการเข้าถึงไมโครโฟนเพื่อส่งเสียงสั่งงานน้องฉลาดด้วยนะคะคุณท่าน');
        } else {
          alert('ขออภัยค่ะ มีข้อผิดพลาดในระบบตรวจจับเสียง กรุณาลองใหม่อีกครั้งนะคะ');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          setPrompt(prev => prev ? prev + ' ' + text : text);
        }
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleSendCommand = async (customPrompt?: string) => {
    const textToSend = (customPrompt || prompt).trim();
    if (!textToSend) return;

    if (!customPrompt) {
      setPrompt('');
    }

    const userMsg: Message = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          tasks,
          expenses,
          categories,
          todayStr,
          settings
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'การเชื่อมกลุ่มคำสั่งทำงานล่าช้า โปรดตั้งค่าคีย์หรือลองสั่งอีกครั้งค่ะ');
      }

      const data = await response.json();

      const aiMsg: Message = {
        id: 'msg_ai_' + Date.now(),
        sender: 'assistant',
        text: data.reply || 'น้องฉลาดประมวลผลให้เรียบร้อยแล้วค่ะคุณท่าน!',
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);

      // Call action executions if any actions are parsed
      if (data.actions && Array.isArray(data.actions) && data.actions.length > 0) {
        onExecuteActions(data.actions);
        if (soundEnabled) {
          playNotificationSound('success', soundVolume);
        }
      } else {
        if (soundEnabled) {
          playNotificationSound('pop', soundVolume);
        }
      }

    } catch (error: any) {
      const aiErr: Message = {
        id: 'msg_err_' + Date.now(),
        sender: 'assistant',
        text: error.message || 'ขออภัยด้วยนะคะคุณท่าน เกิดข้อพารามิเตอร์ตกหล่น ไม่สามารถส่งสารพาน้องฉลาดได้ค่ะ',
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages(prev => [...prev, aiErr]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: '📝 เพิ่มงานตรวจนโยบายบ่ายสาม', text: 'เพิ่มงานตรวจนโยบายวันนี้เวลา 15:00 น.' },
    { label: '💰 บันทึกค่าบิลเน็ต 890 ค้างจ่าย', text: 'เพิ่มค่าใช้จ่าย บิลค่าอินเทอร์เน็ตสำนักงาน 890 บาท หมวดสาธารณูปโภค ยังไม่ได้จ่าย กำหนดชำระวันสุดท้ายของเดือนนี้' },
    { label: '🧮 คำนวณยอดบิลจ่ายแล้ว', text: 'ช่วยสรุปคำนวณและรวมยอดค่าใช้จ่ายที่จ่ายเงินเรียบร้อยแล้วทั้งหมดให้หน่อย' },
    { label: '👀 หางานด่วนวันนี้', text: 'มีงานด่วนหรือภารกิจใดที่ครบกำหนดวันนี้บ้าง สรุปให้ตรวจหน่อย' }
  ];

  const themeAccent = settings?.colorAccent || '#4f46e5';

  return (
    <>
      {/* Floating Trigger Badge */}
      <motion.div
        ref={widgetRef}
        className="fixed bottom-6 right-6 z-[999]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none transition-all duration-300 hover:scale-110 relative cursor-pointer"
          style={{ backgroundColor: themeAccent }}
          title="ปรึกษาน้องฉลาด (เลขา AI ส่วนตัว)"
        >
          {isOpen ? (
            <X className="w-6 h-6 animate-spin-once" />
          ) : (
            <>
              <Bot className="w-7 h-7" />
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                AI
              </span>
            </>
          )}
        </button>
      </motion.div>

      {/* Expandable Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 w-full sm:w-[420px] h-full sm:h-[600px] z-[9998] flex flex-col justify-end pointer-events-none p-0 sm:p-2">
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-slate-900 w-full h-[85vh] sm:h-full rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-150 dark:border-slate-800 flex flex-col overflow-hidden pointer-events-auto animate-fade-in"
            >
              {/* Chat Header */}
              <div
                className="p-4 flex items-center justify-between text-white"
                style={{ backgroundColor: themeAccent }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-black tracking-wide flex items-center gap-1">
                      น้องฉลาด (Nong Chalat AI) <Sparkles className="w-3.5 h-3.5 fill-current text-amber-300" />
                    </h3>
                    <p className="text-[9px] text-white/80 font-medium">ผู้ประมวลระบบงาน การเงิน และพฤติกรรมเลขาผู้บริหาร</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/30">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div className="max-w-[85%] flex flex-col">
                      <div
                        className={`p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm text-left ${
                          m.sender === 'user'
                            ? 'bg-slate-800 text-white dark:bg-indigo-650 rounded-tr-none'
                            : m.isError
                            ? 'bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/30 dark:border-rose-950 dark:text-rose-300 rounded-tl-none'
                            : 'bg-white text-slate-850 dark:bg-slate-850 dark:text-slate-100 border border-slate-100 dark:border-slate-800/80 rounded-tl-none'
                        }`}
                        style={m.sender === 'user' ? { backgroundColor: themeAccent } : {}}
                      >
                        {m.text}
                      </div>
                      <span className={`text-[9px] text-slate-400 mt-1 font-mono ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
                        {m.timestamp}
                      </span>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start animate-pulse">
                    <div className="bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce delay-75" style={{ backgroundColor: themeAccent }} />
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce delay-150" style={{ backgroundColor: themeAccent }} />
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce delay-300" style={{ backgroundColor: themeAccent }} />
                      </div>
                      <span className="text-[10px] text-slate-400 font-extrabold animate-pulse">น้องฉลาดกำลังคิดคำนวณและประมวลผล...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Suggestions */}
              {messages.length < 5 && !loading && (
                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-850 bg-slate-50/80 dark:bg-slate-950/80">
                  <span className="text-[9px] font-extrabold text-slate-400 float-left uppercase tracking-wider mb-1.5 block">
                    ⚡ แนะนำตัวอย่างสั่งงานดลบันดาลลัด (Quick Prompts)
                  </span>
                  <div className="clearfix clear-both" />
                  <div className="flex flex-wrap gap-1.5">
                    {quickPrompts.map((q) => (
                      <button
                        key={q.label}
                        type="button"
                        onClick={() => handleSendCommand(q.text)}
                        className="bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 dark:bg-slate-850 dark:hover:bg-indigo-950 dark:border-slate-800 dark:hover:border-indigo-900 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-650 dark:text-slate-350 text-left transition-colors cursor-pointer"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Input Area */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-150 dark:border-slate-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendCommand();
                  }}
                  className="flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={startSpeechRecognition}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-200 dark:shadow-none'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400'
                    }`}
                    title={isListening ? "กำลังฟังเสียงของคุณท่าน... คลิกเพื่อปิดไมค์" : "สั่งงานด้วยเสียง (พูดภาษาไทย)"}
                    disabled={loading}
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4 text-white" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>

                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={isListening ? "🎙️ กำลังฟังเสียง... พูดได้เลยค่ะ" : "ป้อนคำสั่งลบ เพิ่ม ค้นหา บอกน้องฉลาดได้เลยค่ะ..."}
                    className="flex-1 h-11 px-3 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                    disabled={loading}
                  />
                  
                  <button
                    type="submit"
                    disabled={loading || !prompt.trim()}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      prompt.trim() && !loading
                        ? 'text-white hover:opacity-90 shadow-sm font-bold'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                    }`}
                    style={prompt.trim() && !loading ? { backgroundColor: themeAccent } : {}}
                    title="ส่งคำสั่งให้น้องฉลาด"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
