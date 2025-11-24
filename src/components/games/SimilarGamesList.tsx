'use client';

import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { SimilarGame } from '@/types/games';

interface SimilarGamesListProps {
  similarGames: SimilarGame[] | undefined;
  isLoading: boolean;
}

export function SimilarGamesList({ similarGames, isLoading }: SimilarGamesListProps) {
  const t = useTranslations('gameDetails');

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      <div className="relative p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-1 w-8 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
          <h3 className="text-lg font-bold">{t('yourSimilarGames')}</h3>
        </div>
        
      {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : similarGames && similarGames.length > 0 ? (
          <div className="space-y-3">
          {similarGames.map((similarGame) => (
            <Link
              key={similarGame.id}
              href={`/games/${similarGame.id}`}
                className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 hover:border-primary/50 hover:from-primary/10 hover:to-primary/5 transition-all duration-300 group"
            >
              {similarGame.cover_url ? (
                  <div className="relative h-20 w-14 flex-shrink-0 rounded-lg overflow-hidden bg-muted shadow-md group-hover:shadow-lg transition-shadow">
                  <Image
                    src={similarGame.cover_url}
                    alt={similarGame.title}
                    fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      sizes="56px"
                  />
                </div>
              ) : (
                  <div className="h-20 w-14 flex-shrink-0 rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border/50">
                    <span className="text-xs text-muted-foreground text-center px-1 line-clamp-2 font-medium">
                    {similarGame.title}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                  {similarGame.title}
                </p>
                {similarGame.console && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                    {similarGame.console.name}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Aucun jeu similaire trouvé</p>
          </div>
      )}
      </div>
    </div>
  );
}

