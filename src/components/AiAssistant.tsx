import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, CornerDownLeft, Sparkles, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { Task, Expense } from '../types';
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
  soundType = 'chime'
}: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
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
          todayStr
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

  return (
    <>
      {/* Floating Draggable Trigger Badge */}
      <motion.div
        ref={widgetRef}
        drag
        dragMomentum={false}
        dragElastic={0.1}
        className="fixed z-[10000] cursor-grab active:cursor-grabbing pointer-events-auto"
        initial={{ right: 24, bottom: 230 }}
        style={{ touchAction: 'none' }}
      >
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-colors duration-200 focus:outline-none ${
            isOpen 
              ? 'bg-rose-500 hover:bg-rose-600 text-white' 
              : 'bg-indigo-600 dark:bg-purple-600 hover:bg-indigo-700 dark:hover:bg-purple-700 text-white border-2 border-indigo-400 dark:border-purple-400'
          }`}
          title={isOpen ? 'ปิดเลขา AI' : 'คุยกับ น้องฉลาด เลขา AI เคลื่อนที่ได้'}
        >
          {isOpen ? (
            <X className="w-6 h-6 animate-spin-once" />
          ) : (
            <div className="relative">
              <Bot className="w-7 h-7" />
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-950 animate-ping" />
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-950" />
            </div>
          )}
        </motion.button>
      </motion.div>

      {/* Expanded Dialog Panel */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9998] pointer-events-none flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              className="w-full max-w-md h-[550px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto scale-100"
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-indigo-650 via-indigo-600 to-purple-600 text-white flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center border border-white/20 shadow-inner">
                    <Bot className="w-5 h-5 text-indigo-100" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-extrabold text-sm tracking-wide flex items-center gap-1.5">
                      <span>น้องฉลาด (Nong Chalat AI)</span>
                      <span className="text-[10px] bg-emerald-400/30 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full font-bold animate-pulse">ออนไลน์</span>
                    </h3>
                    <p className="text-[10px] text-white/80 font-semibold truncate max-w-[200px]">
                      เลขาอัจฉริยะประมวลบิล & ภารกิจขัดสนทนา
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 hover:text-white transition-all flex items-center justify-center text-indigo-100 focus:outline-none"
                  title="พับเก็บแผงความรู้"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat messages viewport */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40">
                {messages.map((msg) => {
                  const isAi = msg.sender === 'assistant';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${isAi ? 'justify-start' : 'justify-end'}`}
                    >
                      {isAi && (
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 flex-shrink-0 flex items-center justify-center font-bold text-xs shadow-sm border border-indigo-200/20">
                          🤖
                        </div>
                      )}
                      
                      <div className="max-w-[80%] flex flex-col gap-1">
                        <div
                          className={`p-3 rounded-2xl text-xs font-semibold text-left leading-relaxed shadow-sm ${
                            isAi
                              ? msg.isError 
                                ? 'bg-rose-50 text-rose-800 dark:bg-rose-955/20 dark:text-rose-300 border border-rose-100 dark:border-rose-900/40'
                                : 'bg-white text-slate-750 dark:bg-slate-850 dark:text-slate-200 border border-slate-100 dark:border-slate-800'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className={`text-[9px] font-normal text-slate-400 px-1 ${!isAi ? 'text-right' : 'text-left'}`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-605 flex-shrink-0 flex items-center justify-center font-bold text-xs animate-bounce">
                      🤖
                    </div>
                    <div className="bg-white dark:bg-slate-850 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-650 animate-bounce delay-75" />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-650 animate-bounce delay-150" />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-650 animate-bounce delay-300" />
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
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="ป้อนคำสั่งลบ เพิ่ม ค้นหา บอกน้องฉลาดได้เลยค่ะ..."
                    className="flex-1 h-11 px-3 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !prompt.trim()}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                      prompt.trim() && !loading
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                    }`}
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
