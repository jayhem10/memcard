import { withApi, ApiError } from '@/lib/api-wrapper';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/notifications/[id]/read
 * Marquer une notification comme lue
 */
export const PATCH = withApi(async (
  request: NextRequest,
  { params, user }: { params: { id: string }; user: any }
) => {
  if (!user) {
    throw new ApiError('Non authentifié', 401);
  }

  const notificationId = params.id;

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

  // Marquer comme lue
  // Utiliser directement le booléen is_read
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .update({ 
      is_read: true,
      read_at: new Date().toISOString() // Garder pour historique
    })
    .eq('id', notificationId)
    .eq('user_id', user.id)
    .eq('is_read', false) // ⬅️ Filtrer avec le booléen
    .select()
    .single();

  if (error) {
    console.error('[API Read] Error marking notification as read:', error);
    throw new ApiError('Erreur lors du marquage de la notification', 500);
  }

  if (!data) {
    throw new ApiError('Notification non trouvée ou déjà lue', 404);
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

