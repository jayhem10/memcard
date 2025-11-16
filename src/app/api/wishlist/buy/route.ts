import { withApi, ApiError } from '@/lib/api-wrapper';
import { validateBody } from '@/lib/validation';
import { createAuthenticatedSupabaseClient, getAuthenticatedUser } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/wishlist/buy
 * Met à jour le statut "buy" d'un jeu dans la wishlist
 * Les notifications sont créées/supprimées automatiquement via triggers SQL
 */
export const POST = withApi(async (request, { user, supabase }) => {
  const body = await request.json();

  // Si un token est fourni (accès public), utiliser la fonction SQL SECURITY DEFINER
  if (body.token) {
    const publicSupabase = await createAuthenticatedSupabaseClient();
    if (!publicSupabase) {
      throw new ApiError('Erreur lors de la connexion à la base de données', 500);
    }

    const { data, error } = await publicSupabase.rpc('update_wishlist_buy_status', {
      p_token: body.token,
      p_user_game_id: body.userGameId,
      p_buy: body.buy,
    });

    if (error) {
      console.error('Error calling update_wishlist_buy_status:', error);
      const errorMessage = error.message || 'Erreur lors de la mise à jour';
      const statusCode = errorMessage.includes('non trouvé') || errorMessage.includes('invalide') ? 404 : 500;
      throw new ApiError(errorMessage, statusCode);
    }

    return { success: true };
  }

  // Route authentifiée - validation des champs requis
  validateBody<{ userGameId: string; buy: boolean }>(body, ['userGameId', 'buy']);

  // Si supabase est null (requireAuth: false), obtenir l'authentification manuellement
  let authenticatedSupabase = supabase;
  let authenticatedUser = user;
  
  if (!authenticatedSupabase || !authenticatedUser) {
    const authResult = await getAuthenticatedUser(request);
    authenticatedSupabase = authResult.supabase;
    authenticatedUser = authResult.user;
    
    if (!authenticatedSupabase || !authenticatedUser) {
      throw new ApiError('Non authentifié', 401);
    }
  }

  const { userGameId, buy } = body;

  // Vérifier que le user_game appartient bien à l'utilisateur
  const { data: userGame, error: fetchError } = await authenticatedSupabase
    .from('user_games')
    .select('id, user_id, status')
    .eq('id', userGameId)
    .single();

  if (fetchError || !userGame) {
    console.error('Error fetching user_game:', fetchError);
    throw new ApiError('Jeu non trouvé', 404);
  }

  if (userGame.user_id !== authenticatedUser.id) {
    throw new ApiError('Non autorisé', 403);
  }

  // Vérifier que le statut est bien wishlist
  if (userGame.status !== 'WISHLIST' && userGame.status !== 'wishlist') {
    throw new ApiError('Ce jeu n\'est pas dans la wishlist', 400);
  }

  // Mettre à jour le statut buy
  // Les notifications seront créées/supprimées automatiquement via les triggers SQL
  const { error: updateError } = await authenticatedSupabase
    .from('user_games')
    .update({ 
      buy: buy,
      updated_at: new Date().toISOString()
    })
    .eq('id', userGameId);

  if (updateError) {
    console.error('[Wishlist Buy] Error updating buy status:', updateError);
    throw new ApiError('Erreur lors de la mise à jour', 500);
  }

  return { success: true };
}, { requireAuth: false }); // Permet l'accès public avec token
