import { useEffect, useRef, useState } from 'react';
import { Loader2, RotateCcw, Send } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { useAskMigsel } from '@/features/chatbot/hooks/use-ask-migsel';
import type { AskMigselAction, AskMigselHandoff } from '@/features/chatbot/types';
import { ASK_MIGSEL_QUICK_PROMPTS } from '@/features/chatbot/utils/constants';
import { ChatMessage } from './chat-message';

export function AskMigselChat({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const { messages, isLoading, error, sendMessage, retry, sendFeedback } = useAskMigsel();
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const showPrompts = messages.length === 1 && !isLoading;

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, isLoading, error]);

  const submit = (value: string) => {
    const message = value.trim();
    if (!message || isLoading) return;
    setInput('');
    void sendMessage(message);
  };

  const handleAction = (action: AskMigselAction) => {
    if (action.type === 'ANSWER_CLARIFICATION') {
      submit(action.value);
      return;
    }
    if (action.type === 'START_MIGSEL_GRIEVANCE') {
      const state: { askMigsel: AskMigselHandoff } = {
        askMigsel: {
          source: 'ask-migsel',
          category: action.categoryId,
          description: action.description ?? '',
        },
      };
      navigate('/report', { state });
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className={`flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto ${compact ? 'px-3 py-2' : 'px-3 py-4 sm:px-4'}`}
        aria-live="polite"
        aria-busy={isLoading}
      >
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            compact={compact}
            onAction={handleAction}
            onFeedback={(helpful) => sendFeedback(message, helpful)}
          />
        ))}

        {showPrompts && (
          <div className="flex flex-wrap gap-1.5" aria-label="Example questions">
            {ASK_MIGSEL_QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => submit(prompt)}
                className={`hover:border-primary hover:text-primary rounded-full border border-slate-200 bg-white text-left text-slate-600 shadow-sm transition-colors focus-visible:ring-2 ${
                  compact ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
                }`}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-500" role="status">
            <Loader2 className="text-primary h-4 w-4 animate-spin" aria-hidden="true" />
            Ask MIGSEL is checking verified information…
          </div>
        )}

        {error && (
          <div
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"
            role="alert"
          >
            <p>{error}</p>
            <Button type="button" size="xs" variant="outline" onClick={retry} className="mt-2">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Retry
            </Button>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(input);
        }}
        className={`border-border flex shrink-0 items-center gap-2 border-t bg-white ${compact ? 'p-2' : 'p-3 sm:p-4'}`}
      >
        <label
          htmlFor={compact ? 'ask-migsel-compact-input' : 'ask-migsel-input'}
          className="sr-only"
        >
          Tell MIGSEL what you need
        </label>
        <input
          ref={inputRef}
          id={compact ? 'ask-migsel-compact-input' : 'ask-migsel-input'}
          value={input}
          maxLength={500}
          disabled={isLoading}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Tell MIGSEL what you need…"
          className={`bg-muted focus:ring-primary min-w-0 flex-1 rounded-xl px-3 outline-none focus:ring-2 ${
            compact ? 'h-9 text-xs' : 'h-11 text-sm'
          }`}
        />
        <Button
          type="submit"
          size={compact ? 'icon-xs' : 'icon-sm'}
          disabled={!input.trim() || isLoading}
          aria-label="Send message"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </form>
    </div>
  );
}
