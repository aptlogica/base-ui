import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('renders placeholder actions and opens preview', () => {
    render(
      <Attachment
        value={[]}
        onChange={vi.fn()}
        showPreview={true}
      />
    );

    const previewButton = screen.getByRole('button', { name: /preview attachments/i });
    fireEvent.click(previewButton);
    expect(screen.getByText('Preview Open')).toBeInTheDocument();
  });

  it('shows validation error when required and empty after change', () => {
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
    fireEvent.click(addButton);
    fireEvent.click(screen.getByText('Clear Files'));

    expect(onChange).toHaveBeenCalledWith([]);
    expect(screen.getByText('Please attach at least one file')).toBeInTheDocument();
  });

  it('does not call API mutations when persistImmediately is false', () => {
    render(
      <Attachment
        value={[]}
        onChange={vi.fn()}
        persistImmediately={false}
      />
    );

    fireEvent.click(screen.getByTitle('Add attachment'));
    fireEvent.click(screen.getByText('Apply Files'));

    expect(addAttachmentMock).not.toHaveBeenCalled();
    expect(removeAttachmentsMock).not.toHaveBeenCalled();
  });

  it('calls addAttachmentMutation when persistImmediately is true and file objects exist', async () => {
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

    fireEvent.click(screen.getByTitle('Add attachment'));
    fireEvent.click(screen.getByText('Apply Files With Object'));

    expect(addAttachmentMock).toHaveBeenCalledWith({
      model_id: 'm1',
      column_id: 'c1',
      row_id: 1,
      files: expect.any(Array),
    });
  });

  it('calls removeAttachmentsMutation when files are removed', async () => {
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

    fireEvent.click(screen.getByTitle('Add attachment'));
    fireEvent.click(screen.getByText('Clear Files'));

    expect(removeAttachmentsMock).toHaveBeenCalledWith({
      model_id: 'm1',
      column_id: 'c1',
      row_id: 1,
      attachments: ['att-1'],
    });
  });
});
