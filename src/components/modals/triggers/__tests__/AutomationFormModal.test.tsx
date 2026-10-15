import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AutomationFormModal from '../AutomationFormModal';
import type { Automation } from '../../../../service/clientService';

const createMutateAsync = vi.fn();
const updateMutateAsync = vi.fn();
const runMutateAsync = vi.fn();
const validateMutateAsync = vi.fn();

vi.mock('../../../../hooks/useApi', () => ({
  useCreateAutomation: () => ({ mutateAsync: createMutateAsync, isPending: false }),
  useUpdateAutomation: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
  useRunAutomation: () => ({ mutateAsync: runMutateAsync, isPending: false }),
  useValidateAutomation: () => ({ mutateAsync: validateMutateAsync, isPending: false }),
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

// Clicks Validate and waits for it to pass; Save and Run need a validated query
const validate = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Validate' }));
  await screen.findByText(/^Valid: Postgres accepts this query/);
};

// Run shows only after Validate passes; returns the Run button
const validateFirst = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Validate' }));
  return screen.findByRole('button', { name: 'Run' });
};

describe('AutomationFormModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    createMutateAsync.mockResolvedValue({});
    updateMutateAsync.mockResolvedValue({});
    runMutateAsync.mockResolvedValue({});
    validateMutateAsync.mockResolvedValue({ data: { valid: true } });
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

    it('keeps Save disabled until there is a query, then reports what is missing when it is clicked', async () => {
      render(<AutomationFormModal type="trigger" table={table} onClose={onClose} />);
      const save = screen.getByRole('button', { name: 'Save' });
      expect(save).toBeDisabled();

      typeQuery('Trigger query', TRIGGER_QUERY);
      expect(save).toBeEnabled();

      // No title: the field is highlighted in red
      await userEvent.click(save);
      expect(screen.getByLabelText(/Title/)).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getAllByText('Title is required').length).toBeGreaterThan(0);

      // Typing a title clears the highlight
      await userEvent.type(screen.getByLabelText(/Title/), 'Log salary');
      expect(screen.getByLabelText(/Title/)).toHaveAttribute('aria-invalid', 'false');

      // Filled, but the query has not passed Validate yet
      await userEvent.click(save);
      expect(screen.getByText('Validate the query first')).toBeInTheDocument();
      expect(createMutateAsync).not.toHaveBeenCalled();

      await validate();
      await userEvent.click(save);
      await waitFor(() => expect(createMutateAsync).toHaveBeenCalled());
    });

    it('rejects a title already used by another entry of the same type', async () => {
      render(<AutomationFormModal type="trigger" table={table} existingTitles={['Audit']} onClose={onClose} />);
      await userEvent.type(screen.getByLabelText(/Title/), ' audit ');
      typeQuery('Trigger query', TRIGGER_QUERY);
      await validate();
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(screen.getByLabelText(/Title/)).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getAllByText('This title is already used. Enter a unique title.').length).toBeGreaterThan(0);
      expect(createMutateAsync).not.toHaveBeenCalled();
    });

    it('highlights the title when the server says it already exists', async () => {
      createMutateAsync.mockRejectedValueOnce(new Error('Title already exists'));
      render(<AutomationFormModal type="trigger" table={table} onClose={onClose} />);
      await userEvent.type(screen.getByLabelText(/Title/), 'Log salary');
      typeQuery('Trigger query', TRIGGER_QUERY);
      await validate();
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(screen.getByLabelText(/Title/)).toHaveAttribute('aria-invalid', 'true'));
      expect(onClose).not.toHaveBeenCalled();
    });

    it('creates the trigger with the chosen timing and events written into the query', async () => {
      render(<AutomationFormModal type="trigger" table={table} onClose={onClose} />);
      await userEvent.type(screen.getByLabelText(/Title/), '  Log salary ');
      typeQuery('Trigger query', TRIGGER_QUERY);

      await userEvent.click(screen.getByRole('button', { name: 'BEFORE' }));
      await userEvent.click(screen.getByRole('checkbox', { name: 'UPDATE' }));
      expect(screen.getByText(/Saved as: BEFORE INSERT, BEFORE UPDATE/)).toBeInTheDocument();

      await validate();
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

    it('sets the timing and events from a pasted query', async () => {
      render(<AutomationFormModal type="trigger" table={table} onClose={onClose} />);
      expect(screen.getByText(/Saved as: AFTER INSERT/)).toBeInTheDocument();

      typeQuery('Trigger query', TRIGGER_QUERY.replace('AFTER INSERT', 'BEFORE DELETE'));

      expect(screen.getByText(/Saved as: BEFORE DELETE/)).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: 'DELETE' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'INSERT' })).not.toBeChecked();
      expect(screen.getByRole('button', { name: 'BEFORE' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('asks for an event when none is ticked', async () => {
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
      await validate();
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
      await validate();
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
      // Changed, but not validated yet
      await userEvent.click(save);
      expect(screen.getByText('Validate the query first')).toBeInTheDocument();
      expect(updateMutateAsync).not.toHaveBeenCalled();
      await validate();
      expect(save).toBeEnabled();
    });

    it('does not count the trailing ; the server removes as an unsaved change', async () => {
      render(<AutomationFormModal type="trigger" table={table} item={savedTrigger} onClose={onClose} />);
      const query = screen.getByLabelText('Trigger query');
      await userEvent.type(query, ';');
      await validate();
      // Same query as saved apart from the ;, so Run is offered and enabled
      expect(screen.getByRole('button', { name: 'Run' })).toBeEnabled();
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
      await validate();
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(updateMutateAsync).toHaveBeenCalledWith({
        id: 'a1', tableId: 't1', title: 'Audit salary', context: TRIGGER_QUERY, event: 'AFTER INSERT',
      }));
      expect(screen.getByText('Saved. Click Run to apply it in Postgres.')).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('disables Run while there are unsaved changes', async () => {
      render(<AutomationFormModal type="trigger" table={table} item={savedTrigger} onClose={onClose} />);
      const run = await validateFirst();
      expect(run).toBeEnabled();
      await userEvent.type(screen.getByLabelText(/Title/), '!');
      expect(run).toBeDisabled();
      expect(run).toHaveAttribute('title', 'Save first: Run applies the saved query');
    });

    it('runs the saved query and closes', async () => {
      render(<AutomationFormModal type="trigger" table={table} item={savedTrigger} onClose={onClose} />);
      await userEvent.click(await validateFirst());
      await waitFor(() => expect(runMutateAsync).toHaveBeenCalledWith({ id: 'a1', tableId: 't1' }));
      expect(onClose).toHaveBeenCalled();
    });

    it('shows the error when running fails', async () => {
      runMutateAsync.mockRejectedValue(new Error('function log_fn() does not exist'));
      render(<AutomationFormModal type="trigger" table={table} item={savedTrigger} onClose={onClose} />);
      await userEvent.click(await validateFirst());
      expect(await screen.findByText('function log_fn() does not exist')).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('has no Run button for a webhook', () => {
      const webhook: Automation = { id: 'w1', model_id: 't1', type: 'webhook', title: 'Notify', context: '{"url":"x"}' };
      render(<AutomationFormModal type="webhook" table={table} item={webhook} onClose={onClose} />);
      expect(screen.queryByRole('button', { name: 'Run' })).not.toBeInTheDocument();
    });
  });

  describe('validating', () => {
    it('shows Validate first, then Run in its place once the query passes', async () => {
      render(<AutomationFormModal type="trigger" table={table} item={savedTrigger} onClose={onClose} />);
      expect(screen.queryByRole('button', { name: 'Run' })).not.toBeInTheDocument();

      await validateFirst();
      expect(screen.getByText('Valid: Postgres accepts this query. You can run it now.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Validate' })).not.toBeInTheDocument();
    });

    it('keeps Validate for a new entry, which has nothing to run', async () => {
      render(<AutomationFormModal type="trigger" table={table} onClose={onClose} />);
      typeQuery('Trigger query', TRIGGER_QUERY);
      await userEvent.click(screen.getByRole('button', { name: 'Validate' }));
      expect(await screen.findByText('Valid: Postgres accepts this query.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Validate' })).toBeInTheDocument();
    });

    it('hides Run again when the query or events change after validating', async () => {
      render(<AutomationFormModal type="trigger" table={table} item={savedTrigger} onClose={onClose} />);
      await validateFirst();

      await userEvent.click(screen.getByRole('checkbox', { name: 'UPDATE' }));
      expect(screen.queryByRole('button', { name: 'Run' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Validate' })).toBeInTheDocument();

      await userEvent.click(screen.getByRole('checkbox', { name: 'UPDATE' }));
      expect(screen.getByRole('button', { name: 'Run' })).toBeInTheDocument();

      typeQuery('Trigger query', TRIGGER_QUERY.replace('log_fn', 'other_fn'));
      expect(screen.queryByRole('button', { name: 'Run' })).not.toBeInTheDocument();
    });

    it('keeps Run hidden when the query is not valid', async () => {
      validateMutateAsync.mockResolvedValue({ data: { valid: false, message: 'syntax error' } });
      render(<AutomationFormModal type="trigger" table={table} item={savedTrigger} onClose={onClose} />);
      await userEvent.click(screen.getByRole('button', { name: 'Validate' }));
      expect(await screen.findByText('syntax error')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Run' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    it('asks to run after saving a validated change', async () => {
      render(<AutomationFormModal type="trigger" table={table} item={savedTrigger} onClose={onClose} />);
      await userEvent.type(screen.getByLabelText(/Title/), '!');
      await validateFirst();
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(await screen.findByText('Saved. Click Run to apply it in Postgres.')).toBeInTheDocument();
    });

    it('validates a new trigger as typed, with the chosen events', async () => {
      render(<AutomationFormModal type="trigger" table={table} onClose={onClose} />);
      const validate = screen.getByRole('button', { name: 'Validate' });
      expect(validate).toBeDisabled();

      typeQuery('Trigger query', TRIGGER_QUERY);
      await userEvent.click(validate);

      await waitFor(() => expect(validateMutateAsync).toHaveBeenCalledWith({
        model_id: 't1', id: undefined, type: 'trigger', context: TRIGGER_QUERY, event: 'AFTER INSERT',
      }));
      expect(await screen.findByText('Valid: Postgres accepts this query.')).toBeInTheDocument();
      // Nothing is saved or run
      expect(createMutateAsync).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('validates unsaved changes of an existing entry by its id', async () => {
      render(<AutomationFormModal type="function" table={table} item={{ ...savedTrigger, type: 'function', context: FUNCTION_QUERY, event: '' }} onClose={onClose} />);
      const edited = FUNCTION_QUERY.replace('RETURN NEW', 'RETURN OLD');
      typeQuery('Function query', edited);
      await userEvent.click(screen.getByRole('button', { name: 'Validate' }));

      await waitFor(() => expect(validateMutateAsync).toHaveBeenCalledWith({
        model_id: 't1', id: 'a1', type: 'function', context: edited, event: '',
      }));
      expect(updateMutateAsync).not.toHaveBeenCalled();
    });

    it("shows Postgres' reason when the query is not valid", async () => {
      validateMutateAsync.mockResolvedValue({ data: { valid: false, message: 'function log_fn() does not exist' } });
      render(<AutomationFormModal type="trigger" table={table} item={savedTrigger} onClose={onClose} />);
      await userEvent.click(screen.getByRole('button', { name: 'Validate' }));
      expect(await screen.findByText('function log_fn() does not exist')).toBeInTheDocument();
    });

    it('shows the error when the query has the wrong format', async () => {
      validateMutateAsync.mockRejectedValue(new Error('Invalid trigger query'));
      render(<AutomationFormModal type="trigger" table={table} item={savedTrigger} onClose={onClose} />);
      await userEvent.click(screen.getByRole('button', { name: 'Validate' }));
      expect(await screen.findByText('Invalid trigger query')).toBeInTheDocument();
    });

    it('has no Validate button for a webhook', () => {
      const webhook: Automation = { id: 'w1', model_id: 't1', type: 'webhook', title: 'Notify', context: '{"url":"x"}' };
      render(<AutomationFormModal type="webhook" table={table} item={webhook} onClose={onClose} />);
      expect(screen.queryByRole('button', { name: 'Validate' })).not.toBeInTheDocument();
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
