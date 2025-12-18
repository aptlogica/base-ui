import { TableDB } from "./table.interface";


interface BaseDBInput {
    name: string;
    description: string;
    color: string | null;
    icon: string | null;
    is_public: boolean;
}

interface BaseDB extends BaseDBInput {
    id: string;
    owner_id: string;
    workspace_id: string;
    is_public: boolean;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    tables?: TableDB[];
}

export type { BaseDB, BaseDBInput };

