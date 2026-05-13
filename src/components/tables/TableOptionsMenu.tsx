// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { PopoverMenu } from '../common/PopoverMenu';
import { Ellipsis, Edit, Trash2, Table2, Pin } from 'lucide-react';
import { EditItemModal } from '../modals/EditItemModal';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import { useUpdateTable } from '../../hooks/useApi';
import { useBaseAccess } from '../../hooks/useBaseAccess';

import { ExistingItem } from '../../utils/nameValidation';

interface TableOptionsMenuProps {
  table: any;
  onRename: (name: string) => void;
  onEditDescription: (desc: string) => void;
  onDelete: () => void | Promise<void>;
  onPinToggle?: (tableId: string, newStatus: boolean) => void;
  portaled?: boolean;
  align?: 'left' | 'right' | 'auto';
  isPinned?: boolean;
  baseId?: string;
  existingTables?: ExistingItem[];
}

const TableOptionsMenu: React.FC<TableOptionsMenuProps> = ({ table, onRename, onEditDescription, onDelete, portaled = false, align = 'auto', onPinToggle, isPinned = false, baseId, existingTables = [] }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  // TanStack Query mutations
  const updateTableMutation = useUpdateTable();
  const { canDeleteTable, isBaseReadOnly, canUpdateTable } = useBaseAccess(table?.base_id);

  const handleEditTable = async ({ name, description }: { name: string; description: string }) => {
    try {
      // Fix: Use correct parameter structure
      await updateTableMutation.mutateAsync({
        tableId: table.id,
        params: {
          title: name,
          description,
          updated_at: new Date().toISOString()
        }
      });

      // Call the callback functions to update parent state
      onRename(name);
      onEditDescription(description);
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update table:', error);
      // Show user-friendly error message
      alert(`Failed to update table "${table.name}". Please try again.`);
      throw error;
    }
  };

  const handleDeleteTable = async () => {
    try {
      // Let the parent perform the delete API call + any navigation only after success.
      await Promise.resolve(onDelete());
      setShowDelete(false);
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Failed to delete table "${table.title || table.name}". Please try again.`);
    }
  };

  const handlePinClick = () => {
    if (onPinToggle) onPinToggle(table.id, !isPinned);
  };

  // Build menu items based on permissions
  const menuItems = [
    // Pin table - only show if not read-only
    ...(onPinToggle && !isBaseReadOnly() ? [{
      label: isPinned ? 'Unpin table' : 'Pin table',
      icon: <Pin className="w-5 h-5 text-gray-500" />,
      onClick: handlePinClick
    }] : []),
    // Edit table - only show if user can update table and not read-only
    ...(canUpdateTable() && !isBaseReadOnly() ? [{
      label: 'Edit table',
      icon: <Edit className="w-5 h-5 text-gray-500" />,
      onClick: () => setShowEditModal(true)
    }] : []),
    // Delete table - only show if user can delete
    ...(canDeleteTable() ? [{
      label: 'Delete table',
      icon: <Trash2 className="w-5 h-5 text-red-600" />,
      onClick: () => setShowDelete(true),
      danger: true
    }] : []),
  ];

  // Don't render menu if no actions are available
  if (menuItems.length === 0) {
    return null;
  }

  return (
    <>
      <PopoverMenu
        align={align}
        portaled={portaled}
        trigger={<Ellipsis className="w-4 h-4 text-gray-500 hover:text-gray-600" />}
        items={menuItems}
      />
      {showEditModal && ReactDOM.createPortal(
        // Add a key so the modal remounts when a different table is edited (avoids stale props in portaled contexts)
        <EditItemModal
          key={table?.id}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditTable}
          title="Edit Table"
          subtitle="Update table name and description"
          icon={<Table2 size={20} className="icon-primary" />}
          initialName={table?.title || table?.name || ''}
          // Some API shapes store description in meta/config; try common fallbacks
          initialDescription={table?.description || table?.meta?.description || ''}
          itemType="table"
          existingItems={existingTables}
          currentItemId={table?.id}
        />,
        document.body
      )}

      {showDelete && ReactDOM.createPortal(
        <DeleteConfirmModal
          isOpen={showDelete}
          title="Delete Table"
          message={`Are you sure you want to delete the table "${table.title || table.name}"? This will permanently delete the table and all its data. This action cannot be undone.`}
          onClose={() => setShowDelete(false)}
          onConfirm={handleDeleteTable}
        />,
        document.body
      )}
    </>
  );
};

export default TableOptionsMenu; 
