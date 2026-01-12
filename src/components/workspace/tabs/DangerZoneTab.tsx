import React, { useState } from 'react';
import { useDeleteWorkspace } from '../../../hooks/useApi';
import { useNavigationActions } from '../../../hooks/useNavigationActions';
import { useWorkspaceAccess } from '../../../hooks/useWorkspaceAccess';
import { useToast } from '../../../components/common/Toast';
import { DeleteWorkspaceModal } from '../../../components/modals/DeleteWorkspaceModal';

interface DangerZoneTabProps {
  workspaceId: string;
  workspaceTitle: string;
}

export const DangerZoneTab: React.FC<DangerZoneTabProps> = ({ workspaceId, workspaceTitle }) => {
  const deleteWorkspaceMutation = useDeleteWorkspace();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const toast = useToast();
  
  // Navigation state handler
  const { handleWorkspaceDeletion } = useNavigationActions();
  const { canDeleteWorkspace } = useWorkspaceAccess(workspaceId);

  const handleLeaveWorkspace = async () => {
    setIsLeaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowLeaveConfirm(false);
    } catch (error) {
      console.error('Error leaving workspace:', error);
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDeleteWorkspace = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async (wsId: string) => {
    try {
      await deleteWorkspaceMutation.mutateAsync(wsId);
      
      // Use the navigation handler to properly clean up localStorage and navigate
      handleWorkspaceDeletion(wsId);
      
      toast.success('Workspace deleted successfully');
    } catch (err: any) {
      console.error('Failed to delete workspace:', err);
      toast.error(err?.message || 'Failed to delete workspace. Please try again.');
      throw err; // Re-throw so modal can handle it
    }
  };

  return (
    <div className="space-y-0">
      {/* Danger Zone Card */}
      <div className="bg-sidebar rounded-xl border p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Danger Zone</h2>
        
        <div className="space-y-6">
          {/* Leave Workspace */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">Leave this workspace.</h3>
              <p className="text-sm text-gray-600 mt-1">
                You will no longer have access to this workspace unless re-invited.
              </p>
            </div>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              disabled={true}
              className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Leave Workspace
            </button>
          </div>

          {/* Delete Workspace - only show for admin users */}
          {canDeleteWorkspace() && (
            <div className="flex items-center justify-between p-4 rounded-xl border border-red-400">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">Delete this workspace and all it's contents.</h3>
                <p className="text-sm text-gray-600 mt-1">
                  This will permanently remove the workspace and all its contents. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={handleDeleteWorkspace}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete Workspace
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Leave Workspace Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-sidebar rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Leave Workspace</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to leave this workspace? You will no longer have access to it unless you are re-invited.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="px-16 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveWorkspace}
                disabled={isLeaving}
                className="px-16 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLeaving ? 'Leaving...' : 'Leave Workspace'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Workspace Confirmation Modal */}
      <DeleteWorkspaceModal
        isOpen={showDeleteConfirm}
        workspace={showDeleteConfirm ? { id: workspaceId, title: workspaceTitle, name: workspaceTitle } : null}
        onClose={() => {
          setShowDeleteConfirm(false);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
