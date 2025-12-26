import React, { useState, useMemo, useEffect } from 'react';
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

  // Transform base members to UserAvatarStack format
  // Handle both { data: [...] } and direct array responses
  const members = useMemo(() => {
    if (!baseMembersQuery.data) return [];

    // Try different data structures
    let data: any[] = [];
    if (Array.isArray(baseMembersQuery.data)) {
      data = baseMembersQuery.data;
    } else if (baseMembersQuery.data?.data && Array.isArray(baseMembersQuery.data.data)) {
      data = baseMembersQuery.data.data;
    } else if (baseMembersQuery.data?.members && Array.isArray(baseMembersQuery.data.members)) {
      data = baseMembersQuery.data.members;
    }

    return data.map((m: any) => ({
      id: m.user_id || m.id || m.user?.id,
      name: m.display_name || m.name || m.user?.display_name || m.user?.name || m.email || m.user?.email || 'Unknown',
      avatar: m.avatar || m.user?.avatar || null,
      email: m.email || m.user?.email
    }));
  }, [baseMembersQuery.data]);

  // Debug logging (remove in production)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[HeaderMembers] Debug:', {
        selectedBaseId,
        selectedWorkspaceId,
        canAssignUsers: canAssignUsers(),
        queryStatus: baseMembersQuery.status,
        queryData: baseMembersQuery.data,
        queryError: baseMembersQuery.error,
        isLoading: baseMembersQuery.isLoading,
        isError: baseMembersQuery.isError,
        membersCount: members.length,
        members: members,
      });
    }
  }, [selectedBaseId, selectedWorkspaceId, canAssignUsers, baseMembersQuery, members]);

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
          size="md"
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

