'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { UserGameData } from '@/types/games';

interface GameInfoCardProps {
  game: {
    developer?: string | null;
    publisher?: string | null;
    release_date?: string | null;
    console?: {
      name: string;
    } | null;
    genres?: Array<{
      genre_id: string;
      genres?: {
        name: string;
      } | null;
    }>;
  };
  userGame?: UserGameData;
  onEditPrice: () => void;
}

export function GameInfoCard({ game, userGame, onEditPrice }: GameInfoCardProps) {
  const t = useTranslations('gameDetails');

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      <div className="relative p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-1 w-8 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
          <h3 className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            {t('information')}
          </h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{t('developer')}</span>
            <p className="font-semibold text-foreground">{game.developer || t('notDefined')}</p>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{t('publisher')}</span>
            <p className="font-semibold text-foreground">{game.publisher || t('notDefined')}</p>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{t('releaseDate')}</span>
            <p className="font-semibold text-foreground">
              {game.release_date ? new Date(game.release_date).toLocaleDateString('fr-FR') : t('notDefinedDate')}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{t('platform')}</span>
            <p className="font-semibold text-foreground">{game.console?.name || t('notDefined')}</p>
          </div>
          
          <div className="space-y-1 col-span-2">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{t('purchasePrice')}</span>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground">
                {userGame?.buy_price
                  ? `${userGame.buy_price.toFixed(2)} €`
                  : t('notSpecified')}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-primary/10 transition-colors"
                onClick={onEditPrice}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {game.genres && game.genres.length > 0 && (
          <div className="pt-4 border-t border-border/50">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide block mb-3">{t('genres')}</span>
            <div className="flex flex-wrap gap-2">
              {game.genres.map((genreItem) => (
                <Badge 
                  key={genreItem.genre_id} 
                  variant="secondary" 
                  className="text-xs px-3 py-1 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 hover:from-primary/20 hover:to-primary/10 transition-all"
                >
                  {genreItem.genres?.name || 'Genre inconnu'}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
