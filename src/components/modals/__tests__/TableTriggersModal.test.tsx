import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TableTriggersModal from '../TableTriggersModal';
import { useAutomations } from '../../../hooks/useApi';
import type { Automation } from '../../../service/clientService';

const deleteMutateAsync = vi.fn();

vi.mock('../../../hooks/useApi', () => ({
  useAutomations: vi.fn(),
  useDeleteAutomation: () => ({ mutateAsync: deleteMutateAsync, isPending: false }),
}));

vi.mock('../triggers/UserName', () => ({
  default: ({ userId }: { userId?: string }) => <>{userId ? `user:${userId}` : '-'}</>,
}));

vi.mock('../triggers/AutomationFormModal', () => ({
  default: ({ type, item, onClose }: { type: string; item?: Automation; onClose: () => void }) => (
    <div data-testid="automation-form">
      <span>form:{type}:{item?.id ?? 'new'}</span>
      <button type="button" onClick={onClose}>close form</button>
    </div>
  ),
}));

const useAutomationsMock = vi.mocked(useAutomations);

const trigger = (id: string, title: string, extra: Partial<Automation> = {}): Automation => ({
  id, model_id: 't1', type: 'trigger', title,
  context: `CREATE TRIGGER ${id}_trg AFTER INSERT ON emp FOR EACH ROW EXECUTE FUNCTION f();`,
  event: 'AFTER INSERT', created_by: 'u1', created_time: '2026-10-09T10:00:00Z', ...extra,
});

const AUTOMATIONS: Automation[] = [
  trigger('a1', 'Log salary', { event: 'BEFORE INSERT, BEFORE UPDATE' }),
  trigger('a2', 'Audit delete'),
  { id: 'f1', model_id: 't1', type: 'function', title: 'Set status', context: 'CREATE FUNCTION set_status() RETURNS trigger AS $$ $$' },
  { id: 'w1', model_id: 't1', type: 'webhook', title: 'Notify CRM', context: '{"url":"x"}' },
];

const table = { id: 't1', title: 'Employee' };

const mockAutomations = (data: Automation[], isLoading = false) =>
  useAutomationsMock.mockReturnValue({ data, isLoading } as any);

