import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId est requis' },
        { status: 400 }
      );
    }

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

    // Appeler la fonction SQL pour valider la notification
    const { data, error } = await supabase.rpc('validate_wishlist_notification', {
      p_notification_id: notificationId,
    });

    if (error) {
      console.error('Error validating notification:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la validation de la notification' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Notification non trouvée ou déjà validée' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in POST /api/wishlist/notifications/validate:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

