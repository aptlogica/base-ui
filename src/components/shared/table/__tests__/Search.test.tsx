import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Search } from '../Search';

vi.mock('../../../../hooks/useClickOutside', () => ({
  useClickOutside: vi.fn(() => ({ current: null })),
}));

vi.mock('../../../../types/constants', () => ({
  fieldsToExcludeInFilter: [],
}));

const defaultColumns = [
  { key: 'name', title: 'Name', column_name: 'name', type: 'text' },
  { key: 'email', title: 'Email', column_name: 'email', type: 'email' },
];

describe('Search', () => {
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search input with first column placeholder', () => {
    render(<Search columns={defaultColumns} onSearch={mockOnSearch} />);
    expect(screen.getByPlaceholderText('Search in Name')).toBeInTheDocument();
  });

  it('should render field selector button with first column title', () => {
    render(<Search columns={defaultColumns} onSearch={mockOnSearch} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('should apply className to wrapper', () => {
    const { container } = render(
      <Search columns={defaultColumns} onSearch={mockOnSearch} className="my-search" />
    );
    expect(container.querySelector('.my-search')).toBeInTheDocument();
  });

  it('should be disabled when disabled is true', () => {
    render(<Search columns={defaultColumns} onSearch={mockOnSearch} disabled />);
    const input = document.querySelector('input[type="text"]');
    expect(input).toHaveAttribute('disabled');
  });

  it('should call onSearch when input is cleared', async () => {
    render(<Search columns={defaultColumns} onSearch={mockOnSearch} />);
    const input = screen.getByPlaceholderText('Search in Name');
    await userEvent.type(input, 'x');
    await userEvent.clear(input);
    expect(mockOnSearch).toHaveBeenCalledWith('', expect.anything());
  });

  it('should open dropdown when field selector is clicked', async () => {
    render(<Search columns={defaultColumns} onSearch={mockOnSearch} />);
    const button = screen.getByText('Name').closest('button');
    if (button) {
      await userEvent.click(button);
      expect(screen.getByPlaceholderText('Search fields')).toBeInTheDocument();
    }
  });

  it('should use initialSelectedField when provided', () => {
    render(
      <Search
        columns={defaultColumns}
        onSearch={mockOnSearch}
        initialSelectedField={{ key: 'email', title: 'Email', type: 'email' }}
      />
    );
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('should render when columns is empty', () => {
    render(<Search columns={[]} onSearch={mockOnSearch} />);
    expect(document.body).toBeInTheDocument();
  });

  it('filters dropdown fields by internal search input', async () => {
    render(<Search columns={defaultColumns} onSearch={mockOnSearch} />);
    const selector = screen.getByRole('button', { name: /name/i });
    await userEvent.click(selector as HTMLButtonElement);

    const fieldSearch = screen.getByPlaceholderText('Search fields');
    await userEvent.type(fieldSearch, 'ema');

    const list = fieldSearch.closest('div')?.parentElement?.parentElement;
    expect(list).not.toBeNull();
    expect(within(list as HTMLElement).getByText('Email')).toBeInTheDocument();
    expect(within(list as HTMLElement).queryByText('Name')).not.toBeInTheDocument();
  });

  it('excludes non-title system fields from dropdown', async () => {
    const columns = [
      { key: 'title', title: 'Title', column_name: 'title', type: 'text', isSystem: true },
      { key: 'createdBy', title: 'Created By', column_name: 'created_by', type: 'text', isSystem: true },
      { key: 'name', title: 'Name', column_name: 'name', type: 'text' },
    ];

    render(<Search columns={columns as any} onSearch={mockOnSearch} />);
    const selector = screen.getByRole('button', { name: /title/i });
    await userEvent.click(selector as HTMLButtonElement);

    const fieldSearch = screen.getByPlaceholderText('Search fields');
    const list = fieldSearch.closest('div')?.parentElement?.parentElement;
    expect(list).not.toBeNull();
    expect(within(list as HTMLElement).getByText('Title')).toBeInTheDocument();
    expect(within(list as HTMLElement).getByText('Name')).toBeInTheDocument();
    expect(within(list as HTMLElement).queryByText('Created By')).not.toBeInTheDocument();
  });

  it('triggers immediate search when a field is selected', async () => {
    render(<Search columns={defaultColumns} onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText('Search in Name');
    await userEvent.type(input, 'alice');

    const selector = screen.getByText('Name').closest('button');
    await userEvent.click(selector as HTMLButtonElement);
    await userEvent.click(screen.getByText('Email'));

    expect(mockOnSearch).toHaveBeenCalledWith(
      'alice',
      expect.objectContaining({ key: 'email', title: 'Email' })
    );
  });

  it('uses debounce for typing before firing onSearch', async () => {
    vi.useFakeTimers();
    render(<Search columns={defaultColumns} onSearch={mockOnSearch} />);

    const input = screen.getByPlaceholderText('Search in Name');
    fireEvent.change(input, { target: { value: 'abc' } });

    expect(mockOnSearch).not.toHaveBeenCalledWith('abc', expect.anything());

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(mockOnSearch).toHaveBeenCalledWith('abc', expect.anything());
    vi.useRealTimers();
  });

  it('resets selected field when selected key no longer exists after columns change', () => {
    const { rerender } = render(
      <Search
        columns={defaultColumns}
        onSearch={mockOnSearch}
        initialSelectedField={{ key: 'email', title: 'Email', type: 'email' }}
      />
    );

    expect(screen.getByText('Email')).toBeInTheDocument();

    rerender(
      <Search
        columns={[{ key: 'name', title: 'Name', column_name: 'name', type: 'text' }] as any}
        onSearch={mockOnSearch}
        initialSelectedField={{ key: 'email', title: 'Email', type: 'email' }}
      />
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
  });
});
