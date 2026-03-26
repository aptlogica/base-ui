import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderBasicConfigStep } from '../NewColumnModalConfigStep.basic';

vi.mock('../NewColumnModalConfigStep', () => ({
  renderDescriptionToggle: () => <div data-testid="description-toggle" />,
}));

vi.mock('../../common/dropdown/AdvancedDropdown', () => ({
  default: ({ onChange }: any) => (
    <button type="button" onClick={() => onChange('0.00')}>
      Precision
    </button>
  ),
}));

vi.mock('../../common/Fields', () => ({
  SingleLineText: ({ value, onChange }: any) => (
    <input
      data-testid="single-line"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
  LongText: ({ value, onChange }: any) => (
    <textarea
      data-testid="long-text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
  NumberField: ({ value, onChange }: any) => (
    <input
      data-testid="number-field"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
  Decimal: ({ onChange }: any) => (
    <input
      data-testid="decimal-field"
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const baseProps = {
  defaultValue: '',
  setDefaultValue: vi.fn(),
  showTextDefault: false,
  setShowTextDefault: vi.fn(),
  showDescription: false,
  setShowDescription: vi.fn(),
  description: '',
  setDescription: vi.fn(),
  richText: false,
  setRichText: vi.fn(),
  showThousands: false,
  setShowThousands: vi.fn(),
  precision: '0.00',
  setPrecision: vi.fn(),
  handleLongtextModalOpen: vi.fn(),
  handleLongtextModalClose: vi.fn(),
};

describe('renderBasicConfigStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders text default input when enabled and updates value', () => {
    render(
      <div>
        {renderBasicConfigStep({
          ...baseProps,
          selectedType: { key: 'text' },
          showTextDefault: true,
        })}
      </div>
    );

    fireEvent.change(screen.getByTestId('single-line'), { target: { value: 'hello' } });
    expect(baseProps.setDefaultValue).toHaveBeenCalledWith('hello');
    expect(screen.getByTestId('description-toggle')).toBeInTheDocument();
  });

  it('renders decimal config and updates precision/default', () => {
    render(
      <div>
        {renderBasicConfigStep({
          ...baseProps,
          selectedType: { key: 'decimal' },
          showTextDefault: true,
          defaultValue: '3.14',
        })}
      </div>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Precision' }));
    expect(baseProps.setPrecision).toHaveBeenCalledWith('0.00');

    fireEvent.change(screen.getByTestId('decimal-field'), { target: { value: '2.5' } });
    expect(baseProps.setDefaultValue).toHaveBeenCalledWith('2.5');
  });
});
