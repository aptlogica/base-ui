import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { FindAndReplacePanel } from '../FindAndReplacePanel';

const columnsSample = [{ id: 'col-1', title: 'Column 1' }];

describe('FindAndReplacePanel', () => {
  it('renders find input with provided value', () => {
    const props = {
      columns: columnsSample,
      selectedColumnIds: ['col-1'],
      onToggleColumn: vi.fn(),
      onToggleAllColumns: vi.fn(),
      findText: 'NY',
      onFindTextChange: vi.fn(),
      replaceText: '',
      onReplaceTextChange: vi.fn(),
      matchingCase: 'ignore_case' as const,
      onMatchingCaseChange: vi.fn(),
    };

    render(<FindAndReplacePanel {...props} />);

    const input = screen.getByPlaceholderText('e.g. NY') as HTMLInputElement;
    expect(input.value).toBe('NY');
  });

  it('calls onFindTextChange when find input changes', () => {
    const onFindTextChange = vi.fn();

    render(
      <FindAndReplacePanel
        columns={columnsSample}
        selectedColumnIds={[]}
        onToggleColumn={vi.fn()}
        onToggleAllColumns={vi.fn()}
        findText=""
        onFindTextChange={onFindTextChange}
        replaceText=""
        onReplaceTextChange={vi.fn()}
        matchingCase={'ignore_case'}
        onMatchingCaseChange={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('e.g. NY');
    fireEvent.change(input, { target: { value: 'ABC' } });

    expect(onFindTextChange).toHaveBeenCalledWith('ABC');
  });

  it('renders replace input with provided value', () => {
    const props = {
      columns: columnsSample,
      selectedColumnIds: [],
      onToggleColumn: vi.fn(),
      onToggleAllColumns: vi.fn(),
      findText: '',
      onFindTextChange: vi.fn(),
      replaceText: "New York",
      onReplaceTextChange: vi.fn(),
      matchingCase: 'ignore_case' as const,
      onMatchingCaseChange: vi.fn(),
    };

    render(<FindAndReplacePanel {...props} />);

    const input = screen.getByPlaceholderText("e.g. 'New York'") as HTMLInputElement;
    expect(input.value).toBe('New York');
  });

  it('calls onReplaceTextChange when replace input changes', () => {
    const onReplaceTextChange = vi.fn();

    render(
      <FindAndReplacePanel
        columns={columnsSample}
        selectedColumnIds={[]}
        onToggleColumn={vi.fn()}
        onToggleAllColumns={vi.fn()}
        findText=""
        onFindTextChange={vi.fn()}
        replaceText=""
        onReplaceTextChange={onReplaceTextChange}
        matchingCase={'ignore_case'}
        onMatchingCaseChange={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText("e.g. 'New York'");
    fireEvent.change(input, { target: { value: 'Some value' } });

    expect(onReplaceTextChange).toHaveBeenCalledWith('Some value');
  });

  it('shows the selected matching case radio as checked', () => {
    render(
      <FindAndReplacePanel
        columns={columnsSample}
        selectedColumnIds={[]}
        onToggleColumn={vi.fn()}
        onToggleAllColumns={vi.fn()}
        findText=""
        onFindTextChange={vi.fn()}
        replaceText=""
        onReplaceTextChange={vi.fn()}
        matchingCase={'match_entire_value'}
        onMatchingCaseChange={vi.fn()}
      />
    );

    // find the radio input corresponding to the "Match entire value" label
    const radio = screen.getByRole('radio', { name: 'Match entire value' }) as HTMLInputElement;
    expect(radio).toBeTruthy();
    expect(radio.checked).toBe(true);
  });

  it('calls onMatchingCaseChange when a matching option is selected', () => {
    const onMatchingCaseChange = vi.fn();

    render(
      <FindAndReplacePanel
        columns={columnsSample}
        selectedColumnIds={[]}
        onToggleColumn={vi.fn()}
        onToggleAllColumns={vi.fn()}
        findText=""
        onFindTextChange={vi.fn()}
        replaceText=""
        onReplaceTextChange={vi.fn()}
        matchingCase={'ignore_case'}
        onMatchingCaseChange={onMatchingCaseChange}
      />
    );

    const radio = screen.getByLabelText('Match case');
    fireEvent.click(radio);

    expect(onMatchingCaseChange).toHaveBeenCalledWith('match_case');
  });

  it('forwards column selection props to ColumnSelectionSection', () => {
    render(
      <FindAndReplacePanel
        columns={columnsSample}
        selectedColumnIds={['col-1']}
        onToggleColumn={vi.fn()}
        onToggleAllColumns={vi.fn()}
        findText=""
        onFindTextChange={vi.fn()}
        replaceText=""
        onReplaceTextChange={vi.fn()}
        matchingCase={'ignore_case'}
        onMatchingCaseChange={vi.fn()}
      />
    );

    // verify the real ColumnSelectionSection rendered by checking for the column title
    expect(screen.getByText('Column 1')).toBeTruthy();
  });

  it('calls onToggleColumn when ColumnSelectionSection checkbox is toggled', () => {
    const onToggleColumn = vi.fn();

    render(
      <FindAndReplacePanel
        columns={columnsSample}
        selectedColumnIds={[]}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={vi.fn()}
        findText=""
        onFindTextChange={vi.fn()}
        replaceText=""
        onReplaceTextChange={vi.fn()}
        matchingCase={'ignore_case'}
        onMatchingCaseChange={vi.fn()}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    // first checkbox is 'Select all', second is the column checkbox
    const columnCheckbox = checkboxes[1] as HTMLInputElement;
    fireEvent.click(columnCheckbox);

    expect(onToggleColumn).toHaveBeenCalled();
  });

  it('calls onToggleAllColumns when Select all checkbox is toggled', () => {
    const onToggleAllColumns = vi.fn();

    render(
      <FindAndReplacePanel
        columns={columnsSample}
        selectedColumnIds={[]}
        onToggleColumn={vi.fn()}
        onToggleAllColumns={onToggleAllColumns}
        findText=""
        onFindTextChange={vi.fn()}
        replaceText=""
        onReplaceTextChange={vi.fn()}
        matchingCase={'ignore_case'}
        onMatchingCaseChange={vi.fn()}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    const selectAllCheckbox = checkboxes[0] as HTMLInputElement;
    fireEvent.click(selectAllCheckbox);

    expect(onToggleAllColumns).toHaveBeenCalled();
  });
});
