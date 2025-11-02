import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Essayer d'abord avec les cookies
    const cookieStore = await cookies();
    let supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    let { data: { user }, error: authError } = await supabase.auth.getUser();

    // Si l'authentification par cookie échoue, essayer avec le token dans les headers
    if (authError || !user) {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      if (token) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseWithToken = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          }
        );
        
        const result = await supabaseWithToken.auth.getUser();
        user = result.data.user;
        authError = result.error;
        
        // Utiliser ce client pour les requêtes suivantes
        if (user) {
          supabase = supabaseWithToken as any;
        }
      }
    }

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Non authentifié', details: authError?.message },
        { status: 401 }
      );
    }

    // Récupérer les notifications non validées avec les informations du jeu
    const { data: notifications, error: fetchError } = await supabase
      .from('wishlist_notifications')
      .select(`
        id,
        user_game_id,
        created_at,
        user_games!inner(
          game_id,
          games:game_id(
            id,
            title,
            cover_url
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('is_validated', false)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching notifications:', fetchError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des notifications' },
        { status: 500 }
      );
    }

    // Formater les notifications
    const formattedNotifications = (notifications || []).map((notif: any) => ({
      id: notif.id,
      user_game_id: notif.user_game_id,
      created_at: notif.created_at,
      game: (notif.user_games as any)?.games || null,
    }));

    return NextResponse.json({
      notifications: formattedNotifications,
      count: formattedNotifications.length,
    });
  } catch (error: any) {
    console.error('Error in GET /api/wishlist/notifications:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

