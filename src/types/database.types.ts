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
  description: string;
  cover_url: string | null;
  console_id: string;
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
}

export type GameStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DROPPED' | 'WISHLIST';
