import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResolutionPhotoDialog } from '@/features/complaint/components/resolution-photo-dialog';
import { renderWithProviders } from './test-utils';

describe('ResolutionPhotoDialog', () => {
  it('requires an after photo before resolving', async () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      <ResolutionPhotoDialog open isSaving={false} onOpenChange={vi.fn()} onConfirm={onConfirm} />,
    );

    const resolveButton = screen.getByRole('button', { name: 'Upload Photo & Resolve' });
    expect(resolveButton).toBeDisabled();

    const afterPhoto = new File(['completed work'], 'after.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText(/Choose after photo/), {
      target: { files: [afterPhoto] },
    });

    await waitFor(() => expect(screen.getByAltText('After photo preview')).toBeInTheDocument());
    expect(resolveButton).toBeEnabled();

    fireEvent.click(resolveButton);
    expect(onConfirm).toHaveBeenCalledWith(afterPhoto);
  });

  it('closes without resolving when cancelled', () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();
    renderWithProviders(
      <ResolutionPhotoDialog
        open
        isSaving={false}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
