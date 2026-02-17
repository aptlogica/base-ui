import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Attachment } from '../Attachment';

const addAttachmentMock = vi.fn();
const removeAttachmentsMock = vi.fn();

vi.mock('../../../../hooks/useApi', () => ({
  useAddAttachment: () => ({ mutateAsync: addAttachmentMock }),
  useRemoveAttachments: () => ({ mutateAsync: removeAttachmentsMock }),
}));

vi.mock('../../../../plugins/GalleryViewPlugin/components/shared/Modals/AttachmentModal', () => ({
  AttachmentModal: ({ isOpen, onChange }: { isOpen: boolean; onChange: (files: any[]) => void }) => (
    <div>
      {isOpen && (
        <>
          <button type="button" onClick={() => onChange([{ id: 1, url: 'file-a' }])}>
            Apply Files
          </button>
          <button
            type="button"
            onClick={() => onChange([{ id: 2, url: 'file-b', file: new File(['x'], 'file-b.txt', { type: 'text/plain' }) }])}
          >
            Apply Files With Object
          </button>
          <button type="button" onClick={() => onChange([])}>
            Clear Files
          </button>
        </>
      )}
    </div>
  ),
}));

vi.mock('../../../../plugins/GalleryViewPlugin/components/shared/Modals/AttachmentPreviewModal', () => ({
  AttachmentPreviewModal: ({ isOpen }: { isOpen: boolean }) => (
    <div>{isOpen ? 'Preview Open' : null}</div>
  ),
}));

describe('Attachment', () => {
  beforeEach(() => {
    addAttachmentMock.mockResolvedValue(undefined);
    removeAttachmentsMock.mockResolvedValue(undefined);
  });

  it('renders placeholder actions and opens preview', async () => {
    const user = userEvent.setup();
    render(
      <Attachment
        value={[{ id: 'att-1', url: 'file-a' }]}
        onChange={vi.fn()}
        showPreview={true}
      />
    );

    const previewButton = screen.getByRole('button', { name: /preview attachments/i });
    await user.click(previewButton);
    await waitFor(() => {
      expect(screen.getByText('Preview Open')).toBeInTheDocument();
    });
  });

  it('shows validation error when required and empty after change', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Attachment
        value={[]}
        onChange={onChange}
        required={true}
        persistImmediately={false}
      />
    );

    const addButton = screen.getByTitle('Add attachment');
    await user.click(addButton);
    await user.click(screen.getByText('Clear Files'));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith([]));
    await waitFor(() => {
      expect(screen.getByText('Please attach at least one file')).toBeInTheDocument();
    });
  });

  it('does not call API mutations when persistImmediately is false', async () => {
    const user = userEvent.setup();
    render(
      <Attachment
        value={[]}
        onChange={vi.fn()}
        persistImmediately={false}
      />
    );

    await user.click(screen.getByTitle('Add attachment'));
    await user.click(screen.getByText('Apply Files'));

    expect(addAttachmentMock).not.toHaveBeenCalled();
    expect(removeAttachmentsMock).not.toHaveBeenCalled();
  });

  it('does not call API mutations when required identifiers are missing', async () => {
    const user = userEvent.setup();
    render(
      <Attachment
        value={[]}
        onChange={vi.fn()}
        persistImmediately={true}
      />
    );

    await user.click(screen.getByTitle('Add attachment'));
    await user.click(screen.getByText('Apply Files With Object'));

    expect(addAttachmentMock).not.toHaveBeenCalled();
    expect(removeAttachmentsMock).not.toHaveBeenCalled();
  });

  it('calls addAttachmentMutation when persistImmediately is true and file objects exist', async () => {
    const user = userEvent.setup();
    render(
      <Attachment
        value={[]}
        onChange={vi.fn()}
        persistImmediately={true}
        model_id="m1"
        column_id="c1"
        row_id={1}
      />
    );

    await user.click(screen.getByTitle('Add attachment'));
    await user.click(screen.getByText('Apply Files With Object'));

    await waitFor(() =>
      expect(addAttachmentMock).toHaveBeenCalledWith({
        model_id: 'm1',
        column_id: 'c1',
        row_id: 1,
        files: expect.any(Array),
      })
    );
  });

  it('reverts local change when addAttachmentMutation fails', async () => {
    addAttachmentMock.mockRejectedValueOnce(new Error('upload failed'));
    const user = userEvent.setup();
    const onChange = vi.fn();
    const initialValue = [{ id: 'att-1', url: 'file-a' }];

    render(
      <Attachment
        value={initialValue}
        onChange={onChange}
        persistImmediately={true}
        model_id="m1"
        column_id="c1"
        row_id={1}
      />
    );

    await user.click(screen.getByTitle('Add attachment'));
    await user.click(screen.getByText('Apply Files With Object'));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0];
    expect(lastCall).toEqual(initialValue);
  });

  it('calls removeAttachmentsMutation when files are removed', async () => {
    const user = userEvent.setup();
    render(
      <Attachment
        value={[{ id: 'att-1', url: 'file-a' }]}
        onChange={vi.fn()}
        persistImmediately={true}
        model_id="m1"
        column_id="c1"
        row_id={1}
      />
    );

    await user.click(screen.getByTitle('Add attachment'));
    await user.click(screen.getByText('Clear Files'));

    await waitFor(() =>
      expect(removeAttachmentsMock).toHaveBeenCalledWith({
        model_id: 'm1',
        column_id: 'c1',
        row_id: 1,
        attachments: ['att-1'],
      })
    );
  });
});
