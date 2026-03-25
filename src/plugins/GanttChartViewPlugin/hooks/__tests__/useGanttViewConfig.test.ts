import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGanttViewConfig } from '../useGanttViewConfig';
import type { GanttTask } from '../useGanttData';

const useDebounceTracker = vi.hoisted(() => vi.fn());
const extractFieldConfigFromMetaMock = vi.hoisted(() => vi.fn());
const generateDefaultFieldConfigMock = vi.hoisted(() => vi.fn());
const mergeFieldConfigWithColumnsMock = vi.hoisted(() => vi.fn());
const applyFiltersMock = vi.hoisted(() => vi.fn());
const compareValuesMock = vi.hoisted(() => vi.fn());
const isFormulaFieldMock = vi.hoisted(() => vi.fn());

vi.mock('../../../../utils/helpers', () => ({
  useDebounce: (fn: (...args: unknown[]) => unknown) => {
    useDebounceTracker(fn);
    return fn;
  },
}));

vi.mock('../../../../utils/viewFieldConfigUtils', () => ({
  extractFieldConfigFromMeta: extractFieldConfigFromMetaMock,
  generateDefaultFieldConfig: generateDefaultFieldConfigMock,
  mergeFieldConfigWithColumns: mergeFieldConfigWithColumnsMock,
}));

vi.mock('../../../../utils/filterUtils', () => ({
  applyFilters: applyFiltersMock,
}));

vi.mock('../../../../utils/sortUtils', () => ({
  compareValues: compareValuesMock,
}));

vi.mock('../../../../utils/fieldUtils', () => ({
  isFormulaField: isFormulaFieldMock,
}));

const createColumn = (overrides: Record<string, unknown> = {}) => ({
  id: 'col-1',
  column_name: 'title',
  uidt: 'text',
  position: 0,
  hidden: false,
  ...overrides,
});

const defaultFieldConfig = [
  { id: 'col-1', position: 0, isHidden: false },
];

const renderViewConfig = (overrides: Partial<Parameters<typeof useGanttViewConfig>[0]> = {}) => {
  const updateView = vi.fn().mockResolvedValue(undefined);
  const view = overrides.view ?? {
    id: 'view-1',
    meta: {
      filters: [],
      sorts: [],
      fieldConfig: [],
    },
  };
  const columns = overrides.columns ?? [createColumn()];
  const tasks = overrides.tasks ?? [];
  const isReadOnly = overrides.isReadOnly ?? false;
  const hook = renderHook(() => useGanttViewConfig({
    view,
    columns,
    updateView,
    tasks,
    isReadOnly,
  }));

  return { result: hook.result, updateView, view, columns };
};

const baseTasks: GanttTask[] = [
  {
    id: 'task-1',
    name: 'Alpha',
    startDate: new Date('2024-01-01T00:00:00.000Z'),
    endDate: new Date('2024-01-05T00:00:00.000Z'),
    color: '#1',
    progress: 0,
    status: 'active',
    rawData: { title: 'Alpha' },
  },
  {
    id: 'task-2',
    name: 'Beta',
    startDate: new Date('2024-01-06T00:00:00.000Z'),
    endDate: new Date('2024-01-08T00:00:00.000Z'),
    color: '#2',
    progress: 0,
    status: 'active',
    rawData: { title: 'Beta' },
  },
];

