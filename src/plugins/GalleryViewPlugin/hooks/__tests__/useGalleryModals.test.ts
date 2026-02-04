import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGalleryModals } from '../useGalleryModals';

describe('useGalleryModals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with all modals closed', () => {
      const { result } = renderHook(() => useGalleryModals());

      expect(result.current.isCreateModalOpen).toBe(false);
      expect(result.current.isEditModalOpen).toBe(false);
      expect(result.current.isDeleteModalOpen).toBe(false);
    });

    it('should initialize with no selected record', () => {
      const { result } = renderHook(() => useGalleryModals());

      expect(result.current.selectedRecord).toBeNull();
    });
  });

  describe('create modal', () => {
    it('should open create modal', () => {
      const { result } = renderHook(() => useGalleryModals());

      act(() => {
        result.current.handleCreateRecord();
      });

      expect(result.current.isCreateModalOpen).toBe(true);
    });

    it('should close create modal', () => {
      const { result } = renderHook(() => useGalleryModals());

      act(() => {
        result.current.handleCreateRecord();
      });

      act(() => {
        result.current.handleCloseCreateModal();
      });

      expect(result.current.isCreateModalOpen).toBe(false);
    });

    it('should close create modal on success', () => {
      const mockRefresh = vi.fn();
      const { result } = renderHook(() => useGalleryModals());

      act(() => {
        result.current.handleCreateRecord();
      });

      act(() => {
        result.current.handleCreateSuccess(mockRefresh);
      });

      expect(result.current.isCreateModalOpen).toBe(false);
    });

    it('should call refresh callback on create success', () => {
      const mockRefresh = vi.fn();
      const { result } = renderHook(() => useGalleryModals());

      act(() => {
        result.current.handleCreateSuccess(mockRefresh);
      });

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('should handle create success without refresh callback', () => {
      const { result } = renderHook(() => useGalleryModals());

      act(() => {
        result.current.handleCreateRecord();
      });

      act(() => {
        result.current.handleCreateSuccess();
      });

      expect(result.current.isCreateModalOpen).toBe(false);
    });
  });

  describe('edit modal', () => {
    it('should open edit modal with record', () => {
      const { result } = renderHook(() => useGalleryModals());
      const record = { id: 'rec-1', title: 'Test Record' };

      act(() => {
        result.current.handleEditRecord(record);
      });

      expect(result.current.isEditModalOpen).toBe(true);
      expect(result.current.selectedRecord).toEqual(record);
    });

    it('should close edit modal', () => {
      const { result } = renderHook(() => useGalleryModals());
      const record = { id: 'rec-1', title: 'Test Record' };

      act(() => {
        result.current.handleEditRecord(record);
      });

      act(() => {
        result.current.handleCloseEditModal();
      });

      expect(result.current.isEditModalOpen).toBe(false);
      expect(result.current.selectedRecord).toBeNull();
    });

    it('should close edit modal on success', () => {
      const mockRefresh = vi.fn();
      const { result } = renderHook(() => useGalleryModals());
      const record = { id: 'rec-1', title: 'Test Record' };

      act(() => {
        result.current.handleEditRecord(record);
      });

      act(() => {
        result.current.handleEditSuccess(mockRefresh);
      });

      expect(result.current.isEditModalOpen).toBe(false);
      expect(result.current.selectedRecord).toBeNull();
    });

    it('should call refresh callback on edit success', () => {
      const mockRefresh = vi.fn();
      const { result } = renderHook(() => useGalleryModals());

      act(() => {
        result.current.handleEditSuccess(mockRefresh);
      });

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('should handle edit success without refresh callback', () => {
      const { result } = renderHook(() => useGalleryModals());
      const record = { id: 'rec-1', title: 'Test Record' };

      act(() => {
        result.current.handleEditRecord(record);
      });

      act(() => {
        result.current.handleEditSuccess();
      });

      expect(result.current.isEditModalOpen).toBe(false);
    });
  });

  describe('delete modal', () => {
    it('should open delete modal with record', () => {
      const { result } = renderHook(() => useGalleryModals());
      const record = { id: 'rec-1', title: 'Test Record' };

      act(() => {
        result.current.handleDeleteRecord(record);
      });

      expect(result.current.isDeleteModalOpen).toBe(true);
      expect(result.current.selectedRecord).toEqual(record);
    });

    it('should close delete modal', () => {
      const { result } = renderHook(() => useGalleryModals());
      const record = { id: 'rec-1', title: 'Test Record' };

      act(() => {
        result.current.handleDeleteRecord(record);
      });

      act(() => {
        result.current.handleCloseDeleteModal();
      });

      expect(result.current.isDeleteModalOpen).toBe(false);
      expect(result.current.selectedRecord).toBeNull();
    });
  });

  describe('delete from modal', () => {
    it('should close edit modal and open delete modal', () => {
      const { result } = renderHook(() => useGalleryModals());
      const record = { id: 'rec-1', title: 'Test Record' };
      const galleryItems = [{ id: 'rec-1', title: 'Test Record', rawData: record }];

      act(() => {
        result.current.handleEditRecord(record);
      });

      act(() => {
        result.current.handleDeleteRecordFromModal('rec-1', galleryItems);
      });

      expect(result.current.isEditModalOpen).toBe(false);
      expect(result.current.isDeleteModalOpen).toBe(true);
    });

    it('should find record from galleryItems by id', () => {
      const { result } = renderHook(() => useGalleryModals());
      const record = { id: 'rec-1', title: 'Test Record' };
      const galleryItems = [
        { id: 'rec-1', title: 'Item 1', rawData: record },
        { id: 'rec-2', title: 'Item 2', rawData: { id: 'rec-2' } }
      ];

      act(() => {
        result.current.handleDeleteRecordFromModal('rec-1', galleryItems);
      });

      expect(result.current.selectedRecord).toEqual(record);
    });

    it('should find record by rawData.id', () => {
      const { result } = renderHook(() => useGalleryModals());
      const record = { id: 'rec-1', title: 'Test Record' };
      const galleryItems = [
        { id: 'item-1', title: 'Item 1', rawData: record }
      ];

      act(() => {
        result.current.handleDeleteRecordFromModal('rec-1', galleryItems);
      });

      expect(result.current.selectedRecord).toEqual(record);
    });

    it('should find record by rawData._meta.id', () => {
      const { result } = renderHook(() => useGalleryModals());
      const record = { id: 'meta-id', _meta: { id: 'rec-1' }, title: 'Test Record' };
      const galleryItems = [
        { id: 'item-1', title: 'Item 1', rawData: record }
      ];

      act(() => {
        result.current.handleDeleteRecordFromModal('rec-1', galleryItems);
      });

      expect(result.current.selectedRecord).toEqual(record);
    });

    it('should create fallback record when not found', () => {
      const { result } = renderHook(() => useGalleryModals());
      const galleryItems = [
        { id: 'rec-2', title: 'Item 2', rawData: { id: 'rec-2' } }
      ];

      act(() => {
        result.current.handleDeleteRecordFromModal('rec-1', galleryItems);
      });

      expect(result.current.selectedRecord).toEqual({
        id: 'rec-1',
        title: 'Record rec-1'
      });
      expect(result.current.isDeleteModalOpen).toBe(true);
    });

    it('should handle string recordId', () => {
      const { result } = renderHook(() => useGalleryModals());
      const record = { id: '123', title: 'Test Record' };
      const galleryItems = [
        { id: '123', title: 'Item 1', rawData: record }
      ];

      act(() => {
        result.current.handleDeleteRecordFromModal('123', galleryItems);
      });

      expect(result.current.selectedRecord).toEqual(record);
    });

    it('should handle number recordId', () => {
      const { result } = renderHook(() => useGalleryModals());
      const record = { id: 123, title: 'Test Record' };
      const galleryItems = [
        { id: 123, title: 'Item 1', rawData: record }
      ];

      act(() => {
        result.current.handleDeleteRecordFromModal(123 as any, galleryItems);
      });

      expect(result.current.selectedRecord).toEqual(record);
    });

    it('should handle empty galleryItems', () => {
      const { result } = renderHook(() => useGalleryModals());

      act(() => {
        result.current.handleDeleteRecordFromModal('rec-1', []);
      });

      expect(result.current.selectedRecord).toEqual({
        id: 'rec-1',
        title: 'Record rec-1'
      });
    });

    it('should handle null rawData', () => {
      const { result } = renderHook(() => useGalleryModals());
      const galleryItems = [
        { id: 'rec-1', title: 'Item 1', rawData: null }
      ];

      act(() => {
        result.current.handleDeleteRecordFromModal('rec-1', galleryItems);
      });

      expect(result.current.selectedRecord).toEqual({
        id: 'rec-1',
        title: 'Record rec-1'
      });
    });

    it('should handle undefined item id', () => {
      const { result } = renderHook(() => useGalleryModals());
      const galleryItems = [
        { id: undefined, title: 'Item 1', rawData: { id: 'rec-1' } }
      ];

      act(() => {
        result.current.handleDeleteRecordFromModal('rec-1', galleryItems);
      });

      expect(result.current.selectedRecord?.id).toBe('rec-1');
    });
  });

  describe('handler stability', () => {
    it('should maintain handler references', () => {
      const { result, rerender } = renderHook(() => useGalleryModals());

      const handlers = {
        handleCreateRecord: result.current.handleCreateRecord,
        handleEditRecord: result.current.handleEditRecord,
        handleDeleteRecord: result.current.handleDeleteRecord,
        handleDeleteRecordFromModal: result.current.handleDeleteRecordFromModal,
        handleCloseCreateModal: result.current.handleCloseCreateModal,
        handleCloseEditModal: result.current.handleCloseEditModal,
        handleCloseDeleteModal: result.current.handleCloseDeleteModal,
        handleCreateSuccess: result.current.handleCreateSuccess,
        handleEditSuccess: result.current.handleEditSuccess,
      };

      rerender();

      expect(result.current.handleCreateRecord).toBe(handlers.handleCreateRecord);
      expect(result.current.handleEditRecord).toBe(handlers.handleEditRecord);
      expect(result.current.handleDeleteRecord).toBe(handlers.handleDeleteRecord);
      expect(result.current.handleDeleteRecordFromModal).toBe(handlers.handleDeleteRecordFromModal);
      expect(result.current.handleCloseCreateModal).toBe(handlers.handleCloseCreateModal);
      expect(result.current.handleCloseEditModal).toBe(handlers.handleCloseEditModal);
      expect(result.current.handleCloseDeleteModal).toBe(handlers.handleCloseDeleteModal);
      expect(result.current.handleCreateSuccess).toBe(handlers.handleCreateSuccess);
      expect(result.current.handleEditSuccess).toBe(handlers.handleEditSuccess);
    });
  });

  describe('modal state transitions', () => {
    it('should transition from create to closed', () => {
      const { result } = renderHook(() => useGalleryModals());

      act(() => {
        result.current.handleCreateRecord();
      });
      expect(result.current.isCreateModalOpen).toBe(true);

      act(() => {
        result.current.handleCloseCreateModal();
      });
      expect(result.current.isCreateModalOpen).toBe(false);
    });

    it('should transition from edit to delete', () => {
      const { result } = renderHook(() => useGalleryModals());
      const record = { id: 'rec-1', title: 'Test Record' };
      const galleryItems = [{ id: 'rec-1', title: 'Item 1', rawData: record }];

      act(() => {
        result.current.handleEditRecord(record);
      });
      expect(result.current.isEditModalOpen).toBe(true);

      act(() => {
        result.current.handleDeleteRecordFromModal('rec-1', galleryItems);
      });
      expect(result.current.isEditModalOpen).toBe(false);
      expect(result.current.isDeleteModalOpen).toBe(true);
    });

    it('should clear selected record when closing edit modal', () => {
      const { result } = renderHook(() => useGalleryModals());
      const record = { id: 'rec-1', title: 'Test Record' };

      act(() => {
        result.current.handleEditRecord(record);
      });
      expect(result.current.selectedRecord).toEqual(record);

      act(() => {
        result.current.handleCloseEditModal();
      });
      expect(result.current.selectedRecord).toBeNull();
    });

    it('should clear selected record when closing delete modal', () => {
      const { result } = renderHook(() => useGalleryModals());
      const record = { id: 'rec-1', title: 'Test Record' };

      act(() => {
        result.current.handleDeleteRecord(record);
      });
      expect(result.current.selectedRecord).toEqual(record);

      act(() => {
        result.current.handleCloseDeleteModal();
      });
      expect(result.current.selectedRecord).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle opening multiple modals sequentially', () => {
      const { result } = renderHook(() => useGalleryModals());

      act(() => {
        result.current.handleCreateRecord();
      });
      expect(result.current.isCreateModalOpen).toBe(true);

      act(() => {
        result.current.handleCloseCreateModal();
      });

      const record = { id: 'rec-1', title: 'Test' };
      act(() => {
        result.current.handleEditRecord(record);
      });
      expect(result.current.isEditModalOpen).toBe(true);
    });

    it('should handle null record in handleEditRecord', () => {
      const { result } = renderHook(() => useGalleryModals());

      act(() => {
        result.current.handleEditRecord(null);
      });

      expect(result.current.isEditModalOpen).toBe(true);
      expect(result.current.selectedRecord).toBeNull();
    });

    it('should handle undefined record in handleDeleteRecord', () => {
      const { result } = renderHook(() => useGalleryModals());

      act(() => {
        result.current.handleDeleteRecord(undefined as any);
      });

      expect(result.current.isDeleteModalOpen).toBe(true);
      expect(result.current.selectedRecord).toBeUndefined();
    });

    it('should handle empty string recordId', () => {
      const { result } = renderHook(() => useGalleryModals());

      act(() => {
        result.current.handleDeleteRecordFromModal('', []);
      });

      expect(result.current.selectedRecord).toEqual({
        id: '',
        title: 'Record '
      });
    });

    it('should handle recordId with special characters', () => {
      const { result } = renderHook(() => useGalleryModals());
      const record = { id: 'rec-1@#$%', title: 'Test Record' };
      const galleryItems = [
        { id: 'rec-1@#$%', title: 'Item 1', rawData: record }
      ];

      act(() => {
        result.current.handleDeleteRecordFromModal('rec-1@#$%', galleryItems);
      });

      expect(result.current.selectedRecord).toEqual(record);
    });
  });
});
