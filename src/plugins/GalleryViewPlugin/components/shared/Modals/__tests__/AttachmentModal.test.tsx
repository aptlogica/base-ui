import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AttachmentModal } from '../AttachmentModal';

vi.mock('react-dom', () => ({
  createPortal: (node: React.ReactNode) => node,
}));

vi.mock('../../../../../../hooks/useApi', () => ({
  useUpdateAssetById: () => ({ mutateAsync: vi.fn() }),
  useAddAttachment: () => ({ mutateAsync: vi.fn() }),
}));

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  value: [],
  onChange: vi.fn(),
};

describe('AttachmentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when closed', () => {
    const { container } = render(<AttachmentModal {...baseProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when open and triggers onClose', () => {
    render(<AttachmentModal {...baseProps} />);

    const closeOverlay = screen.getByLabelText('Close modal');
    fireEvent.click(closeOverlay);

    expect(baseProps.onClose).toHaveBeenCalled();
  });
});
