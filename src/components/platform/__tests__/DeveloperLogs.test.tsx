// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import DeveloperLogs, { DeveloperLogs as NamedDeveloperLogs } from '../DeveloperLogs';

// Rows in the table body (header row excluded)
const bodyRows = () => screen.getAllByRole('row').slice(1);

describe('DeveloperLogs', () => {
  it('exports the same component as default and named export', () => {
    expect(DeveloperLogs).toBe(NamedDeveloperLogs);
  });

  it('renders the heading, description and sample data badge', () => {
    render(<DeveloperLogs />);

    expect(screen.getByRole('heading', { name: 'Logs' })).toBeInTheDocument();
    expect(screen.getByText('Every request, and the rule that allowed or blocked it.')).toBeInTheDocument();
    expect(screen.getByText('Sample data')).toBeInTheDocument();
  });

  it('renders the table headers', () => {
    render(<DeveloperLogs />);

    ['Time', 'Caller', 'Request', 'Result', 'Why'].forEach((name) => {
      expect(screen.getByRole('columnheader', { name })).toBeInTheDocument();
    });
  });

  it('lists every sample request by default', () => {
    render(<DeveloperLogs />);

    expect(bodyRows()).toHaveLength(8);
    // Two sample requests hit GET /orders (one allowed, one denied)
    expect(screen.getAllByText('GET /orders')).toHaveLength(2);
    expect(screen.getByText('DELETE /orders/1077')).toBeInTheDocument();
    expect(screen.getByText('Customer › Orders › Read › Own rows')).toBeInTheDocument();
  });

  it('marks requests as allowed or denied', () => {
    render(<DeveloperLogs />);

    expect(screen.getAllByText('Allowed')).toHaveLength(5);
    expect(screen.getAllByText('Denied')).toHaveLength(3);
  });

  it('starts with "All requests" selected', () => {
    render(<DeveloperLogs />);

    expect(screen.getByRole('button', { name: 'All requests' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Denied only' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows only denied requests when "Denied only" is chosen, and restores on "All requests"', () => {
    render(<DeveloperLogs />);

    fireEvent.click(screen.getByRole('button', { name: 'Denied only' }));

    expect(screen.getByRole('button', { name: 'Denied only' })).toHaveAttribute('aria-pressed', 'true');
    expect(bodyRows()).toHaveLength(3);
    expect(screen.queryByText('Allowed')).not.toBeInTheDocument();
    expect(screen.getByText('No rule for Anonymous on Orders')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'All requests' }));
    expect(bodyRows()).toHaveLength(8);
  });

  it('offers each distinct caller once in the "Key or user" filter', () => {
    render(<DeveloperLogs />);

    const select = screen.getByLabelText('Key or user');
    const options = within(select).getAllByRole('option').map((o) => o.textContent);

    // "Not logged in" appears twice in the data but only once as an option
    expect(options).toEqual([
      'Everything',
      'aisha@example.com',
      'Not logged in',
      'rohan@example.com',
      'Reporting script',
      'CI import job',
      'Old webhook',
      'priya@example.com',
    ]);
  });

  it('filters by caller', () => {
    render(<DeveloperLogs />);

    fireEvent.change(screen.getByLabelText('Key or user'), { target: { value: 'Not logged in' } });

    expect(bodyRows()).toHaveLength(2);
    expect(screen.getByText('GET /products')).toBeInTheDocument();
    expect(screen.queryByText('DELETE /orders/1077')).not.toBeInTheDocument();
  });

  it('combines the caller filter with "Denied only"', () => {
    render(<DeveloperLogs />);

    fireEvent.change(screen.getByLabelText('Key or user'), { target: { value: 'Not logged in' } });
    fireEvent.click(screen.getByRole('button', { name: 'Denied only' }));

    expect(bodyRows()).toHaveLength(1);
    expect(screen.getByText('No rule for Anonymous on Orders')).toBeInTheDocument();
  });

  it('shows an empty state when no request matches', () => {
    render(<DeveloperLogs />);

    // The Reporting script only has an allowed request
    fireEvent.change(screen.getByLabelText('Key or user'), { target: { value: 'Reporting script' } });
    fireEvent.click(screen.getByRole('button', { name: 'Denied only' }));

    expect(screen.getByText('No requests match these filters.')).toBeInTheDocument();
    expect(screen.queryByText('Allowed')).not.toBeInTheDocument();
  });

  it('offers the time ranges and starts on "Last hour"', () => {
    render(<DeveloperLogs />);

    const select = screen.getByLabelText('Time') as HTMLSelectElement;
    expect(select.value).toBe('Last hour');
    expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Last hour',
      'Last 24 hours',
      'Last 7 days',
      'Last 30 days',
    ]);

    fireEvent.change(select, { target: { value: 'Last 7 days' } });
    expect(select.value).toBe('Last 7 days');
  });

  it('shows usage by key with formatted counts', () => {
    render(<DeveloperLogs />);

    expect(screen.getByRole('heading', { name: 'Usage by key, last 7 days' })).toBeInTheDocument();
    expect(screen.getByText('Public key')).toBeInTheDocument();
    expect(screen.getByText('48,210')).toBeInTheDocument();
    expect(screen.getByText('6,940')).toBeInTheDocument();
    expect(screen.getByText('1,305')).toBeInTheDocument();
  });

  it('scales the usage bars against the busiest key', () => {
    const { container } = render(<DeveloperLogs />);

    const widths = Array.from(container.querySelectorAll<HTMLElement>('.bg-green-700')).map((el) => el.style.width);

    expect(widths[0]).toBe('100%');
    expect(parseFloat(widths[1])).toBeCloseTo((6940 / 48210) * 100, 5);
    expect(parseFloat(widths[2])).toBeCloseTo((1305 / 48210) * 100, 5);
  });

  it('styles callers by kind', () => {
    render(<DeveloperLogs />);

    const rows = bodyRows();
    const callerCell = (row: HTMLElement) => within(row).getAllByRole('cell')[1];

    expect(callerCell(rows[0])).toHaveClass('text-brand-700'); // user
    expect(callerCell(rows[1])).toHaveClass('text-primary'); // anonymous
    expect(callerCell(rows[4])).toHaveClass('text-orange-700'); // key
  });
});
