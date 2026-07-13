// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RemoveSpecialCharsPanel } from '../RemoveSpecialCharsPanel';

type RemoveSpecialCharsPanelProps = ComponentProps<typeof RemoveSpecialCharsPanel>;

const columns: RemoveSpecialCharsPanelProps['columns'] = [
  { id: 'col-1', title: 'First Name' } as RemoveSpecialCharsPanelProps['columns'][number],
  { id: 'col-2', title: 'Last Name' } as RemoveSpecialCharsPanelProps['columns'][number],
];

const createProps = (
  overrides: Partial<RemoveSpecialCharsPanelProps> = {}
): RemoveSpecialCharsPanelProps => ({
  columns,
  selectedColumnIds: ['col-1'],
  onToggleColumn: vi.fn(),
  onToggleAllColumns: vi.fn(),
  charRemovalMode: 'symbols',
  onCharRemovalModeChange: vi.fn(),
  customChar: '',
  onCustomCharChange: vi.fn(),
  ...overrides,
});

describe('RemoveSpecialCharsPanel', () => {
  it('renders the column selection section and the predefined character removal options', () => {
    render(<RemoveSpecialCharsPanel {...createProps()} />);

    expect(screen.getByText('Select columns')).toBeInTheDocument();
    expect(screen.getByText('Choose the columns to clean')).toBeInTheDocument();
    expect(screen.getByText('Select characters to remove')).toBeInTheDocument();
    expect(screen.getByText('Choose which type of characters should be removed.')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Symbols' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Currency Symbols' })).not.toBeChecked();
    expect(screen.queryByPlaceholderText('e.g. #')).not.toBeInTheDocument();
  });

  it('calls onCharRemovalModeChange with punctuation when that radio option is selected', () => {
    const onCharRemovalModeChange = vi.fn();

    render(
      <RemoveSpecialCharsPanel
        {...createProps({
          charRemovalMode: 'symbols',
          onCharRemovalModeChange,
        })}
      />
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Punctuation' }));

    expect(onCharRemovalModeChange).toHaveBeenCalledTimes(1);
    expect(onCharRemovalModeChange).toHaveBeenCalledWith('punctuation');
  });

  it('renders the custom character input and forwards custom character updates', () => {
    const onCharRemovalModeChange = vi.fn();
    const onCustomCharChange = vi.fn();

    render(
      <RemoveSpecialCharsPanel
        {...createProps({
          charRemovalMode: 'custom',
          customChar: '#',
          onCharRemovalModeChange,
          onCustomCharChange,
        })}
      />
    );

    const customRadio = screen.getByRole('radio', { name: 'Custom character' });
    const customInput = screen.getByPlaceholderText('e.g. #');

    expect(customRadio).toBeChecked();
    expect(customInput).toHaveValue('#');

    fireEvent.change(customInput, { target: { value: '@' } });

    expect(onCustomCharChange).toHaveBeenCalledTimes(1);
    expect(onCustomCharChange).toHaveBeenCalledWith('@');
  });

  it('does not render the custom character input when a predefined mode is active', () => {
    render(
      <RemoveSpecialCharsPanel
        {...createProps({
          charRemovalMode: 'brackets',
        })}
      />
    );

    expect(screen.queryByPlaceholderText('e.g. #')).not.toBeInTheDocument();
  });

  it('applies the border separator to every option except the last one', () => {
    const { container } = render(<RemoveSpecialCharsPanel {...createProps()} />);

    const labels = Array.from(container.querySelectorAll('label[aria-label]'));

    expect(labels[0]).toHaveClass('border-b');
    expect(labels[1]).toHaveClass('border-b');
    expect(labels[2]).toHaveClass('border-b');
    expect(labels[3]).toHaveClass('border-b');
    expect(labels[4]).not.toHaveClass('border-b');
  });
});
