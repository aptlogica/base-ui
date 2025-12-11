

export interface CreateWorkspace {
    title: string;
    description: string;
}


export interface UpdateWorkspace {
    title?: string;
    description?: string;
    slug?: string;
    settings?: any;
    is_default?: boolean;
    status?: string;
    updated_at?: string;
}