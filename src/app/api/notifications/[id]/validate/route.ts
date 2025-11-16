import { withApi, ApiError } from '@/lib/api-wrapper';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/notifications/[id]/validate
 * Valider une notification wishlist : passer le jeu de WISHLIST à NOT_STARTED (collection)
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

  // Récupérer la notification et vérifier qu'elle appartient à l'utilisateur
  const { data: notification, error: notifError } = await supabaseAdmin
    .from('notifications')
    .select('id, user_id, type, user_game_id, is_dismissed, dismissed_at')
    .eq('id', notificationId)
    .eq('user_id', user.id)
    .single();

  if (notifError || !notification) {
    throw new ApiError('Notification non trouvée', 404);
  }

  if (notification.type !== 'wishlist') {
    throw new ApiError('Cette notification n\'est pas une notification wishlist', 400);
  }

  // Vérifier si déjà dismissed (utiliser is_dismissed OU dismissed_at pour compatibilité)
  if (notification.is_dismissed === true || notification.dismissed_at) {
    throw new ApiError('Cette notification a déjà été traitée', 400);
  }

  const userGameId = notification.user_game_id;
  
  if (!userGameId) {
    throw new ApiError('Jeu associé non trouvé', 404);
  }

  // Récupérer le user_game associé
  const { data: userGame, error: gameError } = await supabaseAdmin
    .from('user_games')
    .select('id, user_id, status, buy')
    .eq('id', userGameId)
    .single();

  if (gameError || !userGame) {
    throw new ApiError('Jeu non trouvé', 404);
  }

  if (userGame.user_id !== user.id) {
    throw new ApiError('Non autorisé', 403);
  }

  if (userGame.status !== 'WISHLIST' && userGame.status !== 'wishlist') {
    throw new ApiError('Ce jeu n\'est pas dans la wishlist', 400);
  }

  // Passer le jeu en collection (NOT_STARTED) et mettre buy à false
  const { error: updateError } = await supabaseAdmin
    .from('user_games')
    .update({
      status: 'NOT_STARTED',
      buy: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', userGame.id);

  if (updateError) {
    console.error('[API Validate] Error updating user_game:', updateError);
    throw new ApiError('Erreur lors de la mise à jour du jeu', 500);
  }

  // Dismiss la notification (le trigger SQL devrait déjà l'avoir fait, mais on le fait quand même pour être sûr)
  // ⚠️ ATTENTION: Le trigger auto_dismiss_wishlist_notification va automatiquement dismiss la notification
  // quand buy passe à false, mais on le fait manuellement aussi pour garantir la cohérence
  const { error: dismissError } = await supabaseAdmin
    .from('notifications')
    .update({ 
      is_dismissed: true,
      dismissed_at: new Date().toISOString() 
    })
    .eq('id', notificationId)
    .eq('is_dismissed', false); // Ne mettre à jour que si pas déjà dismissed

  if (dismissError) {
    console.error('[API Validate] Error dismissing notification:', dismissError);
    // Ne pas échouer si la notification n'a pas pu être dismissed (peut-être déjà dismissed par le trigger)
  }

  return NextResponse.json(
    { success: true, message: 'Jeu ajouté à votre collection' },
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
});

