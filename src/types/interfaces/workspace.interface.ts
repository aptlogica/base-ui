// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
export interface WorkspaceBaseInput {
    title: string;
    description: string;
}

export interface WorkspaceDB {
    id: string;
    title: string;
    description?: string;
    slug: string;
    settings: Record<string, any>;
    is_default: boolean;
    status: string;
    created_at: string;
    updated_at: string;
}
