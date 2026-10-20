import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FloatingChat } from '@/features/chatbot/components/floating-chat';
import { renderWithProviders } from './test-utils';

vi.mock('@/features/chatbot/components/ask-migsel-chat', () => ({
  AskMigselChat: () => (
    <div>
      <div role="log" aria-label="Conversation history">
        Previous messages
      </div>
      <label>
        Chat draft
        <input aria-label="Chat draft" />
      </label>
    </div>
  ),
}));

describe('FloatingChat', () => {
  const mapWheel = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('keeps chat scrolling from reaching the map', () => {
    renderWithProviders(
      <div data-testid="map">
        <FloatingChat />
      </div>,
    );
    const map = screen.getByTestId('map');
    map.addEventListener('wheel', mapWheel);

    fireEvent.click(screen.getByRole('button', { name: 'Open Ask MIGSEL' }));
    fireEvent.wheel(screen.getByRole('log', { name: 'Conversation history' }));

    expect(mapWheel).not.toHaveBeenCalled();
  });

  it('preserves the conversation when closed and reopened', () => {
    renderWithProviders(<FloatingChat />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Ask MIGSEL' }));
    fireEvent.change(screen.getByLabelText('Chat draft'), {
      target: { value: 'Remember this conversation' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Close Ask MIGSEL' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Open Ask MIGSEL' }));

    expect(screen.getByLabelText('Chat draft')).toHaveValue('Remember this conversation');
  });
});
