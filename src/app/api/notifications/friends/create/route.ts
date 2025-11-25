import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiError } from '@/lib/api-wrapper';
import { createClient } from '@supabase/supabase-js';

export const POST = withApi(async (request: NextRequest) => {
  const { friendId, addedById } = await request.json();

  if (!friendId || !addedById) {
    throw new ApiError('friendId et addedById sont requis', 400);
  }

  // Créer un client admin pour les opérations système
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

  // Créer la notification pour l'utilisateur ajouté
  const { error: notificationError } = await supabaseAdmin
    .from('notifications')
    .insert({
      user_id: friendId, // L'utilisateur qui reçoit la notification
      type: 'friend',
      friend_id: addedById, // L'utilisateur qui a ajouté
    });

  if (notificationError) {
    console.error('Erreur lors de la création de la notification ami:', notificationError);
    throw new ApiError('Erreur lors de la création de la notification', 500);
  }

  return NextResponse.json({ success: true });
});
