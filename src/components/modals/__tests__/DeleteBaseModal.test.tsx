import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteBaseModal } from '../DeleteBaseModal';

describe('DeleteBaseModal', () => {
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  const base = {
    id: 'base-1',
    title: 'Customer Base',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    onConfirm.mockResolvedValue(undefined);
  });

  it('renders nothing when closed or base is missing', () => {
    const closed = render(
      <DeleteBaseModal isOpen={false} base={base} onClose={onClose} onConfirm={onConfirm} />
    );
    expect(closed.container).toBeEmptyDOMElement();

    const noBase = render(
      <DeleteBaseModal isOpen={true} base={null} onClose={onClose} onConfirm={onConfirm} />
    );
    expect(noBase.container).toBeEmptyDOMElement();
  });

  it('renders modal content with warning and base title', () => {
    render(<DeleteBaseModal isOpen={true} base={base} onClose={onClose} onConfirm={onConfirm} />);

    expect(screen.getByRole('heading', { name: 'Delete Base' })).toBeInTheDocument();
    expect(screen.getByText(/permanently delete this base and all its contents/i)).toBeInTheDocument();
    expect(screen.getByText(/please type/i)).toBeInTheDocument();
    expect(screen.getByText('Customer Base')).toBeInTheDocument();
  });

  it('calls onClose when backdrop, close button, cancel or escape are used', () => {
    const { container } = render(
      <DeleteBaseModal isOpen={true} base={base} onClose={onClose} onConfirm={onConfirm} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(4);
  });

  it('enables delete button only when typed value exactly matches base title', () => {
    render(<DeleteBaseModal isOpen={true} base={base} onClose={onClose} onConfirm={onConfirm} />);

    const input = screen.getByPlaceholderText('Enter base name');
    const deleteButton = screen.getByRole('button', { name: 'Delete Base' });

    expect(deleteButton).toBeDisabled();

    fireEvent.change(input, { target: { value: 'customer base' } });
    expect(deleteButton).toBeDisabled();

    fireEvent.change(input, { target: { value: 'Customer Base' } });
    expect(deleteButton).toBeEnabled();
  });

  it('calls confirm and closes on successful delete', async () => {
    render(<DeleteBaseModal isOpen={true} base={base} onClose={onClose} onConfirm={onConfirm} />);

    fireEvent.change(screen.getByPlaceholderText('Enter base name'), {
      target: { value: 'Customer Base' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Delete Base' }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('base-1'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('keeps modal open when confirm fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    onConfirm.mockRejectedValueOnce(new Error('failed'));

    render(<DeleteBaseModal isOpen={true} base={base} onClose={onClose} onConfirm={onConfirm} />);

    fireEvent.change(screen.getByPlaceholderText('Enter base name'), {
      target: { value: 'Customer Base' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Delete Base' }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
