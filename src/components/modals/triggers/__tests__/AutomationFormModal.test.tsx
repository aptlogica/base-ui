import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AutomationFormModal from '../AutomationFormModal';
import type { Automation } from '../../../../service/clientService';

const createMutateAsync = vi.fn();
const updateMutateAsync = vi.fn();
const runMutateAsync = vi.fn();

vi.mock('../../../../hooks/useApi', () => ({
  useCreateAutomation: () => ({ mutateAsync: createMutateAsync, isPending: false }),
  useUpdateAutomation: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
  useRunAutomation: () => ({ mutateAsync: runMutateAsync, isPending: false }),
}));

// Plain textarea instead of the rich field component
vi.mock('../../../common/Fields/MultiLineText', () => ({
  MultiLineText: ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <label>
      {label}
      <textarea aria-label={label} value={value} onChange={e => onChange(e.target.value)} />
    </label>
  ),
}));

const table = { id: 't1', title: 'Employee', alias: 'employee' };
const TRIGGER_QUERY = 'CREATE TRIGGER log_salary AFTER INSERT ON "public"."employee" FOR EACH ROW EXECUTE FUNCTION log_fn();';
const FUNCTION_QUERY = 'CREATE OR REPLACE FUNCTION log_fn() RETURNS trigger AS $$ BEGIN RETURN NEW; END; $$ LANGUAGE plpgsql;';

const savedTrigger: Automation = {
  id: 'a1', model_id: 't1', type: 'trigger', title: 'Log salary', context: TRIGGER_QUERY, event: 'AFTER INSERT',
};

