import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { ServiceCard } from '@/features/chatbot/components/service-card';
import { renderWithProviders } from './test-utils';

describe('ServiceCard URL safety', () => {
  it('does not render a dangerous URL even when a malformed response says it is verified', () => {
    renderWithProviders(
      <ServiceCard
        service={{
          id: crypto.randomUUID(),
          name: 'Unsafe candidate',
          providerName: 'Unknown',
          category: 'test',
          verified: true,
          officialUrl: 'javascript:alert(document.cookie)',
        }}
      />,
    );
    expect(screen.queryByRole('link', { name: /Open Official Service/i })).not.toBeInTheDocument();
  });

  it('renders a verified HTTPS official URL safely', () => {
    renderWithProviders(
      <ServiceCard
        service={{
          id: crypto.randomUUID(),
          name: 'Verified service',
          providerName: 'Verified provider',
          category: 'test',
          verified: true,
          officialUrl: 'https://example.gov.bt/service',
        }}
      />,
    );
    const link = screen.getByRole('link', { name: /Open Official Service/i });
    expect(link).toHaveAttribute('href', 'https://example.gov.bt/service');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
