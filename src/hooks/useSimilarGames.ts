import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { SimilarGame } from '@/types/games';
import { useAuth } from '@/context/auth-context';
import { GAME_BASIC_WITH_GENRES_SELECT, SIMILAR_GAME_SELECT, CONSOLE_SELECT } from '@/lib/supabase-queries';
import { handleErrorSilently } from '@/lib/error-handler';

export function useSimilarGames(gameId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery<SimilarGame[], Error>({
    queryKey: ['similarGames', gameId, user?.id],
    queryFn: async () => {
      if (!gameId || !user) return [];

      // Récupérer les informations du jeu actuel avec ses genres
      const { data: currentGame, error: gameError } = await supabase
        .from('games')
        .select(GAME_BASIC_WITH_GENRES_SELECT)
        .eq('id', gameId)
        .single<{ id: string; console_id: string; developer: string; publisher: string; game_genres: Array<{ genre_id: string; genres: { id: string; name: string } }> }>();

      if (gameError || !currentGame) {
        handleErrorSilently(gameError, 'useSimilarGames - fetch current game');
        return [];
      }

      // Récupérer les IDs des jeux déjà dans la collection de l'utilisateur
      const { data: userGames, error: userGamesError } = await supabase
        .from('user_games')
        .select('game_id')
        .eq('user_id', user.id);

      if (userGamesError) {
        handleErrorSilently(userGamesError, 'useSimilarGames - fetch user games');
      }

      const userGameIds = (userGames || []).map((ug: { game_id: string }) => ug.game_id);
      
      // Récupérer les genres du jeu actuel
      const gameGenres = Array.isArray(currentGame.game_genres) ? currentGame.game_genres : [];
      const genreIds = gameGenres.map((g: { genre_id: string }) => g.genre_id) || [];
      
      if (genreIds.length === 0) {
        // Si pas de genres, chercher par console, développeur ou éditeur
        if (userGameIds.length === 0) return [];

        const conditions: string[] = [];
        if (currentGame.console_id) {
          conditions.push(`console_id.eq.${currentGame.console_id}`);
        }
        if (currentGame.developer) {
          conditions.push(`developer.eq.${currentGame.developer}`);
        }
        if (currentGame.publisher) {
          conditions.push(`publisher.eq.${currentGame.publisher}`);
        }

        if (conditions.length === 0) return [];

        // Récupérer les jeux similaires uniquement parmi ceux de la bibliothèque
        const { data, error } = await supabase
          .from('games')
          .select(SIMILAR_GAME_SELECT)
          .in('id', userGameIds)
          .or(conditions.join(','))
          .neq('id', gameId)
          .limit(6);

        if (error) {
          handleErrorSilently(error, 'useSimilarGames - fetch similar games');
          return [];
        }

        return (data || []).map((game) => ({
          id: game.id,
          title: game.title,
          cover_url: game.cover_url,
          igdb_id: game.igdb_id || null,
          console: game.console || null
        })) as SimilarGame[];
      }

      // Si l'utilisateur n'a pas de jeux dans sa bibliothèque, retourner vide
      if (userGameIds.length === 0) return [];

      // Chercher des jeux avec les mêmes genres uniquement parmi ceux de la bibliothèque
      let genreQuery = supabase
        .from('game_genres')
        .select(`
          game_id,
          games!inner(
            id,
            title,
            cover_url,
            igdb_id,
            console_id,
            ${CONSOLE_SELECT}
          )
        `)
        .in('genre_id', genreIds)
        .in('game_id', userGameIds)
        .neq('game_id', gameId);

      const { data: gamesWithGenres, error: genreError } = await genreQuery;

      if (genreError) {
        handleErrorSilently(genreError, 'useSimilarGames - fetch games by genres');
        return [];
      }

      // Compter les genres en commun et trier
      const gameCounts = new Map<string, { game: SimilarGame; count: number }>();
      
      (gamesWithGenres || []).forEach((item: { game_id: string; games: SimilarGame }) => {
        const similarGameId = item.games?.id;
        const similarGame = item.games;
        
        if (!similarGameId) {
          return;
        }
        
        // Filtrer par même plateforme si le jeu actuel en a une
        if (currentGame.console_id && similarGame.console_id !== currentGame.console_id) {
          return;
        }
        
        const current = gameCounts.get(similarGameId) || { game: similarGame, count: 0 };
        current.count += 1;
        gameCounts.set(similarGameId, current);
      });

      // Trier par nombre de genres en commun et prendre les 6 premiers
      return Array.from(gameCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
        .map(item => item.game);
    },
    enabled: !!gameId && !!user,
  });
}

