import Image from 'next/image';
import { Game } from '@/types/database.types';
import { STATUS_LABELS } from '@/types/games';

interface GameListReadonlyProps {
  games: (Game & {
    status?: string;
    rating?: number;
    notes?: string;
    completion_percentage?: number;
    play_time?: number;
    console_name?: string;
  })[];
}

export function GameListReadonly({ games }: GameListReadonlyProps) {
  return (
    <div className="space-y-4">
      {games.map((game, index) => (
        <div
          key={game.id}
          className="flex items-center space-x-4 p-4 rounded-lg bg-card border border-border/50"
        >
          {/* Game cover */}
          <div className="relative w-20 h-24 flex-shrink-0">
            {game.cover_url ? (
              <Image
                src={game.cover_url}
                alt={game.title}
                fill
                className="object-cover rounded-md"
                sizes="80px"
                priority={index < 4}
                quality={90}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-md">
                <span className="text-muted-foreground text-xs">No Image</span>
              </div>
            )}
          </div>

          {/* Game info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-medium line-clamp-1">
                  {game.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {game.developer}
                </p>
                {game.console_name && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="inline-block px-1.5 py-0.5 rounded-sm bg-secondary/30 text-secondary-foreground">
                      {game.console_name}
                    </span>
                  </p>
                )}
                {game.notes && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                    "{game.notes}"
                  </p>
                )}
              </div>

            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

