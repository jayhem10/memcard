import { withApi, ApiError } from '@/lib/api-wrapper';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { fetchEbayPriceSamples, summarizePrices } from '@/lib/ebay';

export const dynamic = 'force-dynamic';

export const POST = withApi(async (request, { user, supabase }) => {
    // Vérifier que l'utilisateur est admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
    throw new ApiError('Accès refusé. Admin uniquement.', 403);
    }

    // Utiliser le client admin pour les opérations suivantes
    const supabaseDb = supabaseAdmin;

    // Récupérer tous les jeux (titre + console) et toutes les lignes de prix
    const [{ data: games, error: gamesError }, { data: prices, error: pricesError }] = await Promise.all([
      supabaseDb
        .from('games')
        .select('id, title, console:console_id(name, abbreviation)'),
      supabaseDb
        .from('game_prices')
        .select('game_id, last_updated')
    ]);

    if (gamesError) throw new ApiError(gamesError.message, 500);
    if (pricesError) throw new ApiError(pricesError.message, 500);

    const priceByGameId = new Map<string, { last_updated: string | null }>();
    for (const p of prices || []) {
      priceByGameId.set(p.game_id, { last_updated: p.last_updated });
    }

    // Créer des lignes vides pour les jeux sans entrée dans game_prices (exigence: créer si absent)
    const missing = (games || []).filter((g: any) => !priceByGameId.has(g.id));
    if (missing.length) {
      const insertRows = missing.map((g: any) => ({
        game_id: g.id,
        min_price: null,
        max_price: null,
        average_price: null,
        new_price: null,
        currency: 'EUR',
        last_updated: null,
      }));
      const { error: insertMissingError } = await supabaseDb
        .from('game_prices')
        .insert(insertRows);
      if (insertMissingError) {
        throw new ApiError(insertMissingError.message, 500);
      }
      // Rafraîchir la map
      for (const g of missing) {
        priceByGameId.set(g.id, { last_updated: null });
      }
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Filtrer: pas de prix OU last_updated < 7 jours
    const targets = (games || []).filter((g: any) => {
      const row = priceByGameId.get(g.id);
      if (!row) return true;
      if (!row.last_updated) return true;
      const lu = new Date(row.last_updated);
      return lu < sevenDaysAgo;
    });

    let updated = 0;
    let skipped = 0;
    const errors: { gameId: string; reason: string }[] = [];

    // Traiter en petits lots pour éviter les limites rate
    const batchSize = 15;
    for (let i = 0; i < targets.length; i += batchSize) {
      const batch = targets.slice(i, i + batchSize);
      // Effectuer les appels eBay en parallèle (par lot)
      const results = await Promise.all(batch.map(async (game: any) => {
        try {
          // Utiliser l'abbreviation si disponible, sinon le nom complet
          // Gérer le cas où console peut être un tableau ou un objet
          const consoleData = Array.isArray(game?.console) ? game.console[0] : game?.console;
          const platformName = consoleData?.abbreviation || consoleData?.name || undefined;
          
          const priceData = await fetchEbayPriceSamples({
            title: game.title,
            platformName: platformName,
            regionHint: 'PAL',
          });
          const summary = summarizePrices(priceData.used, priceData.new);

          if (!summary || priceData.used.length === 0) {
            // Pas de données eBay pertinentes (normal en sandbox qui a peu de données de test)
            const env = (process.env.EBAY_ENV || '').toLowerCase();
            const reason = env === 'sandbox'
              ? `Aucun résultat pertinent (sandbox a peu de données de test)`
              : `Aucun résultat pertinent (${priceData.used.length} échantillons occasion, ${priceData.new.length} neufs)`;
            return { gameId: game.id, status: 'skipped', reason };
          }

          const now = new Date().toISOString();
          // D'abord tenter une mise à jour
          const { error: updateError, data: updateData } = await supabaseDb
            .from('game_prices')
            .update({
              min_price: summary.min_price,
              max_price: summary.max_price,
              average_price: summary.average_price,
              new_price: summary.new_price || 0,
              currency: summary.currency,
              last_updated: now,
            })
            .eq('game_id', game.id)
            .select();
          if (updateError) throw new Error(updateError.message);

          if (!updateData || updateData.length === 0) {
            // Aucun enregistrement à jour, insérer
            const { error: insertError } = await supabaseDb
              .from('game_prices')
              .insert({
                game_id: game.id,
                min_price: summary.min_price,
                max_price: summary.max_price,
                average_price: summary.average_price,
                new_price: summary.new_price || 0,
                currency: summary.currency,
                last_updated: now,
              });
            if (insertError) throw new Error(insertError.message);
          }
          return { gameId: game.id, status: 'updated' };
        } catch (e: any) {
          return { gameId: game.id, status: 'error', reason: e?.message || 'Erreur inconnue' };
        }
      }));

      for (const r of results) {
        if (r.status === 'updated') updated += 1;
        else if (r.status === 'skipped') skipped += 1;
        else if (r.status === 'error') errors.push({ gameId: r.gameId, reason: r.reason! });
      }
    }

    const total = targets.length;
    const env = (process.env.EBAY_ENV || '').toLowerCase();
    const isSandbox = env === 'sandbox';
    
    let message = total === 0
      ? 'Aucun jeu à mettre à jour (toutes les cotes ont moins de 7 jours).'
      : `Mise à jour terminée: ${updated} mis à jour, ${skipped} ignorés, ${errors.length} erreurs sur ${total} jeux ciblés.`;
    
    if (isSandbox && skipped > 0 && updated === 0) {
      message += ' Note: En sandbox, eBay a peu de données de test, donc beaucoup de jeux peuvent être ignorés. Passez en production pour obtenir des prix réels.';
    }

    // Inclure un échantillon de raisons d'erreurs pour diagnostic
    const errorSamples = errors.slice(0, 10);

    return { success: true, message, updated, skipped, errorsCount: errors.length, total, errorSamples };
});


