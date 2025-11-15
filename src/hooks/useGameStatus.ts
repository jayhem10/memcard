import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { CollectionGame } from './useUserGames';
import { transformUserGameItem, sortGamesByTitle } from '@/lib/game-utils';
import { USER_GAME_WITH_RELATIONS_SELECT } from '@/lib/supabase-queries';

export type GameStatus = 'not_in_collection' | 'in_wishlist' | 'in_collection';

/**
 * Hook pour vérifier le statut d'un jeu dans la collection/wishlist de l'utilisateur
 * Utilise le cache React Query si disponible, sinon fait une requête optimisée
 */
export function useGameStatus(game: CollectionGame | null, enabled: boolean = true) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [gameStatus, setGameStatus] = useState<GameStatus>('not_in_collection');
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!enabled || !game || !user) {
      setIsChecking(false);
      setGameStatus('not_in_collection');
      return;
    }

    setIsChecking(true);
    setGameStatus('not_in_collection');

    const checkGameStatus = async () => {
      try {
        // Essayer d'abord d'utiliser le cache React Query si disponible
        let cachedGames = queryClient.getQueryData<CollectionGame[]>(['userGames', user.id]);
        
        // Si le cache n'existe pas, le précharger pour les prochaines fois
        if (!cachedGames) {
          try {
            // Précharger le cache avec la même logique que useUserGames
            const { data, error } = await supabase
              .from('user_games')
              .select(USER_GAME_WITH_RELATIONS_SELECT)
              .eq('user_id', user.id)
              .order('created_at', { ascending: true });

            if (!error && data) {
              const formattedGames = data
                .map(transformUserGameItem)
                .filter(Boolean) as CollectionGame[];
              
              const sortedGames = sortGamesByTitle(formattedGames);
              
              // Mettre en cache pour les prochaines fois
              queryClient.setQueryData(['userGames', user.id], sortedGames);
              cachedGames = sortedGames;
            }
          } catch (prefetchError) {
            // Continuer avec la méthode de fallback
          }
        }
        
        if (cachedGames && cachedGames.length > 0) {
          // Chercher dans le cache
          const matchingGame = cachedGames.find(
            g => g.igdb_id === game.igdb_id && g.console_id === game.console_id
          );
          
          if (matchingGame) {
            const status = matchingGame.status?.toUpperCase();
            if (status === 'WISHLIST' || status === 'wishlist') {
              setGameStatus('in_wishlist');
            } else {
              setGameStatus('in_collection');
            }
          } else {
            setGameStatus('not_in_collection');
          }
          setIsChecking(false);
          return;
        }

        // Fallback : faire une requête optimisée avec join directement dans Supabase
        const { data: userGamesWithGames, error } = await supabase
          .from('user_games')
          .select(`
            status,
            games:game_id(
              igdb_id,
              console_id
            )
          `)
          .eq('user_id', user.id);

        if (error) throw error;

        if (userGamesWithGames && userGamesWithGames.length > 0) {
          // Trouver le jeu correspondant avec igdb_id et console_id
          type UserGameWithGame = {
            status: string;
            games: {
              igdb_id: number;
              console_id: string;
            } | null;
          };

          const matching = (userGamesWithGames as UserGameWithGame[]).find((ug) => 
            ug.games?.igdb_id === game.igdb_id && ug.games?.console_id === game.console_id
          );

          if (matching) {
            const status = matching.status?.toUpperCase();
            if (status === 'WISHLIST' || status === 'wishlist') {
              setGameStatus('in_wishlist');
            } else {
              setGameStatus('in_collection');
            }
          } else {
            setGameStatus('not_in_collection');
          }
        } else {
          setGameStatus('not_in_collection');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error);
        setGameStatus('not_in_collection');
      } finally {
        setIsChecking(false);
      }
    };

    checkGameStatus();
  }, [enabled, game, user, queryClient]);

  return { gameStatus, isChecking };
}

