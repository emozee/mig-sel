import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { AskMigselChat } from '@/features/chatbot/components/ask-migsel-chat';
import type { AskMigselChatMessage } from '@/features/chatbot/types';
import { renderWithProviders } from './test-utils';

const mocks = vi.hoisted(() => ({
  messages: [] as AskMigselChatMessage[],
  isLoading: false,
  error: null as string | null,
  sendMessage: vi.fn(),
  retry: vi.fn(),
  sendFeedback: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('@/features/chatbot/hooks/use-ask-migsel', () => ({
  useAskMigsel: () => mocks,
}));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => mocks.navigate };
});

const welcome: AskMigselChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: 'Not sure where to go? Just ask.',
};

describe('AskMigselChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.messages = [welcome];
    mocks.isLoading = false;
    mocks.error = null;
  });

  it('sends a typed citizen message', () => {
    renderWithProviders(<AskMigselChat />);
    fireEvent.change(screen.getByLabelText('Tell MIGSEL what you need'), {
      target: { value: 'I lost my driving licence' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
    expect(mocks.sendMessage).toHaveBeenCalledWith('I lost my driving licence');
  });

  it('announces the loading state', () => {
    mocks.isLoading = true;
    renderWithProviders(<AskMigselChat />);
    expect(screen.getByRole('status')).toHaveTextContent('checking verified information');
  });

  it('submits a structured clarification option', () => {
    mocks.messages = [
      welcome,
      {
        id: 'answer',
        role: 'assistant',
        text: 'Which service?',
        response: {
          conversationId: crypto.randomUUID(),
          message: 'Which service?',
          intent: 'government_service',
          confidence: 0.6,
          needsClarification: true,
          actions: [
            { type: 'ANSWER_CLARIFICATION', label: 'Lost or damaged', value: 'lost_or_damaged' },
          ],
        },
      },
    ];
    renderWithProviders(<AskMigselChat />);
    fireEvent.click(screen.getByRole('button', { name: 'Lost or damaged' }));
    expect(mocks.sendMessage).toHaveBeenCalledWith('lost_or_damaged');
  });

  it('renders an unverified service card without an official action', () => {
    mocks.messages = [
      welcome,
      {
        id: 'service',
        role: 'assistant',
        text: 'I found a possible service.',
        response: {
          conversationId: crypto.randomUUID(),
          message: 'I found a possible service.',
          intent: 'government_service',
          confidence: 0.9,
          needsClarification: false,
          service: {
            id: crypto.randomUUID(),
            name: 'Replace Driving Licence',
            providerName: 'BCTA',
            category: 'transport',
            verified: false,
            officialUrl: 'https://untrusted.example',
          },
          actions: [],
        },
      },
    ];
    renderWithProviders(<AskMigselChat />);
    expect(screen.getByText('Replace Driving Licence')).toBeInTheDocument();
    expect(screen.getByText('Information not verified')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Open Official Service/i })).not.toBeInTheDocument();
  });

  it('hands a grievance to the existing report route with prefill state', () => {
    mocks.messages = [
      welcome,
      {
        id: 'grievance',
        role: 'assistant',
        text: 'MIGSEL can handle this.',
        response: {
          conversationId: crypto.randomUUID(),
          message: 'MIGSEL can handle this.',
          intent: 'grievance',
          confidence: 0.96,
          needsClarification: false,
          actions: [
            {
              type: 'START_MIGSEL_GRIEVANCE',
              label: 'Report through MIGSEL',
              categoryId: 'road',
              description: 'There is a pothole outside my house',
            },
          ],
        },
      },
    ];
    renderWithProviders(<AskMigselChat />);
    fireEvent.click(screen.getByRole('button', { name: /Report through MIGSEL/i }));
    expect(mocks.navigate).toHaveBeenCalledWith('/report', {
      state: {
        askMigsel: {
          source: 'ask-migsel',
          category: 'road',
          description: 'There is a pothole outside my house',
        },
      },
    });
  });

  it('shows a retry action after a network error', () => {
    mocks.error = 'Ask MIGSEL is unavailable right now.';
    renderWithProviders(<AskMigselChat />);
    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));
    expect(mocks.retry).toHaveBeenCalledOnce();
  });
});
