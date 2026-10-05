import { startTransition, useCallback, useRef, useState } from 'react';
import { askMigsel, submitAskMigselFeedback } from '@/features/chatbot/api/ask-migsel';
import type { AskMigselChatMessage, AskMigselHistoryMessage } from '@/features/chatbot/types';

const welcomeMessage: AskMigselChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: 'Not sure where to go? Just ask. I can help you find a public service or start a MIGSEL civic report.',
};

export function useAskMigsel() {
  const [messages, setMessages] = useState<AskMigselChatMessage[]>([welcomeMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const conversationIdRef = useRef<string | undefined>(undefined);
  const sessionIdRef = useRef(crypto.randomUUID());

  const sendMessage = useCallback(
    async (rawMessage: string) => {
      const message = rawMessage.trim();
      if (!message || isLoading) return;

      const history: AskMigselHistoryMessage[] = messages
        .filter((item) => item.id !== 'welcome')
        .slice(-8)
        .map((item) => ({ role: item.role, content: item.text }));
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: 'user', text: message },
      ]);
      setIsLoading(true);
      setError(null);
      setLastFailedMessage(null);

      try {
        const response = await askMigsel({
          message,
          sessionId: sessionIdRef.current,
          conversationId: conversationIdRef.current,
          history,
        });
        conversationIdRef.current = response.conversationId;
        startTransition(() => {
          setMessages((current) => [
            ...current,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              text: response.message,
              response,
            },
          ]);
        });
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Ask MIGSEL is unavailable right now. Please try again.',
        );
        setLastFailedMessage(message);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages],
  );

  const retry = useCallback(() => {
    if (lastFailedMessage) void sendMessage(lastFailedMessage);
  }, [lastFailedMessage, sendMessage]);

  const sendFeedback = useCallback(async (message: AskMigselChatMessage, helpful: boolean) => {
    if (!message.response) return;
    try {
      await submitAskMigselFeedback({
        conversationId: message.response.conversationId,
        serviceId: message.response.service?.id,
        helpful,
      });
    } catch (feedbackError) {
      console.error('Ask MIGSEL feedback could not be saved', {
        reason: feedbackError instanceof Error ? feedbackError.message : 'unknown',
      });
    }
  }, []);

  return { messages, isLoading, error, sendMessage, retry, sendFeedback };
}
