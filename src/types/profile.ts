export interface Rank {
  id: string;
  name_en: string;
  name_fr: string;
  description_en: string | null;
  description_fr: string | null;
  level: number;
  icon_url: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
  created_at: string;
  theme: string | null;
  rank_id: number | null;
  quiz_completed: boolean;
  role: 'user' | 'admin';
  is_public: boolean;
  rank?: Rank;
}

export interface UserProfile {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  theme: string;
  provider: string;
  last_sign_in_at: string | null;
  quiz_completed: boolean;
  rank_id: number | null;
  rank_name_fr: string | null;
  role: 'user' | 'admin';
  is_public: boolean;
}

export interface ProfileUpdateRequest {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  theme?: string;
  rank_id?: number;
  quiz_completed?: boolean;
  is_public?: boolean;
}

export interface Achievement {
  id: string;
  name_en: string;
  name_fr: string;
  description_en: string;
  description_fr: string;
  category: string;
  requirement_type: string;
  requirement_value: Record<string, any>;
  icon_url: string | null;
  created_at: string;
  rank?: string | null;
  points?: number | null;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}
