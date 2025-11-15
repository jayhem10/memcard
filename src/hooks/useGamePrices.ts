import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { GamePrice } from '@/types/games';
import { queryKeys, priceQueryOptions } from '@/lib/react-query-config';

export function useGamePrices(gameId: string | undefined) {
  return useQuery<GamePrice | null, Error>({
    queryKey: queryKeys.gamePrices(gameId || ''),
    queryFn: async () => {
      if (!gameId) return null;

      const { data, error } = await supabase
        .from('game_prices')
        .select('min_price, max_price, average_price, new_price, last_updated')
        .eq('game_id', gameId)
        .maybeSingle();

      // Si l'erreur est "PGRST116" (no rows returned), c'est normal = pas de données
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) return null;

      // Convertir explicitement les données en objet GamePrice
      return {
        min_price: typeof data.min_price === 'number' ? data.min_price : 0,
        max_price: typeof data.max_price === 'number' ? data.max_price : 0,
        average_price: typeof data.average_price === 'number' ? data.average_price : 0,
        new_price: typeof data.new_price === 'number' ? data.new_price : 0,
        last_updated: typeof data.last_updated === 'string' ? data.last_updated : new Date().toISOString()
      };
    },
    enabled: !!gameId,
    ...priceQueryOptions,
  });
}

