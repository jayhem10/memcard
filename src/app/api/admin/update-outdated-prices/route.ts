import { z } from 'zod';
import { withApi, ApiError } from '@/lib/api-wrapper';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { fetchEbayPriceSamples, summarizePrices } from '@/lib/ebay';
import type { PriceUpdateBatch } from '@/lib/update-prices';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const pageSize = 100;
const batchSize = 3;
const bodySchema = z.object({ cursor: z.string().uuid().nullable().optional() });

type Game = {
  id: string;
  title: string;
  console: { name: string; abbreviation: string | null }[] | { name: string; abbreviation: string | null } | null;
};

type Price = {
  game_id: string;
  last_updated: string | null;
  average_price: number | null;
  min_price: number | null;
  max_price: number | null;
  new_price: number | null;
};

export const POST = withApi(async (request, { user, supabase }): Promise<PriceUpdateBatch> => {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    throw new ApiError('Accès refusé. Admin uniquement.', 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError('Body JSON invalide', 400);
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) throw new ApiError('Curseur de mise à jour invalide', 400);

  // Pagination par identifiant : les jeux ignorés ou en erreur ne sont pas retraités.
  let query = supabaseAdmin
    .from('games')
    .select('id, title, console:console_id(name, abbreviation)')
    .order('id')
    .limit(pageSize);
  if (parsed.data.cursor) query = query.gt('id', parsed.data.cursor);
  const { data: games, error: gamesError } = await query.returns<Game[]>();
  if (gamesError) throw new ApiError(gamesError.message, 500);

  const page = games || [];
  const priceByGameId = new Map<string, Price>();
  if (page.length) {
    const { data: prices, error: pricesError } = await supabaseAdmin
      .from('game_prices')
      .select('game_id, last_updated, average_price, min_price, max_price, new_price')
      .in('game_id', page.map(game => game.id))
      .returns<Price[]>();
    if (pricesError) throw new ApiError(pricesError.message, 500);
    for (const price of prices || []) priceByGameId.set(price.game_id, price);
  }

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const targets: Game[] = [];
  let scanned = 0;
  for (const game of page) {
    scanned++;
    const price = priceByGameId.get(game.id);
    const hasPrices = price && [price.average_price, price.min_price, price.max_price, price.new_price]
      .some(value => value !== null && value > 0);
    if (!hasPrices || !price.last_updated || new Date(price.last_updated).getTime() < sevenDaysAgo) {
      targets.push(game);
    }
    if (targets.length === batchSize) break;
  }

  const missing = targets.filter(game => !priceByGameId.has(game.id));
  if (missing.length) {
    const { error } = await supabaseAdmin.from('game_prices').insert(missing.map(game => ({
      game_id: game.id,
      min_price: null,
      max_price: null,
      average_price: null,
      new_price: null,
      currency: 'EUR',
      last_updated: null,
    })));
    if (error) throw new ApiError(error.message, 500);
  }

  const results = await Promise.all(targets.map(async game => {
    try {
      const consoleData = Array.isArray(game.console) ? game.console[0] : game.console;
      const priceData = await fetchEbayPriceSamples({
        title: game.title,
        platformName: consoleData?.abbreviation || consoleData?.name || undefined,
        regionHint: 'PAL',
        // Une limite commune à toutes les recherches d'un jeu, OAuth inclus.
        signal: AbortSignal.timeout(20_000),
      });
      const summary = summarizePrices(priceData.used, priceData.new);
      if (!summary || priceData.used.length === 0) {
        return { gameId: game.id, status: 'skipped' as const };
      }

      const values = {
        min_price: summary.min_price,
        max_price: summary.max_price,
        average_price: summary.average_price,
        new_price: summary.new_price || 0,
        currency: summary.currency,
        last_updated: new Date().toISOString(),
      };
      const { data: updatedRows, error } = await supabaseAdmin
        .from('game_prices')
        .update(values)
        .eq('game_id', game.id)
        .select('game_id');
      if (error) throw new Error(error.message);
      if (!updatedRows?.length) {
        const { error: insertError } = await supabaseAdmin
          .from('game_prices')
          .insert({ game_id: game.id, ...values });
        if (insertError) throw new Error(insertError.message);
      }
      return { gameId: game.id, status: 'updated' as const };
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Mise à jour du prix eBay impossible', game.id, error);
      return { gameId: game.id, status: 'error' as const, reason };
    }
  }));

  const errors = results.filter(result => result.status === 'error');
  const hasMore = scanned < page.length || page.length === pageSize;
  return {
    updated: results.filter(result => result.status === 'updated').length,
    skipped: results.filter(result => result.status === 'skipped').length,
    errorsCount: errors.length,
    total: targets.length,
    errorSamples: errors.map(result => ({ gameId: result.gameId, reason: result.reason })),
    nextCursor: hasMore ? page[scanned - 1].id : null,
    isSandbox: (process.env.EBAY_ENV || '').toLowerCase() === 'sandbox',
  };
});
