import { withApi, ApiError } from '@/lib/api-wrapper';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export const POST = withApi(async (request: NextRequest, { user, supabase }) => {
  if (!user || !supabase) {
    throw new ApiError('Non authentifié', 401);
  }

  const { friendId } = await request.json();

  if (!friendId || typeof friendId !== 'string') {
    throw new ApiError('ID de l\'ami requis', 400);
  }

  // Supprimer l'amitié - Supprimer les relations dans les deux sens possibles
  // (peu importe qui a initié la relation)
  const { error } = await supabase
    .from('user_friends')
    .delete()
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

  if (error) {
    console.error('Erreur lors de la suppression d\'ami:', error);
    throw new ApiError('Erreur lors de la suppression de l\'ami', 500);
  }

  return {
    success: true,
    message: 'Ami supprimé avec succès'
  };
});
