import React, { useState, useMemo } from 'react';
import { UserPlus } from 'lucide-react';
import { UserAvatarStack } from './UserAvatarStack';
import { useBaseMembers } from '../../hooks/useApi';
import { useNavigationStore } from '../../stores/navigationStore';
import { AssignUserToWorkspaceModal } from '../modals/AssignUserToWorkspaceModal';
import { useWorkspaceAccess } from '../../hooks/useWorkspaceAccess';
import { useComponentVisibility, COMPONENT_IDS } from '../../contexts/RouteContext';

const HeaderMembers: React.FC = () => {
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const { selectedBaseId, selectedWorkspaceId } = useNavigationStore();
  const baseMembersQuery = useBaseMembers(selectedBaseId || '');
  const { canAssignUsers } = useWorkspaceAccess(selectedWorkspaceId || '');

  // Route-based visibility check
  const isRouteVisible = useComponentVisibility(COMPONENT_IDS.HEADER_MEMBERS);

  const members = useMemo(() => {
    if (!baseMembersQuery.data) return [];

    // Try different data structures
    let data: any[] = [];
    const queryData = baseMembersQuery.data as any;
    
    if (Array.isArray(queryData)) {
      data = queryData;
    } else if (queryData?.data && Array.isArray(queryData.data)) {
      data = queryData.data;
    } else if (queryData?.members && Array.isArray(queryData.members)) {
      data = queryData.members;
    }

    return data.map((m: any) => ({
      id: m.user_id || m.id || m.user?.id,
      name: m.display_name || m.name || m.user?.display_name || m.user?.name || m.email || m.user?.email || 'Unknown',
      avatar: m.avatar || m.user?.avatar || null,
      email: m.email || m.user?.email
    }));
  }, [baseMembersQuery.data]);


  // Combined visibility check:
  // 1. Route-based visibility (handled by RouteContext)
  // 2. Role-based permission (user can assign members)
  // 3. Base must be selected
  if (!isRouteVisible || !canAssignUsers() || !selectedBaseId) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowAddMemberModal(true)}
          className="p-2.5 rounded-xl btn-primary text-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          {/* Add Member */}
        </button>
        <div className="h-6 w-px bg-gray-300"></div>
        <UserAvatarStack
          users={members}
          maxVisible={3}
          size="lg"
        />
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && selectedBaseId && selectedWorkspaceId && (
        <AssignUserToWorkspaceModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          workspaceId={selectedWorkspaceId}
          baseId={selectedBaseId}
          onSuccess={() => {
            baseMembersQuery.refetch();
            setShowAddMemberModal(false);
          }}
        />
      )}
    </>
  );
};

export default HeaderMembers;

