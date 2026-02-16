import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DateTime } from '../DateTime';

vi.mock('../../../../utils/dateUtils', () => ({
  zonedToUtcISO: (date: string, time: string) => `${date}T${time}:00Z`,
}));

describe('DateTime', () => {
  it('opens date dropdown and selects today', () => {
    const onChange = vi.fn();
    render(
      <DateTime
        value=""
        onChange={onChange}
        config={{ dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm', hourFormat: '24' }}
      />
    );

    const dateButton = screen.getByRole('button', { name: /yyyy-mm-dd/i });
    fireEvent.click(dateButton);
    fireEvent.click(screen.getByRole('button', { name: /today/i }));
    expect(onChange).toHaveBeenCalled();
  });

  it('opens time dropdown and selects now', () => {
    const onChange = vi.fn();
    render(
      <DateTime
        value=""
        onChange={onChange}
        config={{ dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm', hourFormat: '24' }}
      />
    );

    const timeButton = screen.getByRole('button', { name: /hh:mm/i });
    fireEvent.click(timeButton);
    fireEvent.click(screen.getByRole('button', { name: /now/i }));
    expect(onChange).toHaveBeenCalled();
  });

  it('renders helper text only when allowEdit is true', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DateTime
        value=""
        onChange={onChange}
        helperText="Pick date and time"
      />
    );
    expect(screen.getByText('Pick date and time')).toBeInTheDocument();

    rerender(
      <DateTime
        value=""
        onChange={onChange}
        helperText="Pick date and time"
        allowEdit={false}
      />
    );
    expect(screen.queryByText('Pick date and time')).not.toBeInTheDocument();
  });

  it('shows timezone indicator when displayTimeZone is enabled', () => {
    const onChange = vi.fn();
    render(
      <DateTime
        value=""
        onChange={onChange}
        config={{
          dateFormat: 'YYYY-MM-DD',
          timeFormat: 'HH:mm',
          hourFormat: '24',
          displayTimeZone: true,
          timeZone: 'UTC'
        }}
      />
    );

    expect(screen.getByText('UTC')).toBeInTheDocument();
  });

  it('does not open date/time dropdowns when readOnly is true', () => {
    const onChange = vi.fn();
    render(
      <DateTime
        value=""
        onChange={onChange}
        readOnly
        config={{ dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm', hourFormat: '24' }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /yyyy-mm-dd/i }));
    fireEvent.click(screen.getByRole('button', { name: /hh:mm/i }));

    expect(screen.queryByRole('button', { name: /today/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /now/i })).not.toBeInTheDocument();
  });

  it('renders value in configured display formats', () => {
    const onChange = vi.fn();
    render(
      <DateTime
        value="2026-02-13T18:45:00Z"
        onChange={onChange}
        config={{ dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm', hourFormat: '12', timeZone: 'UTC' }}
      />
    );

    expect(screen.getByRole('button', { name: /13\/02\/2026/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /6:45 PM/i })).toBeInTheDocument();
  });
});
