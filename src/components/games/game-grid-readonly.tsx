import Image from 'next/image';
import { TranslatedGameStatus } from './TranslatedGameStatus';
import { CollectionGame } from '@/hooks/useUserGames';

interface GameGridReadonlyProps {
  games: CollectionGame[];
  onGameClick?: (game: CollectionGame) => void;
}

export function GameGridReadonly({ games, onGameClick }: GameGridReadonlyProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {games.map((game, index) => (
        <div
          key={game.id}
          onClick={() => onGameClick?.(game)}
          className="group relative aspect-[3/4] overflow-hidden rounded-lg bg-muted cursor-pointer"
        >
          {game.cover_url ? (
            <Image
              src={game.cover_url}
              alt={game.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
              priority={index < 6}
              quality={90}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <span className="text-muted-foreground">No Image</span>
            </div>
          )}
          
          {/* Affichage permanent de la console en bas de l'image */}
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-xs text-white text-center truncate">
            {game.console_name || 'Console inconnue'}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-sm font-medium text-white line-clamp-2">
                {game.title}
              </h3>
              {game.status && game.status !== '0' && (
                <span className="inline-block px-2 py-1 mt-2 text-xs rounded-full bg-primary/80 text-primary-foreground">
                  <TranslatedGameStatus status={game.status} />
                </span>
              )}
              {(() => {
                // Convertir le rating en nombre si nécessaire
                const ratingValue = typeof game.rating === 'number' ? game.rating : 
                                   (game.rating !== null && game.rating !== undefined ? Number(game.rating) : null);
                
                return ratingValue !== null && ratingValue > 0 ? (
                  <div className="mt-1 flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < ratingValue ? 'text-yellow-400' : 'text-gray-400'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

