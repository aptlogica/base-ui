import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GanttChart } from '../GanttChart';
import type { TableResponse, Column } from '../../../../types/api.types';
import type { GanttTask } from '../../hooks/useGanttData';

const useGanttTaskProcessingMock = vi.fn();
const useGanttViewConfigMock = vi.fn();
const useGanttTimelineMock = vi.fn();
const useGanttModalsMock = vi.fn();
const useGanttFieldConfigMock = vi.fn();
const useFrontendPaginationMock = vi.fn();
const useBaseAccessMock = vi.fn();

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [{ index: 0, start: 0 }],
    getTotalSize: () => 60,
  }),
}));

vi.mock('../../hooks/useGanttTaskProcessing', () => ({
  useGanttTaskProcessing: () => useGanttTaskProcessingMock(),
}));

vi.mock('../../hooks/useGanttViewConfig', () => ({
  useGanttViewConfig: () => useGanttViewConfigMock(),
}));

vi.mock('../../hooks/useGanttTimeline', () => ({
  useGanttTimeline: () => useGanttTimelineMock(),
}));

vi.mock('../../hooks/useGanttModals', () => ({
  useGanttModals: () => useGanttModalsMock(),
}));

vi.mock('../../hooks/useGanttFieldConfig', () => ({
  useGanttFieldConfig: () => useGanttFieldConfigMock(),
}));

vi.mock('../../../../hooks/useFrontendPagination', () => ({
  useFrontendPagination: (params: unknown) => useFrontendPaginationMock(params),
}));

vi.mock('../../../../hooks/useBaseAccess', () => ({
  useBaseAccess: (baseId: string | undefined) => useBaseAccessMock(baseId),
}));

vi.mock('../../../../components/shared/table/FilterPopover', () => ({
  FilterPopover: () => <div data-testid="filter-popover" />,
}));

vi.mock('../../../../components/shared/table/SortPopover', () => ({
  SortPopover: (props: any) => <button data-testid="sort-popover" onClick={() => props.onChange?.([])}>Sort</button>,
}));

vi.mock('../../../../components/shared/table/FieldsPopover', () => ({
  FieldsPopover: () => <div data-testid="fields-popover" />,
}));

