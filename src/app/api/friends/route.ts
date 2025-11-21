import { withApi, ApiError } from '@/lib/api-wrapper';
import { NextRequest } from 'next/server';

export const revalidate = 60; // Cache de 60 secondes côté serveur

export const GET = withApi(async (request: NextRequest, { user, supabase }) => {
  if (!user || !supabase) {
    throw new ApiError('Non authentifié', 401);
  }

  // Utiliser la fonction RPC sécurisée qui respecte les RLS
  const { data: friends, error } = await supabase
    .rpc('get_user_friends', { p_user_id: user.id });

  if (error) {
    console.error('Erreur lors de la récupération des amis:', error);
    throw new ApiError('Erreur lors de la récupération des amis', 500);
  }

  return { friends: friends || [] };
});
