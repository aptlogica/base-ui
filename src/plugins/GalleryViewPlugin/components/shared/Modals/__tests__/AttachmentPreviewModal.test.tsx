import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AttachmentPreviewModal } from '../AttachmentPreviewModal';

const removeAttachmentsMutateAsync = vi.fn();
const updateAssetMutateAsync = vi.fn();

vi.mock('react-dom', () => ({
  createPortal: (node: React.ReactNode) => node,
}));

vi.mock('../ImageCarousel', () => ({
  ImageCarousel: ({ isOpen }: { isOpen: boolean }) => (
    <div data-testid="image-carousel">{isOpen ? 'open' : 'closed'}</div>
  ),
}));

vi.mock('../../../../../../hooks/useApi', () => ({
  useRemoveAttachments: () => ({ mutateAsync: removeAttachmentsMutateAsync }),
  useUpdateAssetById: () => ({ mutateAsync: updateAssetMutateAsync }),
}));

const attachments = [
  { id: '1', url: 'http://example.com/a.jpg', name: 'a.jpg', title: 'A Image', mime_type: 'image/jpeg', size: 2048 },
  { id: '2', url: 'http://example.com/b.pdf', name: 'b.pdf', title: 'B Doc', mime_type: 'application/pdf', size: 1024 },
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
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('returns null when closed', () => {
    const { container } = render(<AttachmentPreviewModal {...baseProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders attachments and closes from button', () => {
    render(<AttachmentPreviewModal {...baseProps} />);
    expect(screen.getByText('Thumbnail')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button')[1]);
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('closes on Escape when not editing or in carousel', () => {
    render(<AttachmentPreviewModal {...baseProps} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('calls onAttachFile and opens carousel on card click', async () => {
    render(<AttachmentPreviewModal {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: /attach file/i }));
    expect(baseProps.onAttachFile).toHaveBeenCalled();

    fireEvent.click(screen.getByText('A Image'));
    await waitFor(() => {
      expect(screen.getByTestId('image-carousel')).toHaveTextContent('open');
    });
  });

  it('supports edit save and delete actions', async () => {
    updateAssetMutateAsync.mockResolvedValue({ data: { ok: true } });
    removeAttachmentsMutateAsync.mockResolvedValue({ data: { ok: true } });
    const onAttachmentsChange = vi.fn();

    render(
      <AttachmentPreviewModal
        {...baseProps}
        onAttachmentsChange={onAttachmentsChange}
        model_id="m1"
        column_id="c1"
        row_id={1}
      />
    );

    const firstCard = screen.getByText('A Image').closest('.cursor-pointer') as HTMLElement;
    fireEvent.mouseEnter(firstCard);

    fireEvent.click(screen.getAllByTitle('Edit')[0]);
    const editInput = screen.getByPlaceholderText('Enter filename...');
    fireEvent.change(editInput, { target: { value: 'Renamed' } });
    fireEvent.keyDown(editInput, { key: 'Enter' });

    await waitFor(() => {
      expect(updateAssetMutateAsync).toHaveBeenCalledWith({ id: '1', title: 'Renamed' });
      expect(onAttachmentsChange).toHaveBeenCalled();
    });

    fireEvent.mouseEnter(firstCard);
    fireEvent.click(screen.getAllByTitle('Delete')[0]);
    await waitFor(() => {
      expect(removeAttachmentsMutateAsync).toHaveBeenCalledWith({
        model_id: 'm1',
        column_id: 'c1',
        row_id: 1,
        attachments: ['1'],
      });
    });
  });

  it('cancels edit on Escape and does not call update mutation', async () => {
    render(<AttachmentPreviewModal {...baseProps} />);
    const firstCard = screen.getByText('A Image').closest('.cursor-pointer') as HTMLElement;
    fireEvent.mouseEnter(firstCard);

    fireEvent.click(screen.getAllByTitle('Edit')[0]);
    const editInput = screen.getByPlaceholderText('Enter filename...');
    fireEvent.change(editInput, { target: { value: 'Renamed' } });
    fireEvent.keyDown(editInput, { key: 'Escape' });

    await waitFor(() => {
      expect(updateAssetMutateAsync).not.toHaveBeenCalled();
    });
  });

  it('triggers download when download button is clicked', () => {
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName.toLowerCase() === 'a') {
        return {
          click: clickSpy,
          set href(_val: string) {},
          set download(_val: string) {},
        } as any;
      }
      return originalCreateElement(tagName);
    });

    render(<AttachmentPreviewModal {...baseProps} />);
    const firstCard = screen.getByText('A Image').closest('.cursor-pointer') as HTMLElement;
    fireEvent.mouseEnter(firstCard);
    fireEvent.click(screen.getAllByTitle('Download')[0]);

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(clickSpy).toHaveBeenCalled();
    createElementSpy.mockRestore();
  });

  it('copies url and hides edit controls in readOnly mode', async () => {
    const readOnlyRender = render(<AttachmentPreviewModal {...baseProps} readOnly={true} />);
    expect(screen.queryByRole('button', { name: /attach file/i })).not.toBeInTheDocument();
    readOnlyRender.unmount();

    // Re-render in editable mode to validate copy button
    render(<AttachmentPreviewModal {...baseProps} />);
    const firstCard = screen.getAllByText('A Image')[0].closest('.cursor-pointer') as HTMLElement;
    fireEvent.mouseEnter(firstCard);
    fireEvent.click(screen.getAllByTitle('Copy URL')[0]);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://example.com/a.jpg');
    });
  });
});
