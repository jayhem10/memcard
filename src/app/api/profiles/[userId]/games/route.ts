import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Client anon pour vérifier que le profil est public
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Client admin pour contourner RLS après vérification de la visibilité
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
    const userId = params.userId;

    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    // Validation de l'UUID pour éviter les injections
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'ID utilisateur invalide' },
        { status: 400 }
      );
    }

    // Vérifier que le profil est public avec le client anon
    // IMPORTANT : Cette vérification doit TOUJOURS être faite avant d'utiliser le service_role
    const { data: profile, error: profileError } = await supabaseAnon
      .from('profiles')
      .select('id, username, is_public')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profil non trouvé' },
        { status: 404 }
      );
    }

    // SÉCURITÉ : Vérification critique - ne jamais utiliser service_role si le profil n'est pas public
    if (!profile.is_public) {
      return NextResponse.json(
        { error: 'Ce profil est privé' },
        { status: 403 }
      );
    }

    // Double vérification : s'assurer que l'ID du profil correspond bien à l'ID demandé
    if (profile.id !== userId) {
      console.error('Incohérence détectée : profile.id !== userId');
      return NextResponse.json(
        { error: 'Erreur de validation' },
        { status: 400 }
      );
    }

    // Utiliser l'ID du profil vérifié (plus sûr que d'utiliser directement userId)
    const authUserId = profile.id;
    
    // SÉCURITÉ : Utiliser le client admin UNIQUEMENT après avoir vérifié que le profil est public
    // Le service_role key contourne RLS, mais on a déjà validé que seul un profil public peut être lu
    // On utilise l'ID du profil vérifié pour éviter toute manipulation
    const { data: games, error: gamesError } = await supabaseAdmin
      .from('user_games')
      .select(`
        id,
        game_id,
        status,
        rating,
        notes,
        created_at,
        updated_at,
        purchase_date,
        play_time,
        completion_percentage,
        buy_price,
        games:game_id(
          id,
          igdb_id,
          title,
          release_date,
          developer,
          publisher,
          description,
          cover_url,
          console_id,
          consoles:console_id(id, name),
          game_genres(genre_id, genres(id, name))
        )
      `)
      .eq('user_id', authUserId)
      .neq('status', 'WISHLIST')
      .neq('status', 'wishlist')
      .order('created_at', { ascending: true });

    if (gamesError) {
      console.error('Erreur lors de la récupération des jeux:', gamesError);
      console.error('Code d\'erreur:', gamesError.code);
      console.error('Message:', gamesError.message);
      console.error('Détails:', gamesError.details);
      console.error('Hint:', gamesError.hint);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des jeux', details: gamesError.message },
        { status: 500 }
      );
    }

    // Headers pour désactiver le cache HTTP et permettre les mises à jour en temps réel
    const response = NextResponse.json({ 
      games: games || [],
      profile: {
        id: profile.id,
        username: profile.username
      }
    });
    
    // Désactiver le cache HTTP pour permettre les mises à jour immédiates via Realtime
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

