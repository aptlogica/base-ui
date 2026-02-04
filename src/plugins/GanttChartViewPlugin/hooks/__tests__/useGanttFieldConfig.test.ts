import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGanttFieldConfig } from '../useGanttFieldConfig';
import type { Column } from '../../../../types/api.types';

const mockColumn = (overrides: Partial<Column> = {}): Column => ({
  id: 'col-id',
  model_id: 'model-id',
  base_id: 'base-id',
  column_name: 'title',
  title: 'Title',
  uidt: 'text',
  dt: 'text',
  description: '',
  meta: {},
  virtual: false,
  system: false,
  deleted: false,
  order_index: 0,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

describe('useGanttFieldConfig', () => {
  it('updates the start date field and refreshes the view', async () => {
    const updateView = vi.fn().mockResolvedValue(undefined);
    const onRefresh = vi.fn();
    const currentView = { id: 'view-1', meta: { start_date_field_id: '' } };
    const field = mockColumn({ id: 'start-field' });
    const { result } = renderHook(() => useGanttFieldConfig({ currentView, updateView, onRefresh }));

    await act(async () => result.current.handleStartDateFieldChange(field));

    expect(updateView).toHaveBeenCalledWith('view-1', {
      meta: { start_date_field_id: 'start-field' },
    });
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('clears the end date field when undefined is provided', async () => {
    const updateView = vi.fn().mockResolvedValue(undefined);
    const onRefresh = vi.fn();
    const currentView = { id: 'view-2', meta: { end_date_field_id: 'old-end' } };
    const { result } = renderHook(() => useGanttFieldConfig({ currentView, updateView, onRefresh }));

    await act(async () => result.current.handleEndDateFieldChange(undefined));

    expect(updateView).toHaveBeenCalledWith('view-2', {
      meta: { end_date_field_id: '' },
    });
  });

  it('persists the progress field selection', async () => {
    const updateView = vi.fn().mockResolvedValue(undefined);
    const onRefresh = vi.fn();
    const currentView = { id: 'view-progress', meta: {} };
    const field = mockColumn({ id: 'progress-field' });
    const { result } = renderHook(() => useGanttFieldConfig({ currentView, updateView, onRefresh }));

    await act(async () => result.current.handleProgressFieldChange(field));

    expect(updateView).toHaveBeenCalledWith('view-progress', {
      meta: { progress_field_id: 'progress-field' },
    });
  });

  it('updates the completion field mapping', async () => {
    const updateView = vi.fn().mockResolvedValue(undefined);
    const onRefresh = vi.fn();
    const currentView = { id: 'view-completion', meta: {} };
    const field = mockColumn({ id: 'completion-field' });
    const { result } = renderHook(() => useGanttFieldConfig({ currentView, updateView, onRefresh }));

    await act(async () => result.current.handleCompletionFieldChange(field));

    expect(updateView).toHaveBeenCalledWith('view-completion', {
      meta: { completion_field_id: 'completion-field' },
    });
  });

  it('skips updates when updateView or currentView.id is missing', async () => {
    const onRefresh = vi.fn();
    const field = mockColumn({ id: 'unused' });
    const { result } = renderHook(() => useGanttFieldConfig({ currentView: {}, updateView: undefined, onRefresh }));

    await act(async () => result.current.handleStartDateFieldChange(field));

    expect(onRefresh).not.toHaveBeenCalled();
  });
});
