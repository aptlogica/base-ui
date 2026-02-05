import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarView from '../CalendarView';
import { useCalendarDateNavigation } from '../../hooks/useCalendarDateNavigation';
import { useCalendarModals } from '../../hooks/useCalendarModals';
import { useCalendarViewConfig } from '../../hooks/useCalendarViewConfig';
import { useBaseAccess } from '../../../../hooks/useBaseAccess';
import { applyFilters } from '../../../../utils/filterUtils';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useLocation: vi.fn(() => ({ pathname: '/test', search: '', hash: '', state: null })),
  useNavigate: vi.fn(() => vi.fn()),
  useParams: vi.fn(() => ({})),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>
}));

// Mock AuthContext (path from components/__tests__/ to src/auth)
vi.mock('../../../../auth/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '1', email: 'test@test.com' },
    isAuthenticated: true,
    loading: false
  }))
}));

// Mock all child components
vi.mock('../CalendarHeader', () => ({
  default: ({ onViewChange, onExport, onCreateRecord }: any) => (
    <div data-testid="calendar-header">
      <button onClick={() => onViewChange?.('week')}>Change View</button>
      <button onClick={onExport}>Export</button>
      {onCreateRecord && <button onClick={onCreateRecord}>Create</button>}
    </div>
  )
}));

vi.mock('../EventsSidebar', () => ({
  default: ({ onEventClick, onCreateRecord, events }: any) => (
    <div data-testid="events-sidebar">
      <div>{events.length} events</div>
      {onEventClick && <button onClick={() => onEventClick?.(events[0])}>Click Event</button>}
      {onCreateRecord && <button onClick={onCreateRecord}>Sidebar Create</button>}
    </div>
  )
}));

vi.mock('../MonthView', () => ({
  default: ({ onEventClick, onDateClick, events }: any) => (
    <div data-testid="month-view">
      <div>{events.length} events in month</div>
      {onEventClick && <button onClick={() => onEventClick?.(events[0])}>Month Event Click</button>}
      {onDateClick && <button onClick={() => onDateClick?.(new Date())}>Month Date Click</button>}
    </div>
  )
}));

vi.mock('../WeekView', () => ({
  default: ({ onEventClick, events }: any) => (
    <div data-testid="week-view">
      <div>{events.length} events in week</div>
      {onEventClick && <button onClick={() => onEventClick?.(events[0])}>Week Event Click</button>}
    </div>
  )
}));

vi.mock('../DayView', () => ({
  default: ({ events }: any) => (
    <div data-testid="day-view">
      <div>{events.length} events in day</div>
    </div>
  )
}));

vi.mock('../YearView', () => ({
  default: ({ events }: any) => (
    <div data-testid="year-view">
      <div>{events.length} events in year</div>
    </div>
  )
}));

vi.mock('../ExportModal', () => ({
  default: ({ isOpen, onClose }: any) => (
    isOpen ? <div data-testid="export-modal"><button onClick={onClose}>Close Export</button></div> : null
  )
}));

vi.mock('../../../../components/modals/CreateRecordModal', () => ({
  default: ({ isOpen, onClose, onSuccess }: any) => (
    isOpen ? (
      <div data-testid="create-modal">
        <button onClick={onClose}>Close Create</button>
        <button onClick={onSuccess}>Success Create</button>
      </div>
    ) : null
  )
}));

vi.mock('../../../../components/modals/EditRecordModal', () => ({
  default: ({ isOpen, onClose, onSuccess, onDelete }: any) => (
    isOpen ? (
      <div data-testid="edit-modal">
        <button onClick={onClose}>Close Edit</button>
        <button onClick={onSuccess}>Success Edit</button>
        {onDelete && <button onClick={() => onDelete?.('1')}>Delete</button>}
      </div>
    ) : null
  )
}));

vi.mock('../../hooks/useCalendarViewConfig', () => ({
  useCalendarViewConfig: vi.fn(() => ({
    filters: [],
    sorts: [],
    draftFilter: null,
    localFieldConfig: [],
    visibleColumns: [],
    handleRealTimeFilter: vi.fn(),
    handleAddFilter: vi.fn(),
    handleRemoveFilter: vi.fn(),
    handleUpdateFilter: vi.fn(),
    handleSortChange: vi.fn(),
    handleFieldToggle: vi.fn(),
    handleFieldOrderChange: vi.fn(),
    setLocalFieldConfig: vi.fn()
  }))
}));

