// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RemoveDuplicatesPanel } from '../RemoveDuplicatesPanel';

type RemoveDuplicatesPanelProps = ComponentProps<typeof RemoveDuplicatesPanel>;

const columns: RemoveDuplicatesPanelProps['columns'] = [
  { id: 'col-1', title: 'First Name' } as RemoveDuplicatesPanelProps['columns'][number],
  { id: 'col-2', title: 'Last Name' } as RemoveDuplicatesPanelProps['columns'][number],
];

const createProps = (overrides: Partial<RemoveDuplicatesPanelProps> = {}): RemoveDuplicatesPanelProps => ({
  columns,
  selectedColumnIds: ['col-1'],
  onToggleColumn: vi.fn(),
  onToggleAllColumns: vi.fn(),
  duplicateAction: 'remove_row',
  onDuplicateActionChange: vi.fn(),
  duplicateKeepRule: 'keep_first',
  onDuplicateKeepRuleChange: vi.fn(),
  ...overrides,
});

describe('RemoveDuplicatesPanel', () => {
  it('renders the column selector, duplicate action section, and keep rule section', () => {
    render(<RemoveDuplicatesPanel {...createProps()} />);

    expect(screen.getByText('Identify duplicates by')).toBeInTheDocument();
    expect(screen.getByText('Select one or more columns to compare.')).toBeInTheDocument();
    expect(screen.getByText('Duplicate action')).toBeInTheDocument();
    expect(
      screen.getByText('Choose whether duplicates should be removed or just cleared from the selected columns.')
    ).toBeInTheDocument();
    expect(screen.getByText('Keep rule')).toBeInTheDocument();
    expect(screen.getByText('Choose which matching row should be kept as the original.')).toBeInTheDocument();
    expect(screen.getByText('First Name')).toBeInTheDocument();
    expect(screen.getByText('Last Name')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Remove duplicate rows' })).toBeChecked();
    expect(screen.getByText('Keep first occurrence')).toBeInTheDocument();
  });

  it('forwards the select all checkbox toggle to the provided handler', () => {
    const onToggleAllColumns = vi.fn();

    render(<RemoveDuplicatesPanel {...createProps({ onToggleAllColumns })} />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));

    expect(onToggleAllColumns).toHaveBeenCalledTimes(1);
  });

  it('forwards an individual column toggle to the provided handler', () => {
    const onToggleColumn = vi.fn();

    render(<RemoveDuplicatesPanel {...createProps({ onToggleColumn })} />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'First Name' }));

    expect(onToggleColumn).toHaveBeenCalledTimes(1);
    expect(onToggleColumn).toHaveBeenCalledWith('col-1');
  });

  it('calls onDuplicateActionChange when remove duplicate rows is selected', () => {
    const onDuplicateActionChange = vi.fn();

    render(
      <RemoveDuplicatesPanel
        {...createProps({
          duplicateAction: 'remove_duplicates',
          onDuplicateActionChange,
        })}
      />
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Remove duplicate rows' }));

    expect(onDuplicateActionChange).toHaveBeenCalledTimes(1);
    expect(onDuplicateActionChange).toHaveBeenCalledWith('remove_row');
  });

  it('calls onDuplicateActionChange when keep row and clear duplicate values is selected', () => {
    const onDuplicateActionChange = vi.fn();

    render(
      <RemoveDuplicatesPanel
        {...createProps({
          duplicateAction: 'remove_row',
          onDuplicateActionChange,
        })}
      />
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Keep row and clear duplicate values' }));

    expect(onDuplicateActionChange).toHaveBeenCalledTimes(1);
    expect(onDuplicateActionChange).toHaveBeenCalledWith('remove_duplicates');
  });

  it('calls onDuplicateActionChange when remove duplicate with Match Case is selected', () => {
    const onDuplicateActionChange = vi.fn();

    render(
      <RemoveDuplicatesPanel
        {...createProps({
          duplicateAction: 'remove_row',
          onDuplicateActionChange,
        })}
      />
    );

    fireEvent.click(screen.getByRole('radio', { name: 'Remove duplicate with Match Case' }));

    expect(onDuplicateActionChange).toHaveBeenCalledTimes(1);
    expect(onDuplicateActionChange).toHaveBeenCalledWith('remove_duplicates_matchCase');
  });

  it('applies border-b to every duplicate action option except the last one', () => {
    const { container } = render(<RemoveDuplicatesPanel {...createProps()} />);

    const labels = Array.from(container.querySelectorAll('label[aria-label]'));

    expect(labels[0]).toHaveClass('border-b');
    expect(labels[1]).toHaveClass('border-b');
    expect(labels[2]).not.toHaveClass('border-b');
  });

  it('updates the keep rule through the dropdown selection', () => {
    const onDuplicateKeepRuleChange = vi.fn();

    render(
      <RemoveDuplicatesPanel
        {...createProps({
          duplicateKeepRule: 'keep_last',
          onDuplicateKeepRuleChange,
        })}
      />
    );

    fireEvent.click(screen.getByText('Keep last occurrence'));
    fireEvent.click(screen.getByText('Keep latest updated record'));

    expect(onDuplicateKeepRuleChange).toHaveBeenCalledTimes(1);
    expect(onDuplicateKeepRuleChange).toHaveBeenCalledWith('keep_latest_updated');
  });

  it('renders the empty column state when no columns are available', () => {
    render(
      <RemoveDuplicatesPanel
        {...createProps({
          columns: [],
          selectedColumnIds: [],
        })}
      />
    );

    expect(screen.getByText('No columns available.')).toBeInTheDocument();
  });

  it('does not mark any duplicate action radio as checked for an unknown value', () => {
    render(
      <RemoveDuplicatesPanel
        {...createProps({
          duplicateAction: 'unknown' as RemoveDuplicatesPanelProps['duplicateAction'],
        })}
      />
    );

    expect(screen.getAllByRole('radio').every((radio) => !(radio as HTMLInputElement).checked)).toBe(true);
  });
});