describe('useGanttViewConfig', () => {
  beforeEach(() => {
    extractFieldConfigFromMetaMock.mockReset();
    generateDefaultFieldConfigMock.mockReset();
    mergeFieldConfigWithColumnsMock.mockReset();
    applyFiltersMock.mockReset();
    compareValuesMock.mockReset();
    isFormulaFieldMock.mockReset();
    useDebounceTracker.mockReset();
    extractFieldConfigFromMetaMock.mockReturnValue(defaultFieldConfig);
    mergeFieldConfigWithColumnsMock.mockReturnValue(defaultFieldConfig);
    generateDefaultFieldConfigMock.mockReturnValue(defaultFieldConfig);
    applyFiltersMock.mockImplementation((records: Array<{ id: string }>) => records);
    compareValuesMock.mockReturnValue(0);
    isFormulaFieldMock.mockReturnValue(false);
  });

  it('initializes filters and sorts from the view metadata', async () => {
    const view = {
      id: 'view-1',
      meta: {
        filters: [{ column: 'title', operator: 'is', value: 'Alpha' }],
        sorts: [{ column: 'title', direction: 'asc' }],
        fieldConfig: [],
      },
    };
    const { result } = renderViewConfig({ view });

    await waitFor(() => {
      expect(result.current.filters).toEqual(view.meta.filters);
    });
    expect(result.current.sorts).toEqual(view.meta.sorts);
  });

  it('adds filters and persists them when editable', async () => {
    const { result, updateView } = renderViewConfig();
    const newFilter = { column: 'status', operator: 'is', value: 'Active' };

    await act(async () => result.current.handleAddFilter(newFilter));

    expect(result.current.filters).toContain(newFilter);
    expect(updateView).toHaveBeenCalledWith('view-1', {
      meta: { filters: [newFilter], sorts: [], fieldConfig: [] },
    });
  });

  it('adds filters without persisting when read-only', async () => {
    const { result, updateView } = renderViewConfig({ isReadOnly: true });
    const newFilter = { column: 'title', operator: 'is', value: 'Alpha' };

    await act(async () => result.current.handleAddFilter(newFilter));

    expect(result.current.filters).toContain(newFilter);
    expect(updateView).not.toHaveBeenCalled();
  });

  it('removes filters and syncs the view metadata', async () => {
    const view = {
      id: 'view-1',
      meta: {
        filters: [{ column: 'title', operator: 'is', value: 'Alpha' }],
        sorts: [],
        fieldConfig: [],
      },
    };
    const { result, updateView } = renderViewConfig({ view });

    await waitFor(() => {
      expect(result.current.filters).toHaveLength(1);
    });

    await act(async () => result.current.handleRemoveFilter(0));

    expect(result.current.filters).toHaveLength(0);
    expect(updateView).toHaveBeenCalledWith('view-1', {
      meta: { filters: [], sorts: [], fieldConfig: [] },
    });
  });

  it('updates an existing filter in place', async () => {
    const view = {
      id: 'view-1',
      meta: {
        filters: [{ column: 'title', operator: 'is', value: 'Alpha' }],
        sorts: [],
        fieldConfig: [],
      },
    };
    const { result, updateView } = renderViewConfig({ view });

    await waitFor(() => {
      expect(result.current.filters[0].value).toBe('Alpha');
    });

    await act(async () => result.current.handleUpdateFilter(0, { value: 'Beta' }));

    expect(result.current.filters[0].value).toBe('Beta');
    expect(updateView).toHaveBeenCalledWith('view-1', {
      meta: { filters: [{ column: 'title', operator: 'is', value: 'Beta' }], sorts: [], fieldConfig: [] },
    });
  });

  it('stores sort definitions and persists them', async () => {
    const { result, updateView } = renderViewConfig();
    const sorts = [{ column: 'title', direction: 'desc' } as const];

    await act(async () => result.current.handleSortChange(sorts));

    expect(result.current.sorts).toEqual(sorts);
    expect(updateView).toHaveBeenCalledWith('view-1', {
      meta: { filters: [], sorts, fieldConfig: [] },
    });
  });

  it('toggles field visibility and triggers a debounced update', async () => {
    const view = {
      id: 'view-1',
      meta: {
        filters: [],
        sorts: [],
        fieldConfig: [{ id: 'col-1', position: 0, isHidden: false }],
      },
    };
    const { result, updateView } = renderViewConfig({ view });

    await act(async () => result.current.handleFieldToggle('col-1'));

    expect(result.current.localFieldConfig[0].isHidden).toBe(true);
    expect(updateView).toHaveBeenCalledWith('view-1', {
      meta: expect.objectContaining({ fieldConfig: [{ id: 'col-1', position: 0, isHidden: true }] }),
    });
    expect(useDebounceTracker).toHaveBeenCalled();
  });

  it('reorders field configuration when handleFieldOrderChange is called', async () => {
    const view = {
      id: 'view-1',
      meta: {
        filters: [],
        sorts: [],
        fieldConfig: [
          { id: 'col-1', position: 0, isHidden: false },
          { id: 'col-2', position: 1, isHidden: false },
        ],
      },
    };
    const columns = [createColumn({ id: 'col-1' }), createColumn({ id: 'col-2' })];
    const { result, updateView } = renderViewConfig({ view, columns });

    await act(async () => result.current.handleFieldOrderChange([
      { id: 'col-2', hidden: false },
      { id: 'col-1', hidden: true },
    ]));

    expect(result.current.localFieldConfig[0].id).toBe('col-2');
    expect(result.current.localFieldConfig[1].isHidden).toBe(true);
    expect(updateView).toHaveBeenCalledWith('view-1', {
      meta: expect.objectContaining({ fieldConfig: [
        { id: 'col-2', position: 0, isHidden: false },
        { id: 'col-1', position: 1, isHidden: true },
      ] }),
    });
  });

  it('filters tasks using the shared filter utility and draft filters', async () => {
    const view = {
      id: 'view-1',
      meta: {
        filters: [{ column: 'title', operator: 'is', value: 'Alpha' }],
        sorts: [],
        fieldConfig: [],
      },
    };
    applyFiltersMock.mockReturnValue([{ id: 'task-2' }]);
    const { result } = renderViewConfig({ view, tasks: baseTasks });

    act(() => {
      result.current.handleRealTimeFilter({ column: 'status', operator: 'is', value: 'active' });
    });

    await waitFor(() => {
      expect(result.current.filteredTasks).toHaveLength(1);
    });
    expect(result.current.filteredTasks[0].id).toBe('task-2');
  });

  it('sorts sidebar tasks using compareValues', async () => {
    const view = {
      id: 'view-1',
      meta: {
        filters: [],
        sorts: [{ column: 'title', direction: 'asc' }],
        fieldConfig: [],
      },
    };
    compareValuesMock.mockReturnValue(-1); // Make task-1 come after task-2
    const { result } = renderViewConfig({ view, tasks: baseTasks, columns: [createColumn()] });

    await waitFor(() => {
      expect(result.current.sortedTasksForSidebar[0].id).toBe('task-2');
    });
  });

  it('exposes only visible columns based on the local field config', async () => {
    const columns = [
      createColumn({ id: 'col-1', column_name: 'title', position: 0 }),
      createColumn({ id: 'col-2', column_name: 'status', position: 1 }),
    ];
    const fieldConfig = [
      { id: 'col-1', position: 0, isHidden: false },
      { id: 'col-2', position: 1, isHidden: true },
    ];
    extractFieldConfigFromMetaMock.mockReturnValue(fieldConfig);
    mergeFieldConfigWithColumnsMock.mockReturnValue(fieldConfig);
    const { result } = renderViewConfig({ columns });

    await waitFor(() => {
      expect(result.current.visibleColumns).toHaveLength(1);
    });
    expect(result.current.visibleColumns[0].id).toBe('col-1');
  });

  it('returns all columns when no local field config is available', () => {
    extractFieldConfigFromMetaMock.mockReturnValue([]);
    generateDefaultFieldConfigMock.mockReturnValue([]);
    mergeFieldConfigWithColumnsMock.mockReturnValue([]);
    const columns = [createColumn({ id: 'col-1' }), createColumn({ id: 'col-2' })];
    const { result } = renderViewConfig({ columns });

    expect(result.current.visibleColumns).toEqual(columns);
  });

  it('returns filtered tasks when no sorts are applied', () => {
    const view = {
      id: 'view-1',
      meta: {
        filters: [],
        sorts: [],
        fieldConfig: [],
      },
    };
    const { result } = renderViewConfig({ view, tasks: baseTasks });

    expect(result.current.sortedTasksForSidebar).toEqual(result.current.filteredTasks);
  });
});