vi.mock('../../hooks/useCalendarModals', () => ({
  useCalendarModals: vi.fn(() => ({
    modalState: {
      create: { isOpen: false, selectedDate: null },
      edit: { isOpen: false, selectedEvent: null },
      export: { isOpen: false }
    },
    handleOpenCreateModal: vi.fn(),
    handleOpenEditModal: vi.fn(),
    handleOpenExportModal: vi.fn(),
    handleCloseCreateModal: vi.fn(),
    handleCloseEditModal: vi.fn(),
    handleCloseExportModal: vi.fn(),
    handleCreateSuccess: vi.fn(),
    handleEditSuccess: vi.fn(),
    handleDeleteRecordFromModal: vi.fn()
  }))
}));

vi.mock('../../hooks/useCalendarDateNavigation', () => ({
  useCalendarDateNavigation: vi.fn(() => ({
    currentDate: new Date('2026-01-15'),
    setCurrentDate: vi.fn(),
    selectedDate: null,
    setSelectedDate: vi.fn(),
    currentView: 'month',
    setCurrentView: vi.fn(),
    sidebarCollapsed: false,
    setSidebarCollapsed: vi.fn(),
    toggleSidebar: vi.fn(),
    goToPrevious: vi.fn(),
    goToNext: vi.fn(),
    goToToday: vi.fn(),
    changeView: vi.fn()
  }))
}));

vi.mock('../../../../hooks/useBaseAccess', () => ({
  useBaseAccess: vi.fn(() => ({
    isBaseReadOnly: () => false,
    canCreateRecord: () => true,
    canDeleteRecord: () => true,
    canUpdateRecord: () => true
  }))
}));

vi.mock('../../../../utils/filterUtils', () => ({
  applyFilters: vi.fn((records) => records)
}));

vi.mock('../../../../utils/initialValues', () => ({
  buildInitialValuesForEdit: vi.fn(() => ({}))
}));

vi.mock('../../../../utils/dateUtils', () => ({
  utcISOToZoned: vi.fn((dateStr) => dateStr.replace('Z', '').replace('T', ' '))
}));

