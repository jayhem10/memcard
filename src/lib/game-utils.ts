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
    description: item.games.description,
    cover_url: item.games.cover_url,
    console_id: item.games.console_id,
    console_name: item.games.consoles?.name,
    genres: item.games.game_genres?.map((g: any) => ({
      id: g.genres?.id,
      name: g.genres?.name
    })) || [],
    status: item.status,
    rating: item.rating,
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

