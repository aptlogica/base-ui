import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DropdownSearch } from '../../dropdown/DropdownSearch';

describe('DropdownSearch', () => {
  it('renders with default placeholder and responds to input', () => {
    const onChange = vi.fn();
    render(<DropdownSearch value="" onChange={onChange} />);
    const input = screen.getByPlaceholderText('Search options...');
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(onChange).toHaveBeenCalledWith('abc');
  });

  it('supports custom placeholder', () => {
    render(<DropdownSearch value="" onChange={vi.fn()} placeholder="Find..." />);
    expect(screen.getByPlaceholderText('Find...')).toBeInTheDocument();
  });
});