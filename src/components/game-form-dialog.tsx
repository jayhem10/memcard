'use client';

import { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCollection } from '@/store';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import toast from 'react-hot-toast';

interface GameFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  initialBuyPrice?: number;
}

export function GameFormDialog({ isOpen, onClose, gameId, initialBuyPrice }: GameFormDialogProps) {
  const [buyPrice, setBuyPrice] = useState<string>(initialBuyPrice?.toString() || '');
  const [isLoading, setIsLoading] = useState(false);
  const { addToTotal, subtractFromTotal } = useCollection();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const numericPrice = parseFloat(buyPrice) || 0;
      
      // Si on avait un prix initial, on le soustrait avant d'ajouter le nouveau
      if (initialBuyPrice) {
        subtractFromTotal(initialBuyPrice);
      }
      
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Mise à jour du prix dans la base de données
        const { error } = await (supabase
          .from('user_games') as any)
          .update({ buy_price: numericPrice })
          .eq('game_id', gameId)
          .eq('user_id', user.id);

      if (error) throw error;

      // Ajout du nouveau prix au total de la collection
      addToTotal(numericPrice);
      
      // Invalider le cache pour forcer un rechargement
      queryClient.invalidateQueries({ queryKey: ['game', gameId] });

      toast.success('Prix mis à jour avec succès');
      onClose();
    } catch (error) {
      console.error('Error updating buy price:', error);
      toast.error('Erreur lors de la mise à jour du prix');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] !w-[calc(100vw-2rem)] sm:!w-full max-h-[85vh] overflow-y-auto overflow-x-hidden p-0 flex flex-col">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6 flex-shrink-0">
          <DialogTitle>Prix d'achat</DialogTitle>
          <DialogDescription>
            Entrez le prix d'achat du jeu pour suivre la valeur de votre collection
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 px-4 sm:px-6 overflow-x-hidden">
          <div className="space-y-2">
            <Label htmlFor="buyPrice">Prix d'achat</Label>
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

          <DialogFooter className="gap-2 sm:gap-0 sticky bottom-0 bg-background px-0 pb-4 pt-2 sm:pb-6 sm:pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
