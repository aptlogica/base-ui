import { useState, useCallback } from 'react';

export function useKanbanModals() {
  // Modal state
  const [modalState, setModalState] = useState({
    create: { isOpen: false, stackId: null as string | null },
    edit: { isOpen: false, recordId: null as string | null },
    delete: { isOpen: false, recordId: null as string | null }
  });

  // Open create modal
  const handleOpenCreateRecord = useCallback((stackId: string) => {
    setModalState(prev => ({ ...prev, create: { isOpen: true, stackId } }));
  }, []);

  // Open edit modal
  const handleOpenEditRecord = useCallback((recordId: string) => {
    setModalState(prev => ({ ...prev, edit: { isOpen: true, recordId } }));
  }, []);

  // Open delete modal
  const handleOpenDeleteRecord = useCallback((recordId: string) => {
    setModalState(prev => ({ ...prev, delete: { isOpen: true, recordId } }));
  }, []);

  // Close modals
  const handleCloseCreateModal = useCallback(() => {
    setModalState(prev => ({ ...prev, create: { isOpen: false, stackId: null } }));
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setModalState(prev => ({ ...prev, edit: { isOpen: false, recordId: null } }));
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setModalState(prev => ({ ...prev, delete: { isOpen: false, recordId: null } }));
  }, []);

  // Success handlers
  const handleCreateSuccess = useCallback(() => {
    setModalState(prev => ({ ...prev, create: { isOpen: false, stackId: null } }));
  }, []);

  const handleEditSuccess = useCallback(() => {
    setModalState(prev => ({ ...prev, edit: { isOpen: false, recordId: null } }));
  }, []);

  return {
    // State
    modalState,
    
    // Handlers
    handleOpenCreateRecord,
    handleOpenEditRecord,
    handleOpenDeleteRecord,
    handleCloseCreateModal,
    handleCloseEditModal,
    handleCloseDeleteModal,
    handleCreateSuccess,
    handleEditSuccess,
  };
}

