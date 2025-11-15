import { withApi, ApiError } from '@/lib/api-wrapper';
import { validateBody } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { fetchEbayPriceSamples, summarizePrices } from '@/lib/ebay';

export const dynamic = 'force-dynamic';

export const POST = withApi(async (request) => {
  const supabase = supabaseAdmin;

  let body;
  try {
    body = await request.json();
  } catch (error) {
    throw new ApiError('Body JSON invalide', 400);
  }
  
  validateBody<{ gameId: string }>(body, ['gameId']);

  const { gameId } = body;

    // Récupérer titre et console pour affiner la recherche
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, title, console:console_id(name, abbreviation)')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
    throw new ApiError('Jeu introuvable', 404);
    }

    // Utiliser l'abbreviation si disponible, sinon le nom complet
    // Gérer le cas où console peut être un tableau ou un objet
    const consoleData = Array.isArray(game?.console) ? game.console[0] : game?.console;
    const platformName = consoleData?.abbreviation || consoleData?.name || undefined;

    // Appel eBay (EUR, PAL, complet/CIB)
    let priceData;
    try {
      priceData = await fetchEbayPriceSamples({
        title: game.title,
        platformName: platformName,
        regionHint: 'PAL',
      });
    } catch (error: any) {
      throw new ApiError(
        `Erreur lors de la récupération des prix eBay: ${error.message || 'Erreur inconnue'}`,
        500
      );
    }

    const summary = summarizePrices(priceData.used, priceData.new);
    if (!summary) {
      // Aucun échantillon pertinent; on n'écrase pas les valeurs existantes
      return {
        message: 'Aucun résultat eBay pertinent (EUR/PAL/complet).',
        updated: false,
      };
    }

    const now = new Date().toISOString();

    // D'abord tenter une mise à jour; si aucune ligne affectée, insérer
    const { error: updateError, data: updateData } = await supabase
      .from('game_prices')
      .update({
        min_price: summary.min_price,
        max_price: summary.max_price,
        average_price: summary.average_price,
        new_price: summary.new_price || 0,
        currency: summary.currency,
        last_updated: now,
      })
      .eq('game_id', gameId)
      .select();

    if (updateError) {
      throw new ApiError(updateError.message, 500);
    }

    if (!updateData || updateData.length === 0) {
      const { error: insertError } = await supabase
        .from('game_prices')
        .insert({
          game_id: gameId,
          min_price: summary.min_price,
          max_price: summary.max_price,
          average_price: summary.average_price,
          new_price: summary.new_price || 0,
          currency: summary.currency,
          last_updated: now,
        });
      if (insertError) {
        throw new ApiError(insertError.message, 500);
      }
    }

    return {
      updated: true,
      game_id: gameId,
      ...summary,
      last_updated: now,
    };
});


