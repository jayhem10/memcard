import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { SimilarGame } from '@/types/games';
import { useAuth } from '@/context/auth-context';

export function useSimilarGames(gameId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery<SimilarGame[], Error>({
    queryKey: ['similarGames', gameId, user?.id],
    queryFn: async () => {
      if (!gameId || !user) return [];

      // Récupérer les informations du jeu actuel avec ses genres
      const { data: currentGame, error: gameError } = await supabase
        .from('games')
        .select(`
          id,
          console_id,
          developer,
          publisher,
          game_genres(genre_id, genres(id, name))
        `)
        .eq('id', gameId)
        .single<{ id: string; console_id: string; developer: string; publisher: string; game_genres: Array<{ genre_id: string; genres: { id: string; name: string } }> }>();

      if (gameError || !currentGame) {
        console.error('Error fetching current game:', gameError);
        return [];
      }

      // Récupérer les IDs des jeux déjà dans la collection de l'utilisateur
      const { data: userGames, error: userGamesError } = await supabase
        .from('user_games')
        .select('game_id')
        .eq('user_id', user.id);

      if (userGamesError) {
        console.error('Error fetching user games:', userGamesError);
      }

      const userGameIds = (userGames || []).map((ug: any) => ug.game_id);
      
      // Récupérer les genres du jeu actuel
      const gameGenres = Array.isArray(currentGame.game_genres) ? currentGame.game_genres : [];
      const genreIds = gameGenres.map((g: any) => g.genre_id) || [];
      
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
          .select(`
            id,
            title,
            cover_url,
            igdb_id,
            console:console_id(id, name)
          `)
          .in('id', userGameIds)
          .or(conditions.join(','))
          .neq('id', gameId)
          .limit(6);

        if (error) {
          console.error('Error fetching similar games:', error);
          return [];
        }

        return (data || []).map((game: any) => ({
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
            console:console_id(id, name)
          )
        `)
        .in('genre_id', genreIds)
        .in('game_id', userGameIds)
        .neq('game_id', gameId);

      const { data: gamesWithGenres, error: genreError } = await genreQuery;

      if (genreError) {
        console.error('Error fetching games by genres:', genreError);
        return [];
      }

      // Compter les genres en commun et trier
      const gameCounts = new Map<string, { game: any; count: number }>();
      
      (gamesWithGenres || []).forEach((item: any) => {
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
        .map(item => item.game as SimilarGame);
    },
    enabled: !!gameId && !!user,
  });
}

