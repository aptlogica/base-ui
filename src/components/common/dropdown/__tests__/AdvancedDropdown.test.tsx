import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import AdvancedDropdown from '../../dropdown/AdvancedDropdown';

type Opt = { label: string; value: string; disabled?: boolean; description?: string; rightLabel?: string };

const options: Opt[] = [
  { label: 'Alpha', value: 'alpha', description: 'First option' },
  { label: 'Beta', value: 'beta', rightLabel: 'B' },
  { label: 'Gamma', value: 'gamma', disabled: true },
];

function setup(props?: Partial<React.ComponentProps<typeof AdvancedDropdown<string>>> ) {
  const onChange = vi.fn();
  render(
    <AdvancedDropdown
      options={options}
      onChange={onChange}
      placeholder="Select an option..."
      {...props}
    />
  );
  return { onChange };
}

describe('AdvancedDropdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders placeholder when no selection', () => {
    setup();
    expect(screen.getByRole('button')).toHaveTextContent('Select an option...');
  });

  it('opens and closes the dropdown via trigger click', () => {
    setup();
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Click outside to close
    fireEvent.mouseDown(document.body);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('filters options when searchable and shows no results', () => {
    setup({ searchable: true });
    fireEvent.click(screen.getByRole('button'));
    const input = screen.getByPlaceholderText('Search options...');
    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('selects single option and closes', () => {
    const { onChange } = setup();
    fireEvent.click(screen.getByRole('button'));
    const list = screen.getByRole('listbox');
    const alpha = within(list).getByText('Alpha');
    fireEvent.click(alpha);
    expect(onChange).toHaveBeenCalledWith('alpha');
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles multiple selections, display count and label', () => {
    const { onChange } = setup({ multiple: true, value: [], clearable: false });
    const button = screen.getByRole('button');
    fireEvent.click(button);
    const list = screen.getByRole('listbox');

    fireEvent.click(within(list).getByText('Alpha'));
    expect(onChange).toHaveBeenCalledWith(['alpha']);

    // Re-render with updated value to simulate controlled component without adding clear button
    const { onChange: onChange2 } = setup({ multiple: true, value: ['alpha'], clearable: false });
    const triggerButtons = screen.getAllByRole('button');
    const secondTrigger = triggerButtons[triggerButtons.length - 1];
    fireEvent.click(secondTrigger);
    const listboxes = screen.getAllByRole('listbox');
    const secondList = listboxes[listboxes.length - 1];
    fireEvent.click(within(secondList).getByText('Beta'));
    expect(onChange2).toHaveBeenCalledWith(['alpha', 'beta']);

    // Badge shows count on first trigger
    expect(button).toHaveTextContent('2');
  });

  it('renders rightLabel when provided', () => {
    setup();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('clear button clears selection (multiple)', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { onChange } = setup({ multiple: true, value: ['alpha', 'beta'], clearable: true });
    const clearButton = screen.getByLabelText('Clear selection');
    fireEvent.click(clearButton);
    expect(onChange).toHaveBeenCalledWith([]);
    errorSpy.mockRestore();
  });

  it('clear button clears selection (single)', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { onChange } = setup({ value: 'alpha', clearable: true });
    const clearButton = screen.getByLabelText('Clear selection');
    fireEvent.click(clearButton);
    expect(onChange).toHaveBeenCalledWith(undefined);
    errorSpy.mockRestore();
  });

  it('shows validation error over external error', () => {
    const validate = () => 'Validation error';
    setup({ value: 'alpha', error: 'External error', validate });
    expect(screen.getByRole('alert')).toHaveTextContent('Validation error');
  });

  it('shows external error when no validation error', () => {
    setup({ value: 'alpha', error: 'External error' });
    expect(screen.getByRole('alert')).toHaveTextContent('External error');
  });

  it('does not open when disabled or loading', () => {
    setup({ disabled: true });
    const btn1 = screen.getByRole('button');
    fireEvent.click(btn1);
    expect(btn1).toHaveAttribute('aria-expanded', 'false');

    render(<AdvancedDropdown options={options} onChange={vi.fn()} loading />);
    const btn2 = screen.getAllByRole('button')[1];
    fireEvent.click(btn2);
    expect(btn2).toHaveAttribute('aria-expanded', 'false');
  });

  it('keyboard navigation selects focused option and Escape closes', () => {
    // Mock scrollIntoView for JSDOM
    Element.prototype.scrollIntoView = vi.fn();
    
    const { onChange } = setup();
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onChange).toHaveBeenCalled();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('respects disabled option and does not select it', () => {
    const { onChange } = setup();
    fireEvent.click(screen.getByRole('button'));
    const list = screen.getByRole('listbox');
    fireEvent.click(within(list).getByText('Gamma'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('positions menu above when not enough space below', () => {
    setup();
    const btn = screen.getByRole('button');

    // Mock getBoundingClientRect to force above positioning
    const rect = { top: 500, bottom: 520, left: 0, right: 200, width: 200, height: 20 } as DOMRect;
    (btn as any).getBoundingClientRect = vi.fn(() => rect);
    Object.defineProperty(globalThis, 'innerHeight', { value: 530, writable: true });

    fireEvent.click(btn);
    const menu = screen.getByRole('listbox').parentElement as HTMLElement;
    expect(menu.className).toMatch(/bottom-full/);
  });
});