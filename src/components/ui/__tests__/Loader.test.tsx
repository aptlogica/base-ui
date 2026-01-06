import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Loader } from '../Loader';

describe('Loader', () => {
  it('renders an accessible status with default label', () => {
    render(<Loader />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('renders optional text when provided', () => {
    render(<Loader text="Fetching data" />);
    expect(screen.getByText('Fetching data')).toBeInTheDocument();
  });

  it('does not render text span when text is empty/undefined', () => {
    const { container, rerender } = render(<Loader />);
    expect(container.querySelector('span')).toBeNull();

    rerender(<Loader text={''} />);
    expect(container.querySelector('span')).toBeNull();
  });

  it('applies size and spinnerColor to dot styles', () => {
    render(<Loader size={12} spinnerColor="rgb(1, 2, 3)" />);

    const status = screen.getByRole('status', { name: 'Loading' });
    const dots = status.querySelectorAll('div.rounded-full');
    expect(dots.length).toBe(3);

    for (const dot of Array.from(dots)) {
      const el = dot as HTMLElement;
      expect(el.style.width).toBe('12px');
      expect(el.style.height).toBe('12px');
      expect(el.style.backgroundColor).toBe('rgb(1, 2, 3)');
    }
  });
});
