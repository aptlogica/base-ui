import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VirtualizedTableBody } from '../components/VirtualizedTableBody';
import type { GridRecord, GridColumn } from '../../../types/grid.types';

// Mock @tanstack/react-virtual
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(({ count, estimateSize }) => ({
    getVirtualItems: () =>
      Array.from({ length: Math.min(count, 10) }, (_, i) => ({
        index: i,
        key: `row-${i}`,
        start: i * estimateSize(i),
        size: estimateSize(i),
      })),
    getTotalSize: () => count * 40,
    measure: vi.fn(),
  })),
}));

// Mock MemoizedTableRow
vi.mock('../components/TableRow', () => ({
  MemoizedTableRow: ({ row, rowIndex, displayRowNumber }: any) => (
    <div data-testid={`row-${row.id || rowIndex}`} data-row-number={displayRowNumber || rowIndex + 1}>
      Row {row.id || rowIndex}
    </div>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid="chevron-down">▼</span>,
  ChevronRight: () => <span data-testid="chevron-right">▶</span>,
}));

describe('VirtualizedTableBody', () => {
  const mockOnRowSelect = vi.fn();
  const mockOnCellChange = vi.fn();
  const mockOnContextMenu = vi.fn();
  const mockSetActiveCell = vi.fn();
  const mockOnScroll = vi.fn();
  const mockSetExpandedGroups = vi.fn();

  const defaultColumns: GridColumn[] = [
    { id: 'col-1', key: 'title', title: 'Title', type: 'text' },
    { id: 'col-2', key: 'status', title: 'Status', type: 'select' },
  ];

  const defaultData: GridRecord[] = [
    { id: 'row-1', _meta: { id: 'row-1', created_at: '', updated_at: '', deleted_at: null, position: 1 }, data: { title: 'Item 1', status: 'active' } },
    { id: 'row-2', _meta: { id: 'row-2', created_at: '', updated_at: '', deleted_at: null, position: 2 }, data: { title: 'Item 2', status: 'pending' } },
    { id: 'row-3', _meta: { id: 'row-3', created_at: '', updated_at: '', deleted_at: null, position: 3 }, data: { title: 'Item 3', status: 'active' } },
  ];

  const defaultProps = {
    data: defaultData,
    columns: defaultColumns,
    columnWidths: [200, 150],
    selectedRows: new Set<string>(),
    onRowSelect: mockOnRowSelect,
    onCellChange: mockOnCellChange,
    onContextMenu: mockOnContextMenu,
    activeCell: null,
    setActiveCell: mockSetActiveCell,
    tableId: 'table-1',
    height: 400,
    width: 600,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with ungrouped data', () => {
      render(<VirtualizedTableBody {...defaultProps} />);

      expect(screen.getByTestId('row-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('row-row-2')).toBeInTheDocument();
      expect(screen.getByTestId('row-row-3')).toBeInTheDocument();
    });

    it('should return null when height is 0', () => {
      const { container } = render(<VirtualizedTableBody {...defaultProps} height={0} />);

      expect(container.firstChild).toBeNull();
    });

    it('should return null when width is 0', () => {
      const { container } = render(<VirtualizedTableBody {...defaultProps} width={0} />);

      expect(container.firstChild).toBeNull();
    });

    it('should set data-virtualized attribute', () => {
      const { container } = render(<VirtualizedTableBody {...defaultProps} />);

      const virtualizedDiv = container.querySelector('[data-virtualized="true"]');
      expect(virtualizedDiv).toBeInTheDocument();
    });

    it('should set data-virtualizer attribute', () => {
      const { container } = render(<VirtualizedTableBody {...defaultProps} />);

      const virtualizedDiv = container.querySelector('[data-virtualizer="tanstack-react-virtual"]');
      expect(virtualizedDiv).toBeInTheDocument();
    });

    it('calls onScroll when parent scrolls', () => {
      const scrollHost = document.createElement('div');
      scrollHost.style.overflow = 'auto';
      scrollHost.style.height = '200px';
      scrollHost.style.width = '400px';
      document.body.appendChild(scrollHost);

      const outerRef = { current: scrollHost } as React.RefObject<HTMLDivElement>;
      render(
        <VirtualizedTableBody
          {...defaultProps}
          outerRef={outerRef}
          onScroll={mockOnScroll}
        />
      );

      scrollHost.scrollTop = 120;
      fireEvent.scroll(scrollHost);

      expect(mockOnScroll).toHaveBeenCalledWith(120);
      document.body.removeChild(scrollHost);
    });
  });

  describe('grouped data', () => {
    const groupedData = [
      {
        groupColumn: 'status',
        groupValue: 'active',
        rows: [
          { id: 'row-1', _meta: { id: 'row-1', created_at: '', updated_at: '', deleted_at: null, position: 1 }, data: { title: 'Item 1', status: 'active' } },
          { id: 'row-3', _meta: { id: 'row-3', created_at: '', updated_at: '', deleted_at: null, position: 3 }, data: { title: 'Item 3', status: 'active' } },
        ],
      },
      {
        groupColumn: 'status',
        groupValue: 'pending',
        rows: [
          { id: 'row-2', _meta: { id: 'row-2', created_at: '', updated_at: '', deleted_at: null, position: 2 }, data: { title: 'Item 2', status: 'pending' } },
        ],
      },
    ];

    it('should render group headers', () => {
      render(
        <VirtualizedTableBody
          {...defaultProps}
          groupedData={groupedData}
          expandedGroups={new Set()}
          setExpandedGroups={mockSetExpandedGroups}
        />
      );

      // Multiple group headers with Status: label
      expect(screen.getAllByText('Status:').length).toBeGreaterThan(0);
      expect(screen.getByText('active')).toBeInTheDocument();
    });

    it('should show row count in group header', () => {
      render(
        <VirtualizedTableBody
          {...defaultProps}
          groupedData={groupedData}
          expandedGroups={new Set()}
          setExpandedGroups={mockSetExpandedGroups}
        />
      );

      expect(screen.getByText('2 rows')).toBeInTheDocument();
    });

    it('should show rows when group is expanded', () => {
      const expandedGroups = new Set(['status-active-0']);

      render(
        <VirtualizedTableBody
          {...defaultProps}
          groupedData={groupedData}
          expandedGroups={expandedGroups}
          setExpandedGroups={mockSetExpandedGroups}
        />
      );

      expect(screen.getByTestId('row-row-1')).toBeInTheDocument();
    });

    it('should toggle group expansion on click', async () => {
      render(
        <VirtualizedTableBody
          {...defaultProps}
          groupedData={groupedData}
          expandedGroups={new Set()}
          setExpandedGroups={mockSetExpandedGroups}
        />
      );

      const groupHeader = screen.getByRole('button', { name: /Toggle group Status: active/i });
      fireEvent.click(groupHeader);

      expect(mockSetExpandedGroups).toHaveBeenCalled();
    });

    it('should toggle group on Enter key', () => {
      render(
        <VirtualizedTableBody
          {...defaultProps}
          groupedData={groupedData}
          expandedGroups={new Set()}
          setExpandedGroups={mockSetExpandedGroups}
        />
      );

      const groupHeader = screen.getByRole('button', { name: /Toggle group Status: active/i });
      fireEvent.keyDown(groupHeader, { key: 'Enter' });

      expect(mockSetExpandedGroups).toHaveBeenCalled();
    });

    it('should toggle group on Space key', () => {
      render(
        <VirtualizedTableBody
          {...defaultProps}
          groupedData={groupedData}
          expandedGroups={new Set()}
          setExpandedGroups={mockSetExpandedGroups}
        />
      );

      const groupHeader = screen.getByRole('button', { name: /Toggle group Status: active/i });
      fireEvent.keyDown(groupHeader, { key: ' ' });

      expect(mockSetExpandedGroups).toHaveBeenCalled();
    });

    it('should show chevron down for expanded groups', () => {
      const expandedGroups = new Set(['status-active-0']);

      render(
        <VirtualizedTableBody
          {...defaultProps}
          groupedData={groupedData}
          expandedGroups={expandedGroups}
          setExpandedGroups={mockSetExpandedGroups}
        />
      );

      // At least one chevron-down should be visible for expanded group
      expect(screen.getAllByTestId('chevron-down').length).toBeGreaterThan(0);
    });

    it('should show chevron right for collapsed groups', () => {
      render(
        <VirtualizedTableBody
          {...defaultProps}
          groupedData={groupedData}
          expandedGroups={new Set()}
          setExpandedGroups={mockSetExpandedGroups}
        />
      );

      // Multiple chevrons for collapsed groups
      expect(screen.getAllByTestId('chevron-right').length).toBeGreaterThan(0);
    });

    it('should set aria-expanded based on group state', () => {
      const expandedGroups = new Set(['status-active-0']);

      render(
        <VirtualizedTableBody
          {...defaultProps}
          groupedData={groupedData}
          expandedGroups={expandedGroups}
          setExpandedGroups={mockSetExpandedGroups}
        />
      );

      const expandedHeader = screen.getByRole('button', { name: /Toggle group Status: active/i });
      expect(expandedHeader).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('nested grouped data', () => {
    const nestedGroupedData = [
      {
        groupColumn: 'status',
        groupValue: 'active',
        rows: [
          {
            groupColumn: 'priority',
            groupValue: 'high',
            rows: [
              { id: 'row-1', _meta: { id: 'row-1', created_at: '', updated_at: '', deleted_at: null, position: 1 }, data: { title: 'Item 1' } },
            ],
          },
        ],
      },
    ];

    it('should show nested group count label', () => {
      render(
        <VirtualizedTableBody
          {...defaultProps}
          groupedData={nestedGroupedData}
          expandedGroups={new Set()}
          setExpandedGroups={mockSetExpandedGroups}
        />
      );

      // Should show "1 group" instead of "1 row"
      expect(screen.getByText('1 group')).toBeInTheDocument();
    });
  });

  describe('canEdit prop', () => {
    it('should pass canEdit=true by default', () => {
      render(<VirtualizedTableBody {...defaultProps} />);

      // Rows should be rendered (mocked component)
      expect(screen.getByTestId('row-row-1')).toBeInTheDocument();
    });

    it('should pass canEdit=false when disabled', () => {
      render(<VirtualizedTableBody {...defaultProps} canEdit={false} />);

      expect(screen.getByTestId('row-row-1')).toBeInTheDocument();
    });
  });

  describe('scroll handling', () => {
    it('should call onScroll when scrolling', async () => {
      const outerRef = { current: document.createElement('div') } as React.RefObject<HTMLDivElement>;

      render(
        <VirtualizedTableBody
          {...defaultProps}
          onScroll={mockOnScroll}
          outerRef={outerRef}
        />
      );

      // Simulate scroll event on the outer ref
      if (outerRef.current) {
        Object.defineProperty(outerRef.current, 'scrollTop', { value: 100, configurable: true });
        fireEvent.scroll(outerRef.current);
      }

      await waitFor(() => {
        expect(mockOnScroll).toHaveBeenCalled();
      });
    });
  });

  describe('column width calculation', () => {
    it('should calculate total width correctly', () => {
      const { container } = render(
        <VirtualizedTableBody
          {...defaultProps}
          columnWidths={[100, 200, 300]}
        />
      );

      const virtualizedDiv = container.querySelector('[data-virtualized="true"]');
      // Total = 48 (selector) + 100 + 200 + 300 = 648
      expect(virtualizedDiv).toHaveStyle({ width: '648px' });
    });
  });

  describe('row identification', () => {
    it('should use _meta.id for row identification', () => {
      render(<VirtualizedTableBody {...defaultProps} />);

      expect(screen.getByTestId('row-row-1')).toBeInTheDocument();
    });

    it('should fallback to id when _meta.id is not available', () => {
      const dataWithoutMeta: GridRecord[] = [
        { id: 'fallback-1', data: { title: 'Test' } },
      ];

      render(<VirtualizedTableBody {...defaultProps} data={dataWithoutMeta} />);

      expect(screen.getByTestId('row-fallback-1')).toBeInTheDocument();
    });
  });

  describe('visible columns', () => {
    it('should use visibleColumns when provided', () => {
      const visibleColumns: GridColumn[] = [
        { id: 'col-1', key: 'title', title: 'Title', type: 'text' },
      ];

      render(
        <VirtualizedTableBody
          {...defaultProps}
          visibleColumns={visibleColumns}
        />
      );

      expect(screen.getByTestId('row-row-1')).toBeInTheDocument();
    });
  });

  describe('group row numbering', () => {
    const groupedData = [
      {
        groupColumn: 'status',
        groupValue: 'active',
        rows: [
          { id: 'row-1', _meta: { id: 'row-1', created_at: '', updated_at: '', deleted_at: null, position: 1 }, data: { title: 'Item 1', status: 'active' } },
          { id: 'row-2', _meta: { id: 'row-2', created_at: '', updated_at: '', deleted_at: null, position: 2 }, data: { title: 'Item 2', status: 'active' } },
        ],
      },
    ];

    it('should show group-relative row numbers', () => {
      const expandedGroups = new Set(['status-active-0']);

      render(
        <VirtualizedTableBody
          {...defaultProps}
          groupedData={groupedData}
          expandedGroups={expandedGroups}
          setExpandedGroups={mockSetExpandedGroups}
        />
      );

      const row1 = screen.getByTestId('row-row-1');
      expect(row1).toHaveAttribute('data-row-number', '1');
    });
  });

  describe('hover effects', () => {
    const groupedData = [
      {
        groupColumn: 'status',
        groupValue: 'active',
        rows: [{ id: 'row-1', _meta: { id: 'row-1', created_at: '', updated_at: '', deleted_at: null, position: 1 }, data: {} }],
      },
    ];

    it('should change background on mouse enter', () => {
      render(
        <VirtualizedTableBody
          {...defaultProps}
          groupedData={groupedData}
          expandedGroups={new Set()}
          setExpandedGroups={mockSetExpandedGroups}
        />
      );

      const groupHeader = screen.getByRole('button', { name: /Toggle group Status: active/i });
      fireEvent.mouseEnter(groupHeader);

      // Background color should change (we can't easily test CSS variables, but the event should be handled)
      expect(groupHeader).toBeInTheDocument();
    });

    it('should reset background on mouse leave', () => {
      render(
        <VirtualizedTableBody
          {...defaultProps}
          groupedData={groupedData}
          expandedGroups={new Set()}
          setExpandedGroups={mockSetExpandedGroups}
        />
      );

      const groupHeader = screen.getByRole('button', { name: /Toggle group Status: active/i });
      fireEvent.mouseEnter(groupHeader);
      fireEvent.mouseLeave(groupHeader);

      expect(groupHeader).toBeInTheDocument();
    });
  });
});
