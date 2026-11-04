import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import ApiDocsPage from '../ApiDocsPage';
import { useWorkspaceApi } from '../../components/platform/useWorkspaceApi';

vi.mock('../../components/platform/useWorkspaceApi', () => ({ useWorkspaceApi: vi.fn() }));
vi.mock('../../service/clientService', () => ({ getApiOrigin: () => 'https://api.example.com' }));

const useWorkspaceApiMock = vi.mocked(useWorkspaceApi);

const mockStatus = (data: unknown) => {
  useWorkspaceApiMock.mockReturnValue({ data, isLoading: false, error: null } as any);
};

const Where = () => <div data-testid="where">{useLocation().pathname}</div>;

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/workspace/ws-1/developer/api-docs']}>
      <Routes>
        <Route path="/workspace/:workspaceId/developer/api-docs" element={<ApiDocsPage />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>
  );

const ENABLED = { workspace_id: 'ws-1', enabled: true, public_id: 'ws_ab12cd34ef', base_path: '/api/v1/ws_ab12cd34ef' };

describe('ApiDocsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the workspace base URL in the examples once the API is on', () => {
    mockStatus(ENABLED);
    renderPage();

    expect(useWorkspaceApiMock).toHaveBeenCalledWith('ws-1');
    expect(screen.getByText('https://api.example.com/api/v1/ws_ab12cd34ef')).toBeInTheDocument();
    expect(screen.getByText(/This is your workspace's address/)).toBeInTheDocument();
    // List bases has a success and an error example for the same request
    expect(screen.getAllByText('curl "https://api.example.com/api/v1/ws_ab12cd34ef/bases"')).toHaveLength(2);
  });

  it('uses a sample address and says how to turn the API on when it is off', () => {
    mockStatus({ workspace_id: 'ws-1', enabled: false });
    renderPage();

    expect(screen.getByText('https://api.example.com/api/v1/ws_8f3k2m9qx7')).toBeInTheDocument();
    expect(screen.getByText(/The API is not turned on for this workspace yet/)).toBeInTheDocument();
  });

  it('explains the live docs and links to the workspace pages once the API is on', () => {
    mockStatus(ENABLED);
    renderPage();

    expect(screen.getByRole('heading', { name: 'Live docs', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('https://api.example.com/api/v1/ws_ab12cd34ef/openapi.json')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open Swagger UI/ })).toHaveAttribute('href', 'https://api.example.com/api/v1/ws_ab12cd34ef/docs');
    expect(screen.getByRole('link', { name: /Open ReDoc/ })).toHaveAttribute('href', 'https://api.example.com/api/v1/ws_ab12cd34ef/redoc');
  });

  it('shows sample live docs addresses without links when the API is off', () => {
    mockStatus({ workspace_id: 'ws-1', enabled: false });
    renderPage();

    expect(screen.getByText('https://api.example.com/api/v1/ws_8f3k2m9qx7/docs')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Open Swagger UI/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Turn the API on to open your workspace's live docs/)).toBeInTheDocument();
  });

  it('documents every supported endpoint', () => {
    mockStatus(ENABLED);
    renderPage();

    for (const title of ['List bases', 'List tables', 'Get a table and its fields', 'List records', 'Get a record', 'Create records', 'Update records', 'Delete records']) {
      expect(screen.getByRole('heading', { name: title, level: 3 })).toBeInTheDocument();
    }
    const summary = screen.getByRole('heading', { name: 'Endpoints' }).parentElement as HTMLElement;
    expect(within(summary).getAllByRole('row')).toHaveLength(11);
    expect(screen.getByRole('heading', { name: 'Field values' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Errors' })).toBeInTheDocument();
  });

  it('switches the examples between cURL and JavaScript', () => {
    mockStatus(ENABLED);
    renderPage();

    expect(screen.getByRole('button', { name: 'cURL' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'JavaScript' }));

    expect(screen.getByRole('button', { name: 'JavaScript' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByText(/const res = await fetch\("https:\/\/api\.example\.com\/api\/v1\/ws_ab12cd34ef\/bases"\)/).length).toBeGreaterThan(0);
    expect(screen.queryAllByText('curl "https://api.example.com/api/v1/ws_ab12cd34ef/bases"')).toHaveLength(0);
  });

  it('marks the section picked in the menu', () => {
    mockStatus(ENABLED);
    renderPage();

    const menu = screen.getByRole('navigation', { name: 'Docs sections' });
    fireEvent.click(within(menu).getByRole('button', { name: 'Create records' }));

    expect(within(menu).getByRole('button', { name: 'Create records' })).toHaveAttribute('aria-current', 'location');
    expect(within(menu).getByRole('button', { name: 'Introduction' })).not.toHaveAttribute('aria-current');
  });

  it('goes back to the workspace', () => {
    mockStatus(ENABLED);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Back to workspace' }));

    expect(screen.getByTestId('where')).toHaveTextContent('/workspace/ws-1');
  });
});
