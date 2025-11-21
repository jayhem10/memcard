import { withApi, ApiError } from '@/lib/api-wrapper';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export const GET = withApi(
  async (request: NextRequest, { user, supabase, params }) => {
    if (!user || !supabase) {
      throw new ApiError('Non authentifié', 401);
    }

    const targetUserId = params?.userId;

    if (!targetUserId) {
      throw new ApiError('ID utilisateur requis', 400);
    }

    // Récupérer le code ami de l'utilisateur cible - RLS permet aux utilisateurs authentifiés de lire tous les profils
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('friend_code')
      .eq('id', targetUserId)
      .single();

    if (error || !profile) {
      throw new ApiError('Profil non trouvé', 404);
    }

    return {
      friendCode: profile.friend_code
    };
  },
  { requireAuth: true }
);
