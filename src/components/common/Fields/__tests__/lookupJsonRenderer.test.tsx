import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LookupJsonValue } from '../lookupJsonRenderer';

describe('lookupJsonRenderer', () => {
  it('renders preview and opens tree modal', () => {
    render(<LookupJsonValue items={[{ name: 'Adeel', version: 6.1 }]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Expand JSON' }));
    expect(screen.getByText('JSON Tree')).toBeInTheDocument();
    expect(screen.getByText('"name"')).toBeInTheDocument();
    expect(screen.getByText('"Adeel"')).toBeInTheDocument();
  });
});

