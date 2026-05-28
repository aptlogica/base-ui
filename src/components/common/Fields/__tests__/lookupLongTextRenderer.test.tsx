import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LookupLongTextValue } from '../lookupLongTextRenderer';

describe('lookupLongTextRenderer', () => {
  it('renders preview and opens modal with full content', () => {
    render(<LookupLongTextValue items={['<p>Hello <b>world</b></p>', 'Second line']} />);

    expect(screen.getByText('Hello world')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Expand long text' }));

    expect(screen.getByText('Long Text')).toBeInTheDocument();
    expect(screen.getAllByText('Hello world').length).toBeGreaterThan(0);
    expect(screen.getByText('Second line')).toBeInTheDocument();
  });
});
