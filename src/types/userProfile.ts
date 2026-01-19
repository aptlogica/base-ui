export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  avatar?: string;
  email_verified: boolean;
  status: 'active' | 'inactive' | 'pending';
  last_login_at: string | null;
  last_active_at: string | null;
  timezone: string;
  locale: string;
  created_at: string;
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
