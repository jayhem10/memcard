import { withApi, ApiError } from '@/lib/api-wrapper';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/notifications/[id]/dismiss
 * Supprimer (dismiss) une notification
 */
export const PATCH = withApi(async (
  request: NextRequest,
  { params, user }: { params?: { id: string }; user: any }
) => {
  if (!user) {
    throw new ApiError('Non authentifié', 401);
  }

  const notificationId = params?.id;

  if (!notificationId) {
    throw new ApiError('ID de notification manquant', 400);
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  // Récupérer la notification pour vérifier son type
  const { data: notification, error: notifError } = await supabaseAdmin
    .from('notifications')
    .select('id, user_id, type, user_game_id, is_dismissed')
    .eq('id', notificationId)
    .eq('user_id', user.id)
    .single();

  if (notifError || !notification) {
    throw new ApiError('Notification non trouvée', 404);
  }

  if (notification.is_dismissed) {
    throw new ApiError('Notification déjà supprimée', 400);
  }

  // Si c'est une notification wishlist, mettre buy = false pour éviter qu'elle ne revienne
  if (notification.type === 'wishlist' && notification.user_game_id) {
    const { error: updateError } = await supabaseAdmin
      .from('user_games')
      .update({ buy: false })
      .eq('id', notification.user_game_id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[API Dismiss] Error updating user_game buy status:', updateError);
      // On continue quand même pour dismiss la notification
    }
  }

  // Dismiss la notification (le trigger SQL devrait déjà l'avoir fait si buy = false)
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .update({ 
      is_dismissed: true,
      dismissed_at: new Date().toISOString()
    })
    .eq('id', notificationId)
    .eq('is_dismissed', false)
    .select()
    .single();

  if (error) {
    console.error('[API Dismiss] Error dismissing notification:', error);
    throw new ApiError('Erreur lors de la suppression de la notification', 500);
  }

  if (!data) {
    // La notification a peut-être déjà été dismissée par le trigger SQL
    // C'est OK, on retourne success quand même
    return NextResponse.json(
      { success: true },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  }

  return NextResponse.json(
    { success: true, notification: data },
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
});

