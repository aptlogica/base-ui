import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AttachmentModal } from '../AttachmentModal';

const addAttachmentMutateAsync = vi.fn();
const updateAttachmentMutateAsync = vi.fn();

vi.mock('react-dom', () => ({
  createPortal: (node: React.ReactNode) => node,
}));

vi.mock('../../../../../../hooks/useApi', () => ({
  useUpdateAttachment: () => ({ mutateAsync: updateAttachmentMutateAsync, isPending: false }),
  useAddAttachment: () => ({ mutateAsync: addAttachmentMutateAsync }),
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
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: vi.fn(() => 'blob:preview-url'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: vi.fn(),
    });
    vi.spyOn(globalThis, 'open').mockImplementation(() => null);
  });

  it('returns null when closed', () => {
    const { container } = render(<AttachmentModal {...baseProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders and closes from overlay', () => {
    render(<AttachmentModal {...baseProps} />);
    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('shows file-size validation error for oversized files', async () => {
    render(<AttachmentModal {...baseProps} maxFileSize={10} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = new File(['this-is-large'], 'large.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText(/is too large/i)).toBeInTheDocument();
    });
  });

  it('adds selected files and uploads with API params', async () => {
    addAttachmentMutateAsync.mockResolvedValueOnce({ data: { ok: true } });
    render(
      <AttachmentModal
        {...baseProps}
        model_id="m1"
        column_id="c1"
        row_id={1}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['ok'], 'sample.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText('sample.txt')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /upload files/i }).at(-1)!);

    await waitFor(() => {
      expect(addAttachmentMutateAsync).toHaveBeenCalled();
      expect(baseProps.onClose).toHaveBeenCalled();
    });
  });

  it('disables upload when immediate mode lacks ids', async () => {
    render(<AttachmentModal {...baseProps} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['ok'], 'x.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getAllByRole('button', { name: /upload files/i }).at(-1)!).toBeDisabled();
  });

  it('supports deferred upload mode (persistImmediately=false)', async () => {
    const onChange = vi.fn();
    const onClose = vi.fn();
    render(
      <AttachmentModal
        {...baseProps}
        onChange={onChange}
        onClose={onClose}
        persistImmediately={false}
        value={[{ name: 'existing.txt', url: 'https://e' }]}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['ok'], 'new.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getAllByRole('button', { name: /upload files/i }).at(-1)!);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
      expect(addAttachmentMutateAsync).not.toHaveBeenCalled();
    });
  });

  it('shows max-files error when selected files exceed limit', async () => {
    render(<AttachmentModal {...baseProps} maxFiles={1} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file1 = new File(['a'], 'a.txt', { type: 'text/plain' });
    const file2 = new File(['b'], 'b.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [file1] } });
    fireEvent.change(input, { target: { files: [file2] } });

    await waitFor(() => {
      expect(screen.getByText(/maximum 1 files allowed/i)).toBeInTheDocument();
    });
  });

  it('handles upload API failure and shows error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    addAttachmentMutateAsync.mockRejectedValueOnce(new Error('upload failed'));
    render(
      <AttachmentModal
        {...baseProps}
        model_id="m1"
        column_id="c1"
        row_id={1}
      />
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['ok'], 'error.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getAllByRole('button', { name: /upload files/i }).at(-1)!);

    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
    });
    consoleErrorSpy.mockRestore();
  });

  it('removes selected file and closes via cancel', async () => {
    const onClose = vi.fn();
    render(<AttachmentModal {...baseProps} onClose={onClose} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['ok'], 'remove.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText('remove.txt')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Remove'));
    await waitFor(() => {
      expect(screen.queryByText('remove.txt')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape key press', () => {
    const onClose = vi.fn();
    render(<AttachmentModal {...baseProps} onClose={onClose} />);

    const backdrop = document.querySelector('.bg-modal-backdrop') as HTMLElement;
    fireEvent.keyDown(backdrop, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('accepts dropped files into the upload area', async () => {
    render(<AttachmentModal {...baseProps} />);

    const uploadArea = screen.getByRole('button', { name: /upload files/i });
    const file = new File(['drop'], 'drop.txt', { type: 'text/plain' });

    fireEvent.dragOver(uploadArea);
    fireEvent.drop(uploadArea, { dataTransfer: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('drop.txt')).toBeInTheDocument();
    });
  });
});
