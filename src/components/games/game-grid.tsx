import Image from 'next/image';
import Link from 'next/link';
import { Game } from '@/types/database.types';
import { STATUS_LABELS } from '@/types/games';
import { CollectionGame } from '@/hooks/useUserGames';

export type GameGridItem = (Game | CollectionGame) & {
  status?: string;
  rating?: number | null;
  console_name?: string;
};

interface GameGridProps {
  games: GameGridItem[];
  readonly?: boolean;
  onGameClick?: (game: GameGridItem) => void;
}

function GameCard({ 
  game, 
  index, 
  readonly, 
  onGameClick 
}: { 
  game: GameGridItem; 
  index: number;
  readonly?: boolean;
  onGameClick?: (game: GameGridItem) => void;
}) {
  // Normaliser le rating (peut être string ou number)
  const ratingValue = typeof game.rating === 'number' 
    ? game.rating 
    : (game.rating !== null && game.rating !== undefined ? Number(game.rating) : null);
  
  // Normaliser le status (peut être '0' ou null pour les collections d'autres utilisateurs)
  const displayStatus = game.status && game.status !== '0' ? game.status : undefined;

  const cardContent = (
    <>
      {/* Zone image - pochette bien visible avec haut toujours visible */}
      <div className="relative flex-1 min-h-0 overflow-hidden bg-muted">
        {game.cover_url ? (
          <Image
            src={game.cover_url}
            alt={game.title}
            fill
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
            priority={index < 6}
            quality={90}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <span className="text-muted-foreground text-sm">No Image</span>
          </div>
        )}

        {/* Badge de statut en haut à droite */}
        {displayStatus && (
          <div className="absolute top-2 right-2 z-10">
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-primary/90 text-primary-foreground backdrop-blur-sm border border-primary/20 shadow-sm">
              {STATUS_LABELS[displayStatus] || displayStatus}
            </span>
          </div>
        )}

        {/* Rating en haut à gauche */}
        {ratingValue !== null && ratingValue > 0 && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-0.5 px-1.5 py-1 rounded-md bg-black/70 backdrop-blur-sm border border-white/20">
            <svg
              className="w-3.5 h-3.5 text-yellow-400 fill-current"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs font-semibold text-white">{ratingValue}</span>
          </div>
        )}
      </div>

      {/* Zone d'information en bas - hauteur fixe pour garantir le même ratio */}
      <div className="relative bg-card/95 backdrop-blur-sm border-t border-border/50 p-3 h-[88px] flex flex-col justify-end group-hover:bg-card transition-colors duration-200 rounded-b-lg">
        {/* Titre du jeu */}
        <h3 className="text-sm font-semibold text-card-foreground line-clamp-2 mb-1.5 group-hover:text-primary transition-colors duration-200">
          {game.title}
        </h3>

        {/* Console */}
        <span className="text-xs text-muted-foreground truncate block">
          {game.console_name || 'Console inconnue'}
        </span>
      </div>
    </>
  );

  const className = "game-card group relative flex flex-col aspect-[3/5] rounded-lg bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300 ease-in-out";

  if (readonly && onGameClick) {
    return (
      <div
        onClick={() => onGameClick(game)}
        className={`${className} cursor-pointer overflow-hidden`}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      href={`/games/${game.id}`}
      className={`${className} overflow-hidden`}
    >
      {cardContent}
    </Link>
  );
}

export function GameGrid({ games, readonly, onGameClick }: GameGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {games.map((game, index) => (
        <GameCard
          key={game.id}
          game={game}
          index={index}
          readonly={readonly}
          onGameClick={onGameClick}
        />
      ))}
    </div>
  );
}
