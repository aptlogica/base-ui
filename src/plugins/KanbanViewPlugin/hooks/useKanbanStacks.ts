import { useState, useCallback } from 'react';

interface UseKanbanStacksOptions {
  view?: any;
  updateView?: any;
  onRefresh: () => void;
}

export function useKanbanStacks(_options: UseKanbanStacksOptions) {
  // UI state for stack creation
  const [uiState, setUiState] = useState({
    isCreateStack: false,
    newOption: '',
    isLoadingGroupBy: false
  });

  // Collapsed stacks state
  const [collapsedStacks, setCollapsedStacks] = useState<Set<string>>(new Set());

  // Handle stack collapse
  const handleStackCollapse = useCallback((stackId: string) => {
    setCollapsedStacks(prev => {
      const newCollapsed = new Set(prev);
      if (newCollapsed.has(stackId)) {
        newCollapsed.delete(stackId);
      } else {
        newCollapsed.add(stackId);
      }
      return newCollapsed;
    });
  }, []);

  // Handle create stack UI
  const handleCreateStackClick = useCallback(() => {
    setUiState(prev => ({ ...prev, isCreateStack: true }));
  }, []);

  const handleCancelCreateStack = useCallback(() => {
    setUiState(prev => ({ ...prev, isCreateStack: false, newOption: '' }));
  }, []);

  const handleNewOptionChange = useCallback((value: string) => {
    setUiState(prev => ({ ...prev, newOption: value }));
  }, []);

  // Handle stack drag & drop
  const handleStackDragStart = useCallback((stackId: string, index: number, e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('stackId', stackId);
    e.dataTransfer.setData('stackIndex', String(index));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleStackDrop = useCallback(async (targetStackId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = e.dataTransfer.getData('stackId');
    if (!sourceId || sourceId === targetStackId) return;

    // Prevent moving Uncategorized stack
    if (sourceId === 'Uncategorized') return;

    // This will be handled by the component with filteredStacks
    // The actual persistence is done in the component
  }, []);

  return {
    // State
    uiState,
    collapsedStacks,
    
    // Setters
    setUiState,
    setCollapsedStacks,
    
    // Handlers
    handleStackCollapse,
    handleCreateStackClick,
    handleCancelCreateStack,
    handleNewOptionChange,
    handleStackDragStart,
    handleStackDrop,
  };
}

