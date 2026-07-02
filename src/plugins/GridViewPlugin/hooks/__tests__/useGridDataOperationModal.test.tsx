import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useGridDataOperationModal } from '../useGridDataOperationModal';
import { getGridActionById } from '../../components/toolbar/gridActionCatalog';

vi.mock('../../components/toolbar/gridActionCatalog', () => ({
  getGridActionById: vi.fn(),
}));

describe('useGridDataOperationModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initial state: activeAction and activeActionId are null, isOpen is false', () => {
    // Arrange & Act
    const { result } = renderHook(() => useGridDataOperationModal());

    // Assert
    expect(result.current.activeAction).toBeNull();
    expect(result.current.activeActionId).toBeNull();
    expect(result.current.isOpen).toBe(false);
    expect(typeof result.current.openActionModal).toBe('function');
    expect(typeof result.current.closeActionModal).toBe('function');
    expect(typeof result.current.resetActionModal).toBe('function');
  });

  it('openActionModal sets activeActionId and isOpen and resolves activeAction via getGridActionById', () => {
    // Arrange
    const mockAction = {
      id: 'remove_duplicates',
      group: 'clean',
      label: 'Remove Duplicates',
      description: 'desc',
      icon: () => null,
    } as const;

    vi.mocked(getGridActionById).mockReturnValue(mockAction as any);

    const { result } = renderHook(() => useGridDataOperationModal());

    // Act
    act(() => {
      result.current.openActionModal(mockAction as any);
    });

    // Assert
    expect(result.current.activeActionId).toBe(mockAction.id);
    expect(result.current.isOpen).toBe(true);
    expect(result.current.activeAction).toBe(mockAction);
    expect(vi.mocked(getGridActionById)).toHaveBeenCalledWith(mockAction.id);
  });

  it('closeActionModal only closes modal but preserves activeActionId', () => {
    // Arrange
    const mockAction = {
      id: 'split_column',
      group: 'transform',
      label: 'Split Column',
      description: 'desc',
      icon: () => null,
    } as const;

    vi.mocked(getGridActionById).mockReturnValue(mockAction as any);

    const { result } = renderHook(() => useGridDataOperationModal());

    act(() => {
      result.current.openActionModal(mockAction as any);
    });

    // Sanity check before close
    expect(result.current.isOpen).toBe(true);
    expect(result.current.activeActionId).toBe(mockAction.id);

    // Act
    act(() => {
      result.current.closeActionModal();
    });

    // Assert
    expect(result.current.isOpen).toBe(false);
    expect(result.current.activeActionId).toBe(mockAction.id);
    expect(result.current.activeAction).toBe(mockAction);
  });

  it('resetActionModal clears both isOpen and activeActionId and activeAction becomes null', () => {
    // Arrange
    const mockAction = {
      id: 'merge_column',
      group: 'transform',
      label: 'Merge Column',
      description: 'desc',
      icon: () => null,
    } as const;

    vi.mocked(getGridActionById).mockReturnValue(mockAction as any);

    const { result } = renderHook(() => useGridDataOperationModal());

    act(() => {
      result.current.openActionModal(mockAction as any);
    });

    // Act
    act(() => {
      result.current.resetActionModal();
    });

    // Assert
    expect(result.current.isOpen).toBe(false);
    expect(result.current.activeActionId).toBeNull();
    expect(result.current.activeAction).toBeNull();
  });

  it('when getGridActionById returns undefined, activeAction is undefined (edge case)', () => {
    // Arrange
    const mockAction = {
      id: 'extract_substring',
      group: 'transform',
      label: 'Extract Substring',
      description: 'desc',
      icon: () => null,
    } as const;

    vi.mocked(getGridActionById).mockReturnValue(undefined as any);

    const { result } = renderHook(() => useGridDataOperationModal());

    // Act
    act(() => {
      result.current.openActionModal(mockAction as any);
    });

    // Assert
    expect(result.current.activeActionId).toBe(mockAction.id);
    expect(result.current.isOpen).toBe(true);
    expect(result.current.activeAction).toBeUndefined();
  });

  it('opening a second action updates activeActionId and activeAction accordingly', () => {
    // Arrange
    const first = {
      id: 'remove_formatting',
      group: 'clean',
      label: 'Remove Formatting',
      description: 'desc',
      icon: () => null,
    } as const;

    const second = {
      id: 'case_normalization',
      group: 'clean',
      label: 'Case Normalization',
      description: 'desc',
      icon: () => null,
    } as const;

    vi.mocked(getGridActionById).mockImplementation((id: string) => {
      if (id === first.id) return first as any;
      if (id === second.id) return second as any;
      return undefined as any;
    });

    const { result } = renderHook(() => useGridDataOperationModal());

    // Act: open first
    act(() => {
      result.current.openActionModal(first as any);
    });

    // Assert first
    expect(result.current.activeActionId).toBe(first.id);
    expect(result.current.activeAction).toBe(first);

    // Act: open second
    act(() => {
      result.current.openActionModal(second as any);
    });

    // Assert second
    expect(result.current.activeActionId).toBe(second.id);
    expect(result.current.activeAction).toBe(second);
  });
});
