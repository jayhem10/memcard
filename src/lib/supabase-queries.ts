/**
 * Constantes pour les sélections Supabase réutilisables
 * Évite la duplication de code (principe DRY)
 */

// Sélection standard pour les consoles
export const CONSOLE_SELECT = 'console:console_id(id, name)';

// Sélection standard pour les genres de jeux
export const GAME_GENRES_SELECT = 'game_genres(genre_id, genres(id, name))';

// Sélection complète pour un jeu avec relations
export const GAME_WITH_RELATIONS_SELECT = `
  *,
  ${CONSOLE_SELECT},
  ${GAME_GENRES_SELECT}
`;

// Sélection pour user_games avec toutes les relations nécessaires
export const USER_GAME_WITH_RELATIONS_SELECT = `
  id,
  game_id,
  status,
  rating,
  notes,
  created_at,
  updated_at,
  purchase_date,
  play_time,
  completion_percentage,
  buy_price,
  buy,
  edition,
  edition_other,
  games:game_id(
    id,
    igdb_id,
    title,
    release_date,
    developer,
    publisher,
    description_en,
    description_fr,
    cover_url,
    console_id,
    consoles:console_id(id, name),
    ${GAME_GENRES_SELECT}
  )
`;

// Sélection pour les données utilisateur d'un jeu
export const USER_GAME_DATA_SELECT = `
  id,
  notes,
  rating,
  status,
  play_time,
  completion_percentage,
  created_at,
  updated_at,
  buy_price,
  condition,
  review,
  edition,
  edition_other
`;

// Sélection pour un jeu similaire (minimal)
export const SIMILAR_GAME_SELECT = `
  id,
  title,
  cover_url,
  igdb_id,
  ${CONSOLE_SELECT}
`;

// Sélection pour les informations de base d'un jeu avec genres (pour similar games)
export const GAME_BASIC_WITH_GENRES_SELECT = `
  id,
  console_id,
  developer,
  publisher,
  ${GAME_GENRES_SELECT}
`;

// Sélection pour le profil avec rang
export const PROFILE_WITH_RANK_SELECT = `
  id,
  username,
  full_name,
  avatar_url,
  theme,
  rank_id,
  quiz_completed,
  is_public,
  role,
  updated_at,
  created_at,
  ranks (
    id,
    name_fr,
    description_fr,
    icon_url
  )
`;

