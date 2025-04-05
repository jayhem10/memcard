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
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
  created_at: string;
  theme: string | null;
  rank_id: string | null;
  quiz_completed: boolean;
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
  rank_name_fr: string | null; // Nouveau champ pour le nom du rang en français
}

export interface ProfileUpdateRequest {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  theme?: string;
  rank_id?: string;
  quiz_completed?: boolean;
}
