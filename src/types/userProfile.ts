export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  avatar?: string;
  auth_provider: string;
  external_id: string;
  mfa_enabled: boolean;
  mfa_secret: string;
  email_verified: boolean;
  phone: string;
  phone_verified: boolean;
  status: 'active' | 'inactive' | 'pending';
  last_login_at: string | null;
  last_active_at: string | null;
  timezone: string;
  locale: string;
  failed_login_attempts: number;
  locked_until: string | null;
  password_changed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_deleted: boolean;
  country?: string;
  dob?: string;
}

export interface UserProfileResponse {
  success: boolean;
  message: string;
  data: UserProfile;
  meta: {
    code: string;
    http_status: number;
  };
}

export interface UserProfileUpdate {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  timezone?: string;
  country?: string;
  dob?: string;
  locale?: string;
}
