import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { DropdownOption } from '../DropdownOption';

describe('DropdownOption', () => {
  it('renders label and description and handles click', () => {
    const onClick = vi.fn();
    const { getByText, getByRole } = render(
      <select>
        <DropdownOption
          option={{ label: 'Option A', value: 'a', description: 'desc' }}
          isSelected={false}
          isFocused={false}
          multiple={false}
          onClick={onClick}
        />
      </select>
    );

    expect(getByText('Option A')).toBeInTheDocument();
    expect(getByText('desc')).toBeInTheDocument();
    fireEvent.click(getByRole('option'));
    expect(onClick).toHaveBeenCalled();
  });

  it('supports keyboard activation when enabled', () => {
    const onClick = vi.fn();
    const { getByRole } = render(
      <select>
        <DropdownOption
          option={{ label: 'Option B', value: 'b' }}
          isSelected={true}
          isFocused={true}
          multiple={true}
          onClick={onClick}
        />
      </select>
    );

    const option = getByRole('option');
    fireEvent.keyDown(option, { key: 'Enter' });
    fireEvent.keyDown(option, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('disables interaction when option is disabled', () => {
    const onClick = vi.fn();
    const { getByRole } = render(
      <select>
        <DropdownOption
          option={{ label: 'Option C', value: 'c', disabled: true }}
          isSelected={false}
          isFocused={false}
          multiple={false}
          onClick={onClick}
        />
      </select>
    );

    const option = getByRole('option');
    fireEvent.click(option);
    fireEvent.keyDown(option, { key: 'Enter' });
    expect(onClick).not.toHaveBeenCalled();
    expect(option).toHaveAttribute('aria-disabled', 'true');
  });
});
