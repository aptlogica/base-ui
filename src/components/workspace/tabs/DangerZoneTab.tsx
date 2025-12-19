import React, { useState } from 'react';
import { useDeleteWorkspace } from '../../../hooks/useApi';
import { useNavigate } from 'react-router-dom';
import { useNavigationActions } from '../../../hooks/useNavigationActions';
import { useWorkspaceAccess } from '../../../hooks/useWorkspaceAccess';

interface DangerZoneTabProps {
  workspaceId: string;
  workspaceTitle: string;
}

export const DangerZoneTab: React.FC<DangerZoneTabProps> = ({ workspaceId, workspaceTitle }) => {
  const deleteWorkspaceMutation = useDeleteWorkspace();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState('');
  const navigate = useNavigate();
  
  // Navigation state handler
  const { handleWorkspaceDeletion } = useNavigationActions();
  const { canDeleteWorkspace } = useWorkspaceAccess(workspaceId);

  const handleLeaveWorkspace = async () => {
    setIsLeaving(true);
    try {
      // TODO: Implement leave workspace logic
      console.log('Leaving workspace:', workspaceId);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setShowLeaveConfirm(false);
    } catch (error) {
      console.error('Error leaving workspace:', error);
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteWorkspaceMutation.mutateAsync(workspaceId);
      console.log('Workspace deletion result:', result);
      // Use the navigation handler to properly clean up localStorage and navigate
      handleWorkspaceDeletion(workspaceId);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting workspace:', error);
      alert('Failed to delete workspace. Please try again.');
    } finally {
      setIsDeleting(false);
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
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Leave Workspace
            </button>
          </div>

          {/* Delete Workspace - only show for admin users */}
          {canDeleteWorkspace() && (
            <div className="flex items-center justify-between p-4 bg-error rounded-xl border border-red-400">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">Delete this workspace and all it's contents.</h3>
                <p className="text-sm text-gray-600 mt-1">
                  This will permanently remove the workspace and all its contents. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-2"
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
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveWorkspace}
                disabled={isLeaving}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLeaving ? 'Leaving...' : 'Leave Workspace'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Workspace Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="bg-modal-backdrop">
          <div className="bg-modal !h-[50vh] !max-w-2xl flex flex-col">
            <h3 className="text-[1.25rem] text-gray-900 mb-4 pb-3 border-b border-primary">Delete Workspace</h3>
            <div className="flex-grow">
              <div className="bg-[var(--color-error-50)] border border-red-200 rounded-md p-2 mb-4">
                <p className="text-red-800 mb-2">
                  <strong>Warning:</strong> All associated bases, tables, records, and data will be permanently removed.
                </p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-primary">
                  <strong>Are you sure you want to proceed? This deletion cannot be reversed.</strong>
                  Confirming this action will permanently delete this workspace and all of its realted contents.
                </p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-700">Please type <strong> {workspaceTitle}</strong> to confirm.</p>
              </div>
              <input
                  type="text"
                  id="baseName"
                  value={workspaceToDelete}
                  onChange={(e:any)=>{
                    setWorkspaceToDelete(e.target.value);
                    if(e.target.value === workspaceTitle){
                      setIsDeleting(true)
                    }else{
                      setIsDeleting(false)
                    }
                  }}
                  onPaste={(e) => e.preventDefault()}
                  placeholder="Enter workspace name"
                  className={`field-component field-component-border field-component-focus mb-4`}
                  required
                  minLength={3}
                  maxLength={50}
                  autoFocus
                />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteWorkspace}
                disabled={!isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
