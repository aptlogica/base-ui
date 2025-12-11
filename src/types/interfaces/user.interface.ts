import { UserActivity } from '../../service/clientService';

interface UserBaseDB {
    email: string;
    first_name: string;
    last_name: string;
    avatar: string;
    password : string;
}

interface UserDBInput extends UserBaseDB {
    id: string;
    is_active: boolean;
    is_verified: boolean;
    last_login_at: Date | null;
    deleted_at: Date | null;
    created_at: Date;
    updated_at: Date;
    activity?: UserActivity; // User activity data for session restoration
}

export type { UserDBInput, UserBaseDB };
