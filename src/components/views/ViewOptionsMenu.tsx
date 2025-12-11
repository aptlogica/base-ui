import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { PopoverMenu } from '../common/PopoverMenu';
import {
  Ellipsis,
  Edit,
  Trash2,
  Copy,
  Eye,
  Pin,
} from 'lucide-react';
import { EditItemModal } from '../modals/EditItemModal';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import { useUpdateView, useDeleteView } from '../../hooks/useApi';
import { useWorkspaceAccess } from '../../hooks/useWorkspaceAccess';

interface ViewOptionsMenuProps {
  view: any;
  onRename: (name: string) => void;
  onEditDescription: (desc: string) => void;
  onDelete: () => void;
  onEditingChange?: (isEditing: boolean) => void;
  onPinToggle?: (viewId: string, newStatus: boolean) => void;
  portaled?: boolean;
  align?: 'left' | 'right' | 'auto';
  isPinned?: boolean;
  workspaceId?: string; // Optional workspace ID to help determine access
}

const ViewOptionsMenu: React.FC<ViewOptionsMenuProps> = ({ view, onRename, onEditDescription, onDelete, onEditingChange, portaled = false, align = 'auto', onPinToggle, isPinned = false, workspaceId: propWorkspaceId }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showIdCopied, setShowIdCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const updateViewMutation = useUpdateView();
  const deleteViewMutation = useDeleteView();
  // Get workspace_id from prop, view, or nested table
  const workspaceId = propWorkspaceId || view?.workspace_id || view?.table?.workspace_id;
  const { canDeleteView } = useWorkspaceAccess(workspaceId);

  const handleCopyId = () => {
    navigator.clipboard.writeText(view.id);
    setShowIdCopied(true);
    setTimeout(() => setShowIdCopied(false), 1200);
  };

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
      alert(`Failed to update view "${view.title || view.name}". Please try again.`);
    }
  };

  const handleDeleteView = async () => {
    setIsLoading(true);
    try {
      await deleteViewMutation.mutateAsync(view.id);
      onDelete();
      setShowDelete(false);
    } catch (error) {
      alert(`Failed to delete view "${view.title || view.name || 'Unknown View'}". Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinClick = () => {
    if (onPinToggle) onPinToggle(view.id, !isPinned);
  };

  return (
    <>
      <PopoverMenu
        align={align}
        portaled={portaled}
        trigger={<Ellipsis className="w-4 h-4 text-gray-500" />}
        items={[
          {
            label: `VIEW ID: ${view.id}`,
            icon: <Copy className="w-4 h-4" />,
            onClick: () => handleCopyId(),
          },
          ...(onPinToggle ? [{
            label: isPinned ? 'Unpin view' : 'Pin view',
            icon: <Pin className="w-4 h-4" />,
            onClick: handlePinClick
          }] : []),
          { label: 'Edit view', icon: <Edit className="w-4 h-4" />, onClick: () => setShowEditModal(true) },
          ...(canDeleteView() ? [{ label: 'Delete view', icon: <Trash2 className="w-4 h-4" />, onClick: () => setShowDelete(true), danger: true }] : []),
        ]}
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
