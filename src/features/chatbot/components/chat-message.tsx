import { useState } from 'react';
import { Bot, MapPinned, ThumbsDown, ThumbsUp, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AskMigselAction, AskMigselChatMessage } from '@/features/chatbot/types';
import { ServiceCard } from './service-card';

export function ChatMessage({
  message,
  compact,
  onAction,
  onFeedback,
}: {
  message: AskMigselChatMessage;
  compact?: boolean;
  onAction: (action: AskMigselAction) => void;
  onFeedback: (helpful: boolean) => Promise<void>;
}) {
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const isUser = message.role === 'user';
  const showFeedback = !isUser && Boolean(message.response?.service);

  return (
    <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex shrink-0 items-center justify-center rounded-full ${
          compact ? 'h-6 w-6' : 'h-8 w-8'
        } ${isUser ? 'bg-slate-200 text-slate-600' : 'bg-primary/10 text-primary'}`}
        aria-hidden="true"
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div className={`flex min-w-0 flex-col gap-2 ${compact ? 'max-w-[88%]' : 'max-w-[84%]'}`}>
        <div
          className={`w-fit max-w-full rounded-2xl px-3 py-2 leading-relaxed break-words whitespace-pre-wrap ${
            compact ? 'text-xs' : 'text-sm'
          } ${
            isUser
              ? 'bg-primary rounded-tr-sm text-white'
              : 'rounded-tl-sm bg-white text-slate-700 shadow-sm'
          }`}
        >
          {message.text}
        </div>
        {message.response?.service && <ServiceCard service={message.response.service} />}
        {message.response?.actions && message.response.actions.length > 0 && (
          <div className="flex w-full flex-wrap gap-1.5">
            {message.response.actions
              .filter((action) => action.type !== 'OPEN_OFFICIAL_SERVICE')
              .map((action) => (
                <Button
                  key={`${action.type}-${action.label}`}
                  type="button"
                  size="xs"
                  variant={action.type === 'START_MIGSEL_GRIEVANCE' ? 'default' : 'outline'}
                  onClick={() => onAction(action)}
                  className="h-auto min-h-8 max-w-full whitespace-normal"
                >
                  {action.type === 'START_MIGSEL_GRIEVANCE' && (
                    <MapPinned className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {action.label}
                </Button>
              ))}
          </div>
        )}
        {showFeedback && feedback === null && (
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span>Was this helpful?</span>
            <button
              type="button"
              aria-label="Yes, this was helpful"
              className="hover:text-primary rounded p-1 focus-visible:ring-2"
              onClick={() => {
                setFeedback(true);
                void onFeedback(true);
              }}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="No, this was not helpful"
              className="rounded p-1 hover:text-red-600 focus-visible:ring-2"
              onClick={() => {
                setFeedback(false);
                void onFeedback(false);
              }}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {showFeedback && feedback !== null && (
          <p className="text-[11px] text-slate-500">Thank you for the feedback.</p>
        )}
      </div>
    </div>
  );
}
