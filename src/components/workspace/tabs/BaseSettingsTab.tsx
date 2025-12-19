import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDeleteBase, useBaseById, useUpdateBase } from '../../../hooks/useApi';
import { useNavigationActions } from '../../../hooks/useNavigationActions';
import { MultiLineText } from '../../common/Fields';
import { useToast } from '../../common/Toast';
import { useWorkspaceAccess } from '../../../hooks/useWorkspaceAccess';

interface BaseSettingsTabProps {
  baseId?: string;
}

export const BaseSettingsTab: React.FC<BaseSettingsTabProps> = ({ baseId }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [baseName, setBaseName] = React.useState('');
  const [baseDescription, setBaseDescription] = React.useState('');
  const [originalName, setOriginalName] = React.useState('');
  const [originalDescription, setOriginalDescription] = React.useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const updateBaseMutation = useUpdateBase();

  // TanStack Query hooks
  const deleteBaseMutation = useDeleteBase();
  const { data: baseResponse } = useBaseById(baseId || '');
  
  // Navigation state handler
  const { handleBaseDeletion } = useNavigationActions();

  // Get current base information from base response
  const currentBase = baseResponse?.data || null;
  const workspaceId = currentBase?.workspace_id;
  const { canDeleteBase, canUpdateBase } = useWorkspaceAccess(workspaceId);
  useEffect(() => {
    setBaseName(currentBase?.title || '')
    setOriginalName(currentBase?.title || '')
    setBaseDescription(currentBase?.description || '')
    setOriginalDescription(currentBase?.description || '')
},[currentBase]);

  const handleSaveBase = async () => {
    if (!baseId) return;

    const updates: any = {};
    if (baseName !== originalName) {
      updates.title = baseName;
    }
    if (baseDescription !== originalDescription) {
      updates.description = baseDescription;
    }

    // Don't send if nothing changed
    if (Object.keys(updates).length === 0) {
      toast.info('No changes to save');
      return;
    }

    try {
      await updateBaseMutation.mutateAsync({ baseId, updates });
      // Update originals to reflect saved state
      setOriginalName(baseName);
      setOriginalDescription(baseDescription);
      toast.success('Base updated successfully');
    } catch (err) {
      console.error('Failed to update base:', err);
      toast.error('Failed to update base. Please try again.');
    }
  };

  const handleDeleteBase = async () => {
    if (!baseId) return;

    setIsDeleting(true);
    try {
      const result = await deleteBaseMutation.mutateAsync(baseId);
      console.log(`Base deletion completed:`, result);

      // Use the navigation handler to properly clean up localStorage and navigate
      handleBaseDeletion(baseId);

      // Navigate to workspace or dashboard since we can't easily find other bases without additional queries
      navigate('/workspace');

    } catch (err) {
      console.error('Failed to delete base:', err);
      alert('Failed to delete base. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };


  if (!baseId) {
    return (
      <div className="bg-card rounded-xl shadow border p-8 text-center text-lg text-secondary">
        No base selected. Please select a base from the sidebar.
      </div>
    );
  }

  if (!currentBase) {
    return (
      <div className="bg-card rounded-xl shadow border p-8 text-center text-lg text-secondary">
        Base not found. Please check if the base exists.
      </div>
    );
  }


  return (
    <div className="space-y-0">
      {/* Base Information Card - Always visible */}
      <div className="bg-card rounded-xl border p-6 mb-4">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Base Information</h2>

        {/* <div className='space-y-2 mb-4'>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Base ID
          </label>
          <div className="px-3 py-2 bg-[var(--color-muted-bg)] border border-gray-200 rounded-md text-gray-900 font-mono text-sm">
            {currentBase.id || 'N/A'}
          </div>
        </div> */}
      
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={baseName}
              onChange={(e) => setBaseName(e.target.value)}
              disabled={!canUpdateBase()}
              className={`w-full text-xs px-3 h-11 border flex items-center rounded-[var(--radius-lg)] text-[var(--color-text-primary)] focus:border-[--color-brand-600] placeholder:text-[var(--color-text-placeholder)] truncate overflow-ellipsis whitespace-nowrap outline-none transition-all duration-200 ${
                canUpdateBase() 
                  ? 'bg-[--color-alpha-white] cursor-pointer' 
                  : 'bg-[var(--color-muted-bg)] cursor-not-allowed opacity-60'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <MultiLineText
              placeholder="Enter base description..."
              value={baseDescription}
              onChange={setBaseDescription}
              rows={4}
              isBorder={true}
              disabled={!canUpdateBase()}
            />
          </div>

          {canUpdateBase() && (
            <div className="flex">
              <button
                onClick={handleSaveBase}
                disabled={updateBaseMutation.isPending || (baseName === originalName && baseDescription === originalDescription)}
                className="px-4 py-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateBaseMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone Card - Only show for admin and full_access users */}
      {canDeleteBase() && (
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Danger Zone</h2>
          
          <div className="flex items-center justify-between p-4 bg-error rounded-xl border border-destructive">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-tertiary">Delete this base and all its contents.</h3>
              <p className="text-sm text-secondary mt-1">
                This will permanently remove the base "{currentBase.title}" and all its contents. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 btn-destructive rounded-md focus:outline-none focus:ring-1 focus:ring-offset-2"
            >
              Delete Base
            </button>
          </div>
        </div>
      )}

      {/* Delete Base Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="bg-modal-backdrop">
          <div className="bg-modal !h-[40vh] !max-w-2xl flex flex-col">
            <h3 className="text-[1.25rem] text-gray-900 mb-4 pb-3 border-b border-primary">Delete Base</h3>
            <div className="flex-grow">
              <div className="bg-[var(--color-error-50)] border border-red-200 rounded-md p-3 mb-6">
                <p className="text-red-800 mb-2">
                  <strong className=''>Warning:</strong> All associated tables, records, and data will be permanently deleted.
                </p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-primary">
                  <strong>Are you sure you want to proceed? This deletion cannot be reversed.</strong>
                  Confirming this action will permanently delete this base and all of its realted contents.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-tertiary bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBase}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Base'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
