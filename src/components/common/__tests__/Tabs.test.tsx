import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import Tabs from '../Tabs';

describe('Tabs', () => {
  it('renders all tab labels and counts', () => {
    render(
      <Tabs
        tabs={[
          { key: 'a', label: 'Alpha', count: 2 },
          { key: 'b', label: 'Beta' },
        ]}
        activeKey="a"
        onChange={() => undefined}
      />
    );

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls onChange when a tab is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Tabs
        tabs={[
          { key: 'a', label: 'Alpha' },
          { key: 'b', label: 'Beta' },
        ]}
        activeKey="a"
        onChange={onChange}
      />
    );

    await user.click(screen.getByText('Beta'));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('renders optional icon when provided', () => {
    render(
      <Tabs
        tabs={[{ key: 'a', label: 'Alpha', icon: <span>★</span> }]}
        activeKey="a"
        onChange={() => undefined}
      />
    );

    expect(screen.getByText('★')).toBeInTheDocument();
  });
});
