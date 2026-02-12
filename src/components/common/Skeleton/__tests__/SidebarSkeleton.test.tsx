import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SidebarSkeleton } from '../SidebarSkeleton';

describe('SidebarSkeleton', () => {
  it('renders default skeleton count', () => {
    render(<SidebarSkeleton />);
    const skeletons = screen.getAllByLabelText('Loading...');
    expect(skeletons.length).toBe(34);
  });

  it('renders custom item count', () => {
    render(<SidebarSkeleton itemCount={2} />);
    const skeletons = screen.getAllByLabelText('Loading...');
    expect(skeletons.length).toBe(19);
  });
});
