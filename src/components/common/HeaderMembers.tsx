// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useState, useMemo } from 'react';
import { UserPlus, Sparkles } from 'lucide-react';
import { UserAvatarStack } from './UserAvatarStack';
import { useBaseMembers } from '../../hooks/useApi';
import { useNavigationStore } from '../../stores/navigationStore';
import { AddBaseMembersModal } from '../modals/AddBaseMembersModal';
import { useWorkspaceAccess } from '../../hooks/useWorkspaceAccess';
import { useBaseAccess } from '../../hooks/useBaseAccess';
import { useComponentVisibility, COMPONENT_IDS } from '../../contexts/RouteContext';
import { useSereniChat } from '../../contexts/SereniChatContext';

const HeaderMembers: React.FC = () => {
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const { selectedBaseId, selectedWorkspaceId } = useNavigationStore();
  const baseMembersQuery = useBaseMembers(selectedBaseId || '');
  const { canAssignUsers, isWorkspaceReadOnly } = useWorkspaceAccess(selectedWorkspaceId || '');
  const { isBaseReadOnly, canManageBaseMembers } = useBaseAccess(selectedBaseId || undefined);
  const { toggleSereniChat, isSereniChatOpen } = useSereniChat();

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
  if (!isRouteVisible || !selectedBaseId) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Sereni AI Button - Hide when chat is open */}
        {!isSereniChatOpen && (
          <button
            onClick={toggleSereniChat}
            className="h-10 w-[10rem] py-2 px-3 gap-2 rounded-xl btn-primary transition-all flex items-center justify-center shadow-[inset_0_0_0_1px_rgba(10,13,18,0.18),inset_0_-2px_0_0_rgba(10,13,18,0.05),0_1px_2px_0_rgba(10,13,18,0.05)]"
            title="Ask Sereni AI"
          >
            <Sparkles className="w-5 h-5" />
             <span className="text-sm font-semibold not-italic"> Ask Sereni AI</span>
          </button>
        )}

        {(isWorkspaceReadOnly() || isBaseReadOnly()) ? (
          <span className="inline-block px-2 py-0.5 rounded-xl text-xs font-medium bg-gray-100 text-gray-700 border cursor-default">Read only</span>
        ) : (
          (canAssignUsers() || canManageBaseMembers()) && (
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="h-10 w-10 rounded-xl btn-primary text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          )
        )}
        <UserAvatarStack
          users={members}
          maxVisible={3}
          size="lg"
        />
      </div>


      {/* Add Member Modal */}
      {!(isWorkspaceReadOnly() || isBaseReadOnly()) && showAddMemberModal && selectedBaseId && selectedWorkspaceId && (
        <AddBaseMembersModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          baseId={selectedBaseId}
          workspaceId={selectedWorkspaceId}
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

