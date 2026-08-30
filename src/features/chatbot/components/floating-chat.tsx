import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';
import { useSearchKnowledge, useLogUnanswered } from '../api/use-knowledge';
import { Linkify } from '@/components/ui/linkify';
import { DEFAULT_RESPONSE, SUGGESTED_QUESTIONS } from '../utils/constants';

interface Message {
  role: 'bot' | 'user';
  text: string;
  chips?: string[];
}

export const FloatingChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: 'Hi! Ask me about mig-sel — reports feed, points, and more!',
    },
  ]);
  const [input, setInput] = useState('');
  const [pendingQuery, setPendingQuery] = useState('');
  const submitCountRef = useRef(0);
  const lastProcessedRef = useRef(0);
  const loggedQuestionsRef = useRef<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: knowledgeResult, isFetching, isError } = useSearchKnowledge(pendingQuery);
  const logUnanswered = useLogUnanswered();

  const logIfNew = useCallback(
    (question: string, matchedQuestion: string | null, score: number | null) => {
      const key = question.trim().toLowerCase();
      if (loggedQuestionsRef.current.has(key)) return;
      loggedQuestionsRef.current.add(key);
      logUnanswered.mutate({ question: question.trim(), matchedQuestion, score });
    },
    [logUnanswered],
  );

  const addBotResponse = useCallback((text: string) => {
    setMessages((prev) => [...prev, { role: 'bot', text }]);
  }, []);

  const handleSuggestion = useCallback((question: string) => {
    setInput('');
    submitCountRef.current++;
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
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
      logIfNew(pendingQuery, null, null);
      addBotResponse(`${DEFAULT_RESPONSE}\n\nYou can also ask neighbors in the Reports Feed.`);
      setPendingQuery('');
      return;
    }

    const { best, alternatives } = knowledgeResult;
    const score = best.score ?? 0;

    if (score < 0.35) {
      logIfNew(pendingQuery, best.question, score);
      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: 'Did you mean one of these?',
          chips: alternatives.map((a) => a.question),
        },
      ]);
      setPendingQuery('');
      return;
    }

    addBotResponse(best.answer);
    setPendingQuery('');
  }, [pendingQuery, isFetching, isError, knowledgeResult, addBotResponse, logIfNew]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isFetching]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isFetching) return;

      const userText = input.trim();
      setInput('');
      submitCountRef.current++;
      setMessages((prev) => [...prev, { role: 'user', text: userText }]);
      setPendingQuery(userText);
    },
    [input, isFetching],
  );

  const showSuggestions = messages.length <= 1 && !isFetching;

  return (
    <div className="flex flex-col items-end gap-2">
      {open && (
        <div className="animate-fade-in flex w-72 flex-col overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <Bot className="text-primary h-4 w-4" />
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

          <div className="flex max-h-64 flex-col gap-2 overflow-y-auto px-3 py-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-1.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    msg.role === 'bot' ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {msg.role === 'bot' ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                </div>
                <div className="flex max-w-[85%] flex-col items-start gap-1.5">
                  <div
                    className={`w-fit rounded-2xl px-2.5 py-1.5 text-[11px] leading-relaxed ${
                      msg.role === 'bot'
                        ? 'rounded-tl-sm bg-gray-50 text-gray-700'
                        : 'bg-primary rounded-tr-sm text-white'
                    }`}
                  >
                    {msg.role === 'bot' ? <Linkify>{msg.text}</Linkify> : msg.text}
                  </div>
                  {msg.chips && msg.chips.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {msg.chips.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => handleSuggestion(chip)}
                          className="hover:border-primary hover:text-primary rounded-full border border-gray-200 bg-white px-2 py-1 text-left text-[10px] text-gray-600 transition-colors"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {showSuggestions && (
              <div className="flex flex-wrap gap-1 px-0.5">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSuggestion(q)}
                    className="hover:border-primary hover:text-primary rounded-full border border-gray-200 bg-white px-2 py-1 text-[10px] text-gray-500 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {isFetching && (
              <div className="flex items-start gap-1.5">
                <div className="bg-primary/10 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                  <Bot className="h-3 w-3" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-gray-50 px-2.5 py-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
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
            <div ref={scrollRef} />
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
              className="bg-primary hover:bg-primary/90 flex h-7 w-7 items-center justify-center rounded-lg text-white transition-colors disabled:opacity-50"
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
        className="group bg-primary shadow-primary/30 ring-primary/20 hover:bg-primary/90 flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl text-white shadow-lg ring-1 transition-all duration-200 active:scale-90"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <Bot className="h-6 w-6 transition-transform duration-300 group-active:scale-0 group-active:opacity-0" />
        )}
      </button>
    </div>
  );
};
