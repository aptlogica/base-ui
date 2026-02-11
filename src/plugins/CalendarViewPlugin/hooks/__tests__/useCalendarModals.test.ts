import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalendarModals } from '../useCalendarModals';

describe('useCalendarModals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with all modals closed', () => {
      const { result } = renderHook(() => useCalendarModals());

      expect(result.current.modalState.create.isOpen).toBe(false);
      expect(result.current.modalState.create.selectedDate).toBeNull();
      expect(result.current.modalState.edit.isOpen).toBe(false);
      expect(result.current.modalState.edit.selectedEvent).toBeNull();
      expect(result.current.modalState.export.isOpen).toBe(false);
    });
  });

  describe('handleOpenCreateModal', () => {
    it('should open create modal with selected date', () => {
      const { result } = renderHook(() => useCalendarModals());
      const selectedDate = new Date('2026-06-15');

      act(() => {
        result.current.handleOpenCreateModal(selectedDate);
      });

      expect(result.current.modalState.create.isOpen).toBe(true);
      expect(result.current.modalState.create.selectedDate).toEqual(selectedDate);
    });

    it('should not affect other modals', () => {
      const { result } = renderHook(() => useCalendarModals());
      const selectedDate = new Date('2026-06-15');

      act(() => {
        result.current.handleOpenCreateModal(selectedDate);
      });

      expect(result.current.modalState.edit.isOpen).toBe(false);
      expect(result.current.modalState.export.isOpen).toBe(false);
    });
  });

  describe('handleOpenEditModal', () => {
    it('should open edit modal with selected event', () => {
      const { result } = renderHook(() => useCalendarModals());
      const selectedEvent = {
        id: '1',
        title: 'Test Event',
        date: '2026-06-15',
        dateTime: new Date('2026-06-15'),
        data: {},
        color: 'blue'
      };

      act(() => {
        result.current.handleOpenEditModal(selectedEvent);
      });

      expect(result.current.modalState.edit.isOpen).toBe(true);
      expect(result.current.modalState.edit.selectedEvent).toEqual(selectedEvent);
    });

    it('should not affect other modals', () => {
      const { result } = renderHook(() => useCalendarModals());
      const selectedEvent = {
        id: '1',
        title: 'Test Event',
        date: '2026-06-15',
        dateTime: new Date('2026-06-15'),
        data: {},
        color: 'blue'
      };

      act(() => {
        result.current.handleOpenEditModal(selectedEvent);
      });

      expect(result.current.modalState.create.isOpen).toBe(false);
      expect(result.current.modalState.export.isOpen).toBe(false);
    });
  });

  describe('handleOpenExportModal', () => {
    it('should open export modal', () => {
      const { result } = renderHook(() => useCalendarModals());

      act(() => {
        result.current.handleOpenExportModal();
      });

      expect(result.current.modalState.export.isOpen).toBe(true);
    });

    it('should not affect other modals', () => {
      const { result } = renderHook(() => useCalendarModals());

      act(() => {
        result.current.handleOpenExportModal();
      });

      expect(result.current.modalState.create.isOpen).toBe(false);
      expect(result.current.modalState.edit.isOpen).toBe(false);
    });
  });

  describe('handleCloseCreateModal', () => {
    it('should close create modal', () => {
      const { result } = renderHook(() => useCalendarModals());

      act(() => {
        result.current.handleOpenCreateModal(new Date());
      });

      expect(result.current.modalState.create.isOpen).toBe(true);

      act(() => {
        result.current.handleCloseCreateModal();
      });

      expect(result.current.modalState.create.isOpen).toBe(false);
      expect(result.current.modalState.create.selectedDate).toBeNull();
    });
  });

  describe('handleCloseEditModal', () => {
    it('should close edit modal', () => {
      const { result } = renderHook(() => useCalendarModals());
      const event = {
        id: '1',
        title: 'Test',
        date: '2026-06-15',
        dateTime: new Date(),
        data: {},
        color: 'blue'
      };

      act(() => {
        result.current.handleOpenEditModal(event);
      });

      expect(result.current.modalState.edit.isOpen).toBe(true);

      act(() => {
        result.current.handleCloseEditModal();
      });

      expect(result.current.modalState.edit.isOpen).toBe(false);
      expect(result.current.modalState.edit.selectedEvent).toBeNull();
    });
  });

  describe('handleCloseExportModal', () => {
    it('should close export modal', () => {
      const { result } = renderHook(() => useCalendarModals());

      act(() => {
        result.current.handleOpenExportModal();
      });

      expect(result.current.modalState.export.isOpen).toBe(true);

      act(() => {
        result.current.handleCloseExportModal();
      });

      expect(result.current.modalState.export.isOpen).toBe(false);
    });
  });

  describe('handleCreateSuccess', () => {
    it('should close create modal', () => {
      const { result } = renderHook(() => useCalendarModals());

      act(() => {
        result.current.handleOpenCreateModal(new Date());
      });

      act(() => {
        result.current.handleCreateSuccess();
      });

      expect(result.current.modalState.create.isOpen).toBe(false);
      expect(result.current.modalState.create.selectedDate).toBeNull();
    });

    it('should call onRefresh if provided', () => {
      const { result } = renderHook(() => useCalendarModals());
      const mockRefresh = vi.fn();

      act(() => {
        result.current.handleOpenCreateModal(new Date());
      });

      act(() => {
        result.current.handleCreateSuccess(mockRefresh);
      });

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('should not call onRefresh if not provided', () => {
      const { result } = renderHook(() => useCalendarModals());

      act(() => {
        result.current.handleOpenCreateModal(new Date());
      });

      act(() => {
        result.current.handleCreateSuccess();
      });

      expect(result.current.modalState.create.isOpen).toBe(false);
    });
  });

  describe('handleEditSuccess', () => {
    it('should close edit modal', () => {
      const { result } = renderHook(() => useCalendarModals());
      const event = {
        id: '1',
        title: 'Test',
        date: '2026-06-15',
        dateTime: new Date(),
        data: {},
        color: 'blue'
      };

      act(() => {
        result.current.handleOpenEditModal(event);
      });

      act(() => {
        result.current.handleEditSuccess();
      });

      expect(result.current.modalState.edit.isOpen).toBe(false);
      expect(result.current.modalState.edit.selectedEvent).toBeNull();
    });

    it('should call onRefresh if provided', () => {
      const { result } = renderHook(() => useCalendarModals());
      const mockRefresh = vi.fn();
      const event = {
        id: '1',
        title: 'Test',
        date: '2026-06-15',
        dateTime: new Date(),
        data: {},
        color: 'blue'
      };

      act(() => {
        result.current.handleOpenEditModal(event);
      });

      act(() => {
        result.current.handleEditSuccess(mockRefresh);
      });

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('should not call onRefresh if not provided', () => {
      const { result } = renderHook(() => useCalendarModals());
      const event = {
        id: '1',
        title: 'Test',
        date: '2026-06-15',
        dateTime: new Date(),
        data: {},
        color: 'blue'
      };

      act(() => {
        result.current.handleOpenEditModal(event);
      });

      act(() => {
        result.current.handleEditSuccess();
      });

      expect(result.current.modalState.edit.isOpen).toBe(false);
    });
  });

  describe('handleDeleteRecordFromModal', () => {
    it('should close edit modal', async () => {
      const { result } = renderHook(() => useCalendarModals());
      const mockDeleteEvent = vi.fn().mockResolvedValue(undefined);
      const mockOnRefresh = vi.fn();
      const event = {
        id: '1',
        title: 'Test',
        date: '2026-06-15',
        dateTime: new Date(),
        data: {},
        color: 'blue'
      };
      const tableData = { model: { id: 'table1' } };

      act(() => {
        result.current.handleOpenEditModal(event);
      });

      await act(async () => {
        await result.current.handleDeleteRecordFromModal(
          '1',
          mockDeleteEvent,
          tableData,
          mockOnRefresh
        );
      });

      expect(result.current.modalState.edit.isOpen).toBe(false);
      expect(result.current.modalState.edit.selectedEvent).toBeNull();
    });

    it('should call deleteEvent with record ID', async () => {
      const { result } = renderHook(() => useCalendarModals());
      const mockDeleteEvent = vi.fn().mockResolvedValue(undefined);
      const mockOnRefresh = vi.fn();
      const tableData = { model: { id: 'table1' } };

      await act(async () => {
        await result.current.handleDeleteRecordFromModal(
          'record123',
          mockDeleteEvent,
          tableData,
          mockOnRefresh
        );
      });

      expect(mockDeleteEvent).toHaveBeenCalledWith('record123');
    });

    it('should call onRefresh after deletion', async () => {
      const { result } = renderHook(() => useCalendarModals());
      const mockDeleteEvent = vi.fn().mockResolvedValue(undefined);
      const mockOnRefresh = vi.fn();
      const tableData = { model: { id: 'table1' } };

      await act(async () => {
        await result.current.handleDeleteRecordFromModal(
          'record123',
          mockDeleteEvent,
          tableData,
          mockOnRefresh
        );
      });

      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });

    it('should handle deletion errors', async () => {
      const { result } = renderHook(() => useCalendarModals());
      const mockDeleteEvent = vi.fn().mockRejectedValue(new Error('Delete failed'));
      const mockOnRefresh = vi.fn();
      const tableData = { model: { id: 'table1' } };
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await act(async () => {
        await result.current.handleDeleteRecordFromModal(
          'record123',
          mockDeleteEvent,
          tableData,
          mockOnRefresh
        );
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(mockOnRefresh).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle missing deleteEvent gracefully', async () => {
      const { result } = renderHook(() => useCalendarModals());
      const mockOnRefresh = vi.fn();
      const tableData = { model: { id: 'table1' } };

      await act(async () => {
        await result.current.handleDeleteRecordFromModal(
          'record123',
          undefined as any,
          tableData,
          mockOnRefresh
        );
      });

      expect(mockOnRefresh).not.toHaveBeenCalled();
    });

    it('should handle missing tableData gracefully', async () => {
      const { result } = renderHook(() => useCalendarModals());
      const mockDeleteEvent = vi.fn().mockResolvedValue(undefined);
      const mockOnRefresh = vi.fn();

      await act(async () => {
        await result.current.handleDeleteRecordFromModal(
          'record123',
          mockDeleteEvent,
          {} as any,
          mockOnRefresh
        );
      });

      expect(mockDeleteEvent).not.toHaveBeenCalled();
      expect(mockOnRefresh).not.toHaveBeenCalled();
    });
  });

  describe('multiple modals', () => {
    it('should allow opening different modals independently', () => {
      const { result } = renderHook(() => useCalendarModals());

      act(() => {
        result.current.handleOpenCreateModal(new Date());
      });

      expect(result.current.modalState.create.isOpen).toBe(true);

      act(() => {
        result.current.handleCloseCreateModal();
        result.current.handleOpenExportModal();
      });

      expect(result.current.modalState.create.isOpen).toBe(false);
      expect(result.current.modalState.export.isOpen).toBe(true);
    });
  });
});
