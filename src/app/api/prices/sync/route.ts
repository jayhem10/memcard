import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { fetchEbayPriceSamples, summarizePrices } from '@/lib/ebay';

export async function POST(request: NextRequest) {
  const supabase = supabaseAdmin;

  try {
    const { gameId } = await request.json();
    if (!gameId) {
      return NextResponse.json({ error: 'gameId requis' }, { status: 400 });
    }

    // Récupérer titre et console pour affiner la recherche
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, title, console:console_id(name, abbreviation)')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ error: 'Jeu introuvable' }, { status: 404 });
    }

    // Utiliser l'abbreviation si disponible, sinon le nom complet
    // Gérer le cas où console peut être un tableau ou un objet
    const consoleData = Array.isArray(game?.console) ? game.console[0] : game?.console;
    const platformName = consoleData?.abbreviation || consoleData?.name || undefined;

    // Appel eBay (EUR, PAL, complet/CIB)
    const priceData = await fetchEbayPriceSamples({
      title: game.title,
      platformName: platformName,
      regionHint: 'PAL',
    });

    const summary = summarizePrices(priceData.used, priceData.new);
    if (!summary) {
      // Aucun échantillon pertinent; on n'écrase pas les valeurs existantes
      return NextResponse.json({
        message: 'Aucun résultat eBay pertinent (EUR/PAL/complet).',
        updated: false,
      });
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
      return NextResponse.json({ error: updateError.message }, { status: 500 });
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
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      updated: true,
      game_id: gameId,
      ...summary,
      last_updated: now,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur interne' }, { status: 500 });
  }
}


