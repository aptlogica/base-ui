import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TableSettingsModal from '../TableSettingsModal';

vi.mock('../TableTriggersModal', () => ({
  default: ({ view, embedded, table }: { view: string; embedded?: boolean; table: { id: string } }) => (
    <div data-testid="triggers-panel">{`${view}:${embedded ? 'embedded' : 'popup'}:${table.id}`}</div>
  ),
}));

const table = { id: 't1', title: 'Employee' };

describe('TableSettingsModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the table name in the header', () => {
    render(<TableSettingsModal table={table} onClose={onClose} />);
    expect(screen.getByText('Employee - Settings')).toBeInTheDocument();
  });

  it('falls back to the table name when there is no title', () => {
    render(<TableSettingsModal table={{ id: 't1', name: 'staff' }} onClose={onClose} />);
    expect(screen.getByText('staff - Settings')).toBeInTheDocument();
  });

  it('lists the sections in order, with webhooks hidden', () => {
    render(<TableSettingsModal table={table} onClose={onClose} />);
    const nav = screen.getByRole('navigation', { name: 'Settings sections' });
    const labels = Array.from(nav.querySelectorAll('button')).map(b => b.textContent);
    expect(labels).toEqual(['Primary Key', 'Unique Key', 'Check Constraints', 'Triggers & Functions']);
    expect(screen.queryByText('Webhooks')).not.toBeInTheDocument();
  });

  it('opens on Triggers & Functions with the list embedded', () => {
    render(<TableSettingsModal table={table} onClose={onClose} />);
    expect(screen.getByRole('button', { name: 'Triggers & Functions' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('triggers-panel')).toHaveTextContent('triggers:embedded:t1');
  });

  it('shows an empty right side for sections that are not built yet', async () => {
    render(<TableSettingsModal table={table} onClose={onClose} />);
    for (const label of ['Primary Key', 'Unique Key', 'Check Constraints']) {
      await userEvent.click(screen.getByRole('button', { name: label }));
      expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('button', { name: 'Triggers & Functions' })).not.toHaveAttribute('aria-current');
      expect(screen.queryByTestId('triggers-panel')).not.toBeInTheDocument();
    }

    await userEvent.click(screen.getByRole('button', { name: 'Triggers & Functions' }));
    expect(screen.getByTestId('triggers-panel')).toBeInTheDocument();
  });

  it('closes with the close button, the backdrop and Escape', async () => {
    render(<TableSettingsModal table={table} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close modal' }));
    fireEvent.keyDown(screen.getByTestId('triggers-panel'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('ignores other keys', () => {
    render(<TableSettingsModal table={table} onClose={onClose} />);
    fireEvent.keyDown(screen.getByTestId('triggers-panel'), { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();
  });
});
