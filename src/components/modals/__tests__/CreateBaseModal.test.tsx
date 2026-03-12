import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateBaseModal } from '../CreateBaseModal';

vi.mock('../../common/Fields/MultiLineText', () => ({
  MultiLineText: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <textarea
      aria-label="Description"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe('CreateBaseModal', () => {
  const onClose = vi.fn();
  const onCreate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    const origin = globalThis.location?.origin || 'http://localhost';
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => `blob:${origin}/preview`),
    } as any);
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <CreateBaseModal
        isOpen={false}
        onClose={onClose}
        onCreate={onCreate}
        workspaceId="w1"
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows create mode labels by default and update labels in update mode', () => {
    const createMode = render(
      <CreateBaseModal
        isOpen={true}
        onClose={onClose}
        onCreate={onCreate}
        workspaceId="w1"
      />
    );
    expect(screen.getByRole('heading', { name: 'Create Base' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Base' })).toBeInTheDocument();
    createMode.unmount();

    render(
      <CreateBaseModal
        isOpen={true}
        onClose={onClose}
        onCreate={onCreate}
        workspaceId="w1"
        isUpdate={true}
      />
    );
    expect(screen.getByRole('heading', { name: 'Update Base' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
  });

  it('validates required base name before submit', () => {
    render(
      <CreateBaseModal
        isOpen={true}
        onClose={onClose}
        onCreate={onCreate}
        workspaceId="w1"
      />
    );

    const submit = screen.getByRole('button', { name: 'Create Base' });
    expect(submit).toBeDisabled();
    fireEvent.click(submit);
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('submits trimmed name and description and closes modal', async () => {
    render(
      <CreateBaseModal
        isOpen={true}
        onClose={onClose}
        onCreate={onCreate}
        workspaceId="w1"
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Enter base name'), {
      target: { value: '  New Base  ' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: '  My description  ' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Base' }));

    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith({
        name: 'New Base',
        description: 'My description',
        image: null,
      })
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('shows duplicate name validation using existing bases', () => {
    render(
      <CreateBaseModal
        isOpen={true}
        onClose={onClose}
        onCreate={onCreate}
        workspaceId="w1"
        existingBases={[{ id: 'b1', name: 'Sales Base' }]}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Enter base name'), {
      target: { value: 'Sales Base' },
    });

    const validation = screen.getByText(/already exists/i);
    expect(validation).toBeInTheDocument();

    const submit = screen.getByRole('button', { name: 'Create Base' });
    expect(submit).toBeDisabled();
    fireEvent.click(submit);
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('shows image type validation error for non-image uploads', () => {
    render(
      <CreateBaseModal
        isOpen={true}
        onClose={onClose}
        onCreate={onCreate}
        workspaceId="w1"
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Enter base name'), {
      target: { value: 'Valid Base' },
    });

    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    const badFile = new File(['abc'], 'invalid.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [badFile] } });

    expect(screen.getByText(/please upload a valid image file/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Base' })).toBeDisabled();
  });

  it('shows image dimension error for large image', async () => {
    const OriginalImage = globalThis.Image;
    class MockImage {
      width = 900;
      height = 500;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        this.onload?.();
      }
    }
    (globalThis as any).Image = MockImage;

    render(
      <CreateBaseModal
        isOpen={true}
        onClose={onClose}
        onCreate={onCreate}
        workspaceId="w1"
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Enter base name'), {
      target: { value: 'Valid Base' },
    });

    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    const goodFile = new File(['img'], 'image.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [goodFile] } });

    expect(screen.getByText(/Image dimensions must be max 800 x 400px/i)).toBeInTheDocument();

    (globalThis as any).Image = OriginalImage;
  });

  it('handles drop upload and sets preview', async () => {
    const OriginalImage = globalThis.Image;
    class MockImage {
      width = 200;
      height = 200;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        this.onload?.();
      }
    }
    (globalThis as any).Image = MockImage;

    render(
      <CreateBaseModal
        isOpen={true}
        onClose={onClose}
        onCreate={onCreate}
        workspaceId="w1"
      />
    );

    const dropZone = screen.getByText(/Click to upload/i).closest('button');
    const dropFile = new File(['img'], 'image.png', { type: 'image/png' });
    fireEvent.drop(dropZone as HTMLElement, {
      dataTransfer: { files: [dropFile] },
    });

    await waitFor(() => {
      const img = screen.getByAltText('Preview') as HTMLImageElement;
      expect(img).toBeInTheDocument();
      expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
    });

    (globalThis as any).Image = OriginalImage;
  });

  it('calls onClose for escape key and cancel button', () => {
    const { container } = render(
      <CreateBaseModal
        isOpen={true}
        onClose={onClose}
        onCreate={onCreate}
        workspaceId="w1"
      />
    );

    fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
