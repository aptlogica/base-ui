import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormModals } from '../useFormModals';
import type { FormField } from '../../../types/form';

describe('useFormModals', () => {
  const mockField: FormField = {
    id: 'f1',
    name: 'Field 1',
    type: 'text',
    label: 'Field 1',
    title: 'Field 1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have isNewColumnModalOpen false initially', () => {
      const { result } = renderHook(() => useFormModals());

      expect(result.current.isNewColumnModalOpen).toBe(false);
    });

    it('should have deleteConfirmModalOpen false initially', () => {
      const { result } = renderHook(() => useFormModals());

      expect(result.current.deleteConfirmModalOpen).toBe(false);
    });

    it('should have fieldToDelete null initially', () => {
      const { result } = renderHook(() => useFormModals());

      expect(result.current.fieldToDelete).toBeNull();
    });

    it('should have modalPosition null initially', () => {
      const { result } = renderHook(() => useFormModals());

      expect(result.current.modalPosition).toBeNull();
    });

    it('should have editColumn null initially', () => {
      const { result } = renderHook(() => useFormModals());

      expect(result.current.editColumn).toBeNull();
    });

    it('should have editModalOpen false initially', () => {
      const { result } = renderHook(() => useFormModals());

      expect(result.current.editModalOpen).toBe(false);
    });

    it('should have updateFieldConfirmModalOpen false initially', () => {
      const { result } = renderHook(() => useFormModals());

      expect(result.current.updateFieldConfirmModalOpen).toBe(false);
    });

    it('should have pendingEditColumnChanges null initially', () => {
      const { result } = renderHook(() => useFormModals());

      expect(result.current.pendingEditColumnChanges).toBeNull();
    });
  });

  describe('handleAddField', () => {
    it('should set isNewColumnModalOpen to true when handleAddField is called', () => {
      const { result } = renderHook(() => useFormModals());

      act(() => {
        result.current.handleAddField();
      });

      expect(result.current.isNewColumnModalOpen).toBe(true);
    });

    it('should set modalPosition when handleAddField is called and ref has no current', () => {
      const { result } = renderHook(() => useFormModals());

      act(() => {
        result.current.handleAddField();
      });

      expect(result.current.modalPosition).not.toBeNull();
      expect(result.current.modalPosition).toHaveProperty('top');
      expect(result.current.modalPosition).toHaveProperty('left');
    });
  });

  describe('handleCloseNewColumnModal', () => {
    it('should set isNewColumnModalOpen to false when handleCloseNewColumnModal is called', () => {
      const { result } = renderHook(() => useFormModals());

      act(() => {
        result.current.handleAddField();
      });
      act(() => {
        result.current.handleCloseNewColumnModal();
      });

      expect(result.current.isNewColumnModalOpen).toBe(false);
    });

    it('should set modalPosition to null when handleCloseNewColumnModal is called', () => {
      const { result } = renderHook(() => useFormModals());

      act(() => {
        result.current.handleAddField();
      });
      act(() => {
        result.current.handleCloseNewColumnModal();
      });

      expect(result.current.modalPosition).toBeNull();
    });
  });

  describe('handleFieldEdit', () => {
    it('should set editColumn and editModalOpen when handleFieldEdit is called', () => {
      const { result } = renderHook(() => useFormModals());

      act(() => {
        result.current.handleFieldEdit(mockField);
      });

      expect(result.current.editColumn).toEqual(mockField);
      expect(result.current.editModalOpen).toBe(true);
    });
  });

  describe('handleCloseEditModal', () => {
    it('should clear editColumn and set editModalOpen to false when handleCloseEditModal is called', () => {
      const { result } = renderHook(() => useFormModals());

      act(() => {
        result.current.handleFieldEdit(mockField);
      });
      act(() => {
        result.current.handleCloseEditModal();
      });

      expect(result.current.editColumn).toBeNull();
      expect(result.current.editModalOpen).toBe(false);
    });
  });

  describe('handleDeleteField', () => {
    it('should set fieldToDelete and deleteConfirmModalOpen when handleDeleteField is called', () => {
      const { result } = renderHook(() => useFormModals());

      act(() => {
        result.current.handleDeleteField('field-id-1');
      });

      expect(result.current.fieldToDelete).toBe('field-id-1');
      expect(result.current.deleteConfirmModalOpen).toBe(true);
    });
  });

  describe('handleCloseDeleteConfirmModal', () => {
    it('should clear fieldToDelete and set deleteConfirmModalOpen to false when handleCloseDeleteConfirmModal is called', () => {
      const { result } = renderHook(() => useFormModals());

      act(() => {
        result.current.handleDeleteField('field-id-1');
      });
      act(() => {
        result.current.handleCloseDeleteConfirmModal();
      });

      expect(result.current.fieldToDelete).toBeNull();
      expect(result.current.deleteConfirmModalOpen).toBe(false);
    });
  });

  describe('handleCloseUpdateFieldConfirmModal', () => {
    it('should set updateFieldConfirmModalOpen to false and clear pendingEditColumnChanges when handleCloseUpdateFieldConfirmModal is called', () => {
      const { result } = renderHook(() => useFormModals());

      act(() => {
        result.current.setUpdateFieldConfirmModalOpen(true);
        result.current.setPendingEditColumnChanges({ title: 'New' });
      });
      act(() => {
        result.current.handleCloseUpdateFieldConfirmModal();
      });

      expect(result.current.updateFieldConfirmModalOpen).toBe(false);
      expect(result.current.pendingEditColumnChanges).toBeNull();
    });
  });

  describe('addFieldButtonRef', () => {
    it('should expose addFieldButtonRef', () => {
      const { result } = renderHook(() => useFormModals());

      expect(result.current.addFieldButtonRef).toBeDefined();
      expect(result.current.addFieldButtonRef).toHaveProperty('current');
    });
  });
});
