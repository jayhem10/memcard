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
  review: string | null;
  edition: string | null;
  edition_other: string | null;
};

export type GameData = {
  id: string;
  title: string;
  description_en: string | null;
  description_fr: string | null;
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

export const EDITION_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'enhanced', label: 'Édition Enhanced' },
  { value: 'collector', label: 'Édition Collector' },
  { value: 'limitee', label: 'Édition Limitée' },
  { value: 'deluxe', label: 'Édition Deluxe' },
  { value: 'ultimate', label: 'Édition Ultimate' },
  { value: 'goty', label: 'Édition GOTY (Game of the Year)' },
  { value: 'day_one', label: 'Édition Day One' },
  { value: 'prestige', label: 'Édition Prestige' },
  { value: 'steelbook', label: 'Édition Steelbook' },
  { value: 'autres', label: 'Autres' },
] as const;

export type EditionValue = typeof EDITION_OPTIONS[number]['value'];

