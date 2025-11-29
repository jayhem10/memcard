export interface Console {
  id: string;
  name: string;
  manufacturer: string;
  release_year: number;
  image_url: string;
}

export interface Game {
  id: string;
  igdb_id: number;
  title: string;
  release_date: string | null;
  developer: string;
  publisher: string;
  description_en: string;
  description_fr: string | null;
  cover_url: string | null;
  console_id: string;
  average_rating: number | null;
}

export interface Genre {
  id: string;
  name: string;
}

export interface GameGenre {
  game_id: string;
  genre_id: string;
}

export interface UserGame {
  id: string;
  user_id: string;
  game_id: string;
  purchase_date: string;
  notes: string | null;
  rating: number | null;
  status: string;
  play_time: number | null;
  completion_percentage: number | null;
  created_at: string;
  updated_at: string;
  buy_price: number | null;
  buy: boolean | null;
  review: string | null;
  edition: string | null;
  edition_other: string | null;
}

export interface WishlistShare {
  id: string;
  user_id: string;
  token: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export interface WishlistNotification {
  id: string;
  user_id: string;
  user_game_id: string;
  created_at: string;
  validated_at: string | null;
  is_validated: boolean;
  game?: {
    id: string;
    title: string;
    cover_url: string | null;
  };
}

export type GameStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DROPPED' | 'WISHLIST';
