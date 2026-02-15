import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ColumnDropdown } from '../ColumnDropdown';

vi.mock('../../../../../hooks/useClickOutside', () => ({
  useClickOutside: () => ({ current: null }),
}));

describe('ColumnDropdown', () => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens and shows edit/delete actions', () => {
    render(<ColumnDropdown onEdit={onEdit} onDelete={onDelete} />);

    fireEvent.click(screen.getByTitle('Column options'));

    expect(screen.getByText('Edit Column')).toBeInTheDocument();
    expect(screen.getByText('Delete Column')).toBeInTheDocument();
  });

  it('invokes edit and closes dropdown', () => {
    render(<ColumnDropdown onEdit={onEdit} onDelete={onDelete} />);

    fireEvent.click(screen.getByTitle('Column options'));
    fireEvent.click(screen.getByText('Edit Column'));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Edit Column')).not.toBeInTheDocument();
  });

  it('invokes delete and closes dropdown', () => {
    render(<ColumnDropdown onEdit={onEdit} onDelete={onDelete} />);

    fireEvent.click(screen.getByTitle('Column options'));
    fireEvent.click(screen.getByText('Delete Column'));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Delete Column')).not.toBeInTheDocument();
  });

  it('respects controlled open state', () => {
    const onOpenChange = vi.fn();
    render(
      <ColumnDropdown
        onEdit={onEdit}
        onDelete={onDelete}
        isOpen={true}
        onOpenChange={onOpenChange}
      />
    );

    expect(screen.getByText('Edit Column')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Column options'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calculates dropdown position when opened', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    render(<ColumnDropdown onEdit={onEdit} onDelete={onDelete} />);
    fireEvent.click(screen.getByTitle('Column options'));

    const dropdown = document.querySelector('.fixed.w-48') as HTMLDivElement;
    expect(dropdown).toBeInTheDocument();
    expect(dropdown.style.top).toContain('px');
    expect(dropdown.style.left).toContain('px');

    rafSpy.mockRestore();
  });
});
