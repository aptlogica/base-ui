// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useState, useRef, useCallback } from 'react';
import type { FormField } from '../../../types/form';

export function useFormModals() {
  // Modal states
  const [isNewColumnModalOpen, setIsNewColumnModalOpen] = useState(false);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);
  const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | null>(null);
  const [editColumn, setEditColumn] = useState<FormField | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [updateFieldConfirmModalOpen, setUpdateFieldConfirmModalOpen] = useState(false);
  const [pendingEditColumnChanges, setPendingEditColumnChanges] = useState<Record<string, unknown> | null>(null);
  
  const addFieldButtonRef = useRef<HTMLButtonElement>(null);

  // Handle adding new field - calculates modal position
  const handleAddField = useCallback(() => {
    if (addFieldButtonRef.current) {
      const rect = addFieldButtonRef.current.getBoundingClientRect();
      const top = rect.bottom + window.scrollY + 8;
      const left = rect.left + window.scrollX - 420; // modal width offset
      setModalPosition({ top, left: Math.max(8, left) });
    } else {
      // Fallback to center positioning
      setModalPosition({
        top: window.innerHeight / 2 - 200,
        left: window.innerWidth / 2 - 210
      });
    }
    setIsNewColumnModalOpen(true);
  }, []);

  // Close new column modal
  const handleCloseNewColumnModal = useCallback(() => {
    setIsNewColumnModalOpen(false);
    setModalPosition(null);
  }, []);

  // Handle field edit
  const handleFieldEdit = useCallback((field: FormField) => {
    setEditColumn(field);
    setEditModalOpen(true);
  }, []);

  // Close edit modal
  const handleCloseEditModal = useCallback(() => {
    setEditModalOpen(false);
    setEditColumn(null);
  }, []);

  // Handle delete field
  const handleDeleteField = useCallback((fieldId: string) => {
    setFieldToDelete(fieldId);
    setDeleteConfirmModalOpen(true);
  }, []);

  // Close delete confirm modal
  const handleCloseDeleteConfirmModal = useCallback(() => {
    setDeleteConfirmModalOpen(false);
    setFieldToDelete(null);
  }, []);

  // Close update field confirm modal
  const handleCloseUpdateFieldConfirmModal = useCallback(() => {
    setUpdateFieldConfirmModalOpen(false);
    setPendingEditColumnChanges(null);
    // Clear editColumn when confirmation modal is closed (cancelled)
    setEditColumn(null);
  }, []);

  return {
    // State
    isNewColumnModalOpen,
    deleteConfirmModalOpen,
    fieldToDelete,
    modalPosition,
    editColumn,
    editModalOpen,
    updateFieldConfirmModalOpen,
    pendingEditColumnChanges,
    addFieldButtonRef,
    
    // Setters
    setIsNewColumnModalOpen,
    setDeleteConfirmModalOpen,
    setFieldToDelete,
    setModalPosition,
    setEditColumn,
    setEditModalOpen,
    setUpdateFieldConfirmModalOpen,
    setPendingEditColumnChanges,
    
    // Handlers
    handleAddField,
    handleCloseNewColumnModal,
    handleFieldEdit,
    handleCloseEditModal,
    handleDeleteField,
    handleCloseDeleteConfirmModal,
    handleCloseUpdateFieldConfirmModal,
  };
}

