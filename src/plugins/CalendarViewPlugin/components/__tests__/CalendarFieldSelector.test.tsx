import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarFieldConfiguration } from '../CalendarFieldSelector';
import type { GridColumn } from '../../../GridViewPlugin/types/grid.types';

const onChangeSpy = vi.fn();
const validateSpy = vi.fn();

vi.mock('../../../shared/FieldConfigPopover', () => ({
  FieldConfigPopover: (props: any) => {
    const { options, value, onChange, validate, buttonLabel, title, dropdownLabel } = props;
    return (
      <div>
        <div data-testid="button-label">{buttonLabel}</div>
        <div data-testid="title">{title}</div>
        <div data-testid="dropdown-label">{dropdownLabel}</div>
        <div data-testid="value">{value ?? ''}</div>
        <button type="button" onClick={() => onChange(options[0]?.value)}>
          select-first
        </button>
        <button type="button" onClick={() => validateSpy(validate(''))}>
          validate-empty
        </button>
      </div>
    );
  },
}));

vi.mock('../../../types/fieldTypes', () => ({
  getFieldTypeIconWithMargin: () => null,
  getRelationTypeFromField: () => null,
}));

describe('CalendarFieldConfiguration', () => {
  const columns: GridColumn[] = [
    { id: 'c1', key: 'title', title: 'Title', type: 'text' },
    { id: 'c2', key: 'due', title: 'Due', type: 'date' },
    { id: 'c3', key: 'start', title: 'Start', type: 'datetime' },
  ];

  it('renders nothing when onDateFieldChange is not provided', () => {
    const { container } = render(
      <CalendarFieldConfiguration columns={columns} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('filters date columns and calls onDateFieldChange with selected field', () => {
    render(
      <CalendarFieldConfiguration
        columns={columns}
        dateField={columns[1]}
        onDateFieldChange={onChangeSpy}
      />
    );

    expect(screen.getByTestId('button-label')).toHaveTextContent('Calendar Fields');
    expect(screen.getByTestId('title')).toHaveTextContent('Configure Calendar Fields');
    expect(screen.getByTestId('dropdown-label')).toHaveTextContent('Date Field');
    expect(screen.getByTestId('value')).toHaveTextContent('c2');

    fireEvent.click(screen.getByText('select-first'));
    expect(onChangeSpy).toHaveBeenCalledWith(columns[1]);
  });

  it('validates required selection', () => {
    render(
      <CalendarFieldConfiguration
        columns={columns}
        onDateFieldChange={onChangeSpy}
      />
    );

    fireEvent.click(screen.getByText('validate-empty'));
    expect(validateSpy).toHaveBeenCalledWith('Date Field is required');
  });
});
