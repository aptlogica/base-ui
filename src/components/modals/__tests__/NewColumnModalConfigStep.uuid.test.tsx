import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderUuidConfigStep } from '../NewColumnModalConfigStep.uuid';

vi.mock('../NewColumnModalConfigStep', () => ({
  renderDescriptionToggle: () => <div data-testid="description-toggle" />,
}));

// A plain select keeps the option list and the chosen value easy to check
vi.mock('../../common/dropdown/AdvancedDropdown', () => ({
  default: ({ options, value, onChange }: any) => (
    <select data-testid="version-dropdown" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o: any) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  ),
}));

describe('renderUuidConfigStep', () => {
  const setIdGeneration = vi.fn();
  const setUuidBackfill = vi.fn();

  const renderStep = (props: Record<string, any> = {}) =>
    render(<>{renderUuidConfigStep({
      selectedType: { key: 'uuid' },
      idGeneration: { mode: 'auto', version: 'v7' },
      setIdGeneration,
      uuidBackfill: true,
      setUuidBackfill,
      isTurningUuidToAuto: false,
      isPrimaryKeyField: false,
      showDescription: false,
      setShowDescription: vi.fn(),
      description: '',
      setDescription: vi.fn(),
      ...props,
    })}</>);

  beforeEach(() => vi.clearAllMocks());

  it('renders nothing for other field types', () => {
    expect(renderUuidConfigStep({ selectedType: { key: 'text' } })).toBeNull();
  });

  it('shows the version dropdown with v7, v4 and v1, v7 selected', () => {
    renderStep();
    const dropdown = screen.getByTestId('version-dropdown') as HTMLSelectElement;
    expect(dropdown.value).toBe('v7');
    expect(Array.from(dropdown.options).map(o => o.textContent)).toEqual([
      'v7 · Time-ordered (default)',
      'v4 · Random',
      'v1 · Timestamp',
    ]);
    expect(screen.getByText('Sorts by creation time. Good for primary keys and sorting.')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('changes the version', () => {
    renderStep();
    fireEvent.change(screen.getByTestId('version-dropdown'), { target: { value: 'v4' } });
    expect(setIdGeneration).toHaveBeenCalledWith({ mode: 'auto', version: 'v4' });
  });

  it('switches to manual and hides the version dropdown', () => {
    renderStep();
    fireEvent.click(screen.getByRole('button', { name: 'Manual' }));
    expect(setIdGeneration).toHaveBeenCalledWith({ mode: 'manual' });
  });

  it('manual mode has no version settings and no preview', () => {
    renderStep({ idGeneration: { mode: 'manual' } });
    expect(screen.queryByTestId('version-dropdown')).not.toBeInTheDocument();
    expect(screen.queryByText('Preview')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manual' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('explains what happens when an existing manual field becomes auto-generated', () => {
    renderStep({ isTurningUuidToAuto: true, uuidCounts: { empty: 128, filled: 1872 } });
    expect(screen.getByText('What changes when you save')).toBeInTheDocument();
    expect(screen.getByText('New records get a v7 UUID automatically.')).toBeInTheDocument();
    const fill = screen.getByLabelText('Fill the 128 empty records with new UUIDs');
    expect(fill).toBeChecked();
    fireEvent.click(fill);
    expect(setUuidBackfill).toHaveBeenCalledWith(false);
  });

  it('locks filling empty records for a primary key field', () => {
    renderStep({ isTurningUuidToAuto: true, uuidBackfill: false, isPrimaryKeyField: true });
    const fill = screen.getByLabelText('Fill the empty records with new UUIDs');
    expect(fill).toBeChecked();
    expect(fill).toBeDisabled();
    expect(screen.getByText('Required: this field is the primary key, so every record needs a value.')).toBeInTheDocument();
  });
});
