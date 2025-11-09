import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { GameData, UserGameData } from '@/types/games';
import { combineGameData } from '@/lib/game-utils';
import { useAuth } from '@/context/auth-context';

export function useGame(gameId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery<GameData, Error>({
    queryKey: ['game', gameId, user?.id],
    queryFn: async () => {
      if (!user || !gameId) {
        throw new Error('Utilisateur non authentifié ou ID de jeu manquant');
      }
      
      // 1. Récupérer les informations de base du jeu avec les genres
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select(`
          *,
          console:console_id(id, name),
          game_genres(genre_id, genres(id, name))
        `)
        .eq('id', gameId)
        .single();

      if (gameError) {
        console.error('Erreur lors de la récupération du jeu:', gameError);
        throw gameError;
      }
      
      // 2. Récupérer les données spécifiques à l'utilisateur pour ce jeu
      const { data: userGameData, error: userGameError } = await supabase
        .from('user_games')
        .select('id, notes, rating, status, play_time, completion_percentage, created_at, updated_at, buy_price, condition, review')
        .eq('game_id', gameId)
        .eq('user_id', user.id)
        .maybeSingle<UserGameData>();

      if (userGameError) {
        console.error('Erreur lors de la récupération des données utilisateur pour le jeu:', userGameError);
        throw userGameError;
      }
      
      // 3. Combiner les données
      return combineGameData(gameData, userGameData);
    },
    enabled: !!gameId && !!user,
  });
}

