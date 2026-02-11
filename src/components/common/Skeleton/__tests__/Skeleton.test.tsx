import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton } from '../Skeleton';

describe('Skeleton', () => {
  it('renders with wave animation by default', () => {
    render(<Skeleton width={120} height={16} variant="text" />);
    const element = screen.getByRole('status');
    expect(element).toHaveAttribute('aria-label', 'Loading...');
    expect(element.className).toContain('rounded');
    expect(element.style.animation).toContain('skeleton-shimmer');
  });

  it('renders pulse animation and circular variant', () => {
    render(<Skeleton width={24} height={24} variant="circular" animation="pulse" />);
    const element = screen.getByRole('status');
    expect(element.className).toContain('rounded-full');
    expect(element.className).toContain('animate-pulse');
  });
});
