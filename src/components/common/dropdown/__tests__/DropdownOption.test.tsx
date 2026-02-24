import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { DropdownOption } from '../DropdownOption';

describe('DropdownOption', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders label and description and handles click', () => {
    const onClick = vi.fn();
    const { getByText } = render(
      <ul role="listbox">
        <DropdownOption
          option={{ label: 'Option A', value: 'a', description: 'desc' }}
          isSelected={false}
          isFocused={false}
          multiple={false}
          onClick={onClick}
        />
      </ul>
    );

    expect(getByText('Option A')).toBeInTheDocument();
    expect(getByText('desc')).toBeInTheDocument();
    fireEvent.click(getByText('Option A').closest('li') as HTMLElement);
    expect(onClick).toHaveBeenCalled();
  });

  it('supports keyboard activation when enabled', () => {
    const onClick = vi.fn();
    const { getByText } = render(
      <ul role="listbox">
        <DropdownOption
          option={{ label: 'Option B', value: 'b' }}
          isSelected={true}
          isFocused={true}
          multiple={true}
          onClick={onClick}
        />
      </ul>
    );

    const option = getByText('Option B').closest('li') as HTMLElement;
    fireEvent.keyDown(option, { key: 'Enter' });
    fireEvent.keyDown(option, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('disables interaction when option is disabled', () => {
    const onClick = vi.fn();
    const { getByText } = render(
      <ul role="listbox">
        <DropdownOption
          option={{ label: 'Option C', value: 'c', disabled: true }}
          isSelected={false}
          isFocused={false}
          multiple={false}
          onClick={onClick}
        />
      </ul>
    );

    const option = getByText('Option C').closest('li') as HTMLElement;
    fireEvent.click(option);
    fireEvent.keyDown(option, { key: 'Enter' });
    expect(onClick).not.toHaveBeenCalled();
    expect(option).toHaveAttribute('aria-disabled', 'true');
  });
});
