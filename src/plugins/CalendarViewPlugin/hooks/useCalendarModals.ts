// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useState, useCallback } from 'react';
import { CalendarEvent } from './useCalendarData';

export function useCalendarModals() {
  // Modal state
  const [modalState, setModalState] = useState({
    create: { isOpen: false, selectedDate: null as Date | null },
    edit: { isOpen: false, selectedEvent: null as CalendarEvent | null },
    export: { isOpen: false }
  });

  // Open create modal
  const handleOpenCreateModal = useCallback((selectedDate: Date) => {
    setModalState(prev => ({
      ...prev,
      create: { isOpen: true, selectedDate }
    }));
  }, []);

  // Open edit modal
  const handleOpenEditModal = useCallback((selectedEvent: CalendarEvent) => {
    setModalState(prev => ({
      ...prev,
      edit: { isOpen: true, selectedEvent }
    }));
  }, []);

  // Open export modal
  const handleOpenExportModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      export: { isOpen: true }
    }));
  }, []);

  // Close modals
  const handleCloseCreateModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      create: { isOpen: false, selectedDate: null }
    }));
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      edit: { isOpen: false, selectedEvent: null }
    }));
  }, []);

  const handleCloseExportModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      export: { isOpen: false }
    }));
  }, []);

  // Success handlers
  const handleCreateSuccess = useCallback((onRefresh?: () => void) => {
    setModalState(prev => ({
      ...prev,
      create: { isOpen: false, selectedDate: null }
    }));
    if (onRefresh) {
      onRefresh();
    }
  }, []);

  const handleEditSuccess = useCallback((onRefresh?: () => void) => {
    setModalState(prev => ({
      ...prev,
      edit: { isOpen: false, selectedEvent: null }
    }));
    if (onRefresh) {
      onRefresh();
    }
  }, []);

  // Delete record from edit modal handler
  const handleDeleteRecordFromModal = useCallback(async (
    recordId: string,
    deleteEvent: (eventId: string) => Promise<void>,
    tableData: any,
    onRefresh: () => void
  ) => {
    // Close edit modal
    setModalState(prev => ({ 
      ...prev, 
      edit: { isOpen: false, selectedEvent: null } 
    }));
    // Delete the record using deleteEvent which properly wraps the mutation
    if (deleteEvent && tableData?.model?.id) {
      try {
        await deleteEvent(recordId);
        onRefresh();
      } catch (err) {
        console.error('Failed to delete record:', err);
      }
    }
  }, []);

  return {
    // State
    modalState,
    
    // Handlers
    handleOpenCreateModal,
    handleOpenEditModal,
    handleOpenExportModal,
    handleCloseCreateModal,
    handleCloseEditModal,
    handleCloseExportModal,
    handleCreateSuccess,
    handleEditSuccess,
    handleDeleteRecordFromModal,
  };
}

