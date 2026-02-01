import React from "react";
import { useCurrentUser, getUserInitials } from "../../../auth/useCurrentUser";
import { useUserProfile } from "../../../hooks/useApi";
import { UserProfile } from "../../../types/userProfile";


interface AuditCreatedByProps {
  placeholder?: string;
  disabled?: boolean;
}

export const AuditCreatedBy: React.FC<AuditCreatedByProps> = ({
  placeholder = "Created by...",
  disabled = false,
}) => {
  const currentUser = useCurrentUser();

  // Get user profile data for avatar
  const profileData = useUserProfile(currentUser?.id || '');
  const profileResponse = profileData?.data;
  const userProfile: UserProfile | null = (profileResponse as any)?.data || null;

  if (!currentUser) {
    return <div className="w-full px-2 py-1 text-sm text-gray-500">{placeholder}</div>;
  }

  return (
    <div className="w-full flex items-center gap-2 px-2 py-1">
      {userProfile?.avatar || currentUser?.avatar ? (
        <img
          src={userProfile?.avatar || currentUser?.avatar}
          alt="Profile"
          className="w-6 h-6 rounded-full object-cover"
        />
      ) : (
        <span className="w-6 h-6 p-3.5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[8px]">
          {getUserInitials(currentUser)}
        </span>
      )}
      <span className="text-sm text-gray-600 truncate">{currentUser?.display_name || 'user@example.com'}</span>
    </div>
  );
};
