'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCollection } from '@/store';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/react-query-config';

interface GameFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  /** id de la ligne user_games ciblée (obligatoire si plusieurs exemplaires) */
  userGameId?: string;
  initialBuyPrice?: number;
  initialSellPrice?: number | null;
  /** 'sell' : dialogue orienté "marquer comme vendu" (focus sur le prix de vente) */
  mode?: 'prices' | 'sell';
}

export function GameFormDialog({ isOpen, onClose, gameId, userGameId, initialBuyPrice, initialSellPrice, mode = 'prices' }: GameFormDialogProps) {
  const t = useTranslations('gameDetails');
  const [buyPrice, setBuyPrice] = useState<string>(initialBuyPrice?.toString() || '');
  const [sellPrice, setSellPrice] = useState<string>(initialSellPrice?.toString() || '');
  const [isLoading, setIsLoading] = useState(false);
  const { addToTotal, subtractFromTotal } = useCollection();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setBuyPrice(initialBuyPrice?.toString() || '');
      setSellPrice(initialSellPrice?.toString() || '');
    }
  }, [isOpen, initialBuyPrice, initialSellPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const parsedBuy =
        buyPrice.trim() === '' ? null : parseFloat(buyPrice.replace(',', '.'));
      const parsedSell =
        sellPrice.trim() === '' ? null : parseFloat(sellPrice.replace(',', '.'));

      if (
        (buyPrice.trim() !== '' && !Number.isFinite(parsedBuy!)) ||
        (sellPrice.trim() !== '' && !Number.isFinite(parsedSell!))
      ) {
        throw new Error(t('invalidAmounts'));
      }

      if (mode === 'sell' && parsedSell == null) {
        throw new Error(t('sellPriceRequired'));
      }

      if (initialBuyPrice != null && initialBuyPrice > 0) {
        subtractFromTotal(initialBuyPrice);
      }

      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      let updateQuery = supabase
        .from('user_games')
        .update({ buy_price: parsedBuy, sell_price: parsedSell })
        .eq('game_id', gameId)
        .eq('user_id', user.id);
      if (userGameId) {
        updateQuery = updateQuery.eq('id', userGameId);
      }

      const { data: updatedRows, error } = await updateQuery.select('id');

      if (error) throw error;
      if (!updatedRows?.length) {
        throw new Error('Aucune ligne mise à jour — lien jeu / utilisateur introuvable');
      }

      if (parsedBuy != null && parsedBuy > 0) {
        addToTotal(parsedBuy);
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.game(gameId, user.id) });
      queryClient.invalidateQueries({ queryKey: ['userGames', user.id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.soldGameIds(user.id) });
      queryClient.invalidateQueries({ queryKey: ['userGamesStats', user.id] });

      toast.success(parsedSell != null ? t('markedAsSold') : t('pricesUpdated'));
      onClose();
    } catch (error) {
      console.error('Error updating prices:', error);
      const message = error instanceof Error ? error.message : t('pricesUpdateError');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const margin = sellPrice && buyPrice
    ? (parseFloat(sellPrice) - parseFloat(buyPrice)).toFixed(2)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] !w-[calc(100vw-2rem)] sm:!w-full max-h-[85vh] overflow-y-auto overflow-x-hidden p-0 flex flex-col">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6 flex-shrink-0">
          <DialogTitle>{mode === 'sell' ? t('markAsSold') : t('gamePrices')}</DialogTitle>
          <DialogDescription>
            {mode === 'sell' ? t('markAsSoldDescription') : t('gamePricesDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-4 sm:px-6 overflow-x-hidden">
          <div className="space-y-2">
            <Label htmlFor="buyPrice">{t('buyPriceLabel')}</Label>
            <Input
              id="buyPrice"
              type="number"
              step="0.01"
              min="0"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              placeholder="0.00"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sellPrice">{t('sellPriceLabel')}</Label>
            <Input
              id="sellPrice"
              type="number"
              step="0.01"
              min="0"
              autoFocus={mode === 'sell'}
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="0.00"
              className="w-full"
            />
            {sellPrice && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {t('willBeMarkedAsSold')}
              </p>
            )}
          </div>

          {margin !== null && (
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              parseFloat(margin) >= 0
                ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
            }`}>
              <TrendingUp className="h-4 w-4" />
              {t('margin')} : {parseFloat(margin) >= 0 ? '+' : ''}{margin} €
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 sticky bottom-0 bg-background px-0 pb-4 pt-2 sm:pb-6 sm:pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'sell' ? t('confirmSale') : t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
