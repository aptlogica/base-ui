import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { PopoverMenu } from '../common/PopoverMenu';
import {
  Ellipsis,
  Edit,
  Trash2,
  Eye,
  Pin,
} from 'lucide-react';
import { EditItemModal } from '../modals/EditItemModal';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import { useUpdateView, useDeleteView } from '../../hooks/useApi';
import { useBaseAccess } from '../../hooks/useBaseAccess';

interface ViewOptionsMenuProps {
  view: any;
  onRename: (name: string) => void;
  onEditDescription: (desc: string) => void;
  onDelete: () => void;
  onPinToggle?: (viewId: string, newStatus: boolean) => void;
  portaled?: boolean;
  align?: 'left' | 'right' | 'auto';
  isPinned?: boolean;
}

const ViewOptionsMenu: React.FC<ViewOptionsMenuProps> = ({ view, onRename, onEditDescription, onDelete, portaled = false, align = 'auto', onPinToggle, isPinned = false }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const updateViewMutation = useUpdateView();
  const deleteViewMutation = useDeleteView();
  // Get base_id from view or nested table
  const baseId = view?.base_id || view?.table?.base_id;
  const { canDeleteView, isBaseReadOnly, canUpdateView } = useBaseAccess(baseId);

  const handleEditView = async ({ name, description }: { name: string; description: string }) => {
    try {
      const existingMeta = (view?.meta && typeof view.meta === 'object') ? view.meta : {};
      const flattened = existingMeta?.extra && typeof existingMeta.extra === 'object'
        ? { ...existingMeta, ...existingMeta.extra }
        : existingMeta;

      const viewUpdate = {
        title: name,
        description: description || undefined,
        meta: { ...flattened, description: description || undefined },
      };

      await updateViewMutation.mutateAsync({ viewId: view.id, view: viewUpdate });
      onRename(name);
      onEditDescription(description);
      setShowEditModal(false);
    } catch (error) {
      console.error(`Failed to update view "${view.title || view.name}". Please try again.`, error);
    }
  };

  const handleDeleteView = async () => {
    try {
      await deleteViewMutation.mutateAsync(view.id);
      onDelete();
      setShowDelete(false);
    } catch (error) {
      console.error(`Failed to delete view "${view.title || view.name || 'Unknown View'}". Please try again.`, error);
    }
  };

  const handlePinClick = () => {
    if (onPinToggle) onPinToggle(view.id, !isPinned);
  };

  // Build menu items based on permissions
  const menuItems = [
    // Pin view - only show if not read-only
    ...(onPinToggle && !isBaseReadOnly() ? [{
      label: isPinned ? 'Unpin view' : 'Pin view',
      icon: <Pin className="w-4 h-4 text-gray-500" />,
      onClick: handlePinClick
    }] : []),
    // Edit view - only show if user can update view and not read-only
    ...(canUpdateView() && !isBaseReadOnly() ? [{
      label: 'Edit view',
      icon: <Edit className="w-4 h-4 text-gray-500" />,
      onClick: () => setShowEditModal(true)
    }] : []),
    // Delete view - only show if user can delete
    ...(canDeleteView() ? [{
      label: 'Delete view',
      icon: <Trash2 className="w-4 h-4 text-red-600" />,
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
        trigger={<Ellipsis className="w-4 h-4 text-gray-500" />}
        items={menuItems}
      />

      {showEditModal &&
        ReactDOM.createPortal(
          <EditItemModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSave={handleEditView}
            title="Edit View"
            subtitle="Update view name and description"
            icon={<Eye size={20} className="icon-primary" />}
            initialName={view.title || view.name || ''}
            initialDescription={view?.description || view?.meta?.description || ''}
            itemType="view"
          />,
          document.body
        )}

      {showDelete &&
        ReactDOM.createPortal(
          <DeleteConfirmModal
            isOpen={showDelete}
            title="Delete View"
            message={`Are you sure you want to delete "${view.title || view.name}"? This action cannot be undone.`}
            onClose={() => setShowDelete(false)}
            onConfirm={handleDeleteView}
          />,
          document.body
        )}
    </>
  );
};

export default ViewOptionsMenu;
