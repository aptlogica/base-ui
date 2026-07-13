// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { MergeColumnPanel } from '../MergeColumnPanel';

type MergeColumnPanelProps = ComponentProps<typeof MergeColumnPanel>;

const columns: MergeColumnPanelProps['columns'] = [
  { id: 'col-1', title: 'First Name' } as MergeColumnPanelProps['columns'][number],
  { id: 'col-2', title: 'Last Name' } as MergeColumnPanelProps['columns'][number],
];

const createProps = (overrides: Partial<MergeColumnPanelProps> = {}): MergeColumnPanelProps => ({
  columns,
  selectedColumnIds: ['col-1'],
  onToggleColumn: vi.fn(),
  onToggleAllColumns: vi.fn(),
  mergeFormat: 'space',
  onMergeFormatChange: vi.fn(),
  mergeCustomSeparator: ' / ',
  onMergeCustomSeparatorChange: vi.fn(),
  mergeColumnTitle: 'Full Name',
  onMergeColumnTitleChange: vi.fn(),
  mergeKeepOriginalColumns: false,
  onMergeKeepOriginalColumnsChange: vi.fn(),
  mergePlacement: 'next_to_original',
  onMergePlacementChange: vi.fn(),
  ...overrides,
});

describe('MergeColumnPanel', () => {
  it('renders the column selector and merge format options', () => {
    render(<MergeColumnPanel {...createProps()} />);

    expect(screen.getByText('Column to merge')).toBeInTheDocument();
    expect(screen.getByText('Select two or more columns to merge.')).toBeInTheDocument();
    expect(screen.getByText('Merge format')).toBeInTheDocument();
    expect(screen.getByText('Choose how values should be combined.')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Space' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Comma' })).not.toBeChecked();
    expect(screen.queryByPlaceholderText('Enter custom separator')).not.toBeInTheDocument();
  });

  it('applies border separators to all merge format labels except the last one', () => {
    const { container } = render(<MergeColumnPanel {...createProps()} />);

    const labels = Array.from(container.querySelectorAll('label[aria-label]')).slice(0, 4);
    const wrappers = labels.map((label) => label.parentElement);

    expect(wrappers[0]).toHaveClass('border-b');
    expect(wrappers[1]).toHaveClass('border-b');
    expect(wrappers[2]).toHaveClass('border-b');
    expect(wrappers[3]).not.toHaveClass('border-b');
  });

  it('calls onMergeFormatChange when a merge format radio is selected', () => {
    const onMergeFormatChange = vi.fn();

    render(<MergeColumnPanel {...createProps({ onMergeFormatChange })} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Dash' }));

    expect(onMergeFormatChange).toHaveBeenCalledTimes(1);
    expect(onMergeFormatChange).toHaveBeenCalledWith('dash');
  });

  it('renders the custom separator input when merge format is custom and forwards updates', () => {
    const onMergeCustomSeparatorChange = vi.fn();

    render(
      <MergeColumnPanel
        {...createProps({
          mergeFormat: 'custom',
          mergeCustomSeparator: ' | ',
          onMergeCustomSeparatorChange,
        })}
      />
    );

    const input = screen.getByPlaceholderText('Enter custom separator');
    fireEvent.change(input, { target: { value: ' :: ' } });

    expect(onMergeCustomSeparatorChange).toHaveBeenCalledTimes(1);
    expect(onMergeCustomSeparatorChange).toHaveBeenCalledWith(' :: ');
  });

  it('forwards merge column title updates', () => {
    const onMergeColumnTitleChange = vi.fn();

    render(
      <MergeColumnPanel
        {...createProps({
          mergeColumnTitle: 'Full Name',
          onMergeColumnTitleChange,
        })}
      />
    );

    const input = screen.getByPlaceholderText('Enter column name');
    fireEvent.change(input, { target: { value: 'Display Name' } });

    expect(onMergeColumnTitleChange).toHaveBeenCalledTimes(1);
    expect(onMergeColumnTitleChange).toHaveBeenCalledWith('Display Name');
  });

  it('calls onMergeKeepOriginalColumnsChange with true when the keep original checkbox is enabled', () => {
    const onMergeKeepOriginalColumnsChange = vi.fn();

    render(
      <MergeColumnPanel
        {...createProps({
          mergeKeepOriginalColumns: false,
          onMergeKeepOriginalColumnsChange,
        })}
      />
    );

    fireEvent.click(screen.getByLabelText('keep-original-column'));

    expect(onMergeKeepOriginalColumnsChange).toHaveBeenCalledTimes(1);
    expect(onMergeKeepOriginalColumnsChange).toHaveBeenCalledWith(true);
  });

  it('calls onMergeKeepOriginalColumnsChange with false when the keep original checkbox is disabled', () => {
    const onMergeKeepOriginalColumnsChange = vi.fn();

    render(
      <MergeColumnPanel
        {...createProps({
          mergeKeepOriginalColumns: true,
          onMergeKeepOriginalColumnsChange,
        })}
      />
    );

    fireEvent.click(screen.getByLabelText('keep-original-column'));

    expect(onMergeKeepOriginalColumnsChange).toHaveBeenCalledTimes(1);
    expect(onMergeKeepOriginalColumnsChange).toHaveBeenCalledWith(false);
  });

  it('calls onMergePlacementChange with end_of_table when the placement checkbox is enabled', () => {
    const onMergePlacementChange = vi.fn();

    render(
      <MergeColumnPanel
        {...createProps({
          mergePlacement: 'next_to_original',
          onMergePlacementChange,
        })}
      />
    );

    fireEvent.click(screen.getByLabelText('at-end-of-table'));

    expect(onMergePlacementChange).toHaveBeenCalledTimes(1);
    expect(onMergePlacementChange).toHaveBeenCalledWith('end_of_table');
  });

  it('calls onMergePlacementChange with next_to_original when the placement checkbox is disabled', () => {
    const onMergePlacementChange = vi.fn();

    render(
      <MergeColumnPanel
        {...createProps({
          mergePlacement: 'end_of_table',
          onMergePlacementChange,
        })}
      />
    );

    fireEvent.click(screen.getByLabelText('at-end-of-table'));

    expect(onMergePlacementChange).toHaveBeenCalledTimes(1);
    expect(onMergePlacementChange).toHaveBeenCalledWith('next_to_original');
  });

  it('forwards column selection events to the shared column selector', () => {
    const onToggleColumn = vi.fn();
    const onToggleAllColumns = vi.fn();

    render(
      <MergeColumnPanel
        {...createProps({
          onToggleColumn,
          onToggleAllColumns,
        })}
      />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'First Name' }));

    expect(onToggleAllColumns).toHaveBeenCalledTimes(1);
    expect(onToggleColumn).toHaveBeenCalledTimes(1);
    expect(onToggleColumn).toHaveBeenCalledWith('col-1');
  });
});

