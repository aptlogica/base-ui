import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AttachmentPreviewModal } from '../AttachmentPreviewModal';

vi.mock('react-dom', () => ({
  createPortal: (node: React.ReactNode) => node,
}));

vi.mock('../../../../../../hooks/useApi', () => ({
  useRemoveAttachments: () => ({ mutateAsync: vi.fn() }),
  useUpdateAssetById: () => ({ mutateAsync: vi.fn() }),
}));

const attachments = [
  { id: '1', url: 'http://example.com/a.jpg', name: 'a.jpg', mime_type: 'image/jpeg' },
  { id: '2', url: 'http://example.com/b.pdf', name: 'b.pdf', mime_type: 'application/pdf' },
];

const baseProps = {
  isOpen: true,
  onClose: vi.fn(),
  attachments,
  onAttachFile: vi.fn(),
  onAttachmentsChange: vi.fn(),
};

describe('AttachmentPreviewModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when closed', () => {
    const { container } = render(<AttachmentPreviewModal {...baseProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders attachments and handles close', () => {
    render(<AttachmentPreviewModal {...baseProps} />);

    expect(screen.getByText('Thumbnail')).toBeInTheDocument();
    expect(screen.getByText('a.jpg')).toBeInTheDocument();

    const closeButton = screen.getAllByRole('button').find((btn) => btn.querySelector('.lucide-x'))!;
    fireEvent.click(closeButton);
    expect(baseProps.onClose).toHaveBeenCalled();
  });
});
