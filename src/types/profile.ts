export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
  created_at: string;
  theme: string | null;
}

export interface UserProfile {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  provider: string | null;
  last_sign_in_at: string | null;
  theme: string | null;
}

export interface ProfileUpdateRequest {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  theme?: string;
}
