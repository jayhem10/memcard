import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/react-query-config';

export interface Friend {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  friend_code: string;
  created_at: string;
}

export interface FriendshipStatus {
  isFriend: boolean;
  friendshipId: string | null;
}

// Hook pour récupérer la liste des amis
export function useFriends() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<Friend[], Error>({
    queryKey: queryKeys.friends(user?.id),
    queryFn: async () => {
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      const response = await fetch('/api/friends');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors du chargement des amis');
      }

      const data = await response.json();
      return data.friends || [];
    },
    enabled: !!user && !authLoading,
    staleTime: 1000 * 30, // 30 secondes - données fraîches mais pas trop agressif
  });

  // Mutation pour ajouter un ami par code
  const addFriendMutation = useMutation({
    mutationFn: async (friendCode: string) => {
      const response = await fetch('/api/friends/add-by-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friendCode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de l\'ajout de l\'ami');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalider le cache pour forcer un refetch immédiat
      queryClient.invalidateQueries({ queryKey: queryKeys.friends(user?.id) });
    },
  });

  // Mutation pour supprimer un ami avec optimistic update
  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const response = await fetch('/api/friends/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friendId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la suppression de l\'ami');
      }

      return response.json();
    },
    onMutate: async (friendId: string) => {
      // Annuler les refetch en cours
      await queryClient.cancelQueries({ queryKey: queryKeys.friends(user?.id) });

      // Sauvegarder l'état précédent
      const previousFriends = queryClient.getQueryData<Friend[]>(queryKeys.friends(user?.id));

      // Mettre à jour optimistiquement
      queryClient.setQueryData<Friend[]>(
        queryKeys.friends(user?.id),
        (old) => old?.filter((friend) => friend.id !== friendId) || []
      );

      return { previousFriends };
    },
    onError: (err, friendId, context) => {
      // Restaurer l'état précédent en cas d'erreur
      if (context?.previousFriends) {
        queryClient.setQueryData(queryKeys.friends(user?.id), context.previousFriends);
      }
    },
    onSettled: () => {
      // Toujours refetch après succès ou erreur
      queryClient.invalidateQueries({ queryKey: queryKeys.friends(user?.id) });
    },
  });

  return {
    friends: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    addFriend: addFriendMutation.mutate,
    addFriendAsync: addFriendMutation.mutateAsync,
    removeFriend: removeFriendMutation.mutate,
    removeFriendAsync: removeFriendMutation.mutateAsync,
    isAddingFriend: addFriendMutation.isPending,
    isRemovingFriend: removeFriendMutation.isPending,
  };
}

// Hook pour vérifier le statut d'amitié avec un utilisateur spécifique
export function useFriendshipStatus(targetUserId: string) {
  const { user } = useAuth();

  const query = useQuery<FriendshipStatus, Error>({
    queryKey: ['friendship-status', user?.id, targetUserId],
    queryFn: async () => {
      if (!user || !targetUserId) {
        return { isFriend: false, friendshipId: null };
      }

      const { data: isFriend } = await supabase
        .rpc('are_users_friends', {
          p_user_id: user.id,
          p_friend_id: targetUserId
        });

      return {
        isFriend: !!isFriend,
        friendshipId: null, // On n'a pas besoin de l'ID pour cette implémentation simplifiée
      };
    },
    enabled: !!user && !!targetUserId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    ...query,
    isFriend: query.data?.isFriend || false,
  };
}

// Hook pour récupérer le profil et le code ami de l'utilisateur connecté
export function useMyProfile() {
  const { user, isLoading: authLoading } = useAuth();

  const query = useQuery<{
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    friend_code: string;
  }, Error>({
    queryKey: ['my-profile', user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, friend_code')
        .eq('id', user.id)
        .single();

      if (error) {
        throw new Error('Erreur lors du chargement du profil');
      }

      return data;
    },
    enabled: !!user && !authLoading,
    staleTime: 1000 * 60 * 30, // 30 minutes (rarement modifié)
  });

  return query;
}
