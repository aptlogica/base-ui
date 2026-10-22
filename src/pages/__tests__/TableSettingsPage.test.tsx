import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import TableSettingsPage from '../TableSettingsPage';
import { useTable } from '../../hooks/useApi';
import { updateClientWorkspaceAndBase } from '../../service/clientService';

const setWorkspace = vi.fn();
const setBase = vi.fn();
const setTable = vi.fn();

vi.mock('../../hooks/useApi', () => ({ useTable: vi.fn() }));
vi.mock('../../service/clientService', () => ({ updateClientWorkspaceAndBase: vi.fn() }));
vi.mock('../../stores/navigationStore', () => ({
  useNavigationStore: { getState: () => ({ setWorkspace, setBase, setTable }) },
}));
vi.mock('../../components/ui/Loader', () => ({ Loader: () => <div>loading</div> }));
vi.mock('../../components/modals/tableSettings/PrimaryKeyPanel', () => ({ default: ({ table }: any) => <div>primary panel {table.id}</div> }));
vi.mock('../../components/modals/constraints/UniqueKeysPanel', () => ({ default: () => <div>unique panel</div> }));
vi.mock('../../components/modals/constraints/CheckConstraintsPanel', () => ({ default: () => <div>check panel</div> }));
vi.mock('../../components/modals/TableTriggersModal', () => ({ default: ({ view }: any) => <div>triggers panel {view}</div> }));

const Where = () => <div data-testid="where">{useLocation().pathname}</div>;

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/workspace/:workspaceId/base/:baseId/table/:tableId/settings/:section?" element={<TableSettingsPage />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );

const BASE = '/workspace/w1/base/b1/table/t1';
const detail = (extra: object = {}) => ({ data: { model: { id: 't1', base_id: 'b1', title: 'Employee' }, views: [{ id: 'v1' }], ...extra } });

describe('TableSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTable).mockReturnValue({ data: detail(), isLoading: false } as any);
  });

  it('sets the workspace, base and table, then loads the table', () => {
    renderAt(`${BASE}/settings/primaryKey`);

    expect(updateClientWorkspaceAndBase).toHaveBeenCalledWith('w1', 'b1');
    expect(setWorkspace).toHaveBeenCalledWith('w1');
    expect(setBase).toHaveBeenCalledWith('b1');
    expect(setTable).toHaveBeenCalledWith('t1');
    expect(useTable).toHaveBeenLastCalledWith('t1');
    expect(screen.getByText('Employee - Settings')).toBeInTheDocument();
  });

  it('shows the loader while the table loads', () => {
    vi.mocked(useTable).mockReturnValue({ data: undefined, isLoading: true } as any);
    renderAt(`${BASE}/settings/primaryKey`);

    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('says so when the table is not found', () => {
    vi.mocked(useTable).mockReturnValue({ data: undefined, isLoading: false } as any);
    renderAt(`${BASE}/settings/primaryKey`);

    expect(screen.getByText('Table not found')).toBeInTheDocument();
  });

  it('falls back to the URL ids when the detail has no model, and to the name for the title', () => {
    vi.mocked(useTable).mockReturnValue({ data: { data: { name: 'Fallback' } }, isLoading: false } as any);
    renderAt(`${BASE}/settings/primaryKey`);

    expect(screen.getByText('Fallback - Settings')).toBeInTheDocument();
    expect(screen.getByText('primary panel t1')).toBeInTheDocument();
  });

  it.each([
    ['primaryKey', 'primary panel t1'],
    ['uniqueKey', 'unique panel'],
    ['checkConstraints', 'check panel'],
    ['triggers', 'triggers panel triggers'],
  ])('shows the %s section', (section, text) => {
    renderAt(`${BASE}/settings/${section}`);

    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it.each(['nonsense', 'webhooks'])('shows the primary key for the unknown or hidden section %s', (section) => {
    renderAt(`${BASE}/settings/${section}`);

    expect(screen.getByText('primary panel t1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Primary Key/ })).toHaveAttribute('aria-current', 'page');
  });

  it('opens a section from the left menu', async () => {
    renderAt(`${BASE}/settings/primaryKey`);

    await userEvent.click(screen.getByRole('button', { name: /Check Constraints/ }));

    expect(screen.getByText('check panel')).toBeInTheDocument();
  });

  it('goes back to the first view of the table', async () => {
    renderAt(`${BASE}/settings/primaryKey`);

    await userEvent.click(screen.getByRole('button', { name: 'Back to table' }));

    expect(screen.getByTestId('where')).toHaveTextContent(`${BASE}/v1`);
  });

  it('goes back to the workspace when the table has no view', async () => {
    vi.mocked(useTable).mockReturnValue({ data: detail({ views: [] }), isLoading: false } as any);
    renderAt(`${BASE}/settings/primaryKey`);

    await userEvent.click(screen.getByRole('button', { name: 'Back to table' }));

    expect(screen.getByTestId('where')).toHaveTextContent('/workspace/w1');
  });
});
