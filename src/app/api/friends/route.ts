import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase-server';

// Désactiver complètement le cache pour les amis
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    // Authentification
    const { user, supabase, error: authError } = await getAuthenticatedUser(request);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié', details: authError?.message },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      );
    }

    // Récupérer les relations d'amitié
    const { data: friendships, error: friendshipsError } = await supabase
      .from('user_friends')
      .select('user_id, friend_id')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (friendshipsError) {
      console.error('Erreur lors de la récupération des relations:', friendshipsError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des amis', details: friendshipsError.message },
        { status: 500 }
      );
    }

    if (!friendships || friendships.length === 0) {
      return NextResponse.json({ friends: [] });
    }

    // Extraire les IDs des amis
    const friendIds = friendships.map((f: { user_id: string; friend_id: string }) => 
      f.user_id === user.id ? f.friend_id : f.user_id
    );

    // Récupérer les profils des amis (filtrer les profils supprimés)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, friend_code, created_at')
      .in('id', friendIds)
      .not('username', 'is', null)
      .neq('username', '')
      .order('username', { ascending: true });

    if (profilesError) {
      console.error('Erreur lors de la récupération des profils:', profilesError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des profils', details: profilesError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { friends: profiles || [] },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    );
  } catch (error: any) {
    console.error('Erreur inattendue dans /api/friends:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  }
}
