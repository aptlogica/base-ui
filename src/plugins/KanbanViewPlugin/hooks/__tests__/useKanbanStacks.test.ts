import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKanbanStacks } from '../useKanbanStacks';

describe('useKanbanStacks Hook', () => {
  const mockOnRefresh = vi.fn();
  const mockUpdateView = vi.fn();
  const mockView = { id: 'view1', meta: {} };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default uiState', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      expect(result.current.uiState.isCreateStack).toBe(false);
      expect(result.current.uiState.newOption).toBe('');
      expect(result.current.uiState.isLoadingGroupBy).toBe(false);
    });

    it('should initialize with empty collapsedStacks set', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      expect(result.current.collapsedStacks).toBeInstanceOf(Set);
      expect(result.current.collapsedStacks.size).toBe(0);
    });
  });

  describe('Stack Collapse', () => {
    it('should collapse stack', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      act(() => {
        result.current.handleStackCollapse('stack1');
      });

      expect(result.current.collapsedStacks.has('stack1')).toBe(true);
    });

    it('should expand collapsed stack', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      act(() => {
        result.current.handleStackCollapse('stack1');
      });
      expect(result.current.collapsedStacks.has('stack1')).toBe(true);

      act(() => {
        result.current.handleStackCollapse('stack1');
      });
      expect(result.current.collapsedStacks.has('stack1')).toBe(false);
    });

    it('should handle multiple collapsed stacks', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      act(() => {
        result.current.handleStackCollapse('stack1');
        result.current.handleStackCollapse('stack2');
        result.current.handleStackCollapse('stack3');
      });

      expect(result.current.collapsedStacks.has('stack1')).toBe(true);
      expect(result.current.collapsedStacks.has('stack2')).toBe(true);
      expect(result.current.collapsedStacks.has('stack3')).toBe(true);
      expect(result.current.collapsedStacks.size).toBe(3);
    });

    it('should toggle specific stack without affecting others', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      act(() => {
        result.current.handleStackCollapse('stack1');
        result.current.handleStackCollapse('stack2');
        result.current.handleStackCollapse('stack1');
      });

      expect(result.current.collapsedStacks.has('stack1')).toBe(false);
      expect(result.current.collapsedStacks.has('stack2')).toBe(true);
    });
  });

  describe('Create Stack UI', () => {
    it('should open create stack UI', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      act(() => {
        result.current.handleCreateStackClick();
      });

      expect(result.current.uiState.isCreateStack).toBe(true);
    });

    it('should update newOption value', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      act(() => {
        result.current.handleNewOptionChange('New Option');
      });

      expect(result.current.uiState.newOption).toBe('New Option');
    });

    it('should update newOption multiple times', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      act(() => {
        result.current.handleNewOptionChange('Option 1');
      });
      expect(result.current.uiState.newOption).toBe('Option 1');

      act(() => {
        result.current.handleNewOptionChange('Option 2');
      });
      expect(result.current.uiState.newOption).toBe('Option 2');
    });

    it('should handle empty string in newOption', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      act(() => {
        result.current.handleNewOptionChange('Some value');
        result.current.handleNewOptionChange('');
      });

      expect(result.current.uiState.newOption).toBe('');
    });
  });

  describe('Stack Drag and Drop', () => {
    it('should handle stack drag start', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      const mockEvent = {
        stopPropagation: vi.fn(),
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: ''
        }
      } as any;

      result.current.handleStackDragStart('stack1', 0, mockEvent);

      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockEvent.dataTransfer.setData).toHaveBeenCalledWith('stackId', 'stack1');
      expect(mockEvent.dataTransfer.setData).toHaveBeenCalledWith('stackIndex', '0');
      expect(mockEvent.dataTransfer.effectAllowed).toBe('move');
    });

    it('should handle stack drop', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          getData: vi.fn((key: string) => {
            if (key === 'stackId') return 'stack1';
            return '';
          })
        }
      } as any;

      result.current.handleStackDrop('stack2', mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should not handle drop when source and target are the same', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          getData: vi.fn(() => 'stack1')
        }
      } as any;

      result.current.handleStackDrop('stack1', mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should not handle drop when sourceId is missing', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          getData: vi.fn(() => '')
        }
      } as any;

      result.current.handleStackDrop('stack2', mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should not move Uncategorized stack', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          getData: vi.fn(() => 'Uncategorized')
        }
      } as any;

      result.current.handleStackDrop('stack2', mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('State Setters', () => {
    it('should provide setUiState function', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      expect(result.current.setUiState).toBeInstanceOf(Function);
    });

    it('should provide setCollapsedStacks function', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      expect(result.current.setCollapsedStacks).toBeInstanceOf(Function);
    });

    it('should update uiState via setUiState', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      act(() => {
        result.current.setUiState({ isCreateStack: true, newOption: 'test', isLoadingGroupBy: true });
      });

      expect(result.current.uiState.isCreateStack).toBe(true);
      expect(result.current.uiState.newOption).toBe('test');
      expect(result.current.uiState.isLoadingGroupBy).toBe(true);
    });

    it('should update collapsedStacks via setCollapsedStacks', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      const newSet = new Set(['stack1', 'stack2']);
      act(() => {
        result.current.setCollapsedStacks(newSet);
      });

      expect(result.current.collapsedStacks).toBe(newSet);
    });
  });

  describe('Handler Stability', () => {
    it('should return stable handler functions', () => {
      const { result, rerender } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      const handlers = {
        handleStackCollapse: result.current.handleStackCollapse,
        handleCreateStackClick: result.current.handleCreateStackClick,
        handleNewOptionChange: result.current.handleNewOptionChange,
        handleStackDragStart: result.current.handleStackDragStart,
        handleStackDrop: result.current.handleStackDrop
      };

      rerender();

      expect(result.current.handleStackCollapse).toBe(handlers.handleStackCollapse);
      expect(result.current.handleCreateStackClick).toBe(handlers.handleCreateStackClick);
      expect(result.current.handleNewOptionChange).toBe(handlers.handleNewOptionChange);
      expect(result.current.handleStackDragStart).toBe(handlers.handleStackDragStart);
      expect(result.current.handleStackDrop).toBe(handlers.handleStackDrop);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined view', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: undefined, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      expect(result.current.uiState).toBeDefined();
      expect(result.current.collapsedStacks).toBeDefined();
    });

    it('should handle undefined updateView', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: undefined, onRefresh: mockOnRefresh })
      );

      expect(result.current.uiState).toBeDefined();
      expect(result.current.collapsedStacks).toBeDefined();
    });

    it('should handle empty string stackId in collapse', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      act(() => {
        result.current.handleStackCollapse('');
      });

      expect(result.current.collapsedStacks.has('')).toBe(true);
    });

    it('should handle rapid stack collapse operations', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      act(() => {
        result.current.handleStackCollapse('stack1');
        result.current.handleStackCollapse('stack1');
        result.current.handleStackCollapse('stack1');
      });

      expect(result.current.collapsedStacks.has('stack1')).toBe(true);
    });

    it('should handle special characters in stackId', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      act(() => {
        result.current.handleStackCollapse('stack-with-dashes');
        result.current.handleStackCollapse('stack_with_underscores');
        result.current.handleStackCollapse('stack.with.dots');
      });

      expect(result.current.collapsedStacks.size).toBe(3);
    });

    it('should handle numeric stackId', () => {
      const { result } = renderHook(() =>
        useKanbanStacks({ view: mockView, updateView: mockUpdateView, onRefresh: mockOnRefresh })
      );

      const mockEvent = {
        stopPropagation: vi.fn(),
        dataTransfer: {
          setData: vi.fn(),
          effectAllowed: ''
        }
      } as any;

      result.current.handleStackDragStart('123', 0, mockEvent);

      expect(mockEvent.dataTransfer.setData).toHaveBeenCalledWith('stackId', '123');
    });
  });
});
