// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useState, useCallback } from 'react';

export function useGalleryModals() {
  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Create record handler
  const handleCreateRecord = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  // Edit record handler
  const handleEditRecord = useCallback((record: any) => {
    setSelectedRecord(record);
    setIsEditModalOpen(true);
  }, []);

  // Delete record handler
  const handleDeleteRecord = useCallback((record: any) => {
    setSelectedRecord(record);
    setIsDeleteModalOpen(true);
  }, []);

  // Delete record from edit modal handler
  const handleDeleteRecordFromModal = useCallback((recordId: string, galleryItems: any[]) => {
    // Close edit modal
    setIsEditModalOpen(false);

    // Find the record from galleryItems - try multiple ID formats
    const record = galleryItems.find(item => {
      const itemId = String(item.id || '');
      const rawId = String(item.rawData?.id || '');
      const metaId = String(item.rawData?._meta?.id || '');
      const searchId = String(recordId || '');
      return itemId === searchId || rawId === searchId || metaId === searchId;
    })?.rawData;

    // If not found, create a minimal record object with just the ID
    if (record) {
      setSelectedRecord(record);
    } else {
      // Fallback: create record object with just the ID
      setSelectedRecord({ id: recordId, title: `Record ${recordId}` });
    }

    // Always open the delete confirmation modal
    setIsDeleteModalOpen(true);
  }, []);

  // Close modals
  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedRecord(null);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setSelectedRecord(null);
  }, []);

  // Success handlers
  const handleCreateSuccess = useCallback((onRefresh?: () => void) => {
    setIsCreateModalOpen(false);
    if (onRefresh) {
      onRefresh();
    }
  }, []);

  const handleEditSuccess = useCallback((onRefresh?: () => void) => {
    setIsEditModalOpen(false);
    setSelectedRecord(null);
    if (onRefresh) {
      onRefresh();
    }
  }, []);

  return {
    // State
    isCreateModalOpen,
    isEditModalOpen,
    isDeleteModalOpen,
    selectedRecord,
     // Handlers
    handleCreateRecord,
    handleEditRecord,
    handleDeleteRecord,
    handleDeleteRecordFromModal,
    handleCloseCreateModal,
    handleCloseEditModal,
    handleCloseDeleteModal,
    handleCreateSuccess,
    handleEditSuccess,
  };
}

