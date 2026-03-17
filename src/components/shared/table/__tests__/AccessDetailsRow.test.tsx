import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AccessDetailsRow } from '../AccessDetailsRow';

const baseProps = {
  colSpan: 3,
  isLoading: false,
  error: null,
  workspaces: [],
  errorText: 'Failed to load',
  emptyText: 'No access available',
  getRoleDisplayName: (access: string) => access || 'User',
};

describe('AccessDetailsRow', () => {
  it('renders loading state', () => {
    render(<table><tbody><AccessDetailsRow {...baseProps} isLoading /></tbody></table>);
    expect(screen.getByText('Loading access details...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<table><tbody><AccessDetailsRow {...baseProps} error={new Error('boom')} /></tbody></table>);
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<table><tbody><AccessDetailsRow {...baseProps} /></tbody></table>);
    expect(screen.getByText('No access available')).toBeInTheDocument();
  });

  it('renders workspaces without bases', () => {
    render(
      <table>
        <tbody>
          <AccessDetailsRow
            {...baseProps}
            workspaces={[
              { workspace_id: 'w1', workspace_name: 'Workspace A', access: 'owner', bases: [] },
            ]}
            getRoleDisplayName={() => 'Owner'}
          />
        </tbody>
      </table>
    );

    expect(screen.getByText('Workspace A')).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders workspace bases with roles', () => {
    render(
      <table>
        <tbody>
          <AccessDetailsRow
            {...baseProps}
            workspaces={[
              {
                workspace_id: 'w1',
                workspace_name: 'Workspace A',
                access: 'maintainer',
                bases: [
                  { base_id: 'b1', base_name: 'Base One', access: 'base-member' },
                  { base_id: 'b2', base_name: 'Base Two', access: 'base-read' },
                ],
              },
            ]}
            getRoleDisplayName={(access) => access}
          />
        </tbody>
      </table>
    );

    expect(screen.getByText('Workspace A')).toBeInTheDocument();
    expect(screen.getByText('Base One')).toBeInTheDocument();
    expect(screen.getByText('Base Two')).toBeInTheDocument();
    expect(screen.getByText('base-member')).toBeInTheDocument();
    expect(screen.getByText('base-read')).toBeInTheDocument();
  });
});
