import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { toast } from 'react-hot-toast';
import { CollectionGame } from './useUserGames';
import { sortGamesByTitle } from '@/lib/game-utils';

/**
 * Hook pour ajouter un jeu à la wishlist
 * Gère la création du jeu si nécessaire, l'ajout des genres, et la mise à jour du cache
 */
export function useAddToWishlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  const addToWishlist = async (game: CollectionGame) => {
    if (!game || !user) {
      throw new Error('Jeu ou utilisateur manquant');
    }

    setIsAdding(true);
    try {
      // Vérifier si le jeu existe déjà dans la base de données
      const { data: existingGame, error: findError } = await supabase
        .from('games')
        .select('id')
        .eq('igdb_id', game.igdb_id)
        .eq('console_id', game.console_id)
        .maybeSingle<{ id: string }>();

      if (findError) throw findError;

      let gameId: string;

      if (existingGame) {
        gameId = existingGame.id;
      } else {
        // Créer le jeu s'il n'existe pas
        const { data: newGame, error: createError } = await (supabase
          .from('games') as any)
          .insert({
            igdb_id: game.igdb_id,
            title: game.title,
            release_date: game.release_date,
            developer: game.developer,
            publisher: game.publisher,
            description_en: game.description_en,
            description_fr: game.description_fr,
            cover_url: game.cover_url,
            console_id: game.console_id,
          })
          .select('id')
          .single();

        if (createError) throw createError;
        gameId = newGame.id;

        // Ajouter les genres si disponibles
        if (game.genres && game.genres.length > 0) {
          for (const genre of game.genres) {
            // Vérifier si le genre existe
            const { data: existingGenre } = await supabase
              .from('genres')
              .select('id')
              .eq('name', genre.name)
              .maybeSingle<{ id: string }>();

            let genreId: string;
            if (existingGenre) {
              genreId = existingGenre.id;
            } else {
              const { data: newGenre, error: genreError } = await (supabase
                .from('genres') as any)
                .insert({ name: genre.name })
                .select('id')
                .single();

              if (genreError) throw genreError;
              genreId = (newGenre as { id: string }).id;
            }

            // Créer la relation
            await (supabase
              .from('game_genres') as any)
              .insert({
                game_id: gameId,
                genre_id: genreId,
              });
          }
        }
      }

      // Ajouter à la wishlist
      const { error: insertError } = await (supabase
        .from('user_games') as any)
        .insert({
          user_id: user.id,
          game_id: gameId,
          status: 'WISHLIST',
        });

      if (insertError) {
        // Si le jeu est déjà dans la wishlist, c'est OK
        if (insertError.code !== '23505') {
          throw insertError;
        }
      }

      toast.success('Jeu ajouté à votre liste de souhaits');
      
      // Invalider le cache pour qu'il se mette à jour via Realtime
      queryClient.invalidateQueries({ queryKey: ['userGames', user.id] });
      
      // Mettre à jour le cache localement si il existe pour un feedback immédiat
      const cachedGames = queryClient.getQueryData<CollectionGame[]>(['userGames', user.id]);
      if (cachedGames) {
        // Créer un nouveau jeu pour le cache
        const newGame: CollectionGame = {
          id: gameId,
          igdb_id: game.igdb_id,
          title: game.title,
          release_date: game.release_date,
          developer: game.developer,
          publisher: game.publisher,
          description_en: game.description_en,
          description_fr: game.description_fr,
          cover_url: game.cover_url,
          console_id: game.console_id,
          console_name: game.console_name,
          genres: game.genres,
          status: 'WISHLIST',
        };
        
        // Ajouter le jeu au cache et trier
        const updatedGames = sortGamesByTitle([...cachedGames, newGame]);
        queryClient.setQueryData(['userGames', user.id], updatedGames);
      }

      return { success: true, gameId };
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout à la wishlist:', error);
      toast.error(error.message || 'Erreur lors de l\'ajout à la wishlist');
      throw error;
    } finally {
      setIsAdding(false);
    }
  };

  return { addToWishlist, isAdding };
}

