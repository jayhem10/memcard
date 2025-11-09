import { withApi, ApiError } from '@/lib/api-wrapper';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// Marquer une notification d'achievement comme vue
export const PUT = withApi(async (request: NextRequest, { supabase, user, params }) => {
  if (!user || !supabase) {
    throw new ApiError('Non authentifié', 401);
  }

  const notificationId = params?.id as string;
  if (!notificationId) {
    throw new ApiError('ID de notification manquant', 400);
  }

  const { error } = await supabase
    .from('achievement_notifications')
    .update({
      is_viewed: true,
      viewed_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Erreur lors de la mise à jour de la notification:', error);
    throw new ApiError('Erreur lors de la mise à jour de la notification', 500);
  }

  return { success: true };
});

// Supprimer une notification d'achievement
export const DELETE = withApi(async (request: NextRequest, { supabase, user, params }) => {
  if (!user || !supabase) {
    throw new ApiError('Non authentifié', 401);
  }

  const notificationId = params?.id as string;
  if (!notificationId) {
    throw new ApiError('ID de notification manquant', 400);
  }

  const { error } = await supabase
    .from('achievement_notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    throw new ApiError('Erreur lors de la suppression de la notification', 500);
  }

  return { success: true };
});

