// ============================================================
// FinanceMe — AI Advisor Page
// Chat interface with Groq AI for financial advice.
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/ipc';
import { useAuthStore } from '../store/authStore';
import {
  Send, Sparkles, Trash2, Loader2,
  CheckCircle2, XCircle, Bot, User,
  Wallet, ArrowLeftRight, PiggyBank,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────

interface AIAction {
  action: string;
  params: Record<string, unknown>;
  description: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  actions?: AIAction[];
  timestamp: Date;
}

type ActionStatus = 'pending' | 'approved' | 'rejected';

// ── Component ────────────────────────────────────────────────

const AIAdvisor = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [actionStatuses, setActionStatuses] = useState<Record<string, ActionStatus>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check API key on mount
  useEffect(() => {
    checkApiKey();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkApiKey = async () => {
    try {
      const result = await api.ai.getKey();
      setHasApiKey(result.hasKey);
    } catch {
      setHasApiKey(false);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await api.ai.chat(trimmed);

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: result.text,
        actions: result.actions,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Initialize action statuses
      if (result.actions && result.actions.length > 0) {
        const newStatuses: Record<string, ActionStatus> = {};
        result.actions.forEach((_, i) => {
          newStatuses[`${assistantMsg.id}-${i}`] = 'pending';
        });
        setActionStatuses(prev => ({ ...prev, ...newStatuses }));
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        text: `⚠️ ${err?.message || 'Gagal menghubungi AI. Periksa koneksi internet dan API Key.'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = async () => {
    await api.ai.clearHistory();
    setMessages([]);
    setActionStatuses({});
  };

  const handleApproveAction = async (msgId: string, actionIndex: number, action: AIAction) => {
    const key = `${msgId}-${actionIndex}`;
    try {
      if (action.action === 'create_budget') {
        const p = action.params;
        await api.budgets.create({
          user_id: user!.id,
          category_id: p.category_id as number,
          amount: p.amount as number,
          month: p.month as number,
          year: p.year as number,
        });
      } else if (action.action === 'create_transaction') {
        const p = action.params;
        await api.transactions.create({
          user_id: user!.id,
          type: p.type as string,
          amount: p.amount as number,
          category_id: p.category_id as number,
          description: p.description as string,
          date: p.date as string,
        });
      } else if (action.action === 'create_savings_goal') {
        const p = action.params;
        await api.savings.create({
          user_id: user!.id,
          name: p.name as string,
          target_amount: p.target_amount as number,
          deadline: (p.deadline as string) || undefined,
        });
      }
      setActionStatuses(prev => ({ ...prev, [key]: 'approved' }));
    } catch (err) {
      console.error('[AI] Failed to execute action:', err);
    }
  };

  const handleRejectAction = (msgId: string, actionIndex: number) => {
    const key = `${msgId}-${actionIndex}`;
    setActionStatuses(prev => ({ ...prev, [key]: 'rejected' }));
  };

  // ── No API Key State ───────────────────────────────────────
  if (hasApiKey === false) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-2rem)]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles size={40} className="text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">AI Advisor</h2>
          <p className="text-slate-400 mb-6">
            Untuk menggunakan AI Advisor, kamu perlu memasukkan Groq API Key di halaman Settings terlebih dahulu.
          </p>
          <button
            onClick={() => navigate('/settings')}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors"
          >
            Buka Settings
          </button>
        </div>
      </div>
    );
  }

  if (hasApiKey === null) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-2rem)]">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
      </div>
    );
  }

  // ── Action Icon ────────────────────────────────────────────
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create_budget': return <Wallet size={16} className="text-indigo-400" />;
      case 'create_transaction': return <ArrowLeftRight size={16} className="text-emerald-400" />;
      case 'create_savings_goal': return <PiggyBank size={16} className="text-amber-400" />;
      default: return <Sparkles size={16} className="text-slate-400" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'create_budget': return 'Buat Budget';
      case 'create_transaction': return 'Catat Transaksi';
      case 'create_savings_goal': return 'Buat Target Tabungan';
      default: return 'Aksi';
    }
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">AI Advisor</h1>
            <p className="text-xs text-slate-400">Powered by Groq</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 size={14} />
            Hapus Chat
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-lg">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bot size={32} className="text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-100 mb-2">Halo! 👋</h2>
              <p className="text-slate-400 text-sm mb-6">
                Aku AI Advisor kamu. Tanya apa saja soal keuangan — dari perencanaan budget sampai analisis pengeluaranmu!
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Berapa uang aman yang bisa kupakai weekend ini?',
                  'Analisis pengeluaranku bulan ini',
                  'Buatkan budget date night 500rb',
                  'Bagaimana kondisi keuanganku bulan ini?',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); inputRef.current?.focus(); }}
                    className="text-left px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-slate-300 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={16} className="text-white" />
              </div>
            )}
            <div className={`max-w-[75%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-indigo-500 text-white rounded-br-md'
                    : 'bg-slate-800 text-slate-200 rounded-bl-md border border-slate-700'
                }`}
              >
                {msg.text}
              </div>

              {/* Action Cards */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="space-y-2 mt-2">
                  {msg.actions.map((action, i) => {
                    const key = `${msg.id}-${i}`;
                    const status = actionStatuses[key] || 'pending';

                    return (
                      <div
                        key={key}
                        className={`border rounded-xl p-4 transition-all ${
                          status === 'approved'
                            ? 'bg-emerald-500/5 border-emerald-500/30'
                            : status === 'rejected'
                            ? 'bg-red-500/5 border-red-500/20 opacity-60'
                            : 'bg-slate-800/80 border-slate-600 hover:border-indigo-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {getActionIcon(action.action)}
                          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                            {getActionLabel(action.action)}
                          </span>
                          {status === 'approved' && (
                            <span className="ml-auto text-xs text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 size={12} /> Disetujui
                            </span>
                          )}
                          {status === 'rejected' && (
                            <span className="ml-auto text-xs text-red-400 flex items-center gap-1">
                              <XCircle size={12} /> Ditolak
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-300 mb-3">{action.description}</p>

                        {/* Params Preview */}
                        <div className="bg-slate-900/50 rounded-lg p-2.5 mb-3 space-y-1">
                          {Object.entries(action.params).map(([k, v]) => (
                            <div key={k} className="flex justify-between text-xs">
                              <span className="text-slate-500">{k}</span>
                              <span className="text-slate-300 font-mono">{String(v)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Approve / Reject buttons */}
                        {status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveAction(msg.id, i, action)}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-medium transition-colors"
                            >
                              <CheckCircle2 size={14} /> Setujui & Simpan
                            </button>
                            <button
                              onClick={() => handleRejectAction(msg.id, i)}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-700/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-600 hover:border-red-500/20 rounded-lg text-xs font-medium transition-colors"
                            >
                              <XCircle size={14} /> Tolak
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <User size={16} className="text-slate-300" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 size={14} className="animate-spin" />
                Sedang berpikir...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-slate-700">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanya soal keuanganmu..."
              rows={1}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 pr-12 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-slate-600 mt-2 text-center">
          AI dapat membuat kesalahan. Selalu periksa saran sebelum menyetujui.
        </p>
      </div>
    </div>
  );
};

export default AIAdvisor;
