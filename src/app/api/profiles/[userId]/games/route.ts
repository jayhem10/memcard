import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> | { userId: string } }
) {
  try {
    
    // Résoudre params si c'est une Promise (Next.js 15+)
    const resolvedParams = context.params instanceof Promise 
      ? await context.params 
      : context.params;
    
    const userId = resolvedParams.userId;

    // Récupérer les paramètres de requête pour pagination et filtrage
    const url = new URL(request.url);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const limit = parseInt(url.searchParams.get('limit') || '30');
    const consoleId = url.searchParams.get('console_id');
    const genreId = url.searchParams.get('genre_id');
    const searchTerm = url.searchParams.get('search');
    const statusFilter = url.searchParams.get('status') || 'all';

    // Récupérer l'utilisateur connecté et son client Supabase authentifié
    const { user: currentUser, supabase: supabaseAuth, error: authError } = await getAuthenticatedUser(request);
    const currentUserId = currentUser?.id || null;
    

    // Utiliser le client authentifié pour bénéficier des RLS policies
    // Si pas d'utilisateur connecté, utiliser le client anon
    const supabaseClient = supabaseAuth || createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

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

    // Vérifier que le profil existe avec le client authentifié
    // Les RLS policies permettent de voir les profils publics et ceux des amis
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, username, is_public')
      .eq('id', userId)
      .single();


    if (profileError || !profile) {
      // Si le profil n'est pas trouvé, c'est soit qu'il n'existe pas, soit que l'utilisateur n'a pas accès
      return NextResponse.json(
        { error: profileError?.code === 'PGRST116' ? 'Ce profil est privé' : 'Profil non trouvé' },
        { status: profileError?.code === 'PGRST116' ? 403 : 404 }
      );
    }


    // SÉCURITÉ : Si on arrive ici, c'est que les RLS policies ont autorisé l'accès
    // Les RLS vérifient automatiquement :
    // 1. Le profil est public OU
    // 2. C'est le profil de l'utilisateur connecté OU
    // 3. Les utilisateurs sont amis
    // Pas besoin de vérification supplémentaire !

    // Double vérification : s'assurer que l'ID du profil correspond bien à l'ID demandé
    if (profile.id !== userId) {
      console.error('Incohérence détectée : profile.id !== userId');
      return NextResponse.json(
        { error: 'Erreur de validation' },
        { status: 400 }
      );
    }
    
    const userGamesResult = await supabaseClient.rpc('get_user_games_filtered_paginated', {
      p_user_id: userId,
      p_console_id: consoleId && consoleId !== 'all' ? consoleId : null,
      p_genre_id: genreId && genreId !== 'all' ? genreId : null,
      p_search_term: searchTerm?.trim() || null,
      p_status_filter: statusFilter || 'all',
      p_tab: 'collection',
      p_sort_order: 'date_desc',
      p_offset: offset,
      p_limit: limit
    });

    if (userGamesResult.error) {
      console.error('❌ RPC error:', userGamesResult.error);
      
      // Si c'est une erreur d'accès, retourner 403
      if (userGamesResult.error.message?.includes('Accès refusé')) {
        return NextResponse.json(
          { error: 'Ce profil est privé' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: 'Service de filtrage non disponible', details: userGamesResult.error.message },
        { status: 503 }
      );
    }


    // La RPC retourne déjà les données complètes des jeux
    const games = userGamesResult.data || [];

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
  } catch (error: any) {
    console.error('❌ Erreur inattendue dans /api/profiles/[userId]/games:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  }
}