const typeQuery = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('AutomationFormModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    createMutateAsync.mockResolvedValue({});
    updateMutateAsync.mockResolvedValue({});
    runMutateAsync.mockResolvedValue({});
  });

  describe('adding a trigger', () => {
    it('shows the add header, the table name and the timing and event controls', () => {
      render(<AutomationFormModal type="trigger" table={table} onClose={onClose} />);
      expect(screen.getByText('Add trigger')).toBeInTheDocument();
      expect(screen.getByText('Employee')).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Trigger timing' })).toBeInTheDocument();
      expect(screen.getByText(/Saved as: AFTER INSERT/)).toBeInTheDocument();
      // A new entry is applied on save, so there is nothing to run yet
      expect(screen.queryByRole('button', { name: /run/i })).not.toBeInTheDocument();
    });

    it('keeps Save disabled until title and query are filled', async () => {
      render(<AutomationFormModal type="trigger" table={table} onClose={onClose} />);
      const save = screen.getByRole('button', { name: 'Save' });
      expect(save).toBeDisabled();

      await userEvent.type(screen.getByLabelText(/Title/), 'Log salary');
      expect(save).toBeDisabled();

      typeQuery('Trigger query', TRIGGER_QUERY);
      expect(save).toBeEnabled();
    });

    it('creates the trigger with the chosen timing and events written into the query', async () => {
      render(<AutomationFormModal type="trigger" table={table} onClose={onClose} />);
      await userEvent.type(screen.getByLabelText(/Title/), '  Log salary ');
      typeQuery('Trigger query', TRIGGER_QUERY);

      await userEvent.click(screen.getByRole('button', { name: 'BEFORE' }));
      await userEvent.click(screen.getByRole('checkbox', { name: 'UPDATE' }));
      expect(screen.getByText(/Saved as: BEFORE INSERT, BEFORE UPDATE/)).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(createMutateAsync).toHaveBeenCalledWith({
        model_id: 't1',
        title: 'Log salary',
        type: 'trigger',
        context: 'CREATE TRIGGER log_salary BEFORE INSERT OR UPDATE ON "public"."employee" FOR EACH ROW EXECUTE FUNCTION log_fn();',
        event: 'BEFORE INSERT, BEFORE UPDATE',
      }));
      expect(onClose).toHaveBeenCalled();
    });

    it('disables Save when no event is ticked', async () => {
      render(<AutomationFormModal type="trigger" table={table} onClose={onClose} />);
      await userEvent.type(screen.getByLabelText(/Title/), 'Log salary');
      typeQuery('Trigger query', TRIGGER_QUERY);
      await userEvent.click(screen.getByRole('checkbox', { name: 'INSERT' }));
      expect(screen.getByText(/Saved as: -/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    it('warns about INSTEAD OF and TRUNCATE', async () => {
      render(<AutomationFormModal type="trigger" table={table} onClose={onClose} />);
      await userEvent.click(screen.getByRole('button', { name: 'INSTEAD OF' }));
      await userEvent.click(screen.getByRole('checkbox', { name: 'TRUNCATE' }));
      expect(screen.getByText(/INSTEAD OF works only on views/)).toBeInTheDocument();
      expect(screen.getByText(/TRUNCATE needs FOR EACH STATEMENT/)).toBeInTheDocument();
    });

    it('shows the server error and stays open when creating fails', async () => {
      createMutateAsync.mockRejectedValue(new Error('syntax error at or near "TRIGER"'));
      render(<AutomationFormModal type="trigger" table={table} onClose={onClose} />);
      await userEvent.type(screen.getByLabelText(/Title/), 'Log salary');
      typeQuery('Trigger query', TRIGGER_QUERY);
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(await screen.findByText('syntax error at or near "TRIGER"')).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('adding a function', () => {
    it('has no timing or events and saves the query as typed', async () => {
      render(<AutomationFormModal type="function" table={table} onClose={onClose} />);
      expect(screen.getByText('Add function')).toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'Trigger timing' })).not.toBeInTheDocument();

      await userEvent.type(screen.getByLabelText(/Title/), 'Log fn');
      typeQuery('Function query', `  ${FUNCTION_QUERY}  `);
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(createMutateAsync).toHaveBeenCalledWith({
        model_id: 't1', title: 'Log fn', type: 'function', context: FUNCTION_QUERY, event: '',
      }));
    });
  });

  describe('editing', () => {
    it('fills the form from the saved entry and only enables Save after a change', async () => {
      render(<AutomationFormModal type="trigger" table={table} item={savedTrigger} onClose={onClose} />);
      expect(screen.getByText('Edit trigger')).toBeInTheDocument();
      expect(screen.getByLabelText(/Title/)).toHaveValue('Log salary');
      expect(screen.getByLabelText('Trigger query')).toHaveValue(TRIGGER_QUERY);

      const save = screen.getByRole('button', { name: 'Save' });
      expect(save).toBeDisabled();
      await userEvent.type(screen.getByLabelText(/Title/), '!');
      expect(save).toBeEnabled();
    });

    it('takes timing and events from the query when the entry has no stored event', () => {
      const query = TRIGGER_QUERY.replace('AFTER INSERT', 'BEFORE DELETE');
      render(<AutomationFormModal type="trigger" table={table} item={{ ...savedTrigger, event: undefined, context: query }} onClose={onClose} />);
      expect(screen.getByText(/Saved as: BEFORE DELETE/)).toBeInTheDocument();
    });

    it('saves changes without closing and asks to run them', async () => {
      render(<AutomationFormModal type="trigger" table={table} item={savedTrigger} onClose={onClose} />);
      await userEvent.clear(screen.getByLabelText(/Title/));
      await userEvent.type(screen.getByLabelText(/Title/), 'Audit salary');
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(updateMutateAsync).toHaveBeenCalledWith({
        id: 'a1', tableId: 't1', title: 'Audit salary', context: TRIGGER_QUERY, event: 'AFTER INSERT',
      }));
      expect(screen.getByText('Saved. Click Run to apply it in Postgres.')).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('disables Run while there are unsaved changes', async () => {
      render(<AutomationFormModal type="trigger" table={table} item={savedTrigger} onClose={onClose} />);
      const run = screen.getByRole('button', { name: 'Run' });
      expect(run).toBeEnabled();
      await userEvent.type(screen.getByLabelText(/Title/), '!');
      expect(run).toBeDisabled();
      expect(run).toHaveAttribute('title', 'Save first: Run applies the saved query');
    });

    it('runs the saved query and closes', async () => {
      render(<AutomationFormModal type="trigger" table={table} item={savedTrigger} onClose={onClose} />);
      await userEvent.click(screen.getByRole('button', { name: 'Run' }));
      await waitFor(() => expect(runMutateAsync).toHaveBeenCalledWith({ id: 'a1', tableId: 't1' }));
      expect(onClose).toHaveBeenCalled();
    });

    it('shows the error when running fails', async () => {
      runMutateAsync.mockRejectedValue(new Error('function log_fn() does not exist'));
      render(<AutomationFormModal type="trigger" table={table} item={savedTrigger} onClose={onClose} />);
      await userEvent.click(screen.getByRole('button', { name: 'Run' }));
      expect(await screen.findByText('function log_fn() does not exist')).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('has no Run button for a webhook', () => {
      const webhook: Automation = { id: 'w1', model_id: 't1', type: 'webhook', title: 'Notify', context: '{"url":"x"}' };
      render(<AutomationFormModal type="webhook" table={table} item={webhook} onClose={onClose} />);
      expect(screen.queryByRole('button', { name: 'Run' })).not.toBeInTheDocument();
    });
  });

  describe('closing', () => {
    it('closes with Cancel, the close button, the backdrop and Escape', async () => {
      render(<AutomationFormModal type="function" table={table} onClose={onClose} />);
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      await userEvent.click(screen.getByRole('button', { name: 'Close' }));
      await userEvent.click(screen.getByRole('button', { name: 'Close modal' }));
      fireEvent.keyDown(screen.getByLabelText(/Title/), { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(4);
    });

    it('does not let Escape reach popups underneath', () => {
      const parentKeyDown = vi.fn();
      render(
        <div onKeyDown={parentKeyDown}>
          <AutomationFormModal type="function" table={table} onClose={onClose} />
        </div>
      );
      fireEvent.keyDown(screen.getByLabelText(/Title/), { key: 'Escape' });
      expect(parentKeyDown).not.toHaveBeenCalled();
    });
  });
});
