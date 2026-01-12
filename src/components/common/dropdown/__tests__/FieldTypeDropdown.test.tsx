import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FieldTypeDropdown } from '../fieldDropdown/FieldTypeDropdown';

const Icon = ({ className }: { className?: string }) => <span data-testid="icon" className={className}>I</span>;

const fieldTypes = [
  { key: 'str', label: 'String', icon: Icon },
  { key: 'num', label: 'Number', icon: Icon },
];

describe('FieldTypeDropdown', () => {
  it('renders selected type and toggles open/close', () => {
    const setSelectedType = vi.fn();
    render(
      <FieldTypeDropdown
        selectedType={fieldTypes[0]}
        setSelectedType={setSelectedType}
        fieldTypes={fieldTypes}
      />
    );
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('String');
    fireEvent.click(button);
    expect(screen.getByText('Number')).toBeInTheDocument();
  });

  it('selects a type and closes', () => {
    const setSelectedType = vi.fn();
    render(
      <FieldTypeDropdown
        selectedType={fieldTypes[0]}
        setSelectedType={setSelectedType}
        fieldTypes={fieldTypes}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Number'));
    expect(setSelectedType).toHaveBeenCalledWith(fieldTypes[1]);
    expect(screen.queryByText('Number')).not.toBeInTheDocument();
  });

  it('does not open when disabled', () => {
    render(
      <FieldTypeDropdown
        selectedType={fieldTypes[0]}
        setSelectedType={vi.fn()}
        fieldTypes={fieldTypes}
        disabled
      />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.queryByText('Number')).not.toBeInTheDocument();
  });

  it('closes on outside click', () => {
    render(
      <FieldTypeDropdown
        selectedType={fieldTypes[0]}
        setSelectedType={vi.fn()}
        fieldTypes={fieldTypes}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Number')).not.toBeInTheDocument();
  });

  it('renders icon for selected and list items', () => {
    render(
      <FieldTypeDropdown
        selectedType={fieldTypes[0]}
        setSelectedType={vi.fn()}
        fieldTypes={fieldTypes}
      />
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getAllByTestId('icon').length).toBeGreaterThan(1);
  });
});