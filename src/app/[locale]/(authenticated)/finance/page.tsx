'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { coercePriceToNumber } from '@/lib/game-utils';
import { getEditionLabel } from '@/types/games';
import { TrendingUp, TrendingDown, DollarSign, Loader2, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type SoldGame = {
  user_game_id: string;
  game_id: string;
  title: string;
  cover_url: string | null;
  console_name: string | null;
  edition: string | null;
  edition_other: string | null;
  buy_price: number | null;
  sell_price: number;
  sold_at: string | null;
};

export default function FinancePage() {
  const t = useTranslations('finance');
  const tGames = useTranslations('games');
  const { user } = useAuth();
  const [soldGames, setSoldGames] = useState<SoldGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchSoldGames = async () => {
      setLoading(true);
      const { data, error } = await (supabase
        .from('user_games') as any)
        .select(`
          id,
          buy_price,
          sell_price,
          edition,
          edition_other,
          updated_at,
          games:game_id(id, title, cover_url, consoles:console_id(name))
        `)
        .eq('user_id', user.id)
        .not('sell_price', 'is', null)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching sold games:', error);
      } else if (data) {
        setSoldGames(
          data
            .map((row: any): SoldGame | null => {
              const sellPrice = coercePriceToNumber(row.sell_price);
              if (sellPrice == null) return null;
              return {
                user_game_id: row.id,
                game_id: String(row.games?.id ?? ''),
                title: row.games?.title ?? t('unknownGame'),
                cover_url: row.games?.cover_url ?? null,
                console_name: row.games?.consoles?.name ?? null,
                edition: row.edition ?? null,
                edition_other: row.edition_other ?? null,
                buy_price: coercePriceToNumber(row.buy_price),
                sell_price: sellPrice,
                sold_at: row.updated_at ?? null,
              };
            })
            .filter((g: SoldGame | null): g is SoldGame => g !== null)
        );
      }
      setLoading(false);
    };

    fetchSoldGames();
  }, [user, t]);

  const totalBuy = soldGames.reduce((acc, g) => acc + (g.buy_price ?? 0), 0);
  const totalSell = soldGames.reduce((acc, g) => acc + g.sell_price, 0);
  const totalMargin = totalSell - totalBuy;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t('soldCount', { count: soldGames.length })}
          </p>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/40">
              <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t('totalBought')}</p>
              <p className="text-xl font-bold">{totalBuy.toFixed(2)} €</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t('totalSold')}</p>
              <p className="text-xl font-bold">{totalSell.toFixed(2)} €</p>
            </div>
          </div>
        </div>

        <div className={`relative overflow-hidden rounded-2xl border border-border/50 shadow-xl p-5 ${
          totalMargin >= 0
            ? 'bg-gradient-to-br from-green-50/50 via-card to-card/95 dark:from-green-950/20'
            : 'bg-gradient-to-br from-red-50/50 via-card to-card/95 dark:from-red-950/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              totalMargin >= 0
                ? 'bg-green-100 dark:bg-green-950/40'
                : 'bg-red-100 dark:bg-red-950/40'
            }`}>
              {totalMargin >= 0
                ? <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                : <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              }
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t('totalMargin')}</p>
              <p className={`text-xl font-bold ${
                totalMargin >= 0
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-red-700 dark:text-red-400'
              }`}>
                {totalMargin >= 0 ? '+' : ''}{totalMargin.toFixed(2)} €
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table des jeux vendus */}
      {soldGames.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl p-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground text-lg">{t('emptyTitle')}</p>
            <p className="text-sm text-muted-foreground">
              {t('emptyHint')}
            </p>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('colGame')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">{t('colConsole')}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('colBuy')}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('colSell')}</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('colMargin')}</th>
                </tr>
              </thead>
              <tbody>
                {soldGames.map((game, idx) => {
                  const margin = game.sell_price - (game.buy_price ?? 0);
                  const isPositive = margin >= 0;
                  return (
                    <tr
                      key={game.user_game_id}
                      className={`border-b border-border/30 hover:bg-muted/20 transition-colors ${
                        idx === soldGames.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Link href={`/games/${game.game_id}?copy=${game.user_game_id}`} className="flex items-center gap-3 group">
                          <div className="relative w-10 h-12 rounded-md overflow-hidden flex-shrink-0 bg-muted shadow-sm">
                            {game.cover_url ? (
                              <Image
                                src={game.cover_url}
                                alt={game.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                                sizes="40px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted">
                                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="block font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                              {game.title}
                            </span>
                            {game.edition && game.edition !== 'standard' && (
                              <span className="block text-xs text-muted-foreground">
                                {getEditionLabel((key) => tGames(key), game.edition, game.edition_other)}
                              </span>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {game.console_name && (
                          <Badge variant="secondary" className="text-xs">{game.console_name}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        {game.buy_price != null ? `${game.buy_price.toFixed(2)} €` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        {game.sell_price.toFixed(2)} €
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center gap-1 text-sm font-semibold ${
                          isPositive
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {isPositive
                            ? <TrendingUp className="h-3.5 w-3.5" />
                            : <TrendingDown className="h-3.5 w-3.5" />
                          }
                          {isPositive ? '+' : ''}{margin.toFixed(2)} €
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
