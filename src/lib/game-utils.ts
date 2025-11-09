// Utilitaires pour transformer et formater les données de jeux

import { GameData, UserGameData } from '@/types/games';

/**
 * Transforme les genres depuis la structure Supabase vers la structure attendue
 */
export function transformGenres(gameGenres: any[]): Array<{
  genre_id: string;
  genres: {
    id: string;
    name: string;
  };
}> {
  if (!gameGenres || !Array.isArray(gameGenres)) {
    return [];
  }
  
  return gameGenres.map((item: any) => ({
    genre_id: item.genre_id,
    genres: item.genres
  }));
}

/**
 * Combine les données d'un jeu avec les données utilisateur
 */
export function combineGameData(
  gameData: any,
  userGameData: UserGameData | null
): GameData {
  const genres = transformGenres((gameData as any).game_genres || []);
  
  // Supprimer game_genres du spread pour éviter les conflits
  const { game_genres, ...gameDataWithoutGenres } = gameData as any;
  
  return {
    ...gameDataWithoutGenres,
    genres: genres,
    user_games: userGameData ? [userGameData] : []
  };
}

/**
 * Transforme les données d'un user_game avec ses relations
 */
export function transformUserGameItem(item: any): any | null {
  if (!item.games) {
    console.warn('Données de jeu manquantes pour l\'item:', item);
    return null;
  }
  
  return {
    id: item.games.id,
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
    genres: item.games.game_genres?.map((g: any) => ({
      id: g.genres?.id,
      name: g.genres?.name
    })) || [],
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
export function sortGamesByTitle(games: any[]): any[] {
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

