import React from "react";
import { useCurrentUser, getUserInitials } from "../../../auth/useCurrentUser";
import { useUserProfile } from "../../../hooks/useApi";

interface AuditUserProps {
    placeholder?: string;
}

export const AuditUser: React.FC<AuditUserProps> = ({
    placeholder = "User...",
}) => {
    const currentUser = useCurrentUser();

    // Get user profile data for avatar
    const { data: profileResponse } = useUserProfile(currentUser?.id || '');
    const response = profileResponse as { data?: any } | undefined;
    const userProfile = response?.data;

    if (!currentUser) {
        return <div className="w-full px-2 py-1 text-sm text-gray-500">{placeholder}</div>;
    }

    return (
        <div className="w-full flex items-center gap-2 px-2 py-1 cursor-default">
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