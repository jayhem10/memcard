import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { GameData, UserGameData } from '@/types/games';
import { combineGameData } from '@/lib/game-utils';
import { useAuth } from '@/context/auth-context';
import { GAME_WITH_RELATIONS_SELECT, USER_GAME_DATA_SELECT } from '@/lib/supabase-queries';
import { handleSupabaseError } from '@/lib/error-handler';
import { queryKeys, collectionQueryOptions } from '@/lib/react-query-config';

export function useGame(gameId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery<GameData, Error>({
    queryKey: queryKeys.game(gameId || '', user?.id),
    queryFn: async () => {
      if (!user || !gameId) {
        throw new Error('Utilisateur non authentifié ou ID de jeu manquant');
      }
      
      // 1. Récupérer les informations de base du jeu avec les genres
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select(GAME_WITH_RELATIONS_SELECT)
        .eq('id', gameId)
        .single();

      if (gameError) {
        handleSupabaseError(gameError, 'useGame', 'Erreur lors de la récupération du jeu');
      }
      
      // 2. Récupérer les données spécifiques à l'utilisateur pour ce jeu
      const { data: userGameData, error: userGameError } = await supabase
        .from('user_games')
        .select(USER_GAME_DATA_SELECT)
        .eq('game_id', gameId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (userGameError) {
        handleSupabaseError(userGameError, 'useGame', 'Erreur lors de la récupération des données utilisateur pour le jeu');
      }
      
      // 3. Combiner les données
      return combineGameData(gameData, userGameData);
    },
    enabled: !!gameId && !!user,
    ...collectionQueryOptions,
  });
}

