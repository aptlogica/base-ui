import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnContextMenu } from '../ColumnContextMenu';

vi.mock('lucide-react', () => ({
  Pencil: () => <span data-testid="icon-pencil" />,
  Trash2: () => <span data-testid="icon-trash" />,
}));

describe('ColumnContextMenu', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1 as any;
    });
  });

  it('renders edit and delete actions and calls handlers', () => {
    const onClose = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <ColumnContextMenu x={10} y={20} onClose={onClose} onEdit={onEdit} onDelete={onDelete} />
    );

    fireEvent.click(screen.getByTitle('Edit column'));
    fireEvent.click(screen.getByTitle('Delete column'));

    expect(onEdit).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalled();
  });

  it('closes on outside click and Escape', () => {
    const onClose = vi.fn();
    render(
      <ColumnContextMenu x={10} y={20} onClose={onClose} onEdit={vi.fn()} onDelete={vi.fn()} />
    );

    fireEvent.mouseDown(document.body);
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('hides actions based on permissions', () => {
    render(
      <ColumnContextMenu x={10} y={20} onClose={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} canUpdate={false} canDelete={false} />
    );

    expect(screen.queryByTitle('Edit column')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Delete column')).not.toBeInTheDocument();
  });
});
