// Types centralisés pour les jeux et données utilisateur

export type UserGameData = {
  id: string;
  notes: string | null;
  rating: number | null;
  status: string | null;
  play_time: number | null;
  completion_percentage: number | null;
  created_at: string | null;
  updated_at: string | null;
  buy_price: number | null;
  condition: string | null;
};

export type GameData = {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  developer: string | null;
  publisher: string | null;
  release_date: string | null;
  console_id: string | null;
  user_games: UserGameData[];
  console: {
    id: string;
    name: string;
  } | null;
  genres?: Array<{
    genre_id: string;
    genres: {
      id: string;
      name: string;
    };
  }>;
};

export type SimilarGame = {
  id: string;
  title: string;
  cover_url: string | null;
  igdb_id?: number | null;
  console: {
    id: string;
    name: string;
  } | null;
};

export type GamePrice = {
  min_price: number;
  max_price: number;
  average_price: number;
  new_price: number;
  last_updated: string;
};

export const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Non commencé',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  DROPPED: 'Abandonné',
  WISHLIST: 'Liste de souhaits',
};

