interface ViewDBInput {
    name: string;
    type: ViewType;
    config?: any;
    position: number;
    is_default: boolean;
    description?: string;
}

interface ViewDB extends ViewDBInput {
    id: string;
    table_id: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
}

import { ViewType } from '../viewTypes';

export { ViewDB, ViewDBInput, ViewType };