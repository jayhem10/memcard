import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
// Note: Le fallback avec supabaseAdmin est temporaire et devrait être retiré
// une fois la migration appliquée et la fonction RPC testée
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
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

    // Vérifier d'abord que le token existe et obtenir le user_id
    const { data: share, error: shareError } = await supabase
      .from('wishlist_shares')
      .select('user_id')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (shareError || !share) {
      console.error('Share error:', shareError);
      return NextResponse.json(
        { error: 'Token invalide ou expiré' },
        { status: 404 }
      );
    }

    // Récupérer les informations du propriétaire (utiliser admin client pour accès public)
    let ownerInfo = null;
    try {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('username, full_name')
        .eq('id', share.user_id)
        .maybeSingle();

      if (!profileError && profile) {
        ownerInfo = {
          username: profile.username || null,
          full_name: profile.full_name || null,
        };
      }
    } catch (profileErr) {
      console.warn('Could not fetch owner profile:', profileErr);
      // On continue même si on ne peut pas récupérer le profil
    }

    // Essayer d'abord avec la fonction RPC
    let gamesData: any[] | null = null;
    let gamesError: any = null;

    try {
      console.log('Calling get_wishlist_by_token with token:', token);
      const rpcResult = await supabase.rpc(
        'get_wishlist_by_token',
        { p_token: token }
      );
      gamesData = rpcResult.data;
      gamesError = rpcResult.error;
      console.log('RPC response - data:', gamesData, 'error:', gamesError);
    } catch (rpcErr: any) {
      console.error('RPC call failed:', rpcErr);
      gamesError = rpcErr;
    }

    // Si la fonction RPC échoue ou n'existe pas, utiliser une requête directe
    // ATTENTION: Ce fallback utilise le client admin et devrait être retiré une fois
    // la migration SQL appliquée et la fonction get_wishlist_by_token validée.
    // La fonction RPC est SECURITY DEFINER et est la méthode recommandée.
    if (gamesError) {
      console.log('RPC failed, falling back to direct query');
      console.error('RPC error details:', JSON.stringify(gamesError, null, 2));
      console.warn('Using admin client as fallback - this should be temporary');
      
      // Fallback temporaire: utiliser le client admin pour contourner RLS
      // TODO: Retirer ce fallback une fois la migration appliquée
      const { data: directGames, error: directError } = await supabaseAdmin
        .from('user_games')
        .select(`
          id,
          buy,
          games:game_id(
            id,
            title,
            cover_url,
            console_id,
            consoles:console_id(name)
          )
        `)
        .eq('user_id', share.user_id)
        .or('status.eq.WISHLIST,status.eq.wishlist');

      if (directError) {
        console.error('Direct query also failed:', directError);
        return NextResponse.json(
          { 
            error: 'Erreur lors de la récupération de la wishlist', 
            details: directError.message || gamesError.message 
          },
          { status: 500 }
        );
      }

      // Formater les données de la requête directe
      const formattedGames = (directGames || [])
        .map((item: any) => ({
          id: item.id,
          buy: item.buy || false,
          games: {
            id: item.games?.id,
            title: item.games?.title,
            cover_url: item.games?.cover_url,
            console_id: item.games?.console_id,
            consoles: item.games?.consoles ? { name: item.games.consoles.name } : null,
          },
        }))
        // Trier par ordre alphabétique (titre du jeu)
        .sort((a: any, b: any) => {
          const titleA = a.games?.title || '';
          const titleB = b.games?.title || '';
          return titleA.localeCompare(titleB, 'fr', { sensitivity: 'base' });
        });

      return NextResponse.json({
        games: formattedGames,
        owner: ownerInfo,
      });
    }

    // Formater les données de la fonction RPC et trier par ordre alphabétique
    const formattedGames = (gamesData || [])
      .map((game: any) => ({
        id: game.id,
        buy: game.buy,
        games: {
          id: game.game_id,
          title: game.game_title,
          cover_url: game.game_cover_url,
          console_id: game.game_console_id,
          consoles: game.console_name ? { name: game.console_name } : null,
        },
      }))
      // Trier par ordre alphabétique (titre du jeu) - sécurité supplémentaire
      .sort((a: any, b: any) => {
        const titleA = a.games?.title || '';
        const titleB = b.games?.title || '';
        return titleA.localeCompare(titleB, 'fr', { sensitivity: 'base' });
      });

    return NextResponse.json({
      games: formattedGames,
      owner: ownerInfo,
    });
  } catch (error: any) {
    console.error('Error in GET /api/wishlist/[token]:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

