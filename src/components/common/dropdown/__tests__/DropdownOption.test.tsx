import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DropdownOption } from '../../dropdown/DropdownOption';

type Opt<T> = {
  label: string;
  value: T;
  disabled?: boolean;
  description?: string;
  icon?: React.ReactNode;
};

describe('DropdownOption', () => {
  it('renders label, description, and icon', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const option: Opt<string> = {
      label: 'Alpha',
      value: 'alpha',
      description: 'First',
      icon: <span data-testid="icon">I</span>
    };
    render(
      <DropdownOption
        option={option}
        isSelected={false}
        isFocused={false}
        multiple={false}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByRole('option')).toHaveTextContent('Alpha');
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  it('calls onClick when enabled, not when disabled', () => {
    const onClick = vi.fn();
    render(
      <DropdownOption
        option={{ label: 'Alpha', value: 'alpha' }}
        isSelected={false}
        isFocused={false}
        multiple={false}
        onClick={onClick}
      />
    );
    fireEvent.click(screen.getByRole('option'));
    expect(onClick).toHaveBeenCalledTimes(1);

    onClick.mockReset();
    render(
      <DropdownOption
        option={{ label: 'Gamma', value: 'gamma', disabled: true }}
        isSelected={false}
        isFocused={false}
        multiple={false}
        onClick={onClick}
      />
    );
    fireEvent.click(screen.getByText('Gamma'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows check icon when selected (single and multiple)', () => {
    const { rerender } = render(
      <DropdownOption
        option={{ label: 'Alpha', value: 'alpha' }}
        isSelected
        isFocused={false}
        multiple={false}
        onClick={vi.fn()}
      />
    );
    const option = screen.getByRole('option');
    expect(option.querySelector('svg')).toBeInTheDocument();

    rerender(
      <DropdownOption
        option={{ label: 'Alpha', value: 'alpha' }}
        isSelected
        isFocused={false}
        multiple={true}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByRole('option').querySelector('svg')).toBeInTheDocument();
  });
});