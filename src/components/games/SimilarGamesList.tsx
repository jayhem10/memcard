'use client';

import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { SimilarGame } from '@/types/games';

interface SimilarGamesListProps {
  similarGames: SimilarGame[] | undefined;
  isLoading: boolean;
}

export function SimilarGamesList({ similarGames, isLoading }: SimilarGamesListProps) {
  return (
    <div className="bg-card p-4 rounded-lg shadow-sm">
      <h3 className="font-semibold border-b pb-2">Vos jeux similaires</h3>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : similarGames && similarGames.length > 0 ? (
        <div className="mt-3 space-y-3">
          {similarGames.map((similarGame) => (
            <Link
              key={similarGame.id}
              href={`/games/${similarGame.id}`}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors group"
            >
              {similarGame.cover_url ? (
                <div className="relative h-16 w-12 flex-shrink-0 rounded overflow-hidden bg-muted">
                  <Image
                    src={similarGame.cover_url}
                    alt={similarGame.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="48px"
                  />
                </div>
              ) : (
                <div className="h-16 w-12 flex-shrink-0 rounded bg-muted flex items-center justify-center">
                  <span className="text-xs text-muted-foreground text-center px-1 line-clamp-2">
                    {similarGame.title}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                  {similarGame.title}
                </p>
                {similarGame.console && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {similarGame.console.name}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Aucun jeu similaire trouvé
        </p>
      )}
    </div>
  );
}

