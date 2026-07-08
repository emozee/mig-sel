import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Send, Bot, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearchKnowledge } from '@/features/chatbot/api/use-knowledge';
import { Linkify } from '@/components/ui/linkify';
import { DEFAULT_RESPONSE, SUGGESTED_QUESTIONS } from '@/features/chatbot/utils/constants';
import { MapDock } from '@/components/layout/map-dock';

interface Message {
  id: number;
  role: 'bot' | 'user';
  text: string;
}

let msgCounter = 0;

export const ChatPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: ++msgCounter,
      role: 'bot',
      text: "Hi! I'm the mig-sel assistant. Ask me about reporting issues, points, or anything else!",
    },
  ]);
  const [input, setInput] = useState('');
  const [pendingQuery, setPendingQuery] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const submitCountRef = useRef(0);
  const lastProcessedRef = useRef(0);

  const { data: knowledgeResult, isFetching, isError } = useSearchKnowledge(pendingQuery);

  const addBotResponse = useCallback((text: string) => {
    setMessages((prev) => [...prev, { id: ++msgCounter, role: 'bot', text }]);
  }, []);

  const handleSuggestion = useCallback((question: string) => {
    setInput('');
    submitCountRef.current++;
    setMessages((prev) => [...prev, { id: ++msgCounter, role: 'user', text: question }]);
    setPendingQuery(question);
  }, []);

  useEffect(() => {
    if (!pendingQuery || isFetching) return;
    if (lastProcessedRef.current === submitCountRef.current) return;

    lastProcessedRef.current = submitCountRef.current;

    if (isError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      addBotResponse('Sorry, I had trouble looking that up. Please try again.');
      setPendingQuery('');
      return;
    }

    if (!knowledgeResult) {
      addBotResponse(DEFAULT_RESPONSE);
      setPendingQuery('');
      return;
    }

    const score = knowledgeResult.score ?? 0;
    let text = knowledgeResult.answer;

    if (score < 0.35) {
      text = `Did you mean: "${knowledgeResult.question}"?\n\n${text}`;
    }

    addBotResponse(text);
    setPendingQuery('');
  }, [pendingQuery, isFetching, isError, knowledgeResult, addBotResponse]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isFetching]);

  const isFetchingRef = useRef(false);
  useEffect(() => {
    isFetchingRef.current = isFetching;
  }, [isFetching]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isFetchingRef.current) return;

    const userText = input.trim();
    setInput('');
    submitCountRef.current++;
    setMessages((prev) => [...prev, { id: ++msgCounter, role: 'user', text: userText }]);
    setPendingQuery(userText);
  };

  const showSuggestions = messages.length <= 1 && !isFetching;

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
          <Bot className="text-primary h-5 w-5" />
          <h1 className="text-base font-bold text-gray-900">Chat Assistant</h1>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-3 py-3 pb-24">
        <div className="flex-1 space-y-3 overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  msg.role === 'bot' ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {msg.role === 'bot' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                  msg.role === 'bot'
                    ? 'rounded-tl-sm bg-white text-gray-700 shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                    : 'bg-primary rounded-tr-sm text-white'
                }`}
              >
                {msg.role === 'bot' ? <Linkify>{msg.text}</Linkify> : msg.text}
              </div>
            </div>
          ))}

          {showSuggestions && (
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSuggestion(q)}
                  className="hover:border-primary hover:text-primary rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500 shadow-sm transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {isFetching && (
            <div className="flex items-start gap-2">
              <div className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-white px-3.5 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <span className="inline-flex items-center gap-1 text-sm text-gray-400">
                  <span className="animate-typing-dot h-1.5 w-1.5 rounded-full bg-gray-400" />
                  <span
                    className="animate-typing-dot h-1.5 w-1.5 rounded-full bg-gray-400"
                    style={{ animationDelay: '0.2s' }}
                  />
                  <span
                    className="animate-typing-dot h-1.5 w-1.5 rounded-full bg-gray-400"
                    style={{ animationDelay: '0.4s' }}
                  />
                </span>
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

      <MapDock />
    </div>
  );
};
