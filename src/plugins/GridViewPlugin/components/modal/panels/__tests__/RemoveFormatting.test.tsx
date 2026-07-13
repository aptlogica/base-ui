// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FormattingPanel } from '../RemoveFormatting';

type FormattingPanelProps = ComponentProps<typeof FormattingPanel>;

const columns: FormattingPanelProps['columns'] = [
  { id: 'col-1', title: 'Amount' } as FormattingPanelProps['columns'][number],
  { id: 'col-2', title: 'Phone Number' } as FormattingPanelProps['columns'][number],
];

const createProps = (overrides: Partial<FormattingPanelProps> = {}): FormattingPanelProps => ({
  columns,
  selectedColumnIds: ['col-1'],
  onToggleColumn: vi.fn(),
  onToggleAllColumns: vi.fn(),
  formatting: 'currency',
  onFormattingChange: vi.fn(),
  formattingPattern: '',
  onFormattingPatternChange: vi.fn(),
  ...overrides,
});

describe('FormattingPanel', () => {
  it('renders the column selector and all formatting options', () => {
    render(<FormattingPanel {...createProps()} />);

    expect(screen.getByText('Select columns')).toBeInTheDocument();
    expect(screen.getByText('Choose the columns to clean.')).toBeInTheDocument();
    expect(screen.getByText('Formatting to remove')).toBeInTheDocument();
    expect(screen.getByText('Choose the type of formatting you want to remove.')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Currency formatting' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Percentage formatting' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Separator formatting' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Phone formatting' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Date formatting' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Custom formatting' })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('e.g. $, -, /')).not.toBeInTheDocument();
  });

  it('calls onFormattingChange when a formatting option is selected', () => {
    const onFormattingChange = vi.fn();

    render(<FormattingPanel {...createProps({ onFormattingChange })} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Percentage formatting' }));

    expect(onFormattingChange).toHaveBeenCalledTimes(1);
    expect(onFormattingChange).toHaveBeenCalledWith('percentage');
  });

  it('renders the custom pattern input when custom formatting is selected', () => {
    render(
      <FormattingPanel
        {...createProps({
          formatting: 'custom',
          formattingPattern: '$, -, /',
        })}
      />
    );

    expect(screen.getByPlaceholderText('e.g. $, -, /')).toHaveValue('$, -, /');
  });

  it('forwards custom pattern changes to the provided handler', () => {
    const onFormattingPatternChange = vi.fn();

    render(
      <FormattingPanel
        {...createProps({
          formatting: 'custom',
          onFormattingPatternChange,
        })}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('e.g. $, -, /'), { target: { value: '[]' } });

    expect(onFormattingPatternChange).toHaveBeenCalledTimes(1);
    expect(onFormattingPatternChange).toHaveBeenCalledWith('[]');
  });

  it('forwards column selection toggles to the shared column selector', () => {
    const onToggleColumn = vi.fn();
    const onToggleAllColumns = vi.fn();

    render(
      <FormattingPanel
        {...createProps({
          onToggleColumn,
          onToggleAllColumns,
        })}
      />
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Phone Number' }));

    expect(onToggleAllColumns).toHaveBeenCalledTimes(1);
    expect(onToggleColumn).toHaveBeenCalledTimes(1);
    expect(onToggleColumn).toHaveBeenCalledWith('col-2');
  });
});