describe('CalendarView', () => {
  const mockTableData = {
    model: {
      id: 'table-1',
      base_id: 'base-1',
      title: 'Test Calendar'
    },
    columns: [
      {
        id: '1',
        column_name: 'start_date',
        title: 'Start Date',
        uidt: 'datetime',
        order_index: 0
      },
      {
        id: '2',
        column_name: 'title',
        title: 'Title',
        uidt: 'text',
        order_index: 1
      }
    ],
    records: [
      {
        id: '1',
        data: {
          start_date: '2026-01-15T14:00:00Z',
          title: 'Event 1'
        }
      },
      {
        id: '2',
        data: {
          start_date: '2026-01-20T10:00:00Z',
          title: 'Event 2'
        }
      }
    ],
    views: [
      {
        id: 'view-1',
        meta: {
          date_field_id: '1'
        }
      }
    ]
  };

  const mockActions = {
    addRow: vi.fn(),
    insertRowData: vi.fn(),
    deleteRecord: vi.fn(),
    updateField: vi.fn(),
    updateView: vi.fn(),
    updateEvent: vi.fn(),
    createEvent: vi.fn(),
    deleteEvent: vi.fn(),
    changeDateField: vi.fn(),
    updateViewConfig: vi.fn()
  };

  const defaultProps = {
    tableData: mockTableData,
    viewId: 'view-1',
    onRefresh: vi.fn(),
    actions: mockActions
  };

  const defaultNavigationMock = {
    currentDate: new Date('2026-01-15'),
    setCurrentDate: vi.fn(),
    selectedDate: null,
    setSelectedDate: vi.fn(),
    currentView: 'month' as const,
    setCurrentView: vi.fn(),
    sidebarCollapsed: false,
    setSidebarCollapsed: vi.fn(),
    toggleSidebar: vi.fn(),
    goToPrevious: vi.fn(),
    goToNext: vi.fn(),
    goToToday: vi.fn(),
    changeView: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCalendarDateNavigation).mockReturnValue(defaultNavigationMock);
  });

  describe('rendering', () => {
    it('should render calendar view layout', () => {
      render(<CalendarView {...defaultProps} />);

      expect(screen.getByTestId('calendar-header')).toBeInTheDocument();
      expect(screen.getByTestId('month-view')).toBeInTheDocument();
      expect(screen.getByTestId('events-sidebar')).toBeInTheDocument();
    });

    it('should process and display events', () => {
      render(<CalendarView {...defaultProps} />);
      expect(screen.getByTestId('month-view')).toHaveTextContent('2');
      expect(screen.getByTestId('month-view')).toHaveTextContent('events in month');
      expect(screen.getByTestId('events-sidebar')).toHaveTextContent('2');
      expect(screen.getByTestId('events-sidebar')).toHaveTextContent('events');
    });

    it('should hide sidebar when collapsed', () => {
      vi.mocked(useCalendarDateNavigation).mockReturnValue({
        currentDate: new Date('2026-01-15'),
        setCurrentDate: vi.fn(),
        selectedDate: null,
        setSelectedDate: vi.fn(),
        currentView: 'month',
        setCurrentView: vi.fn(),
        sidebarCollapsed: true,
        setSidebarCollapsed: vi.fn(),
        toggleSidebar: vi.fn(),
        goToPrevious: vi.fn(),
        goToNext: vi.fn(),
        goToToday: vi.fn(),
        changeView: vi.fn()
      });

      render(<CalendarView {...defaultProps} />);

      expect(screen.queryByTestId('events-sidebar')).not.toBeInTheDocument();
    });
  });

  describe('view switching', () => {
    it('should render week view when view is week', () => {
      vi.mocked(useCalendarDateNavigation).mockReturnValue({
        currentDate: new Date('2026-01-15'),
        setCurrentDate: vi.fn(),
        selectedDate: null,
        setSelectedDate: vi.fn(),
        currentView: 'week',
        setCurrentView: vi.fn(),
        sidebarCollapsed: false,
        setSidebarCollapsed: vi.fn(),
        toggleSidebar: vi.fn(),
        goToPrevious: vi.fn(),
        goToNext: vi.fn(),
        goToToday: vi.fn(),
        changeView: vi.fn()
      });

      render(<CalendarView {...defaultProps} />);

      expect(screen.getByTestId('week-view')).toBeInTheDocument();
      expect(screen.queryByTestId('month-view')).not.toBeInTheDocument();
    });

    it('should render day view when view is day', () => {
      vi.mocked(useCalendarDateNavigation).mockReturnValue({
        currentDate: new Date('2026-01-15'),
        setCurrentDate: vi.fn(),
        selectedDate: null,
        setSelectedDate: vi.fn(),
        currentView: 'day',
        setCurrentView: vi.fn(),
        sidebarCollapsed: false,
        setSidebarCollapsed: vi.fn(),
        toggleSidebar: vi.fn(),
        goToPrevious: vi.fn(),
        goToNext: vi.fn(),
        goToToday: vi.fn(),
        changeView: vi.fn()
      });

      render(<CalendarView {...defaultProps} />);

      expect(screen.getByTestId('day-view')).toBeInTheDocument();
    });

    it('should render year view when view is year', () => {
      vi.mocked(useCalendarDateNavigation).mockReturnValue({
        currentDate: new Date('2026-01-15'),
        setCurrentDate: vi.fn(),
        selectedDate: null,
        setSelectedDate: vi.fn(),
        currentView: 'year',
        setCurrentView: vi.fn(),
        sidebarCollapsed: false,
        setSidebarCollapsed: vi.fn(),
        toggleSidebar: vi.fn(),
        goToPrevious: vi.fn(),
        goToNext: vi.fn(),
        goToToday: vi.fn(),
        changeView: vi.fn()
      });

      render(<CalendarView {...defaultProps} />);

      expect(screen.getByTestId('year-view')).toBeInTheDocument();
    });
  });

  describe('create modal', () => {
    it('should open create modal when create button is clicked', async () => {
      const mockHandleOpenCreateModal = vi.fn();
      vi.mocked(useCalendarModals).mockReturnValue({
        modalState: {
          create: { isOpen: false, selectedDate: null },
          edit: { isOpen: false, selectedEvent: null },
          export: { isOpen: false }
        },
        handleOpenCreateModal: mockHandleOpenCreateModal,
        handleOpenEditModal: vi.fn(),
        handleOpenExportModal: vi.fn(),
        handleCloseCreateModal: vi.fn(),
        handleCloseEditModal: vi.fn(),
        handleCloseExportModal: vi.fn(),
        handleCreateSuccess: vi.fn(),
        handleEditSuccess: vi.fn(),
        handleDeleteRecordFromModal: vi.fn()
      });

      render(<CalendarView {...defaultProps} />);

      const createButton = screen.getByText('Create');
      await userEvent.click(createButton);

      expect(mockHandleOpenCreateModal).toHaveBeenCalled();
    });

    it('should render create modal when open', () => {
      vi.mocked(useCalendarModals).mockReturnValue({
        modalState: {
          create: { isOpen: true, selectedDate: new Date('2026-01-15') },
          edit: { isOpen: false, selectedEvent: null },
          export: { isOpen: false }
        },
        handleOpenCreateModal: vi.fn(),
        handleOpenEditModal: vi.fn(),
        handleOpenExportModal: vi.fn(),
        handleCloseCreateModal: vi.fn(),
        handleCloseEditModal: vi.fn(),
        handleCloseExportModal: vi.fn(),
        handleCreateSuccess: vi.fn(),
        handleEditSuccess: vi.fn(),
        handleDeleteRecordFromModal: vi.fn()
      });

      render(<CalendarView {...defaultProps} />);

      expect(screen.getByTestId('create-modal')).toBeInTheDocument();
    });
  });

  describe('edit modal', () => {
    it('should open edit modal when event is clicked', async () => {
      const mockHandleOpenEditModal = vi.fn();
      vi.mocked(useCalendarModals).mockReturnValue({
        modalState: {
          create: { isOpen: false, selectedDate: null },
          edit: { isOpen: false, selectedEvent: null },
          export: { isOpen: false }
        },
        handleOpenCreateModal: vi.fn(),
        handleOpenEditModal: mockHandleOpenEditModal,
        handleOpenExportModal: vi.fn(),
        handleCloseCreateModal: vi.fn(),
        handleCloseEditModal: vi.fn(),
        handleCloseExportModal: vi.fn(),
        handleCreateSuccess: vi.fn(),
        handleEditSuccess: vi.fn(),
        handleDeleteRecordFromModal: vi.fn()
      });

      render(<CalendarView {...defaultProps} />);

      const eventButton = screen.getByText('Month Event Click');
      await userEvent.click(eventButton);

      expect(mockHandleOpenEditModal).toHaveBeenCalled();
    });

    it('should render edit modal when open', () => {
      vi.mocked(useCalendarModals).mockReturnValue({
        modalState: {
          create: { isOpen: false, selectedDate: null },
          edit: {
            isOpen: true,
            selectedEvent: {
              id: '1',
              title: 'Event 1',
              date: '2026-01-15',
              dateTime: new Date('2026-01-15T14:00:00'),
              data: { title: 'Event 1' },
              color: 'blue'
            }
          },
          export: { isOpen: false }
        },
        handleOpenCreateModal: vi.fn(),
        handleOpenEditModal: vi.fn(),
        handleOpenExportModal: vi.fn(),
        handleCloseCreateModal: vi.fn(),
        handleCloseEditModal: vi.fn(),
        handleCloseExportModal: vi.fn(),
        handleCreateSuccess: vi.fn(),
        handleEditSuccess: vi.fn(),
        handleDeleteRecordFromModal: vi.fn()
      });

      render(<CalendarView {...defaultProps} />);

      expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
    });
  });

  describe('export modal', () => {
    it('should open export modal when export button is clicked', async () => {
      const mockHandleOpenExportModal = vi.fn();
      vi.mocked(useCalendarModals).mockReturnValue({
        modalState: {
          create: { isOpen: false, selectedDate: null },
          edit: { isOpen: false, selectedEvent: null },
          export: { isOpen: false }
        },
        handleOpenCreateModal: vi.fn(),
        handleOpenEditModal: vi.fn(),
        handleOpenExportModal: mockHandleOpenExportModal,
        handleCloseCreateModal: vi.fn(),
        handleCloseEditModal: vi.fn(),
        handleCloseExportModal: vi.fn(),
        handleCreateSuccess: vi.fn(),
        handleEditSuccess: vi.fn(),
        handleDeleteRecordFromModal: vi.fn()
      });

      render(<CalendarView {...defaultProps} />);

      const exportButton = screen.getByText('Export');
      await userEvent.click(exportButton);

      expect(mockHandleOpenExportModal).toHaveBeenCalled();
    });

    it('should render export modal when open', () => {
      vi.mocked(useCalendarModals).mockReturnValue({
        modalState: {
          create: { isOpen: false, selectedDate: null },
          edit: { isOpen: false, selectedEvent: null },
          export: { isOpen: true }
        },
        handleOpenCreateModal: vi.fn(),
        handleOpenEditModal: vi.fn(),
        handleOpenExportModal: vi.fn(),
        handleCloseCreateModal: vi.fn(),
        handleCloseEditModal: vi.fn(),
        handleCloseExportModal: vi.fn(),
        handleCreateSuccess: vi.fn(),
        handleEditSuccess: vi.fn(),
        handleDeleteRecordFromModal: vi.fn()
      });

      render(<CalendarView {...defaultProps} />);

      expect(screen.getByTestId('export-modal')).toBeInTheDocument();
    });
  });

  describe('read-only mode', () => {
    it('should disable create/edit/delete when read-only', () => {
      vi.mocked(useBaseAccess).mockReturnValue({
        baseAccess: null,
        currentBase: null,
        canAccessBase: false,
        hasFullBaseAccess: false,
        canCreateBase: () => false,
        canUpdateBase: () => false,
        canDeleteBase: () => false,
        canManageBaseMembers: () => false,
        canCreateTable: () => false,
        canUpdateTable: () => false,
        canDeleteTable: () => false,
        canUpdateTableSchema: () => false,
        canCreateRecord: () => false,
        canUpdateRecord: () => false,
        canDeleteRecord: () => false,
        canUpdateViewSchema: () => false,
        canManageViews: () => false,
        canShareView: () => false,
        isBaseReadOnly: () => true
      } as any);

      render(<CalendarView {...defaultProps} />);

      expect(screen.queryByText('Create')).not.toBeInTheDocument();
      expect(screen.queryByText('Month Event Click')).not.toBeInTheDocument();
    });
  });

  describe('event processing', () => {
    it('should handle records without date fields', () => {
      const dataWithoutDates = {
        ...mockTableData,
        records: [
          { id: '1', data: { title: 'No Date Event' } }
        ]
      };

      render(<CalendarView {...defaultProps} tableData={dataWithoutDates} />);
      expect(screen.getByTestId('month-view')).toHaveTextContent('0');
      expect(screen.getByTestId('month-view')).toHaveTextContent('events in month');
    });

    it('should handle empty records', () => {
      const emptyData = {
        ...mockTableData,
        records: []
      };

      render(<CalendarView {...defaultProps} tableData={emptyData} />);
      expect(screen.getByTestId('month-view')).toHaveTextContent('0');
      expect(screen.getByTestId('month-view')).toHaveTextContent('events in month');
    });

    it('should handle date field without datetime', () => {
      const dateOnlyData = {
        ...mockTableData,
        columns: [
          {
            id: '1',
            column_name: 'start_date',
            title: 'Start Date',
            uidt: 'date',
            order_index: 0
          }
        ],
        records: [
          {
            id: '1',
            data: {
              start_date: '2026-01-15',
              title: 'Date Only Event'
            }
          }
        ]
      };

      render(<CalendarView {...defaultProps} tableData={dateOnlyData} />);
      expect(screen.getByTestId('month-view')).toHaveTextContent('1');
      expect(screen.getByTestId('month-view')).toHaveTextContent('events in month');
    });
  });

  describe('filtering', () => {
    it('should apply filters to events', () => {
      vi.mocked(applyFilters).mockReturnValue([{ id: '1', data: { title: 'Event 1' } }]);
      vi.mocked(useCalendarViewConfig).mockReturnValue({
        filters: [{ column: 'title', operator: 'eq', value: 'Event 1' }],
        sorts: [],
        draftFilter: null,
        localFieldConfig: [],
        visibleColumns: [],
        handleRealTimeFilter: vi.fn(),
        handleAddFilter: vi.fn(),
        handleRemoveFilter: vi.fn(),
        handleUpdateFilter: vi.fn(),
        handleSortChange: vi.fn(),
        handleFieldToggle: vi.fn(),
        handleFieldOrderChange: vi.fn(),
        setLocalFieldConfig: vi.fn()
      });

      render(<CalendarView {...defaultProps} />);

      expect(applyFilters).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle missing view configuration', () => {
      const noViewData = {
        ...mockTableData,
        views: []
      };

      render(<CalendarView {...defaultProps} tableData={noViewData} />);
      // Default view is month when no view config; ensure a view is rendered
      expect(screen.getByTestId('month-view')).toBeInTheDocument();
    });

    it('should handle missing columns', () => {
      const noColumnsData = {
        ...mockTableData,
        columns: []
      };

      render(<CalendarView {...defaultProps} tableData={noColumnsData} />);

      expect(screen.getByTestId('calendar-header')).toBeInTheDocument();
    });
  });
});
