import React, { useMemo } from 'react';
import { X, Database, Loader2, Info } from 'lucide-react';
import { useUserAccessDetails } from '../../hooks/useApi';

interface BaseAccessInfo {
  id: string;
  title: string;
}

interface WorkspaceAccessInfo {
  id: string;
  title: string;
  access_level: string;
  bases: BaseAccessInfo[];
}

interface UserAccessDetailsResponse {
  workspaces: WorkspaceAccessInfo[];
}

interface UserAccessDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export const UserAccessDetailsModal: React.FC<UserAccessDetailsModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
}) => {
  const { data, isLoading, error, refetch } = useUserAccessDetails(isOpen ? userId : null);

  // Refetch when modal opens to ensure we have the latest data
  React.useEffect(() => {
    if (isOpen && userId) {
      refetch();
    }
  }, [isOpen, userId, refetch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Data is already extracted in the hook, so we can use it directly
  const accessData = data as UserAccessDetailsResponse | null;
  const workspaces = accessData?.workspaces || [];

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalBases = workspaces.reduce((acc, ws) => acc + (ws.bases?.length || 0), 0);
    const fullAccessCount = workspaces.filter(ws => ws.access_level?.toLowerCase() === 'full_access').length;
    const limitedAccessCount = workspaces.filter(ws => ws.access_level?.toLowerCase() === 'limited_access').length;
    return {
      workspaces: workspaces.length,
      bases: totalBases,
      fullAccess: fullAccessCount,
      limitedAccess: limitedAccessCount,
    };
  }, [workspaces]);

  // Group workspaces by access level
  const groupedWorkspaces = useMemo(() => {
    const fullAccess = workspaces.filter(ws => ws.access_level?.toLowerCase() === 'full_access');
    const limitedAccess = workspaces.filter(ws => ws.access_level?.toLowerCase() === 'limited_access');
    const other = workspaces.filter(ws => {
      const level = ws.access_level?.toLowerCase();
      return level !== 'full_access' && level !== 'limited_access';
    });
    return { fullAccess, limitedAccess, other };
  }, [workspaces]);

  const getAccessLevelBadge = (accessLevel: string) => {
    const level = accessLevel.toLowerCase();
    if (level === 'full_access') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Full Access
        </span>
      );
    } else if (level === 'limited_access') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Limited Access
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {accessLevel}
      </span>
    );
  };

  return (
    <div
      className="bg-modal-backdrop"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-modal max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 icon-primary rounded-lg flex items-center justify-center">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary">Access Details</h2>
              <p className="text-sm text-secondary">{userName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X size={16} className="text-primary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading access details...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-red-500 mb-2">
                <Info className="w-8 h-8" />
              </div>
              <p className="text-sm text-gray-600">Failed to load access details</p>
              <p className="text-xs text-gray-500 mt-1">Please try again later</p>
            </div>
          ) : workspaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-sm text-gray-600">No workspace access</p>
              <p className="text-xs text-gray-500 mt-1">This user is not assigned to any workspaces</p>
            </div>
          ) : (
            <>

              {/* Grouped Workspaces */}
              <div className="space-y-6">
                {/* Full Access Workspaces */}
                {groupedWorkspaces.fullAccess.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-px flex-1 bg-green-200"></div>
                      <span className="text-xs font-semibold text-green-700 uppercase tracking-wide px-2">
                        Full Access ({groupedWorkspaces.fullAccess.length})
                      </span>
                      <div className="h-px flex-1 bg-green-200"></div>
                    </div>
                    <div className="space-y-3">
                      {groupedWorkspaces.fullAccess.map((workspace) => (
                        <WorkspaceCard key={workspace.id} workspace={workspace} getAccessLevelBadge={getAccessLevelBadge} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Limited Access Workspaces */}
                {groupedWorkspaces.limitedAccess.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-px flex-1 bg-yellow-200"></div>
                      <span className="text-xs font-semibold text-yellow-700 uppercase tracking-wide px-2">
                        Limited Access ({groupedWorkspaces.limitedAccess.length})
                      </span>
                      <div className="h-px flex-1 bg-yellow-200"></div>
                    </div>
                    <div className="space-y-3">
                      {groupedWorkspaces.limitedAccess.map((workspace) => (
                        <WorkspaceCard key={workspace.id} workspace={workspace} getAccessLevelBadge={getAccessLevelBadge} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Access Levels */}
                {groupedWorkspaces.other.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-px flex-1 bg-gray-200"></div>
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide px-2">
                        Other ({groupedWorkspaces.other.length})
                      </span>
                      <div className="h-px flex-1 bg-gray-200"></div>
                    </div>
                    <div className="space-y-3">
                      {groupedWorkspaces.other.map((workspace) => (
                        <WorkspaceCard key={workspace.id} workspace={workspace} getAccessLevelBadge={getAccessLevelBadge} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Workspace Card Component
const WorkspaceCard: React.FC<{
  workspace: { id: string; title: string; access_level: string; bases?: Array<{ id: string; title: string }> };
  getAccessLevelBadge: (accessLevel: string) => React.ReactNode;
}> = ({ workspace, getAccessLevelBadge }) => {
  return (
    <div className="border rounded-lg p-4 hover:border-gray-300 transition-colors bg-card">
      {/* Workspace Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {workspace.title}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Workspace</p>
          </div>
        </div>
        <div className="flex-shrink-0 ml-2">
          {getAccessLevelBadge(workspace.access_level)}
        </div>
      </div>

      {/* Bases List */}
      {workspace.bases && workspace.bases.length > 0 ? (
        <div className="ml-13 space-y-2">
          <p className="text-xs font-medium text-gray-700 mb-2">Bases:</p>
          <div className="space-y-1.5">
            {workspace.bases.map((base) => (
              <div
                key={base.id}
                className="flex items-center gap-2 pl-3 py-1.5 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <Database className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700">{base.title}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="ml-13">
          <p className="text-xs text-gray-500 italic">Access to all bases</p>
        </div>
      )}
    </div>
  );
};