describe('TableTriggersModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    deleteMutateAsync.mockResolvedValue({});
    mockAutomations(AUTOMATIONS);
  });

  describe('as a popup', () => {
    it('shows the table name, tab counts and the triggers of the table', () => {
      render(<TableTriggersModal table={table} view="triggers" onClose={onClose} />);
      expect(useAutomationsMock).toHaveBeenCalledWith('t1');
      expect(screen.getByText('Employee - Triggers')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Triggers\s*2/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Functions\s*1/ })).toBeInTheDocument();
      expect(screen.getByText('Log salary')).toBeInTheDocument();
      expect(screen.getByText('Audit delete')).toBeInTheDocument();
      expect(screen.queryByText('Set status')).not.toBeInTheDocument();
      // Each chosen event is a chip
      expect(screen.getByText('BEFORE INSERT')).toBeInTheDocument();
      expect(screen.getByText('BEFORE UPDATE')).toBeInTheDocument();
      expect(screen.getAllByText('user:u1')).toHaveLength(2);
      expect(screen.getAllByText('Oct 9, 2026')).toHaveLength(2);
    });

    it('switches to the functions tab', async () => {
      render(<TableTriggersModal table={table} view="triggers" onClose={onClose} />);
      await userEvent.click(screen.getByRole('button', { name: /Functions/ }));
      expect(screen.getByText('Employee - Functions')).toBeInTheDocument();
      expect(screen.getByText('Set status')).toBeInTheDocument();
      expect(screen.getByText('set_status')).toBeInTheDocument();
      expect(screen.queryByText('Log salary')).not.toBeInTheDocument();
    });

    it('shows only webhooks, without tabs, in the webhooks view', () => {
      render(<TableTriggersModal table={table} view="webhooks" onClose={onClose} />);
      expect(screen.getByText('Employee - Webhooks')).toBeInTheDocument();
      expect(screen.getByText('Notify CRM')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Functions/ })).not.toBeInTheDocument();
    });

    it('filters by search text and says when nothing matches', async () => {
      render(<TableTriggersModal table={table} view="triggers" onClose={onClose} />);
      const search = screen.getByPlaceholderText('Search triggers');
      await userEvent.type(search, 'audit');
      expect(screen.getByText('Audit delete')).toBeInTheDocument();
      expect(screen.queryByText('Log salary')).not.toBeInTheDocument();

      await userEvent.clear(search);
      await userEvent.type(search, 'zzz');
      expect(screen.getByText('No triggers match "zzz"')).toBeInTheDocument();
    });

    it('shows a loading row', () => {
      mockAutomations([], true);
      render(<TableTriggersModal table={table} view="triggers" onClose={onClose} />);
      expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    it('shows an empty state that opens the add form', async () => {
      mockAutomations([]);
      render(<TableTriggersModal table={table} view="triggers" onClose={onClose} />);
      expect(screen.getByText('No triggers yet')).toBeInTheDocument();
      // Header button and empty-state button
      await userEvent.click(screen.getAllByRole('button', { name: 'Add trigger' })[1]);
      expect(screen.getByText('form:trigger:new')).toBeInTheDocument();
    });

    it('opens the edit form from the title and from Edit', async () => {
      render(<TableTriggersModal table={table} view="triggers" onClose={onClose} />);
      await userEvent.click(screen.getByText('Log salary'));
      expect(screen.getByText('form:trigger:a1')).toBeInTheDocument();
      await userEvent.click(screen.getByText('close form'));
      expect(screen.queryByTestId('automation-form')).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Edit Audit delete' }));
      expect(screen.getByText('form:trigger:a2')).toBeInTheDocument();
    });

    it('deletes after confirmation', async () => {
      render(<TableTriggersModal table={table} view="triggers" onClose={onClose} />);
      await userEvent.click(screen.getByRole('button', { name: 'Delete Log salary' }));
      expect(screen.getByText('Delete trigger')).toBeInTheDocument();
      expect(screen.getByText(/It is removed from the database right away/)).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
      await waitFor(() => expect(deleteMutateAsync).toHaveBeenCalledWith({ id: 'a1', tableId: 't1' }));
    });

    it('warns that a function in use cannot be deleted, and shows delete errors', async () => {
      deleteMutateAsync.mockRejectedValue(new Error('cannot drop function: trigger depends on it'));
      render(<TableTriggersModal table={table} view="triggers" onClose={onClose} />);
      await userEvent.click(screen.getByRole('button', { name: /Functions/ }));
      await userEvent.click(screen.getByRole('button', { name: 'Delete Set status' }));
      expect(screen.getByText(/It can't be deleted while a trigger still uses it/)).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
      expect(await screen.findByText('cannot drop function: trigger depends on it')).toBeInTheDocument();
    });

    it('pages through more than 10 entries', async () => {
      mockAutomations(Array.from({ length: 12 }, (_, i) => trigger(`t${i}`, `Trigger ${String(i).padStart(2, '0')}`)));
      render(<TableTriggersModal table={table} view="triggers" onClose={onClose} />);
      expect(screen.getByText('Trigger 00')).toBeInTheDocument();
      expect(screen.queryByText('Trigger 11')).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: '2' }));
      expect(screen.getByText('Trigger 11')).toBeInTheDocument();
      expect(screen.queryByText('Trigger 00')).not.toBeInTheDocument();
    });

    it('closes with the close button, the backdrop and Escape', async () => {
      render(<TableTriggersModal table={table} view="triggers" onClose={onClose} />);
      await userEvent.click(screen.getByRole('button', { name: 'Close' }));
      await userEvent.click(screen.getByRole('button', { name: 'Close modal' }));
      fireEvent.keyDown(screen.getByPlaceholderText('Search triggers'), { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(3);
    });

    it('ignores Escape while a popup is open on top', async () => {
      render(<TableTriggersModal table={table} view="triggers" onClose={onClose} />);
      await userEvent.click(screen.getByText('Log salary'));
      fireEvent.keyDown(screen.getByText('close form'), { key: 'Escape' });
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('embedded in the settings popup', () => {
    it('has no header or close button of its own', () => {
      render(<TableTriggersModal table={table} view="triggers" embedded />);
      expect(screen.queryByText('Employee - Triggers')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Close modal' })).not.toBeInTheDocument();
      expect(screen.getByText('Log salary')).toBeInTheDocument();
    });

    it('shows a section title when there are no tabs', () => {
      render(<TableTriggersModal table={table} view="webhooks" embedded />);
      const heading = screen.getByRole('heading', { name: 'Webhooks' });
      expect(within(heading.parentElement as HTMLElement).getByText(/Sending webhooks is not active yet/)).toBeInTheDocument();
    });

    it('keeps Escape inside while a popup is open, and lets it through otherwise', async () => {
      const parentKeyDown = vi.fn();
      render(
        <div onKeyDown={parentKeyDown}>
          <TableTriggersModal table={table} view="triggers" embedded />
        </div>
      );
      fireEvent.keyDown(screen.getByPlaceholderText('Search triggers'), { key: 'Escape' });
      expect(parentKeyDown).toHaveBeenCalledTimes(1);

      await userEvent.click(screen.getByText('Log salary'));
      fireEvent.keyDown(screen.getByText('close form'), { key: 'Escape' });
      expect(parentKeyDown).toHaveBeenCalledTimes(1);
    });
  });
});
