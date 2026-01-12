import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import {
  COMPONENT_IDS,
  RouteContextProvider,
  useComponentVisibility,
  useRouteContext,
} from '../RouteContext';

function Consumer() {
  const { routeType, pathname, params } = useRouteContext();
  const showAdminSettings = useComponentVisibility(
    COMPONENT_IDS.ADMINISTRATOR_SETTINGS_BUTTON
  );

  return (
    <div>
      <div data-testid="routeType">{routeType}</div>
      <div data-testid="pathname">{pathname}</div>
      <div data-testid="params">{JSON.stringify(params)}</div>
      <div data-testid="adminSettingsVisible">
        {String(showAdminSettings)}
      </div>
    </div>
  );
}

describe('RouteContext', () => {
  it('throws if used outside provider', () => {
    expect(() => render(<Consumer />)).toThrow(
      'useRouteContext must be used within RouteContextProvider'
    );
  });

  it('classifies homepage routes and extracts workspaceId for /workspace/:workspaceId', () => {
    render(
      <MemoryRouter initialEntries={['/workspace/abc123']}>
        <RouteContextProvider>
          <Consumer />
        </RouteContextProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('routeType')).toHaveTextContent('homepage');
    expect(screen.getByTestId('pathname')).toHaveTextContent('/workspace/abc123');
    expect(screen.getByTestId('params')).toHaveTextContent(
      JSON.stringify({ workspaceId: 'abc123' })
    );

    // On homepage routes, admin settings button is visible by rule
    expect(screen.getByTestId('adminSettingsVisible')).toHaveTextContent('true');
  });

  it('classifies administrator routes and makes workspace settings button visible there', () => {
    render(
      <MemoryRouter initialEntries={['/workspace/abc123/administrator']}>
        <RouteContextProvider>
          <Consumer />
        </RouteContextProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('routeType')).toHaveTextContent('administrator');
    expect(screen.getByTestId('params')).toHaveTextContent(
      JSON.stringify({ workspaceId: 'abc123' })
    );
    expect(screen.getByTestId('adminSettingsVisible')).toHaveTextContent('true');
  });

  it('classifies view routes and extracts baseId/tableId/viewId', () => {
    render(
      <MemoryRouter initialEntries={['/workspace/w1/base/b1/table/t1/v1']}>
        <RouteContextProvider>
          <Consumer />
        </RouteContextProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('routeType')).toHaveTextContent('view');
    expect(screen.getByTestId('params')).toHaveTextContent(
      JSON.stringify({ workspaceId: 'w1', baseId: 'b1', tableId: 't1', viewId: 'v1' })
    );

    // On view routes, admin settings button is hidden by rule
    expect(screen.getByTestId('adminSettingsVisible')).toHaveTextContent('false');
  });

  it('defaults to unknown route type for unmatched paths', () => {
    render(
      <MemoryRouter initialEntries={['/somewhere-else']}>
        <RouteContextProvider>
          <Consumer />
        </RouteContextProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('routeType')).toHaveTextContent('unknown');
    // Unknown route type has no explicit visibility rules; defaults to true
    expect(screen.getByTestId('adminSettingsVisible')).toHaveTextContent('true');
  });
});
