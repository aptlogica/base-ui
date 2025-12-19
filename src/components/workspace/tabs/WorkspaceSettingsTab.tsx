import React from 'react';
import { Plus, X } from 'lucide-react';
import { AdvancedDropdown } from '../../common/dropdown/AdvancedDropdown';
import { useWorkspaces, useWorkspaceById, useCreateWorkspace } from '../../../hooks/useApi';
import { useToast } from '../../common/Toast';
import { useWorkspaceAccess } from '../../../hooks/useWorkspaceAccess';

export const WorkspaceSettingsTab: React.FC = () => {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = React.useState<string>('');
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = React.useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = React.useState('');
  
  const workspacesQuery = useWorkspaces();
  const workspaceDetailsQuery = useWorkspaceById(selectedWorkspaceId);
  const createWorkspaceMutation = useCreateWorkspace();
  const toast = useToast();
  const { canCreateWorkspace } = useWorkspaceAccess();
  
  const workspaces = workspacesQuery.data || [];
  
  // Extract workspace details from response
  const workspaceDetails = workspaceDetailsQuery.data?.data || workspaceDetailsQuery.data;
  
  // Create dropdown options from workspaces
  const dropdownOptions = workspaces.map((ws: any) => ({
    label: ws.title || 'Untitled Workspace',
    value: ws.id,
  }));
  
  // Set default selected workspace on load
  React.useEffect(() => {
    if (workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, selectedWorkspaceId]);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast.error('Workspace name is required');
      return;
    }

    try {
      await createWorkspaceMutation.mutateAsync({
        workspace: {
          title: newWorkspaceName,
          description: newWorkspaceDescription
        }
      });
      
      setNewWorkspaceName('');
      setNewWorkspaceDescription('');
      setShowCreateForm(false);
      toast.success('Workspace created successfully');
    } catch (error) {
      toast.error('Failed to create workspace');
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Workspace Settings</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your workspaces and configure their settings</p>
        </div>
        {canCreateWorkspace() && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors font-medium"
          >
            <Plus size={18} />
            Create Space
          </button>
        )}
      </div>

      {/* Card 1: Space Dropdown Selector */}
      <div className="bg-card rounded-xl border p-6">
        <AdvancedDropdown
          label="Select Space"
          options={dropdownOptions}
          value={selectedWorkspaceId}
          onChange={(value) => setSelectedWorkspaceId(value as string)}
          placeholder="Select a workspace"
          searchable
        />
      </div>

      {/* Card 2: Workspace General Information */}
      {selectedWorkspaceId && workspaceDetails && (
        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">General Information</h3>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Workspace ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Workspace ID</label>
              <input
                type="text"
                value={workspaceDetails.id || ''}
                disabled
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-medium cursor-not-allowed"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={workspaceDetails.title || ''}
                disabled
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-medium cursor-not-allowed"
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={workspaceDetails.description || ''}
                disabled
                rows={3}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-medium cursor-not-allowed resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Card 3: Create New Workspace Form */}
      {showCreateForm && (
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Create New Space</h3>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewWorkspaceName('');
                setNewWorkspaceDescription('');
              }}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Workspace Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Space Name *</label>
              <input
                type="text"
                placeholder="Enter space name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* Workspace Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                placeholder="Enter space description (optional)"
                value={newWorkspaceDescription}
                onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 resize-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewWorkspaceName('');
                setNewWorkspaceDescription('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateWorkspace}
              disabled={createWorkspaceMutation.isPending}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors"
            >
              {createWorkspaceMutation.isPending ? 'Creating...' : 'Create Space'}
            </button>
          </div>
        </div>
      )}

      {/* Empty State - No Workspace Selected */}
      {!selectedWorkspaceId && workspaces.length === 0 && (
        <div className="bg-gray-50 rounded-xl border p-12 text-center">
          <p className="text-gray-600 font-medium">No workspaces available</p>
          <p className="text-sm text-gray-500 mt-1">Create your first workspace to get started</p>
        </div>
      )}
    </div>
  );
};
