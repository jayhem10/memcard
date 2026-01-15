import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface UpdateGameData {
  notes: string;
  rating: number;
  status: string;
  play_time: number;
  completion_percentage: number;
  condition: string | null;
  review: string | null;
  edition: string | null;
  edition_other: string | null;
}

export function useGameMutations(gameId: string | undefined, userId: string | undefined) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateGameData) => {
      if (!userId || !gameId) {
        throw new Error('Utilisateur non authentifié ou ID de jeu manquant');
      }
      
      // Vérifier si l'utilisateur a déjà ce jeu dans sa collection
      const { data: existingUserGame, error: findError } = await supabase
        .from('user_games')
        .select('id')
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .maybeSingle();
      
      if (findError) throw findError;
      
      // Préparer les données à mettre à jour
      const updateData: {
        notes: string | null;
        rating: number | null;
        status: string;
        play_time: number | null;
        completion_percentage: number | null;
        condition: string | null;
        review: string | null;
        edition: string | null;
        edition_other: string | null;
      } = {
        notes: data.notes || null,
        rating: data.rating || null,
        status: data.status,
        play_time: data.play_time || null,
        completion_percentage: data.completion_percentage || null,
        condition: null,
        review: null,
        edition: null,
        edition_other: null,
      };
      
      // Si le statut est WISHLIST, réinitialiser condition à NULL
      if (updateData.status === 'WISHLIST' || updateData.status === 'wishlist') {
        updateData.condition = null;
      } else {
        updateData.condition = data.condition || null;
      }
      
      updateData.review = data.review || null;
      
      // Gérer edition et edition_other
      if (data.edition === '' || data.edition === undefined || data.edition === 'standard') {
        updateData.edition = null;
        updateData.edition_other = null;
      } else if (data.edition !== 'autres') {
        updateData.edition = data.edition;
        updateData.edition_other = null;
      } else {
        updateData.edition = data.edition;
        updateData.edition_other = data.edition_other || null;
      }
      
      let result;
      if (existingUserGame) {
        result = await (supabase
          .from('user_games') as any)
          .update(updateData)
          .eq('id', existingUserGame.id)
          .select();
      } else {
        result = await (supabase
          .from('user_games') as any)
          .insert({
            user_id: userId,
            game_id: gameId,
            ...updateData
          })
          .select();
      }
      
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: async () => {
      toast.success('Modifications enregistrées');
      queryClient.invalidateQueries({ queryKey: ['game', gameId, userId] });
      queryClient.invalidateQueries({ queryKey: ['userGames', userId] });

      await queryClient.refetchQueries({ 
        queryKey: ['userGames', userId],
        type: 'all' 
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !gameId) {
        throw new Error('Utilisateur non authentifié ou ID de jeu manquant');
      }
      
      // Récupérer le statut du jeu avant suppression
      const { data: userGame, error: fetchError } = await supabase
        .from('user_games')
        .select('status')
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const gameStatus = userGame?.status?.toUpperCase();
      const isWishlist = gameStatus === 'WISHLIST' || gameStatus === 'wishlist';
      
      const { error } = await supabase
        .from('user_games')
        .delete()
        .eq('user_id', userId)
        .eq('game_id', gameId);

      if (error) throw error;
      
      return { isWishlist };
    },
    onSuccess: async (data) => {
      const { queryKeys } = await import('@/lib/react-query-config');
      queryClient.invalidateQueries({ queryKey: queryKeys.userGames(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.game(gameId || '', userId) });

      await queryClient.refetchQueries({ queryKey: ['userGames', userId] });

      // Invalider le cache des stats
      if (userId) {
        const { useStore } = await import('@/store');
        const statsStore = useStore.getState();
        statsStore.resetStats();
        statsStore.fetchUserStats(userId);
      }
      
      if (data.isWishlist) {
        toast.success('Jeu supprimé de votre liste de souhaits');
        router.push('/collection?tab=wishlist');
      } else {
        toast.success('Jeu supprimé de votre collection');
        router.push('/collection');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la suppression');
    },
  });

  return {
    updateMutation,
    deleteMutation,
  };
}
