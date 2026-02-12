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
});
