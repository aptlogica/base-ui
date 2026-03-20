import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TablePagination } from '../TablePagination';

describe('TablePagination', () => {
  it('renders nothing when totalPages is 1 or less', () => {
    const { container } = render(
      <TablePagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('disables prev/next at boundaries', () => {
    const { rerender } = render(
      <TablePagination currentPage={1} totalPages={3} onPageChange={vi.fn()} />
    );

    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();

    rerender(
      <TablePagination currentPage={3} totalPages={3} onPageChange={vi.fn()} />
    );

    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /previous/i })).not.toBeDisabled();
  });

  it('calls onPageChange for prev/next and page buttons', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(<TablePagination currentPage={2} totalPages={5} onPageChange={onPageChange} />);

    await user.click(screen.getByRole('button', { name: /previous/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    await user.click(screen.getByRole('button', { name: '5' }));

    expect(onPageChange).toHaveBeenCalledWith(1);
    expect(onPageChange).toHaveBeenCalledWith(3);
    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  it('renders ellipses around distant pages', () => {
    render(<TablePagination currentPage={5} totalPages={10} onPageChange={vi.fn()} />);

    const ellipses = screen.getAllByText('...');
    expect(ellipses.length).toBeGreaterThan(0);
  });
});
