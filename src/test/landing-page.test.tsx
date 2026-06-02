import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { LandingPage } from '@/routes/landing-page';
import { renderWithProviders } from './test-utils';

describe('LandingPage', () => {
  it('renders the app name', () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByText('GMC Resonance')).toBeInTheDocument();
  });

  it('renders the sign-in button', () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });
});
