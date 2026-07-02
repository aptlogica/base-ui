import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ExtractSubstringPanel } from '../ExtractSubstring';

// Mock createPortal so dropdowns render inline
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

const advancedDropdownSpy = vi.fn();
vi.mock('../../../../../../components/common/dropdown/AdvancedDropdown', () => ({
  AdvancedDropdown: (props: any) => {
    advancedDropdownSpy(props);
    return <div data-testid={props.label || 'advanced-dropdown'} />;
  },
}));

describe('ExtractSubstringPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders only columns that have id or key and shows their titles', () => {
    const columns = [
      { id: 'c1', title: 'Column 1' },
      { key: 'k2', title: 'Column 2' },
      { title: 'No Id Or Key' },
    ] as any;

    render(
      <ExtractSubstringPanel
        columns={columns}
        selectedColumnIds={[]}
        onSelectColumn={vi.fn()}
        method={'extraction_type'}
        onMethodChange={vi.fn()}
        extractionType={'email'}
        onExtractionTypeChange={vi.fn()}
        startAfter=""
        onStartAfterChange={vi.fn()}
        endBefore=""
        onEndBeforeChange={vi.fn()}
        keepOriginalColumn={false}
        onKeepOriginalColumnChange={vi.fn()}
        placement={'next_to_original'}
        onPlacementChange={vi.fn()}
      />
    );

    expect(screen.getByText('Column 1')).toBeInTheDocument();
    expect(screen.getByText('Column 2')).toBeInTheDocument();
    expect(screen.queryByText('No Id Or Key')).not.toBeInTheDocument();
  });

  it('calls onSelectColumn when a source column radio is clicked', async () => {
    const onSelectColumn = vi.fn();
    const columns = [{ id: 'col-1', title: 'My Column' }] as any;

    render(
      <ExtractSubstringPanel
        columns={columns}
        selectedColumnIds={[]}
        onSelectColumn={onSelectColumn}
        method={'extraction_type'}
        onMethodChange={vi.fn()}
        extractionType={'email'}
        onExtractionTypeChange={vi.fn()}
        startAfter=""
        onStartAfterChange={vi.fn()}
        endBefore=""
        onEndBeforeChange={vi.fn()}
        keepOriginalColumn={false}
        onKeepOriginalColumnChange={vi.fn()}
        placement={'next_to_original'}
        onPlacementChange={vi.fn()}
      />
    );

    const radio = screen.getByRole('radio', { name: 'My Column' });
    await userEvent.click(radio);

    expect(onSelectColumn).toHaveBeenCalledTimes(1);
    expect(onSelectColumn).toHaveBeenCalledWith('col-1');
  });

  it('renders AdvancedDropdown for extraction_type and forwards onChange', () => {
    const onExtractionTypeChange = vi.fn();

    render(
      <ExtractSubstringPanel
        columns={[]}
        selectedColumnIds={[]}
        onSelectColumn={vi.fn()}
        method={'extraction_type'}
        onMethodChange={vi.fn()}
        extractionType={'email'}
        onExtractionTypeChange={onExtractionTypeChange}
        startAfter=""
        onStartAfterChange={vi.fn()}
        endBefore=""
        onEndBeforeChange={vi.fn()}
        keepOriginalColumn={false}
        onKeepOriginalColumnChange={vi.fn()}
        placement={'next_to_original'}
        onPlacementChange={vi.fn()}
      />
    );

    const dropdownProps = advancedDropdownSpy.mock.calls[0][0] as Record<string, any>;

    expect(dropdownProps).toBeDefined();
    expect(dropdownProps.options).toBeInstanceOf(Array);

    dropdownProps.onChange('phone');

    expect(onExtractionTypeChange).toHaveBeenCalledWith('phone');
  });

  it('shows startAfter and endBefore inputs when method is between_characters and triggers callbacks', () => {
    const onStartAfterChange = vi.fn();
    const onEndBeforeChange = vi.fn();

    render(
      <ExtractSubstringPanel
        columns={[]}
        selectedColumnIds={[]}
        onSelectColumn={vi.fn()}
        method={'between_characters'}
        onMethodChange={vi.fn()}
        extractionType={'email'}
        onExtractionTypeChange={vi.fn()}
        startAfter={'foo'}
        onStartAfterChange={onStartAfterChange}
        endBefore={'bar'}
        onEndBeforeChange={onEndBeforeChange}
        keepOriginalColumn={false}
        onKeepOriginalColumnChange={vi.fn()}
        placement={'next_to_original'}
        onPlacementChange={vi.fn()}
      />
    );

    const startInput = screen.getByPlaceholderText('Enter starting value') as HTMLInputElement;
    const endInput = screen.getByPlaceholderText('Enter ending value') as HTMLInputElement;

    expect(startInput).toBeInTheDocument();
    expect(endInput).toBeInTheDocument();

    fireEvent.change(startInput, { target: { value: 'newStart' } });
    fireEvent.change(endInput, { target: { value: 'newEnd' } });

    expect(onStartAfterChange).toHaveBeenCalledWith('newStart');
    expect(onEndBeforeChange).toHaveBeenCalledWith('newEnd');
  });

  it('toggles keep original column checkbox and calls handler with correct value', async () => {
    const onKeepOriginalColumnChange = vi.fn();

    render(
      <ExtractSubstringPanel
        columns={[]}
        selectedColumnIds={[]}
        onSelectColumn={vi.fn()}
        method={'extraction_type'}
        onMethodChange={vi.fn()}
        extractionType={'email'}
        onExtractionTypeChange={vi.fn()}
        startAfter={''}
        onStartAfterChange={vi.fn()}
        endBefore={''}
        onEndBeforeChange={vi.fn()}
        keepOriginalColumn={false}
        onKeepOriginalColumnChange={onKeepOriginalColumnChange}
        placement={'next_to_original'}
        onPlacementChange={vi.fn()}
      />
    );

    const checkbox = screen.getByRole('checkbox', { name: 'Keep original column' }) as HTMLInputElement;
    expect(checkbox).toBeInTheDocument();
    expect(checkbox.checked).toBe(false);

    await userEvent.click(checkbox);

    expect(onKeepOriginalColumnChange).toHaveBeenCalledTimes(1);
    expect(onKeepOriginalColumnChange).toHaveBeenCalledWith(true);
  });

  it('selects placement option and calls onPlacementChange with correct value', async () => {
    const onPlacementChange = vi.fn();

    render(
      <ExtractSubstringPanel
        columns={[]}
        selectedColumnIds={[]}
        onSelectColumn={vi.fn()}
        method={'extraction_type'}
        onMethodChange={vi.fn()}
        extractionType={'email'}
        onExtractionTypeChange={vi.fn()}
        startAfter={''}
        onStartAfterChange={vi.fn()}
        endBefore={''}
        onEndBeforeChange={vi.fn()}
        keepOriginalColumn={false}
        onKeepOriginalColumnChange={vi.fn()}
        placement={'next_to_original'}
        onPlacementChange={onPlacementChange}
      />
    );

    const endOption = screen.getByLabelText('At end of table');
    await userEvent.click(endOption);

    expect(onPlacementChange).toHaveBeenCalledWith('end_of_table');
  });

  it('applies border-b class to extraction type label when method is between_characters', () => {
    render(
      <ExtractSubstringPanel
        columns={[]}
        selectedColumnIds={[]}
        onSelectColumn={vi.fn()}
        method={'between_characters'}
        onMethodChange={vi.fn()}
        extractionType={'email'}
        onExtractionTypeChange={vi.fn()}
        startAfter={''}
        onStartAfterChange={vi.fn()}
        endBefore={''}
        onEndBeforeChange={vi.fn()}
        keepOriginalColumn={false}
        onKeepOriginalColumnChange={vi.fn()}
        placement={'next_to_original'}
        onPlacementChange={vi.fn()}
      />
    );

    const labelText = screen.getByText('Extraction Type');
    const label = labelText.closest('label');
    expect(label).toBeTruthy();
    expect(label).toHaveClass('border-b');
  });
});
