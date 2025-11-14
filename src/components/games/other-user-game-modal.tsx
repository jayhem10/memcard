'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CollectionGame } from '@/hooks/useUserGames';
import { useGameStatus } from '@/hooks/useGameStatus';
import { useAddToWishlist } from '@/hooks/useAddToWishlist';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth-context';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

interface OtherUserGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: CollectionGame | null;
  ownerUserId: string;
}

export function OtherUserGameModal({ isOpen, onClose, game, ownerUserId }: OtherUserGameModalProps) {
  // Utiliser les hooks personnalisés pour la logique métier
  const { gameStatus, isChecking } = useGameStatus(game, isOpen);
  const { addToWishlist, isAdding } = useAddToWishlist();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [localGameStatus, setLocalGameStatus] = useState(gameStatus);
  const [isRemoving, setIsRemoving] = useState(false);

  // Synchroniser le statut local avec le statut du hook
  useEffect(() => {
    setLocalGameStatus(gameStatus);
  }, [gameStatus]);

  const handleAddToWishlist = async () => {
    if (!game) return;

    try {
      await addToWishlist(game);
      // Mettre à jour le statut local immédiatement pour un feedback instantané
      // Le hook useGameStatus se mettra à jour automatiquement via le cache React Query
      setLocalGameStatus('in_wishlist');
    } catch (error) {
      // L'erreur est déjà gérée dans le hook avec toast
    }
  };

  const handleRemoveFromCollection = async () => {
    if (!game || !user) return;

    setIsRemoving(true);
    try {
      // Trouver l'ID du jeu dans user_games en utilisant igdb_id et console_id
      // car game.id est l'ID du jeu dans la collection de l'autre utilisateur
      const { data: userGamesWithGames, error: findError } = await supabase
        .from('user_games')
        .select(`
          id,
          status,
          game_id,
          games:game_id(
            igdb_id,
            console_id
          )
        `)
        .eq('user_id', user.id);

      if (findError) throw findError;

      // Trouver le jeu correspondant avec igdb_id et console_id
      type UserGameWithGame = {
        id: string;
        status: string;
        game_id: string;
        games: {
          igdb_id: number;
          console_id: string;
        } | null;
      };

      const matchingGame = (userGamesWithGames as UserGameWithGame[] | null)?.find((ug) => 
        ug.games?.igdb_id === game.igdb_id && ug.games?.console_id === game.console_id
      );

      if (!matchingGame) {
        toast.error('Jeu non trouvé dans votre collection');
        return;
      }

      // Supprimer le jeu
      const { error: deleteError } = await supabase
        .from('user_games')
        .delete()
        .eq('id', matchingGame.id);

      if (deleteError) throw deleteError;

      // Mettre à jour le cache localement immédiatement pour un feedback instantané
      const cachedGames = queryClient.getQueryData<CollectionGame[]>(['userGames', user.id]);
      if (cachedGames) {
        const updatedGames = cachedGames.filter(
          g => !(g.igdb_id === game.igdb_id && g.console_id === game.console_id)
        );
        queryClient.setQueryData(['userGames', user.id], updatedGames);
      }

      // Mettre à jour le statut local immédiatement
      setLocalGameStatus('not_in_collection');
      
      // Invalider le cache en arrière-plan (sans attendre) pour synchroniser avec la DB
      queryClient.invalidateQueries({ queryKey: ['userGames', user.id] });
      
      const isWishlist = matchingGame.status?.toUpperCase() === 'WISHLIST' || matchingGame.status?.toUpperCase() === 'wishlist';
      toast.success(isWishlist ? 'Jeu supprimé de votre liste de souhaits' : 'Jeu supprimé de votre collection');
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      setIsRemoving(false);
    }
  };

  if (!game) return null;

  // Vérifier que le jeu a au moins un titre
  if (!game.title) {
    console.error('Jeu sans titre:', game);
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] !w-[calc(100vw-2rem)] sm:!w-full max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6 pb-3 sm:pb-4 flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl pr-8 break-words">
            {game.title || 'Jeu sans titre'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Détails du jeu {game.title}
          </DialogDescription>
        </DialogHeader>

        {isChecking ? (
          // État de chargement pendant la vérification du statut
          <div className="flex items-center justify-center py-12 sm:py-16 px-4 sm:px-6 flex-1 overflow-y-auto">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative min-h-0">
            <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
            {/* Image et infos principales */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              {/* Jaquette */}
              <div className="relative w-full sm:w-40 h-48 sm:h-56 flex-shrink-0 rounded-lg overflow-hidden bg-muted mx-auto sm:mx-0 max-w-[160px] sm:max-w-none">
                {game.cover_url ? (
                  <Image
                    src={game.cover_url}
                    alt={game.title || 'Jaquette du jeu'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 160px, 160px"
                    priority
                    onError={(e) => {
                      console.error('Erreur de chargement de l\'image:', game.cover_url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                    <span className="text-muted-foreground text-sm text-center px-2">Pas d'image</span>
                  </div>
                )}
              </div>

              {/* Infos du jeu */}
              <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Informations</h3>
                  <div className="space-y-2 sm:space-y-2.5 text-sm">
                    {game.console_name && (
                      <div>
                        <span className="font-medium">Plateforme :</span>{' '}
                        <span className="text-muted-foreground">{game.console_name}</span>
                      </div>
                    )}
                    {game.developer && (
                      <div className="break-words">
                        <span className="font-medium">Développeur :</span>{' '}
                        <span className="text-muted-foreground">{game.developer}</span>
                      </div>
                    )}
                    {game.publisher && (
                      <div className="break-words">
                        <span className="font-medium">Éditeur :</span>{' '}
                        <span className="text-muted-foreground">{game.publisher}</span>
                      </div>
                    )}
                    {game.release_date && (
                      <div>
                        <span className="font-medium">Date de sortie :</span>{' '}
                        <span className="text-muted-foreground">
                          {new Date(game.release_date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                    {game.genres && game.genres.length > 0 && (
                      <div className="break-words">
                        <span className="font-medium">Genres :</span>{' '}
                        <span className="text-muted-foreground">
                          {game.genres.map(g => g.name).join(', ')}
                        </span>
                      </div>
                    )}
                    {(!game.developer && !game.publisher && !game.release_date && (!game.genres || game.genres.length === 0)) && (
                      <div className="text-muted-foreground italic">
                        Aucune information supplémentaire disponible
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {(game.description_fr || game.description_en) && (
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Description</h3>
                <div className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  <p className="whitespace-pre-wrap break-words">
                    {game.description_fr || game.description_en}
                  </p>
                </div>
              </div>
            )}

            {/* Avis du propriétaire */}
            {game.review && (
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Avis du collectionneur</h3>
                <div className="p-3 sm:p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed">
                    {game.review}
                  </p>
                </div>
              </div>
            )}
            </div>
          </div>
        )}

        {/* Footer avec bouton de statut et fermer */}
        {!isChecking && (
          <DialogFooter className="flex-shrink-0 px-4 sm:px-6 pb-4 sm:pb-6 pt-4 border-t gap-2 flex-row">
            {localGameStatus === 'in_collection' ? (
              <Button
                onClick={handleRemoveFromCollection}
                disabled={isRemoving}
                variant="default"
                size="sm"
                className="h-9 px-2 sm:px-3 gap-1 sm:gap-2 flex-1"
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                    <span className="text-sm hidden sm:inline">Suppression...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm hidden sm:inline">Retirer de ma collection</span>
                  </>
                )}
              </Button>
            ) : localGameStatus === 'in_wishlist' ? (
              <Button
                onClick={handleRemoveFromCollection}
                disabled={isRemoving}
                variant="default"
                size="sm"
                className="h-9 px-2 sm:px-3 gap-1 sm:gap-2 flex-1"
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                    <span className="text-sm hidden sm:inline">Suppression...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm hidden sm:inline">Retirer de ma wishlist</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleAddToWishlist}
                disabled={isAdding}
                variant="default"
                size="sm"
                className="h-9 px-2 sm:px-3 gap-1 sm:gap-2 flex-1"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                    <span className="text-sm hidden sm:inline">Ajout en cours...</span>
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm hidden sm:inline">Ajouter à ma wishlist</span>
                  </>
                )}
              </Button>
            )}
            <Button onClick={onClose} variant="outline" className="h-9 px-3 flex-1">
              Fermer
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

