// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const { dropdownSpy, advancedDropdownSpy } = vi.hoisted(() => ({
  dropdownSpy: vi.fn(),
  advancedDropdownSpy: vi.fn(),
}));

vi.mock('../../../shared', () => ({
  Dropdown: (props: unknown) => {
    dropdownSpy(props);
    return <div data-testid="split-column-dropdown" />;
  },
}));

vi.mock('../../../../../../components/common/dropdown/AdvancedDropdown', () => ({
  AdvancedDropdown: (props: unknown) => {
    advancedDropdownSpy(props);
    return <div data-testid="split-column-advanced-dropdown" />;
  },
}));

import { SplitColumnPanel } from '../SplitColumnPanel';

type SplitColumnPanelProps = ComponentProps<typeof SplitColumnPanel>;

const validColumns: SplitColumnPanelProps['columns'] = [
  { id: 'first_name', title: 'First Name', type: 'text' } as SplitColumnPanelProps['columns'][number],
  { key: 'last_name', title: 'Last Name', type: 'text' } as SplitColumnPanelProps['columns'][number],
  { type: 'text' } as unknown as SplitColumnPanelProps['columns'][number],
];

const createProps = (overrides: Partial<SplitColumnPanelProps> = {}): SplitColumnPanelProps => ({
  columns: validColumns,
  splitSourceColumnId: '',
  onSplitSourceColumnChange: vi.fn(),
  onClearSplitSourceColumn: vi.fn(),
  splitMode: 'separator',
  onSplitModeChange: vi.fn(),
  splitSeparatorType: 'space',
  onSplitSeparatorTypeChange: vi.fn(),
  splitCustomSeparator: '-',
  onSplitCustomSeparatorChange: vi.fn(),
  splitMaxColumns: '3',
  onSplitMaxColumnsChange: vi.fn(),
  splitFixedDirection: 'after',
  onSplitFixedDirectionChange: vi.fn(),
  splitCharacterCount: '2',
  onSplitCharacterCountChange: vi.fn(),
  splitPattern: String.raw`\d+`,
  onSplitPatternChange: vi.fn(),
  splitOutputMode: 'replace_original',
  onSplitOutputModeChange: vi.fn(),
  splitPlacement: 'next_to_original',
  onSplitPlacementChange: vi.fn(),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SplitColumnPanel', () => {
  it('renders only selectable columns and hides columns without an identity', () => {
    render(<SplitColumnPanel {...createProps()} />);

    expect(screen.getByText('First Name')).toBeInTheDocument();
    expect(screen.getByText('Last Name')).toBeInTheDocument();
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('shows an empty state when no selectable columns exist', () => {
    render(
      <SplitColumnPanel
        {...createProps({
          columns: [{ type: 'text' } as unknown as SplitColumnPanelProps['columns'][number]],
        })}
      />
    );

    expect(screen.getByText('No columns available.')).toBeInTheDocument();
  });

  it('calls onSplitSourceColumnChange when a source column is selected', () => {
    const onSplitSourceColumnChange = vi.fn();

    render(<SplitColumnPanel {...createProps({ onSplitSourceColumnChange })} />);

    fireEvent.click(screen.getByRole('radio', { name: 'First Name' }));

    expect(onSplitSourceColumnChange).toHaveBeenCalledTimes(1);
    expect(onSplitSourceColumnChange).toHaveBeenCalledWith('first_name');
  });

  it('calls onClearSplitSourceColumn when Clear selection is clicked', () => {
    const onClearSplitSourceColumn = vi.fn();

    render(<SplitColumnPanel {...createProps({ onClearSplitSourceColumn })} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));

    expect(onClearSplitSourceColumn).toHaveBeenCalledTimes(1);
  });

  it('shows the selected source column count when a column is already selected', () => {
    render(<SplitColumnPanel {...createProps({ splitSourceColumnId: 'first_name' })} />);

    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'First Name' })).toBeChecked();
  });

  it('renders separator fields without the custom separator input for non-custom separator types', () => {
    render(
      <SplitColumnPanel
        {...createProps({
          splitMode: 'separator',
          splitSeparatorType: 'space',
        })}
      />
    );

    expect(screen.getByText('Separator type')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('10')).toHaveValue(3);
    expect(screen.queryByPlaceholderText('Enter custom separator')).not.toBeInTheDocument();
  });

  it('renders the custom separator input when separator type is custom and forwards updates', () => {
    const onSplitCustomSeparatorChange = vi.fn();

    render(
      <SplitColumnPanel
        {...createProps({
          splitMode: 'separator',
          splitSeparatorType: 'custom',
          splitCustomSeparator: ' / ',
          onSplitCustomSeparatorChange,
        })}
      />
    );

    const input = screen.getByPlaceholderText('Enter custom separator');
    fireEvent.change(input, { target: { value: ' :: ' } });

    expect(onSplitCustomSeparatorChange).toHaveBeenCalledTimes(1);
    expect(onSplitCustomSeparatorChange).toHaveBeenCalledWith(' :: ');
  });

  it('forwards separator type changes from the separator dropdown', () => {
    const onSplitSeparatorTypeChange = vi.fn();

    render(
      <SplitColumnPanel
        {...createProps({
          splitMode: 'separator',
          splitSeparatorType: 'comma',
          onSplitSeparatorTypeChange,
        })}
      />
    );

    const props = dropdownSpy.mock.calls[0][0] as {
      onChange: (value: string) => void;
      value: string;
    };

    props.onChange('custom');

    expect(onSplitSeparatorTypeChange).toHaveBeenCalledTimes(1);
    expect(onSplitSeparatorTypeChange).toHaveBeenCalledWith('custom');
    expect(props.value).toBe('comma');
  });

  it('renders fixed-length fields and forwards character count changes', () => {
    const onSplitCharacterCountChange = vi.fn();

    render(
      <SplitColumnPanel
        {...createProps({
          splitMode: 'fixed_length',
          onSplitCharacterCountChange,
        })}
      />
    );

    const input = screen.getByPlaceholderText('Enter number of characters');
    fireEvent.change(input, { target: { value: '5' } });

    expect(onSplitCharacterCountChange).toHaveBeenCalledTimes(1);
    expect(onSplitCharacterCountChange).toHaveBeenCalledWith('5');
  });

  it('forwards fixed-length direction changes from the dropdown', () => {
    const onSplitFixedDirectionChange = vi.fn();

    render(
      <SplitColumnPanel
        {...createProps({
          splitMode: 'fixed_length',
          splitFixedDirection: 'after',
          onSplitFixedDirectionChange,
        })}
      />
    );

    const props = dropdownSpy.mock.calls[0][0] as {
      onChange: (value: string) => void;
      value: string;
    };

    props.onChange('before');

    expect(onSplitFixedDirectionChange).toHaveBeenCalledTimes(1);
    expect(onSplitFixedDirectionChange).toHaveBeenCalledWith('before');
    expect(props.value).toBe('after');
  });

  it('renders pattern fields and forwards pattern changes', () => {
    const onSplitPatternChange = vi.fn();

    render(
      <SplitColumnPanel
        {...createProps({
          splitMode: 'pattern',
          splitPattern: String.raw`\s+`,
          onSplitPatternChange,
        })}
      />
    );

    expect(screen.getByTestId('split-column-advanced-dropdown')).toBeInTheDocument();

    const props = advancedDropdownSpy.mock.calls[0][0] as {
      onChange: (value: string) => void;
      value: string;
    };

    props.onChange('[A-Z]+');

    expect(onSplitPatternChange).toHaveBeenCalledTimes(1);
    expect(onSplitPatternChange).toHaveBeenCalledWith('[A-Z]+');
    expect(props.value).toBe(String.raw`\s+`);
  });

  it('checks keep original output mode and toggles it off', () => {
    const onSplitOutputModeChange = vi.fn();

    render(
      <SplitColumnPanel
        {...createProps({
          splitOutputMode: 'keep_original',
          onSplitOutputModeChange,
        })}
      />
    );

    const checkbox = screen.getByLabelText('keep-original');
    fireEvent.click(checkbox);

    expect(onSplitOutputModeChange).toHaveBeenCalledTimes(1);
    expect(onSplitOutputModeChange).toHaveBeenCalledWith('replace_original');
  });

  it('toggles keep original output mode on from replace original', () => {
    const onSplitOutputModeChange = vi.fn();

    render(
      <SplitColumnPanel
        {...createProps({
          splitOutputMode: 'replace_original',
          onSplitOutputModeChange,
        })}
      />
    );

    const checkbox = screen.getByLabelText('keep-original');
    fireEvent.click(checkbox);

    expect(onSplitOutputModeChange).toHaveBeenCalledTimes(1);
    expect(onSplitOutputModeChange).toHaveBeenCalledWith('keep_original');
  });

  it('forwards placement changes to end of table', () => {
    const onSplitPlacementChange = vi.fn();

    render(
      <SplitColumnPanel
        {...createProps({
          splitPlacement: 'next_to_original',
          onSplitPlacementChange,
        })}
      />
    );

    fireEvent.click(screen.getByLabelText('at-end-of-table'));

    expect(onSplitPlacementChange).toHaveBeenCalledTimes(1);
    expect(onSplitPlacementChange).toHaveBeenCalledWith('end_of_table');
  });

  it('forwards placement changes back to next to original', () => {
    const onSplitPlacementChange = vi.fn();

    render(
      <SplitColumnPanel
        {...createProps({
          splitPlacement: 'end_of_table',
          onSplitPlacementChange,
        })}
      />
    );

    fireEvent.click(screen.getByLabelText('next-to-original'));

    expect(onSplitPlacementChange).toHaveBeenCalledTimes(1);
    expect(onSplitPlacementChange).toHaveBeenCalledWith('next_to_original');
  });

  it('renders no mode-specific controls for an unsupported split mode', () => {
    render(
      <SplitColumnPanel
        {...createProps({
          splitMode: 'unsupported' as SplitColumnPanelProps['splitMode'],
        })}
      />
    );

    expect(screen.queryByText('Separator type')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Enter number of characters')).not.toBeInTheDocument();
    expect(screen.queryByTestId('split-column-advanced-dropdown')).not.toBeInTheDocument();
  });
  it('forwards maximum split columns changes in separator mode', () => {
    const onSplitMaxColumnsChange = vi.fn();

    render(
      <SplitColumnPanel
        {...createProps({
          splitMode: 'separator',
          onSplitMaxColumnsChange,
        })}
      />
    );

    const input = screen.getByPlaceholderText('10');
    fireEvent.change(input, { target: { value: '12' } });

    expect(onSplitMaxColumnsChange).toHaveBeenCalledTimes(1);
    expect(onSplitMaxColumnsChange).toHaveBeenCalledWith('12');
  });

  it('calls onSplitModeChange with separator when the separator radio is selected', () => {
    const onSplitModeChange = vi.fn();

    render(
      <SplitColumnPanel
        {...createProps({
          splitMode: 'fixed_length',
          onSplitModeChange,
        })}
      />
    );

    fireEvent.click(screen.getByLabelText('Split by separator'));

    expect(onSplitModeChange).toHaveBeenCalledTimes(1);
    expect(onSplitModeChange).toHaveBeenCalledWith('separator');
  });

  it('calls onSplitModeChange with fixed_length when the fixed-length radio is selected', () => {
    const onSplitModeChange = vi.fn();

    render(
      <SplitColumnPanel
        {...createProps({
          splitMode: 'pattern',
          onSplitModeChange,
        })}
      />
    );

    fireEvent.click(screen.getByLabelText('Split by fixed length'));

    expect(onSplitModeChange).toHaveBeenCalledTimes(1);
    expect(onSplitModeChange).toHaveBeenCalledWith('fixed_length');
  });

  it('calls onSplitModeChange with pattern when the pattern radio is selected', () => {
    const onSplitModeChange = vi.fn();

    render(
      <SplitColumnPanel
        {...createProps({
          splitMode: 'separator',
          onSplitModeChange,
        })}
      />
    );

    fireEvent.click(screen.getByLabelText('Split by pattern'));

    expect(onSplitModeChange).toHaveBeenCalledTimes(1);
    expect(onSplitModeChange).toHaveBeenCalledWith('pattern');
  });
});
