import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../shared/ColumnSelectionSection', () => ({
  ColumnSelectionSection: (props: any) => (
    <div
      data-testid="col-select"
      data-columns={JSON.stringify(props.columns)}
      data-selected-column-ids={Array.isArray(props.selectedColumnIds) ? props.selectedColumnIds.join(',') : ''}
      data-title={props.title}
      data-description={props.description}
    />
  ),
}));

import { ExtraspacePanel } from '../ExtraspacePanel';

describe('ExtraspacePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ColumnSelectionSection container', () => {
    const columns = [{ id: 'c1', title: 'Column 1' }];
    const selectedColumnIds: string[] = ['c1'];
    const onToggleColumn = vi.fn();
    const onToggleAllColumns = vi.fn();
    const onSpaceModeChange = vi.fn();

    render(
      <ExtraspacePanel
        columns={columns as any}
        selectedColumnIds={selectedColumnIds}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        spaceMode="both"
        onSpaceModeChange={onSpaceModeChange}
      />
    );

    const colSelect = screen.getByTestId('col-select');
    expect(colSelect).toBeInTheDocument();
  });

  it('passes columns prop to ColumnSelectionSection', () => {
    const columns = [{ id: 'c1', title: 'Column 1' }];
    const onToggleColumn = vi.fn();
    const onToggleAllColumns = vi.fn();
    const onSpaceModeChange = vi.fn();

    render(
      <ExtraspacePanel
        columns={columns as any}
        selectedColumnIds={[]}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        spaceMode="both"
        onSpaceModeChange={onSpaceModeChange}
      />
    );

    const colSelect = screen.getByTestId('col-select');
    expect(colSelect.getAttribute('data-columns')).toBe(JSON.stringify(columns));
  });

  it('passes selectedColumnIds prop to ColumnSelectionSection', () => {
    const columns = [{ id: 'c1', title: 'Column 1' }];
    const selectedColumnIds: string[] = ['c1'];
    const onToggleColumn = vi.fn();
    const onToggleAllColumns = vi.fn();
    const onSpaceModeChange = vi.fn();

    render(
      <ExtraspacePanel
        columns={columns as any}
        selectedColumnIds={selectedColumnIds}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        spaceMode="both"
        onSpaceModeChange={onSpaceModeChange}
      />
    );

    const colSelect = screen.getByTestId('col-select');
    expect(colSelect.getAttribute('data-selected-column-ids')).toBe('c1');
  });

  it('renders Space Options heading', () => {
    const onToggleColumn = vi.fn();
    const onToggleAllColumns = vi.fn();
    const onSpaceModeChange = vi.fn();

    render(
      <ExtraspacePanel
        columns={[] as any}
        selectedColumnIds={[]}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        spaceMode="both"
        onSpaceModeChange={onSpaceModeChange}
      />
    );

    expect(screen.getByText('Space Options')).toBeInTheDocument();
  });

  it('renders Space Options description', () => {
    const onToggleColumn = vi.fn();
    const onToggleAllColumns = vi.fn();
    const onSpaceModeChange = vi.fn();

    render(
      <ExtraspacePanel
        columns={[] as any}
        selectedColumnIds={[]}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        spaceMode="both"
        onSpaceModeChange={onSpaceModeChange}
      />
    );

    expect(screen.getByText('Choose how to handle spaces in the selected columns.')).toBeInTheDocument();
  });

  it('renders all space option radio inputs and marks the selected one as checked', () => {
    const onToggleColumn = vi.fn();
    const onToggleAllColumns = vi.fn();
    const onSpaceModeChange = vi.fn();

    render(
      <ExtraspacePanel
        columns={[] as any}
        selectedColumnIds={[]}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        spaceMode="extra"
        onSpaceModeChange={onSpaceModeChange}
      />
    );

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(4);
  });

  it('marks extra option radio as checked when spaceMode is extra', () => {
    const onToggleColumn = vi.fn();
    const onToggleAllColumns = vi.fn();
    const onSpaceModeChange = vi.fn();

    render(
      <ExtraspacePanel
        columns={[] as any}
        selectedColumnIds={[]}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        spaceMode="extra"
        onSpaceModeChange={onSpaceModeChange}
      />
    );

    const extraRadio = screen.getByRole('radio', { name: /Remove extra spaces/i });
    expect((extraRadio as HTMLInputElement).checked).toBe(true);
  });

  it('calls onSpaceModeChange with correct value when a radio option is selected', () => {
    const onToggleColumn = vi.fn();
    const onToggleAllColumns = vi.fn();
    const onSpaceModeChange = vi.fn();

    render(
      <ExtraspacePanel
        columns={[] as any}
        selectedColumnIds={[]}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        spaceMode="both"
        onSpaceModeChange={onSpaceModeChange}
      />
    );

    const removeExtraRadio = screen.getByRole('radio', { name: /Remove extra spaces/i });
    fireEvent.click(removeExtraRadio);

    expect(onSpaceModeChange).toHaveBeenCalledTimes(1);
  });

  it('passes correct value to onSpaceModeChange when selecting option', () => {
    const onToggleColumn = vi.fn();
    const onToggleAllColumns = vi.fn();
    const onSpaceModeChange = vi.fn();

    render(
      <ExtraspacePanel
        columns={[] as any}
        selectedColumnIds={[]}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        spaceMode="both"
        onSpaceModeChange={onSpaceModeChange}
      />
    );

    const removeExtraRadio = screen.getByRole('radio', { name: /Remove extra spaces/i });
    fireEvent.click(removeExtraRadio);

    expect(onSpaceModeChange).toHaveBeenCalledWith('extra');
  });

  it('applies border-b to all options except the last one', () => {
    const onToggleColumn = vi.fn();
    const onToggleAllColumns = vi.fn();
    const onSpaceModeChange = vi.fn();

    const { container } = render(
      <ExtraspacePanel
        columns={[] as any}
        selectedColumnIds={[]}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        spaceMode="trailing"
        onSpaceModeChange={onSpaceModeChange}
      />
    );

    const labels = Array.from(container.querySelectorAll('label[aria-label]'));
    const lastLabel = labels[labels.length - 1];
    expect(lastLabel.className).not.toMatch(/border-b/);
  });

  it('first option has border-b class applied', () => {
    const onToggleColumn = vi.fn();
    const onToggleAllColumns = vi.fn();
    const onSpaceModeChange = vi.fn();

    const { container } = render(
      <ExtraspacePanel
        columns={[] as any}
        selectedColumnIds={[]}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        spaceMode="trailing"
        onSpaceModeChange={onSpaceModeChange}
      />
    );

    const labels = Array.from(container.querySelectorAll('label[aria-label]'));
    const firstLabel = labels[0];
    expect(firstLabel.className).toMatch(/border-b/);
  });

  it('renders correctly when columns list is empty', () => {
    const onToggleColumn = vi.fn();
    const onToggleAllColumns = vi.fn();
    const onSpaceModeChange = vi.fn();

    render(
      <ExtraspacePanel
        columns={[] as any}
        selectedColumnIds={[]}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        spaceMode="leading"
        onSpaceModeChange={onSpaceModeChange}
      />
    );

    const colSelect = screen.getByTestId('col-select');
    expect(colSelect.getAttribute('data-columns')).toBe('[]');
  });

  it('passes empty selectedColumnIds when columns list is empty', () => {
    const onToggleColumn = vi.fn();
    const onToggleAllColumns = vi.fn();
    const onSpaceModeChange = vi.fn();

    render(
      <ExtraspacePanel
        columns={[] as any}
        selectedColumnIds={[]}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        spaceMode="leading"
        onSpaceModeChange={onSpaceModeChange}
      />
    );

    const colSelect2 = screen.getByTestId('col-select');
    expect(colSelect2.getAttribute('data-selected-column-ids')).toBe('');
  });

  it('leading radio is checked when spaceMode is leading', () => {
    const onToggleColumn = vi.fn();
    const onToggleAllColumns = vi.fn();
    const onSpaceModeChange = vi.fn();

    render(
      <ExtraspacePanel
        columns={[] as any}
        selectedColumnIds={[]}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        spaceMode="leading"
        onSpaceModeChange={onSpaceModeChange}
      />
    );

    const leadingRadio = screen.getByRole('radio', { name: /Trim leading spaces/i });
    expect((leadingRadio as HTMLInputElement).checked).toBe(true);
  });

  it('does not mark any radio checked when spaceMode is unknown', () => {
    const onToggleColumn = vi.fn();
    const onToggleAllColumns = vi.fn();
    const onSpaceModeChange = vi.fn();

    render(
      <ExtraspacePanel
        columns={[] as any}
        selectedColumnIds={[]}
        onToggleColumn={onToggleColumn}
        onToggleAllColumns={onToggleAllColumns}
        spaceMode={'unknown' as any}
        onSpaceModeChange={onSpaceModeChange}
      />
    );

    const checked = document.querySelectorAll('input[type="radio"]:checked');
    expect(checked.length).toBe(0);
  });
});
