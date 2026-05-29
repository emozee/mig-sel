import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Send, Bot, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearchKnowledge } from '@/features/chatbot/api/use-knowledge';

interface Message {
  role: 'bot' | 'user';
  text: string;
}

const DEFAULT_RESPONSE =
  "I'm not sure about that. Try asking about: reports, community, map, shop, points, profile, or leaderboard.";

export const ChatPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: "Hi! I'm the mig-sel assistant. Ask me about reporting issues, the community, points, or anything else!",
    },
  ]);
  const [input, setInput] = useState('');
  const [pendingQuery, setPendingQuery] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const processedRef = useRef<string>('');

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
    <div className="flex min-h-dvh flex-col bg-gray-50">
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-12 max-w-lg items-center gap-2 px-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Bot className="h-5 w-5 text-emerald-600" />
          <h1 className="text-base font-bold text-gray-900">Chat Assistant</h1>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-3 py-3">
        <div className="flex-1 space-y-3 overflow-y-auto">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  msg.role === 'bot'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {msg.role === 'bot' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                  msg.role === 'bot'
                    ? 'rounded-tl-sm bg-white text-gray-700 shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                    : 'rounded-tr-sm bg-emerald-600 text-white'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isFetching && (
            <div className="flex items-start gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-white px-3.5 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <span className="text-sm text-gray-400">Typing...</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-3 flex items-center gap-2 rounded-xl bg-white p-2 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
        >
          <Input
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={500}
            className="h-10 flex-1 border-0 text-sm shadow-none focus-visible:ring-0"
          />
          <Button type="submit" size="icon-xs" disabled={!input.trim() || isFetching}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