vi.mock('../../../../components/modals/CreateRecordModal', () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock('../../../../components/modals/EditRecordModal', () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock('../../../../components/modals/DeleteConfirmModal', () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock('../../../../components/ui/Loader', () => ({
  Loader: () => <span data-testid="loader" />,
}));

vi.mock('../../../../utils/helpers', () => ({
  formatCompactNumber: String,
}));

vi.mock('../../../../utils/fieldType', () => ({
  normalizeFieldType: (value: string) => value,
}));

vi.mock('lucide-react', () => ({
  Calendar: (props: any) => <span {...props}>CalendarIcon</span>,
  Plus: (props: any) => <span {...props}>PlusIcon</span>,
  Layers: (props: any) => <span {...props}>LayersIcon</span>,
  ZoomIn: (props: any) => <span {...props}>ZoomInIcon</span>,
  ZoomOut: (props: any) => <span {...props}>ZoomOutIcon</span>,
}));

vi.mock('../GanttFieldSelector', () => ({
  GanttFieldConfiguration: () => <div data-testid="gantt-field-config">Field Config</div>,
}));

const buildColumn = (overrides: Partial<Column>): Column => ({
  id: String(overrides.id || 'col'),
  column_name: overrides.column_name || 'title',
  title: overrides.title || 'Title',
  uidt: overrides.uidt || 'text',
  model_id: 'model',
  base_id: 'base',
  dt: 'text',
  description: '',
  meta: {},
  virtual: false,
  system: false,
  deleted: false,
  order_index: 0,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
});

const sampleTask: GanttTask = {
  id: 'task-1',
  name: 'Task One',
  startDate: new Date('2024-01-01T00:00:00.000Z'),
  endDate: new Date('2024-01-05T00:00:00.000Z'),
  color: '#123456',
  progress: 20,
  status: 'active',
  rawData: { title: 'Task One' },
};

const tableData: TableResponse = {
  success: true,
  message: 'ok',
  data: {
    model: {
      id: 'model-1',
      base_id: 'base-1',
      workspace_id: 'workspace-1',
      title: 'Model',
      description: 'Model description',
      alias: 'model',
      meta: {},
      order_index: 0,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
    columns: [],
    views: [],
    records: [],
  },
  meta: { code: '200', http_status: 200 },
};

const buildActions = () => ({
  addRow: {},
  insertRowData: {},
  deleteRecord: {},
  updateField: {},
  updateView: vi.fn(),
  moveTask: vi.fn(),
  createTask: vi.fn(),
  deleteTask: vi.fn(),
  updateTaskProgress: vi.fn(),
  updateViewConfig: vi.fn(),
});

const setupMocks = (overrides?: {
  isReadOnly?: boolean;
  hasMore?: boolean;
}) => {
  const columns = [buildColumn({ id: 'title', column_name: 'title' })];
  useGanttTaskProcessingMock.mockReturnValue({
    tasks: [sampleTask],
    columns,
    currentView: { id: 'view-1', meta: {} },
    startDateField: columns[0],
    endDateField: columns[0],
    titleField: columns[0],
    progressField: undefined,
    completionField: undefined,
  });

  const paginationData = {
    allLoadedData: [sampleTask],
    loadNextPage: vi.fn(),
    hasMore: overrides?.hasMore ?? false,
    totalItems: 1,
  };
  useFrontendPaginationMock.mockReturnValue(paginationData);

  useGanttViewConfigMock.mockReturnValue({
    filters: [],
    sorts: [],
    localFieldConfig: [],
    filteredTasks: [sampleTask],
    sortedTasksForSidebar: [sampleTask],
    handleAddFilter: vi.fn(),
    handleRemoveFilter: vi.fn(),
    handleUpdateFilter: vi.fn(),
    handleSortChange: vi.fn(),
    handleFieldToggle: vi.fn(),
  });

  const timelineHandlers = {
    dayWidth: 30,
    timelineDays: [new Date('2024-01-01T00:00:00.000Z')],
    showTooltip: false,
    tooltipTask: null,
    tooltipRef: { current: null },
    tooltipLines: [],
    getTaskPosition: () => ({ left: 0, width: 100 }),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    resetZoom: vi.fn(),
    handleTaskMouseEnter: vi.fn(),
    handleTaskMouseLeave: vi.fn(),
    getTooltipClasses: () => 'tooltip',
    getTooltipArrowClasses: () => 'tooltip-arrow',
  };
  useGanttTimelineMock.mockReturnValue(timelineHandlers);

  const modalsHandlers = {
    modalState: { create: { isOpen: false }, edit: { isOpen: false, selectedTask: null } },
    deleteConfirmModalOpen: false,
    taskToDelete: null,
    handleCreateRecord: vi.fn(),
    handleEditTask: vi.fn(),
    handleDeleteTask: vi.fn(),
    handleCloseCreateModal: vi.fn(),
    handleCloseEditModal: vi.fn(),
    handleCloseDeleteModal: vi.fn(),
    handleCreateSuccess: vi.fn(),
    handleEditSuccess: vi.fn(),
    handleDeleteRecord: vi.fn(),
    handleConfirmDelete: vi.fn(),
    handleDuplicateRecord: vi.fn(),
    getCreateInitialValues: () => ({}),
    getEditInitialValues: () => ({}),
  };
  useGanttModalsMock.mockReturnValue(modalsHandlers);

  useGanttFieldConfigMock.mockReturnValue({
    handleStartDateFieldChange: vi.fn(),
    handleEndDateFieldChange: vi.fn(),
    handleProgressFieldChange: vi.fn(),
    handleCompletionFieldChange: vi.fn(),
  });

  const accessState = overrides?.isReadOnly ? {
    isBaseReadOnly: () => true,
    canCreateRecord: () => false,
    canUpdateRecord: () => false,
    canDeleteRecord: () => false,
  } : {
    isBaseReadOnly: () => false,
    canCreateRecord: () => true,
    canUpdateRecord: () => true,
    canDeleteRecord: () => true,
  };
  useBaseAccessMock.mockReturnValue(accessState);

  return { paginationData, timelineHandlers, modalsHandlers };
};

const renderChart = (overrides?: { isReadOnly?: boolean; hasMore?: boolean }) => {
  const state = setupMocks(overrides);
  const actions = buildActions();
  render(<GanttChart tableData={tableData} onRefresh={() => undefined} actions={actions} />);
  return { ...state, actions };
};

describe('GanttChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the new record button and triggers create handler', async () => {
    const { modalsHandlers } = renderChart();
    const buttons = screen.getAllByRole('button', { name: /New Record/i });
    const button = buttons[0]; // Use the first button (desktop layout)

    await userEvent.click(button);

    expect(modalsHandlers.handleCreateRecord).toHaveBeenCalledTimes(1);
  });

  it('hides field configuration and new record control when read-only', () => {
    renderChart({ isReadOnly: true });

    expect(screen.queryByTestId('gantt-field-config')).toBeNull();
    expect(screen.queryByRole('button', { name: /New Record/i })).toBeNull();
  });

  it('loads more tasks through the pagination helper', async () => {
    const { paginationData } = renderChart({ hasMore: true });
    const loadMoreButton = screen.getByRole('button', { name: /Load more/ });

    await userEvent.click(loadMoreButton);

    expect(paginationData.loadNextPage).toHaveBeenCalledTimes(1);
  });

  it('invokes zoom handlers from the timeline hook', async () => {
    const { timelineHandlers } = renderChart();
    const zoomOutButton = screen.getByRole('button', { name: /ZoomOutIcon/i });
    const resetButton = screen.getByRole('button', { name: /Reset/i });
    const zoomInButton = screen.getByRole('button', { name: /ZoomInIcon/i });

    await userEvent.click(zoomOutButton);
    await userEvent.click(resetButton);
    await userEvent.click(zoomInButton);

    expect(timelineHandlers.zoomOut).toHaveBeenCalledTimes(1);
    expect(timelineHandlers.resetZoom).toHaveBeenCalledTimes(1);
    expect(timelineHandlers.zoomIn).toHaveBeenCalledTimes(1);
  });
});
