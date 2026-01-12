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
