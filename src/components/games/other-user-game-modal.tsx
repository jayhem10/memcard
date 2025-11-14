'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, CheckCircle2, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CollectionGame } from '@/hooks/useUserGames';
import { useGameStatus } from '@/hooks/useGameStatus';
import { useAddToWishlist } from '@/hooks/useAddToWishlist';

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
  
  const [localGameStatus, setLocalGameStatus] = useState(gameStatus);

  // Synchroniser le statut local avec le statut du hook
  useEffect(() => {
    setLocalGameStatus(gameStatus);
  }, [gameStatus]);

  const handleAddToWishlist = async () => {
    if (!game) return;

    try {
      await addToWishlist(game);
      // Mettre à jour le statut local immédiatement pour un feedback instantané
      setLocalGameStatus('in_wishlist');
    } catch (error) {
      // L'erreur est déjà gérée dans le hook avec toast
    }
  };

  if (!game) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">{game.title}</DialogTitle>
        </DialogHeader>

        {isChecking ? (
          // État de chargement pendant la vérification du statut
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Image et infos principales */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Jaquette */}
              <div className="relative w-full sm:w-48 h-64 sm:h-72 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                {game.cover_url ? (
                  <Image
                    src={game.cover_url}
                    alt={game.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 192px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-muted-foreground">Pas d'image</span>
                  </div>
                )}
              </div>

              {/* Infos du jeu */}
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Informations</h3>
                  <div className="space-y-2 text-sm">
                    {game.developer && (
                      <div>
                        <span className="font-medium">Développeur :</span>{' '}
                        <span className="text-muted-foreground">{game.developer}</span>
                      </div>
                    )}
                    {game.publisher && (
                      <div>
                        <span className="font-medium">Éditeur :</span>{' '}
                        <span className="text-muted-foreground">{game.publisher}</span>
                      </div>
                    )}
                    {game.console_name && (
                      <div>
                        <span className="font-medium">Plateforme :</span>{' '}
                        <span className="text-muted-foreground">{game.console_name}</span>
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
                      <div>
                        <span className="font-medium">Genres :</span>{' '}
                        <span className="text-muted-foreground">
                          {game.genres.map(g => g.name).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bouton d'action */}
                <div className="pt-2">
                  {localGameStatus === 'in_collection' ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Dans ma collection
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64">
                        <p className="text-sm">
                          Ce jeu est déjà dans votre collection sur {game.console_name}.
                        </p>
                      </PopoverContent>
                    </Popover>
                  ) : localGameStatus === 'in_wishlist' ? (
                    <Button variant="outline" className="w-full sm:w-auto" disabled>
                      <Heart className="h-4 w-4 mr-2 fill-current text-primary" />
                      Dans ma liste de souhaits
                    </Button>
                  ) : (
                    <Button
                      onClick={handleAddToWishlist}
                      disabled={isAdding}
                      className="w-full sm:w-auto"
                    >
                      {isAdding ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Ajout...
                        </>
                      ) : (
                        <>
                          <Heart className="h-4 w-4 mr-2" />
                          Ajouter à ma liste de souhaits
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {(game.description_fr || game.description_en) && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">
                  {game.description_fr || game.description_en}
                </p>
              </div>
            )}

            {/* Avis du propriétaire */}
            {game.review && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Avis du collectionneur</h3>
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-sm whitespace-pre-wrap">{game.review}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

