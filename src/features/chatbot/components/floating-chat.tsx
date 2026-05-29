import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { useSearchKnowledge } from '../api/use-knowledge';

interface Message {
  role: 'bot' | 'user';
  text: string;
}

const DEFAULT_RESPONSE =
  "I'm not sure about that. Try asking about: reports, community, map, shop, points, profile, or leaderboard.";

export const FloatingChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: 'Hi! Ask me about mig-sel — reports, community, points, and more!',
    },
  ]);
  const [input, setInput] = useState('');
  const [pendingQuery, setPendingQuery] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const processedRef = useRef<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: knowledgeResult, isFetching } = useSearchKnowledge(pendingQuery);

  const addBotResponse = useCallback((text: string) => {
    setMessages((prev) => [...prev, { role: 'bot', text }]);
  }, []);

  useEffect(() => {
    if (!pendingQuery || isFetching) return;
    if (processedRef.current === pendingQuery) return;

    processedRef.current = pendingQuery;
    const response = knowledgeResult?.answer ?? DEFAULT_RESPONSE;
    addBotResponse(response);
    setPendingQuery('');
  }, [pendingQuery, isFetching, knowledgeResult, addBotResponse]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isFetching]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isFetching) return;

      const userText = input.trim();
      setInput('');
      setMessages((prev) => [...prev, { role: 'user', text: userText }]);
      setPendingQuery(userText);
    },
    [input, isFetching],
  );

  return (
    <div className="flex flex-col items-end gap-2">
      {open && (
        <div className="animate-fade-in flex w-72 flex-col overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <Bot className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-semibold text-gray-900">Chat Assistant</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex max-h-52 flex-col gap-2 overflow-y-auto px-3 py-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-1.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    msg.role === 'bot'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {msg.role === 'bot' ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-2.5 py-1.5 text-[11px] leading-relaxed ${
                    msg.role === 'bot'
                      ? 'rounded-tl-sm bg-gray-50 text-gray-700'
                      : 'rounded-tr-sm bg-emerald-600 text-white'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isFetching && (
              <div className="flex items-start gap-1.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Bot className="h-3 w-3" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-gray-50 px-2.5 py-1.5">
                  <span className="text-[11px] text-gray-400">Typing...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-1.5 border-t border-gray-100 px-3 py-2"
          >
            <input
              ref={inputRef}
              placeholder="Ask..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              className="h-7 flex-1 rounded-lg bg-gray-50 px-2 text-xs outline-none placeholder:text-gray-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || isFetching}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {isFetching ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Chat Assistant"
        aria-label="Chat Assistant"
        className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-gray-200/60 transition-all hover:bg-gray-50 active:scale-95"
      >
        {open ? (
          <X className="h-6 w-6 text-gray-700" />
        ) : (
          <MessageCircle className="h-6 w-6 text-gray-700" />
        )}
      </button>
    </div>
  );
};
