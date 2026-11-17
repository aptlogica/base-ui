import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import ApiDocsPage from '../ApiDocsPage';
import { useApplication } from '../../components/platform/useApplications';
import { ENDPOINT_GROUPS } from '../../components/platform/docs/apiDocsContent';

vi.mock('../../components/platform/useApplications', () => ({ useApplication: vi.fn() }));
vi.mock('../../service/clientService', () => ({ getApiOrigin: () => 'https://api.example.com' }));

const useApplicationMock = vi.mocked(useApplication);

const mockStatus = (data: unknown) => {
  useApplicationMock.mockReturnValue({ data, isLoading: false, error: null } as any);
};

const Where = () => <div data-testid="where">{useLocation().pathname}</div>;

const renderPage = (path = '/workspace/ws-1/applications/app-1/api-docs') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/workspace/:workspaceId/applications/:applicationId/api-docs" element={<ApiDocsPage />} />
        <Route path="/workspace/:workspaceId/developer/api-docs" element={<ApiDocsPage />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>
  );

const ENABLED = {
  id: 'app-1', workspace_id: 'ws-1', name: 'Portal', enabled: true, public_id: 'app_ab12cd34ef',
  base_path: '/api/v1/app_ab12cd34ef', bases: [{ id: 'b1', title: 'CRM' }],
};
const DISABLED = { ...ENABLED, enabled: false };
const BASE = 'https://api.example.com/api/v1/app_ab12cd34ef';
const SAMPLE = 'https://api.example.com/api/v1/app_8f3k2m9qx7';

const menu = () => screen.getByRole('navigation', { name: 'Docs sections' });
const openPage = (label: string) => fireEvent.click(within(menu()).getByRole('button', { name: label }));

// The text of every code panel; highlighting splits lines into spans, so panels are read as a whole
const codePanels = () => Array.from(document.querySelectorAll('pre code')).map((el) => el.textContent ?? '');

describe('ApiDocsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the application's base URL in the examples while its API is on", () => {
    mockStatus(ENABLED);
    renderPage();

    expect(useApplicationMock).toHaveBeenCalledWith('ws-1', 'app-1');
    // In the header and on the Introduction page
    expect(screen.getAllByText(BASE).length).toBeGreaterThanOrEqual(1);
    expect(codePanels()).toContain(BASE);
    expect(screen.getByText(/This is the address of Portal/)).toBeInTheDocument();

    openPage('List bases');
    expect(codePanels()).toContain(`curl "${BASE}/bases"`);
  });

  it("uses a sample address when the application's API is off", () => {
    mockStatus(DISABLED);
    renderPage();

    expect(codePanels()).toContain(SAMPLE);
    expect(screen.getByText(/No application with its API on is chosen/)).toBeInTheDocument();
  });

  it('uses a sample address on the docs page without an application', () => {
    mockStatus(undefined);
    renderPage('/workspace/ws-1/developer/api-docs');

    expect(useApplicationMock).toHaveBeenCalledWith('ws-1', undefined);
    expect(codePanels()).toContain(SAMPLE);
  });

  it("explains the live docs and links to the application's pages while its API is on", () => {
    mockStatus(ENABLED);
    renderPage();
    openPage('Live docs');

    expect(screen.getByRole('heading', { name: 'Live docs', level: 2 })).toBeInTheDocument();
    expect(screen.getByText(`${BASE}/openapi.json`)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open Swagger UI/ })).toHaveAttribute('href', `${BASE}/docs`);
    expect(screen.getByRole('link', { name: /Open ReDoc/ })).toHaveAttribute('href', `${BASE}/redoc`);
  });

  it('shows sample live docs addresses without links when the API is off', () => {
    mockStatus(DISABLED);
    renderPage();
    openPage('Live docs');

    expect(screen.getByText(`${SAMPLE}/docs`)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Open Swagger UI/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Open the docs from an application with its API on/)).toBeInTheDocument();
  });

  it('has a page for every endpoint, and lists them all on the Introduction', () => {
    mockStatus(ENABLED);
    renderPage();

    const summary = screen.getByRole('heading', { name: 'Endpoints' }).parentElement as HTMLElement;
    // A header row and one row per endpoint
    expect(within(summary).getAllByRole('row')).toHaveLength(15);

    for (const endpoint of ENDPOINT_GROUPS.flatMap((g) => g.endpoints)) {
      openPage(endpoint.title);
      expect(screen.getByRole('heading', { name: endpoint.title, level: 2 })).toBeInTheDocument();
      expect(screen.getByText(endpoint.summary)).toBeInTheDocument();
    }
    for (const page of ['Field values', 'Safe retries', 'Errors', 'Limits']) {
      openPage(page);
      expect(screen.getByRole('heading', { name: page, level: 2 })).toBeInTheDocument();
    }
  });

  it('switches the examples between cURL and JavaScript', () => {
    mockStatus(ENABLED);
    renderPage();
    openPage('List bases');

    expect(screen.getByRole('button', { name: 'cURL' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'JavaScript' }));

    expect(screen.getByRole('button', { name: 'JavaScript' })).toHaveAttribute('aria-pressed', 'true');
    expect(codePanels().some((code) => code.startsWith(`const res = await fetch("${BASE}/bases")`))).toBe(true);
    expect(codePanels().some((code) => code.startsWith('curl'))).toBe(false);

    // The language stays picked on other pages
    openPage('List tables');
    expect(screen.getByRole('button', { name: 'JavaScript' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows the scenario picked in the examples', () => {
    mockStatus(ENABLED);
    renderPage();
    openPage('List bases');

    const examples = screen.getByRole('group', { name: 'Examples' });
    const wrongWorkspace = within(examples).getByRole('button', { name: /Wrong application ID/ });
    expect(wrongWorkspace).toHaveAttribute('aria-pressed', 'false');
    expect(codePanels().some((code) => code.startsWith('HTTP/1.1 200 OK'))).toBe(true);

    fireEvent.click(wrongWorkspace);

    expect(wrongWorkspace).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/Every endpoint answers this way/)).toBeInTheDocument();
    expect(codePanels().some((code) => code.startsWith('HTTP/1.1 404 Not Found'))).toBe(true);
  });

  it('marks the page picked in the menu', () => {
    mockStatus(ENABLED);
    renderPage();

    openPage('Create records');

    expect(within(menu()).getByRole('button', { name: 'Create records' })).toHaveAttribute('aria-current', 'page');
    expect(within(menu()).getByRole('button', { name: 'Introduction' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('heading', { name: 'Create records', level: 2 })).toBeInTheDocument();
  });

  it('filters the menu with the search box', () => {
    mockStatus(ENABLED);
    renderPage();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search the docs' }), { target: { value: 'delete' } });

    expect(within(menu()).getByRole('button', { name: 'Delete records' })).toBeInTheDocument();
    expect(within(menu()).queryByRole('button', { name: 'List bases' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search the docs' }), { target: { value: 'nothing like this' } });
    expect(screen.getByText(/No pages match/)).toBeInTheDocument();
  });

  it('moves to the next and previous page', () => {
    mockStatus(ENABLED);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Next\s*Live docs/ }));
    expect(screen.getByRole('heading', { name: 'Live docs', level: 2 })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Previous\s*Introduction/ }));
    expect(screen.getByRole('heading', { name: 'Introduction', level: 2 })).toBeInTheDocument();
  });

  it('goes back to the workspace', () => {
    mockStatus(ENABLED);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Back to workspace' }));

    expect(screen.getByTestId('where')).toHaveTextContent('/workspace/ws-1');
  });
});
