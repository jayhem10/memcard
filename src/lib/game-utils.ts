// Utilitaires pour transformer et formater les données de jeux

import { GameData, UserGameData } from '@/types/games';

// Types pour les données Supabase brutes
interface SupabaseGameGenre {
  genre_id: string;
  genres: {
    id: string;
    name: string;
  };
}

interface SupabaseGameData {
  id: number;
  igdb_id: number;
  title: string;
  release_date: string | null;
  developer: string | null;
  publisher: string | null;
  description_en: string | null;
  description_fr: string | null;
  cover_url: string | null;
  console_id: string;
  game_genres?: SupabaseGameGenre[];
  [key: string]: unknown;
}

interface SupabaseUserGameItem {
  id: string;
  game_id: number;
  status: string;
  rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  purchase_date: string | null;
  play_time: number | null;
  completion_percentage: number | null;
  buy_price: number | null;
  games: {
    id: number;
    igdb_id: number;
    title: string;
    release_date: string | null;
    developer: string | null;
    publisher: string | null;
    description_en: string | null;
    description_fr: string | null;
    cover_url: string | null;
    console_id: string;
    consoles?: {
      name: string;
    } | null;
    game_genres?: Array<{
      genres?: {
        id: string;
        name: string;
      } | null;
    }>;
  };
}

/**
 * Transforme les genres depuis la structure Supabase vers la structure attendue
 */
export function transformGenres(gameGenres: SupabaseGameGenre[]): Array<{
  genre_id: string;
  genres: {
    id: string;
    name: string;
  };
}> {
  if (!gameGenres || !Array.isArray(gameGenres)) {
    return [];
  }
  
  return gameGenres.map((item) => ({
    genre_id: item.genre_id,
    genres: item.genres
  }));
}

/**
 * Combine les données d'un jeu avec les données utilisateur
 */
export function combineGameData(
  gameData: SupabaseGameData,
  userGameData: UserGameData | null
): GameData {
  const genres = transformGenres(gameData.game_genres || []);
  
  // Extraire console et game_genres du spread pour éviter les conflits
  const { game_genres, console, ...gameDataWithoutGenres } = gameData;
  
  // Formater la console si elle existe
  const formattedConsole = console && typeof console === 'object' && 'id' in console && 'name' in console
    ? {
        id: String(console.id),
        name: String(console.name)
      }
    : null;
  
  return {
    ...gameDataWithoutGenres,
    id: String(gameData.id), // Convertir l'id en string pour correspondre au type GameData
    genres: genres,
    console: formattedConsole,
    user_games: userGameData ? [userGameData] : []
  };
}

/**
 * Transforme les données d'un user_game avec ses relations
 */
export function transformUserGameItem(item: SupabaseUserGameItem): {
  id: string;
  igdb_id: number;
  title: string;
  release_date: string | null;
  developer: string | null;
  publisher: string | null;
  description_en: string | null;
  description_fr: string | null;
  cover_url: string | null;
  console_id: string;
  console_name?: string;
  genres: Array<{ id: string; name: string }>;
  status: string;
  rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  purchase_date: string | null;
  play_time: number | null;
  completion_percentage: number | null;
  buy_price: number | null;
} | null {
  if (!item.games) {
    console.warn('Données de jeu manquantes pour l\'item:', item);
    return null;
  }
  
  return {
    id: String(item.games.id), // Convertir l'id en string pour correspondre au type CollectionGame
    igdb_id: item.games.igdb_id,
    title: item.games.title,
    release_date: item.games.release_date,
    developer: item.games.developer,
    publisher: item.games.publisher,
    description_en: item.games.description_en || null,
    description_fr: item.games.description_fr || null,
    cover_url: item.games.cover_url,
    console_id: item.games.console_id,
    console_name: item.games.consoles?.name,
    genres: item.games.game_genres?.map((g) => ({
      id: g.genres?.id || '',
      name: g.genres?.name || ''
    })).filter(g => g.id && g.name) || [],
    status: item.status,
    rating: item.rating !== null && item.rating !== undefined ? Number(item.rating) : null,
    notes: item.notes,
    created_at: item.created_at,
    updated_at: item.updated_at,
    purchase_date: item.purchase_date,
    play_time: item.play_time,
    completion_percentage: item.completion_percentage,
    buy_price: item.buy_price
  };
}

/**
 * Trie les jeux par titre (ordre alphabétique français)
 */
export function sortGamesByTitle<T extends { title: string }>(games: T[]): T[] {
  return [...games].sort((a, b) => 
    a.title.localeCompare(b.title, 'fr', { 
      numeric: true, 
      sensitivity: 'base' 
    })
  );
}

/**
 * Génère une URL d'image IGDB avec la taille optimale
 * @param imageId L'ID de l'image IGDB
 * @param size La taille souhaitée ('thumb', 'cover_small', 'cover_big', '720p', '1080p')
 * @returns URL de l'image IGDB
 * 
 * Tailles disponibles:
 * - thumb: 90x128 (micro thumbnail)
 * - cover_small: 90x128 (petite couverture)
 * - cover_big: 264x374 (couverture moyenne - ancienne taille par défaut)
 * - 720p: 720x auto (HD - bon compromis qualité/performance)
 * - 1080p: 1080x auto (Full HD - meilleure qualité)
 */
export function getIGDBImageUrl(
  imageId: string,
  size: 'thumb' | 'cover_small' | 'cover_big' | '720p' | '1080p' = '720p'
): string {
  const sizeMap = {
    'thumb': 't_thumb',
    'cover_small': 't_cover_small',
    'cover_big': 't_cover_big',
    '720p': 't_720p',
    '1080p': 't_1080p'
  };
  
  const sizeParam = sizeMap[size];
  return `https://images.igdb.com/igdb/image/upload/${sizeParam}/${imageId}.jpg`;
}

