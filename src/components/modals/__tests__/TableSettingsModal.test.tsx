import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TableSettingsModal from '../TableSettingsModal';

vi.mock('../TableTriggersModal', () => ({
  default: ({ view, embedded, table }: { view: string; embedded?: boolean; table: { id: string } }) => (
    <div data-testid="triggers-panel">{`${view}:${embedded ? 'embedded' : 'popup'}:${table.id}`}</div>
  ),
}));

vi.mock('../tableSettings/PrimaryKeyPanel', () => ({
  default: ({ table }: { table: { id: string } }) => <div data-testid="primary-key-panel">{table.id}</div>,
}));

vi.mock('../constraints/UniqueKeysPanel', () => ({
  default: ({ table }: { table: { id: string } }) => <div data-testid="unique-keys-panel">{`unique:${table.id}`}</div>,
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

  it('opens on Primary Key', () => {
    render(<TableSettingsModal table={table} onClose={onClose} />);
    expect(screen.getByRole('button', { name: 'Primary Key' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('primary-key-panel')).toHaveTextContent('t1');
    expect(screen.queryByTestId('unique-keys-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('triggers-panel')).not.toBeInTheDocument();
  });

  it('shows the unique constraints of the table under Unique Key', async () => {
    render(<TableSettingsModal table={table} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Unique Key' }));
    expect(screen.getByRole('button', { name: 'Unique Key' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('unique-keys-panel')).toHaveTextContent('unique:t1');
    expect(screen.queryByTestId('primary-key-panel')).not.toBeInTheDocument();
  });

  it('embeds the triggers list in Triggers & Functions', async () => {
    render(<TableSettingsModal table={table} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Triggers & Functions' }));
    expect(screen.getByRole('button', { name: 'Triggers & Functions' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('triggers-panel')).toHaveTextContent('triggers:embedded:t1');
    expect(screen.queryByTestId('primary-key-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('unique-keys-panel')).not.toBeInTheDocument();
  });

  it('shows an empty right side for sections that are not built yet', async () => {
    render(<TableSettingsModal table={table} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Check Constraints' }));
    expect(screen.getByRole('button', { name: 'Check Constraints' })).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByTestId('triggers-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('primary-key-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('unique-keys-panel')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Primary Key' }));
    expect(screen.getByTestId('primary-key-panel')).toBeInTheDocument();
  });

  it('closes with the close button, the backdrop and Escape', async () => {
    render(<TableSettingsModal table={table} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close modal' }));
    fireEvent.keyDown(screen.getByTestId('primary-key-panel'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('ignores other keys', () => {
    render(<TableSettingsModal table={table} onClose={onClose} />);
    fireEvent.keyDown(screen.getByTestId('primary-key-panel'), { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();
  });
});
