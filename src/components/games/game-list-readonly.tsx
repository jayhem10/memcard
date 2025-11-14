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
  onGameClick?: (game: Game & { status?: string; rating?: number; notes?: string; completion_percentage?: number; play_time?: number; console_name?: string }) => void;
}

export function GameListReadonly({ games, onGameClick }: GameListReadonlyProps) {
  return (
    <div className="space-y-4">
      {games.map((game, index) => (
        <div
          key={game.id}
          onClick={() => onGameClick?.(game)}
          className="flex items-center space-x-4 p-4 rounded-lg bg-card border border-border/50 cursor-pointer hover:bg-accent/50 hover:border-primary/30 transition-all duration-200"
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
              {game.rating && (
                <div className="flex items-center">
                  <span className="text-yellow-400 mr-1">{game.rating}</span>
                  <svg
                    className="w-4 h-4 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Additional info */}
            <div className="mt-2 flex items-center space-x-4 text-sm">
              {game.status && game.status !== '0' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {STATUS_LABELS[game.status] || game.status}
                </span>
              )}
              {game.completion_percentage !== undefined && (
                <span className="text-muted-foreground">
                  {game.completion_percentage}% terminé
                </span>
              )}
              {game.play_time !== undefined && (
                <span className="text-muted-foreground">
                  {Math.floor(game.play_time / 60)}h {game.play_time % 60}m
                </span>
              )}
            </div>
          </div>

          {/* Arrow icon */}
          <div className="text-muted-foreground">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}

