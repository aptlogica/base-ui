import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKanbanModals } from '../useKanbanModals';

describe('useKanbanModals Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with all modals closed', () => {
      const { result } = renderHook(() => useKanbanModals());
      
      expect(result.current.modalState.create.isOpen).toBe(false);
      expect(result.current.modalState.create.stackId).toBeNull();
      expect(result.current.modalState.edit.isOpen).toBe(false);
      expect(result.current.modalState.edit.recordId).toBeNull();
      expect(result.current.modalState.delete.isOpen).toBe(false);
      expect(result.current.modalState.delete.recordId).toBeNull();
    });
  });

  describe('Create Modal', () => {
    it('should open create modal with stackId', () => {
      const { result } = renderHook(() => useKanbanModals());
      
      act(() => {
        result.current.handleOpenCreateRecord('stack1');
      });
      
      expect(result.current.modalState.create.isOpen).toBe(true);
      expect(result.current.modalState.create.stackId).toBe('stack1');
    });

    it('should close create modal and clear stackId', () => {
      const { result } = renderHook(() => useKanbanModals());
      
      act(() => {
        result.current.handleOpenCreateRecord('stack1');
      });

      act(() => {
        result.current.handleCloseCreateModal();
      });
      
      expect(result.current.modalState.create.isOpen).toBe(false);
      expect(result.current.modalState.create.stackId).toBeNull();
    });

    it('should handle create success', () => {
      const { result } = renderHook(() => useKanbanModals());
      
      act(() => {
        result.current.handleOpenCreateRecord('stack1');
      });

      act(() => {
        result.current.handleCreateSuccess();
      });
      
      expect(result.current.modalState.create.isOpen).toBe(false);
      expect(result.current.modalState.create.stackId).toBeNull();
    });

    it('should not affect other modals when opening create modal', () => {
      const { result } = renderHook(() => useKanbanModals());
      
      act(() => {
        result.current.handleOpenEditRecord('record1');
        result.current.handleOpenCreateRecord('stack1');
      });
      
      expect(result.current.modalState.create.isOpen).toBe(true);
      expect(result.current.modalState.edit.isOpen).toBe(true);
    });

    it('should update stackId when opening create modal multiple times', () => {
      const { result } = renderHook(() => useKanbanModals());
      
      act(() => {
        result.current.handleOpenCreateRecord('stack1');
      });
      expect(result.current.modalState.create.stackId).toBe('stack1');
      
      act(() => {
        result.current.handleOpenCreateRecord('stack2');
      });
      expect(result.current.modalState.create.stackId).toBe('stack2');
    });
  });

  describe('Edit Modal', () => {
    it('should open edit modal with recordId', () => {
      const { result } = renderHook(() => useKanbanModals());
      
      act(() => {
        result.current.handleOpenEditRecord('record1');
      });
      
      expect(result.current.modalState.edit.isOpen).toBe(true);
      expect(result.current.modalState.edit.recordId).toBe('record1');
    });

    it('should close edit modal and clear recordId', () => {
      const { result } = renderHook(() => useKanbanModals());
      
      act(() => {
        result.current.handleOpenEditRecord('record1');
      });

      act(() => {
        result.current.handleCloseEditModal();
      });
      
      expect(result.current.modalState.edit.isOpen).toBe(false);
      expect(result.current.modalState.edit.recordId).toBeNull();
    });

    it('should handle edit success', () => {
      const { result } = renderHook(() => useKanbanModals());
      
      act(() => {
        result.current.handleOpenEditRecord('record1');
      });

      act(() => {
        result.current.handleEditSuccess();
      });
      
      expect(result.current.modalState.edit.isOpen).toBe(false);
      expect(result.current.modalState.edit.recordId).toBeNull();
    });

    it('should not affect other modals when opening edit modal', () => {
      const { result } = renderHook(() => useKanbanModals());
      
      act(() => {
        result.current.handleOpenDeleteRecord('record1');
        result.current.handleOpenEditRecord('record2');
      });
      
      expect(result.current.modalState.edit.isOpen).toBe(true);
      expect(result.current.modalState.delete.isOpen).toBe(true);
    });

    it('should update recordId when opening edit modal multiple times', () => {
      const { result } = renderHook(() => useKanbanModals());
      
      act(() => {
        result.current.handleOpenEditRecord('record1');
      });
      expect(result.current.modalState.edit.recordId).toBe('record1');
      
      act(() => {
        result.current.handleOpenEditRecord('record2');
      });
      expect(result.current.modalState.edit.recordId).toBe('record2');
    });
  });

  describe('Delete Modal', () => {
    it('should open delete modal with recordId', () => {
      const { result } = renderHook(() => useKanbanModals());
      
      act(() => {
        result.current.handleOpenDeleteRecord('record1');
      });
      
      expect(result.current.modalState.delete.isOpen).toBe(true);
      expect(result.current.modalState.delete.recordId).toBe('record1');
    });

    it('should close delete modal and clear recordId', () => {
      const { result } = renderHook(() => useKanbanModals());
      
      act(() => {
        result.current.handleOpenDeleteRecord('record1');
      });

      act(() => {
        result.current.handleCloseDeleteModal();
      });
      
      expect(result.current.modalState.delete.isOpen).toBe(false);
      expect(result.current.modalState.delete.recordId).toBeNull();
    });

    it('should not affect other modals when opening delete modal', () => {
      const { result } = renderHook(() => useKanbanModals());
      
      act(() => {
        result.current.handleOpenCreateRecord('stack1');
        result.current.handleOpenDeleteRecord('record1');
      });
      
      expect(result.current.modalState.delete.isOpen).toBe(true);
      expect(result.current.modalState.create.isOpen).toBe(true);
    });

    it('should update recordId when opening delete modal multiple times', () => {
      const { result } = renderHook(() => useKanbanModals());
      
      act(() => {
        result.current.handleOpenDeleteRecord('record1');
      });
      expect(result.current.modalState.delete.recordId).toBe('record1');
      
      act(() => {
        result.current.handleOpenDeleteRecord('record2');
      });
      expect(result.current.modalState.delete.recordId).toBe('record2');
    });
  });

  describe('Multiple Modals', () => {
    it('should allow all modals to be open simultaneously', () => {
      const { result } = renderHook(() => useKanbanModals());
      
      act(() => {
        result.current.handleOpenCreateRecord('stack1');
        result.current.handleOpenEditRecord('record1');
        result.current.handleOpenDeleteRecord('record2');
      });
      
      expect(result.current.modalState.create.isOpen).toBe(true);
      expect(result.current.modalState.edit.isOpen).toBe(true);
      expect(result.current.modalState.delete.isOpen).toBe(true);
    });

    it('should close specific modal without affecting others', () => {
      const { result } = renderHook(() => useKanbanModals());
      
      act(() => {
        result.current.handleOpenCreateRecord('stack1');
        result.current.handleOpenEditRecord('record1');
        result.current.handleOpenDeleteRecord('record2');
      });
      
      act(() => {
        result.current.handleCloseEditModal();
      });
      
      expect(result.current.modalState.create.isOpen).toBe(true);
      expect(result.current.modalState.edit.isOpen).toBe(false);
      expect(result.current.modalState.delete.isOpen).toBe(true);
    });

    it('should handle success for one modal without affecting others', () => {
      const { result } = renderHook(() => useKanbanModals());
      
      act(() => {
        result.current.handleOpenCreateRecord('stack1');
        result.current.handleOpenEditRecord('record1');
      });
      
      act(() => {
        result.current.handleCreateSuccess();
      });
      
      expect(result.current.modalState.create.isOpen).toBe(false);
      expect(result.current.modalState.edit.isOpen).toBe(true);
    });
  });

  describe('Handler Functions', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useKanbanModals());
      
      const handlers = {
        handleOpenCreateRecord: result.current.handleOpenCreateRecord,
        handleOpenEditRecord: result.current.handleOpenEditRecord,
        handleOpenDeleteRecord: result.current.handleOpenDeleteRecord,
        handleCloseCreateModal: result.current.handleCloseCreateModal,
        handleCloseEditModal: result.current.handleCloseEditModal,
        handleCloseDeleteModal: result.current.handleCloseDeleteModal,
        handleCreateSuccess: result.current.handleCreateSuccess,
        handleEditSuccess: result.current.handleEditSuccess
      };
      
      rerender();
      
      expect(result.current.handleOpenCreateRecord).toBe(handlers.handleOpenCreateRecord);
      expect(result.current.handleOpenEditRecord).toBe(handlers.handleOpenEditRecord);
      expect(result.current.handleOpenDeleteRecord).toBe(handlers.handleOpenDeleteRecord);
      expect(result.current.handleCloseCreateModal).toBe(handlers.handleCloseCreateModal);
      expect(result.current.handleCloseEditModal).toBe(handlers.handleCloseEditModal);
      expect(result.current.handleCloseDeleteModal).toBe(handlers.handleCloseDeleteModal);
      expect(result.current.handleCreateSuccess).toBe(handlers.handleCreateSuccess);
      expect(result.current.handleEditSuccess).toBe(handlers.handleEditSuccess);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string stackId', () => {
      const { result } = renderHook(() => useKanbanModals());
      
      act(() => {
        result.current.handleOpenCreateRecord('');
      });
      
      expect(result.current.modalState.create.isOpen).toBe(true);
      expect(result.current.modalState.create.stackId).toBe('');
    });

    it('should handle empty string recordId', () => {
      const { result } = renderHook(() => useKanbanModals());
      
      act(() => {
        result.current.handleOpenEditRecord('');
      });
      
      expect(result.current.modalState.edit.isOpen).toBe(true);
      expect(result.current.modalState.edit.recordId).toBe('');
    });

    it('should handle rapid open and close operations', () => {
      const { result } = renderHook(() => useKanbanModals());
      
      act(() => {
        result.current.handleOpenCreateRecord('stack1');
        result.current.handleCloseCreateModal();
        result.current.handleOpenCreateRecord('stack2');
        result.current.handleCloseCreateModal();
      });
      
      expect(result.current.modalState.create.isOpen).toBe(false);
      expect(result.current.modalState.create.stackId).toBeNull();
    });

    it('should handle closing already closed modal', () => {
      const { result } = renderHook(() => useKanbanModals());
      
      act(() => {
        result.current.handleCloseCreateModal();
      });
      
      expect(result.current.modalState.create.isOpen).toBe(false);
      expect(result.current.modalState.create.stackId).toBeNull();
    });

    it('should handle success on unopened modal', () => {
      const { result } = renderHook(() => useKanbanModals());
      
      act(() => {
        result.current.handleCreateSuccess();
      });
      
      expect(result.current.modalState.create.isOpen).toBe(false);
      expect(result.current.modalState.create.stackId).toBeNull();
    });
  });
});
