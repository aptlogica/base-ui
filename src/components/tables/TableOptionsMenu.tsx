import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { PopoverMenu } from '../common/PopoverMenu';
import { Ellipsis, Edit, Trash2, Copy, Table2, Pin } from 'lucide-react';
import { EditItemModal } from '../modals/EditItemModal';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import { useUpdateTable, useDeleteTable } from '../../hooks/useApi';
import { useNavigationActions } from '../../hooks/useNavigationActions';
import { useWorkspaceAccess } from '../../hooks/useWorkspaceAccess';

import { ExistingItem } from '../../utils/nameValidation';

interface TableOptionsMenuProps {
  table: any;
  onRename: (name: string) => void;
  onEditDescription: (desc: string) => void;
  onDelete: () => void;
  onEditingChange?: (isEditing: boolean) => void;
  onPinToggle?: (tableId: string, newStatus: boolean) => void;
  portaled?: boolean;
  align?: 'left' | 'right' | 'auto';
  isPinned?: boolean;
  baseId?: string;
  existingTables?: ExistingItem[];
}

const TableOptionsMenu: React.FC<TableOptionsMenuProps> = ({ table, onRename, onEditDescription, onDelete, onEditingChange, portaled = false, align = 'auto', onPinToggle, isPinned = false, baseId, existingTables = [] }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showIdCopied, setShowIdCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // TanStack Query mutations
  const updateTableMutation = useUpdateTable();
  const deleteTableMutation = useDeleteTable();
  const { handleTableDeletion } = useNavigationActions();
  const { canDeleteTable } = useWorkspaceAccess(table?.workspace_id);

  const handleCopyId = () => {
    navigator.clipboard.writeText(table.id);
    setShowIdCopied(true);
    setTimeout(() => setShowIdCopied(false), 1200);
  };

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
    setIsLoading(true);
    try {
      // Only call the navigation handler - the API call should be handled by the parent component
      // to avoid duplicate API calls
      await handleTableDeletion(table.id);
      onDelete();
      setShowDelete(false);
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Failed to delete table "${table.title || table.name}". Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinClick = () => {
    if (onPinToggle) onPinToggle(table.id, !isPinned);
  };

  return (
    <>
      <PopoverMenu
        align={align}
        portaled={portaled}
        trigger={<Ellipsis className="w-4 h-4 text-gray-500 hover:text-gray-600" />}
        items={[
          {
            label: `TABLE ID: ${table.id}`,
            icon: <Copy className="w-4 h-4" />,
            onClick: () => handleCopyId(),
          },
          ...(onPinToggle ? [{ 
            label: isPinned ? 'Unpin table' : 'Pin table', 
            icon: <Pin className="w-4 h-4" />, 
            onClick: handlePinClick
          }] : []),
          { label: 'Edit table', icon: <Edit className="w-4 h-4" />, onClick: () => setShowEditModal(true) },
          ...(canDeleteTable() ? [{ label: 'Delete table', icon: <Trash2 className="w-4 h-4" />, onClick: () => setShowDelete(true), danger: true }] : []),
        ]}
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