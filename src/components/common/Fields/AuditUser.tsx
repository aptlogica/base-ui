// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from "react";
import { useCurrentUser, getUserInitials } from "../../../auth/useCurrentUser";
import { useUserProfile } from "../../../hooks/useApi";

interface AuditUserProps {
    placeholder?: string;
    /** Id of the user stored in the record (created_by / last_modified_by). Empty: the logged-in user is shown. */
    value?: unknown;
}

const nameOf = (u: any): string =>
    u?.display_name || [u?.first_name, u?.last_name].filter(Boolean).join(' ') || u?.email || '';

export const AuditUser: React.FC<AuditUserProps> = ({
    placeholder = "User...",
    value,
}) => {
    const currentUser = useCurrentUser();
    const recordUserId = typeof value === 'string' ? value.trim() : '';
    // the record names another user than the one logged in: show that user
    const showOther = recordUserId !== '' && recordUserId !== currentUser?.id;

    // Get user profile data (name and avatar) of the user shown
    const { data: profileResponse } = useUserProfile(showOther ? recordUserId : currentUser?.id || '');
    const response = profileResponse as { data?: any } | undefined;
    const userProfile = response?.data;

    if (showOther) {
        const name = nameOf(userProfile) || 'Unknown user';
        const avatar = userProfile?.avatar;
        return (
            <div className="w-full flex items-center gap-2 px-2 py-1 cursor-default">
                {avatar ? (
                    <img src={avatar} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                    <span className="w-6 h-6 p-3.5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[8px]">
                        {userProfile ? getUserInitials(userProfile) : '?'}
                    </span>
                )}
                <span className="text-sm text-gray-600 truncate">{name}</span>
            </div>
        );
    }

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
