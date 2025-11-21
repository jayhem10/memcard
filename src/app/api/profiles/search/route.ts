import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Forcer le mode dynamique et désactiver tous les caches
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    // Pour la recherche de profils publics, on n'a pas besoin d'authentification
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    // Construire la requête - filtrer les profils qui existent encore
    let query = supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, is_public, created_at')
      .eq('is_public', true)
      .not('username', 'is', null); // S'assurer que le profil a un username (pas supprimé)

    // Si un username est fourni, filtrer par recherche partielle (insensible à la casse)
    if (username && username.trim().length > 0) {
      query = query.ilike('username', `%${username.trim()}%`);
    }

    // Trier et limiter
    const { data: profiles, error } = await query
      .order('username', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Erreur lors de la recherche de profils:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la recherche', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      profiles: profiles || [],
      timestamp: Date.now() // Pour vérifier la fraîcheur des données
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0, private',
        'Pragma': 'no-cache',
        'Expires': '0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    });
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

