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

  it('enters manual edit mode on double click when allowEdit is false', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateTime
        value=""
        onChange={onChange}
        allowEdit={false}
        config={{ dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm', hourFormat: '24' }}
      />
    );

    fireEvent.doubleClick(container.firstChild as HTMLElement);
    expect(screen.getByPlaceholderText('YYYY-MM-DD HH:mm')).toBeInTheDocument();
  });

  it('does not enter manual edit mode when readOnly is true', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateTime
        value=""
        onChange={onChange}
        allowEdit={false}
        readOnly
        config={{ dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm', hourFormat: '24' }}
      />
    );

    fireEvent.doubleClick(container.firstChild as HTMLElement);
    expect(screen.queryByPlaceholderText('YYYY-MM-DD HH:mm')).not.toBeInTheDocument();
  });

  it('accepts manual date-time input and calls onChange on blur', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateTime
        value=""
        onChange={onChange}
        allowEdit={false}
        config={{ dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm', hourFormat: '24' }}
      />
    );

    fireEvent.doubleClick(container.firstChild as HTMLElement);
    const input = screen.getByPlaceholderText('YYYY-MM-DD HH:mm');
    fireEvent.change(input, { target: { value: '2026-02-13 10:30' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalled();
    const value = onChange.mock.calls[0][0] as string;
    expect(value).toMatch(/^2026-02-13T/);
    expect(value.endsWith('Z')).toBe(true);
  });

  it('accepts manual input in DD/MM/YYYY format', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateTime
        value=""
        onChange={onChange}
        allowEdit={false}
        config={{ dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm', hourFormat: '24' }}
      />
    );

    fireEvent.doubleClick(container.firstChild as HTMLElement);
    const input = screen.getByPlaceholderText('DD/MM/YYYY HH:mm');
    fireEvent.change(input, { target: { value: '13/02/2026 13:15' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalled();
    const value = onChange.mock.calls[0][0] as string;
    expect(value.startsWith('2026-02-13T')).toBe(true);
    expect(value.endsWith('Z')).toBe(true);
  });

  it('accepts date-only input and calls onChange', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateTime
        value=""
        onChange={onChange}
        allowEdit={false}
        config={{ dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm', hourFormat: '24' }}
      />
    );

    fireEvent.doubleClick(container.firstChild as HTMLElement);
    const input = screen.getByPlaceholderText('YYYY-MM-DD HH:mm');
    fireEvent.change(input, { target: { value: '2026-02-13' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalled();
  });

  it('accepts date-only input and fills seconds when configured', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateTime
        value=""
        onChange={onChange}
        allowEdit={false}
        config={{ dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm:ss', hourFormat: '24' }}
      />
    );

    fireEvent.doubleClick(container.firstChild as HTMLElement);
    const input = screen.getByPlaceholderText('DD/MM/YYYY HH:mm:ss');
    fireEvent.change(input, { target: { value: '13/02/2026' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalled();
    const value = onChange.mock.calls[0][0] as string;
    expect(value).toMatch(/:00\.000Z$/);
  });

  it('clears value when input is emptied', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateTime
        value="2026-02-13T10:30:00Z"
        onChange={onChange}
        allowEdit={false}
        config={{ dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm', hourFormat: '24' }}
      />
    );

    fireEvent.doubleClick(container.firstChild as HTMLElement);
    const input = screen.getByPlaceholderText('YYYY-MM-DD HH:mm');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('handles 12-hour time selection', () => {
    const onChange = vi.fn();
    render(
      <DateTime
        value="2026-02-13T00:00:00Z"
        onChange={onChange}
        config={{ dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm', hourFormat: '12' }}
      />
    );

    const buttons = screen.getAllByRole('button');
    const timeButton = buttons[1];
    fireEvent.click(timeButton);
    const timeOptions = screen.getAllByRole('button', { name: /^1:00 PM$/i });
    fireEvent.click(timeOptions[0]);

    expect(onChange).toHaveBeenCalled();
    const value = onChange.mock.calls[0][0] as string;
    expect(value).toMatch(/T13:00/);
  });

  it('uses Now action to set UTC time', () => {
    const onChange = vi.fn();
    render(
      <DateTime
        value=""
        onChange={onChange}
        config={{ dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm', hourFormat: '24' }}
      />
    );

    const buttons = screen.getAllByRole('button');
    const timeButton = buttons[1];
    fireEvent.click(timeButton);
    fireEvent.click(screen.getByRole('button', { name: /now/i }));

    expect(onChange).toHaveBeenCalled();
    const value = onChange.mock.calls[0][0] as string;
    expect(value.endsWith('Z')).toBe(true);
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

  it('renders GMT offset time zone conversion', () => {
    const onChange = vi.fn();
    render(
      <DateTime
        value="2026-02-13T00:00:00Z"
        onChange={onChange}
        config={{ dateFormat: 'YYYY-MM-DD', timeFormat: 'HH:mm', hourFormat: '24', timeZone: 'GMT+2' }}
      />
    );

    expect(screen.getByRole('button', { name: /2026-02-13/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /02:00/i })).toBeInTheDocument();
  });
});
