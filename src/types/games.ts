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
  average_rating: number | null;
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

// Les labels de statut sont maintenant gérés via les traductions
// Cette fonction sera utilisée pour récupérer les labels traduits
export const getStatusLabels = (t: (key: string) => string) => ({
  NOT_STARTED: t('games.status.notStarted'),
  IN_PROGRESS: t('games.status.inProgress'),
  COMPLETED: t('games.status.completed'),
  DROPPED: t('games.status.dropped'),
  WISHLIST: t('games.status.wishlist'),
});

// Pour la compatibilité descendante, on garde l'ancien format mais il sera déprécié
export const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Non commencé',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  DROPPED: 'Abandonné',
  WISHLIST: 'Liste de souhaits',
};

// Les options d'édition sont maintenant gérées via les traductions
export const getEditionOptions = (t: (key: string) => string) => [
  { value: 'standard', label: t('edition.standard') },
  { value: 'enhanced', label: t('edition.enhanced') },
  { value: 'collector', label: t('edition.collector') },
  { value: 'limitee', label: t('edition.limitee') },
  { value: 'deluxe', label: t('edition.deluxe') },
  { value: 'ultimate', label: t('edition.ultimate') },
  { value: 'goty', label: t('edition.goty') },
  { value: 'day_one', label: t('edition.dayOne') },
  { value: 'prestige', label: t('edition.prestige') },
  { value: 'steelbook', label: t('edition.steelbook') },
  { value: 'autres', label: t('edition.autres') },
] as const;

// Pour la compatibilité descendante
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

