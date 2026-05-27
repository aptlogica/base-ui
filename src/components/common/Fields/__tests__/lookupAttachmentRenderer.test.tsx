import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LookupAttachmentValue, extractAttachmentItems } from '../lookupAttachmentRenderer';

describe('lookupAttachmentRenderer', () => {
  it('extracts attachment objects from nested values', () => {
    const items = extractAttachmentItems([
      [{ title: 'first.jpg', url: 'https://x/1.jpg', mimetype: 'image/jpeg' }],
      { file_name: 'notes.pdf', file_url: 'https://x/2.pdf', mime_type: 'application/pdf' },
    ]);

    expect(items).toHaveLength(2);
    expect(items[0].name).toBe('first.jpg');
    expect(items[1].name).toBe('notes.pdf');
  });

  it('opens attachment modal and shows files', () => {
    render(
      <LookupAttachmentValue
        items={[
          { title: 'first.jpg', url: 'https://x/1.jpg', mimetype: 'image/jpeg' },
          { title: 'notes.pdf', url: 'https://x/2.pdf', mimetype: 'application/pdf' },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Expand attachments' }));
    expect(screen.getByText('Attachments')).toBeInTheDocument();
    expect(screen.getAllByTitle('first.jpg').length).toBeGreaterThan(0);
    expect(screen.getAllByTitle('notes.pdf').length).toBeGreaterThan(0);
  });
});
