'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Loader2 } from 'lucide-react';
import { chatAPI, type ChatTurn } from '@/lib/api';
import { useChatStore } from '@/store/chatStore';

type Mode = 'assistant' | 'refine';

interface Message extends ChatTurn {
  id: string;
}

const QUICK_PROMPTS: Record<string, string[]> = {
  '/creator/2d-to-3d': [
    'What kind of images work best?',
    'How long does conversion take?',
    'What output formats are supported?',
  ],
  '/creator/animate': [
    'How do I write a good scene?',
    "What's multi-scene mode?",
    'How long can my video be?',
  ],
  '/creator/text-to-image': [
    'Tips for better image prompts?',
    'Which resolution should I pick?',
    'What styles work well?',
  ],
  default: [
    'What can MESH do?',
    'How do I get started?',
    'What features are available?',
  ],
};

export default function ChatWidget() {
  const pathname = usePathname();
  const open = useChatStore((s) => s.open);
  const setOpen = useChatStore((s) => s.setOpen);
  const [mode, setMode] = useState<Mode>('assistant');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const quickPrompts = QUICK_PROMPTS[pathname] || QUICK_PROMPTS.default;

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || sending) return;

    setError(null);
    setInput('');
    const userMsg: Message = { id: `u_${Date.now()}`, role: 'user', content: message };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const history: ChatTurn[] = messages.map(({ role, content }) => ({ role, content }));
      const response = await chatAPI.send({
        message,
        history,
        page: pathname,
        mode,
      });
      const reply = response?.data?.data?.reply;
      if (reply) {
        setMessages((prev) => [
          ...prev,
          { id: `a_${Date.now()}`, role: 'assistant', content: reply },
        ]);
      } else {
        setError('Empty response from assistant');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Chat failed. Is the backend running?';
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const reset = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <>
      {/* Floating bubble */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="bubble"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
            aria-label="Open assistant"
          >
            <Bot className="h-7 w-7" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] h-[560px] max-h-[calc(100vh-3rem)] bg-surface border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-high">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-headline text-sm font-bold text-foreground uppercase tracking-tight">
                    MESH Assistant
                  </h3>
                  <p className="text-[10px] font-label text-muted uppercase tracking-widest">
                    {mode === 'refine' ? 'Prompt refinement' : 'Ask anything'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted hover:text-foreground transition-colors p-1"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mode tabs */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setMode('assistant')}
                className={`flex-1 flex items-center justify-center py-2 text-[11px] font-label uppercase tracking-widest transition-colors ${
                  mode === 'assistant'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted hover:text-foreground border-b-2 border-transparent'
                }`}
              >
                Assistant
              </button>
              <button
                onClick={() => setMode('refine')}
                className={`flex-1 flex items-center justify-center py-2 text-[11px] font-label uppercase tracking-widest transition-colors ${
                  mode === 'refine'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted hover:text-foreground border-b-2 border-transparent'
                }`}
              >
                Refine Prompt
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <div className="text-center py-4">
                    <Bot className="h-10 w-10 text-accent mx-auto mb-2" />
                    <p className="text-sm text-foreground">
                      {mode === 'refine'
                        ? 'Paste a rough prompt — I\'ll rewrite it for better results.'
                        : 'Hi! Ask me anything about MESH.'}
                    </p>
                  </div>
                  {mode === 'assistant' && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-label text-muted uppercase tracking-widest px-1">
                        Try asking
                      </p>
                      {quickPrompts.map((q) => (
                        <button
                          key={q}
                          onClick={() => send(q)}
                          className="w-full text-left px-3 py-2 bg-surface-high hover:bg-background border border-border rounded-lg text-xs text-foreground transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap break-words ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-surface-high text-foreground border border-border'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="bg-surface-high text-muted border border-border rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Thinking…
                  </div>
                </div>
              )}

              {error && (
                <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-2">
                  {error}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 bg-surface-high">
              {messages.length > 0 && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-label text-muted uppercase tracking-widest">
                    {messages.length} message{messages.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={reset}
                    className="text-[10px] font-label text-muted hover:text-foreground uppercase tracking-widest transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    mode === 'refine'
                      ? 'Paste your prompt here…'
                      : 'Ask a question…'
                  }
                  rows={1}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary min-h-[36px] max-h-[120px]"
                  disabled={sending}
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || sending}
                  className="bg-primary text-primary-foreground rounded-lg px-3 py-2 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
