import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ApplicationForm from '../ApplicationForm';

const create = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('../useApplications', () => ({
  useCreateApplication: () => ({ mutateAsync: create, isPending: false }),
}));

vi.mock('../../common/Toast', () => ({
  useToast: () => ({ success: toastSuccess, error: toastError }),
}));

vi.mock('../ApplicationBasePicker', () => ({
  default: ({ selected, onChange }: any) => (
    <div data-testid="picker">
      chosen:{selected.join(',')}
      <button type="button" onClick={() => onChange(['crm'])}>Pick CRM</button>
    </div>
  ),
}));

const renderForm = (props: Partial<React.ComponentProps<typeof ApplicationForm>> = {}) => {
  const onCreated = vi.fn();
  const onCancel = vi.fn();
  render(<ApplicationForm workspaceId="ws-1" workspaceName="Acme" onCreated={onCreated} onCancel={onCancel} {...props} />);
  return { onCreated, onCancel };
};

describe('ApplicationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('needs a name and a base before it can create', () => {
    renderForm();
    const submit = screen.getByRole('button', { name: 'Create application' });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Pick CRM' }));
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Portal' } });
    expect(submit).toBeEnabled();
  });

  it('creates with the trimmed name and the chosen bases', async () => {
    const created = { id: 'app-1', name: 'Portal' };
    create.mockResolvedValue({ data: created });
    const { onCreated } = renderForm();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '  Portal ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Pick CRM' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create application' }));

    await waitFor(() => expect(create).toHaveBeenCalledWith({ name: 'Portal', description: undefined, base_ids: ['crm'] }));
    expect(onCreated).toHaveBeenCalledWith(created);
    expect(toastSuccess).toHaveBeenCalled();
  });

  it('starts with the base it was opened for', () => {
    renderForm({ initialBaseIds: ['inv'] });
    expect(screen.getByTestId('picker')).toHaveTextContent('chosen:inv');
  });

  it('says why creating failed and stays open', async () => {
    create.mockRejectedValue(new Error('name taken'));
    const { onCreated } = renderForm({ initialBaseIds: ['crm'] });

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Portal' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create application' }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('cancels', () => {
    const { onCancel } = renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });
});
