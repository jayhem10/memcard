import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { userGameId, buy, token } = await request.json();

    if (userGameId === undefined || buy === undefined) {
      return NextResponse.json(
        { error: 'userGameId et buy sont requis' },
        { status: 400 }
      );
    }

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

    // Si un token est fourni (accès public), utiliser la fonction SQL SECURITY DEFINER
    if (token) {
      const { data, error } = await supabase.rpc('update_wishlist_buy_status', {
        p_token: token,
        p_user_game_id: userGameId,
        p_buy: buy,
      });

      if (error) {
        console.error('Error calling update_wishlist_buy_status:', error);
        // Extraire le message d'erreur SQL si disponible
        const errorMessage = error.message || 'Erreur lors de la mise à jour';
        const statusCode = errorMessage.includes('non trouvé') || errorMessage.includes('invalide') ? 404 : 500;
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        );
      }

      return NextResponse.json({ success: true });
    }

    // Sinon, vérifier l'authentification et utiliser le client normal
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier que le user_game appartient bien à l'utilisateur
    const { data: userGame, error: fetchError } = await supabase
      .from('user_games')
      .select('id, user_id, status')
      .eq('id', userGameId)
      .single();

    if (fetchError || !userGame) {
      console.error('Error fetching user_game:', fetchError);
      return NextResponse.json(
        { error: 'Jeu non trouvé' },
        { status: 404 }
      );
    }

    if (userGame.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Vérifier que le statut est bien wishlist
    if (userGame.status !== 'WISHLIST' && userGame.status !== 'wishlist') {
      return NextResponse.json(
        { error: 'Ce jeu n\'est pas dans la wishlist' },
        { status: 400 }
      );
    }

    // Mettre à jour le champ buy
    const { error: updateError } = await supabase
      .from('user_games')
      .update({ 
        buy: buy,
        updated_at: new Date().toISOString()
      })
      .eq('id', userGameId);

    if (updateError) {
      console.error('Error updating buy status:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      );
    }

    // Si buy est mis à true, créer une notification
    if (buy === true) {
      const { error: notificationError } = await supabase
        .from('wishlist_notifications')
        .insert({
          user_id: user.id,
          user_game_id: userGameId,
        });

      // On ignore l'erreur si la notification existe déjà (code 23505 = unique violation)
      if (notificationError && notificationError.code !== '23505') {
        console.error('Error creating notification:', notificationError);
      }
    } else {
      // Si buy est mis à false, supprimer les notifications non validées pour ce jeu
      await supabase
        .from('wishlist_notifications')
        .delete()
        .eq('user_game_id', userGameId)
        .eq('is_validated', false);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in POST /api/wishlist/buy:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

