'use client';

import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

interface AverageRatingDisplayProps {
  rating: number | null;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Composant pour afficher la note moyenne IGDB d'un jeu
 * Note IGDB : échelle de 0 à 100
 */
export function AverageRatingDisplay({
  rating,
  className = '',
  showLabel = true,
  size = 'md'
}: AverageRatingDisplayProps) {
  const t = useTranslations('gameDetails');

  if (!rating || rating === 0) {
    return null;
  }

  // Convertir la note IGDB (0-100) en étoiles (0-5)
  const stars = rating / 20;
  const fullStars = Math.floor(stars);
  const hasHalfStar = stars % 1 >= 0.5;

  // Déterminer la couleur selon la note
  const getColorClass = (rating: number) => {
    if (rating >= 80) return 'text-green-500 dark:text-green-400';
    if (rating >= 60) return 'text-blue-500 dark:text-blue-400';
    if (rating >= 40) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-orange-500 dark:text-orange-400';
  };

  const colorClass = getColorClass(rating);

  // Tailles d'étoiles
  const starSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className={`${textSizes[size]} text-muted-foreground`}>
          {t('averageRating')}:
        </span>
      )}
      
      <div className="flex items-center gap-1">
        {/* Étoiles pleines */}
        {[...Array(fullStars)].map((_, i) => (
          <Star
            key={`full-${i}`}
            className={`${starSizes[size]} ${colorClass} fill-current`}
          />
        ))}
        
        {/* Étoile à moitié */}
        {hasHalfStar && (
          <div className="relative">
            <Star className={`${starSizes[size]} text-muted`} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className={`${starSizes[size]} ${colorClass} fill-current`} />
            </div>
          </div>
        )}
        
        {/* Étoiles vides */}
        {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={`${starSizes[size]} text-muted`}
          />
        ))}
      </div>

      {/* Note numérique */}
      <Badge variant="secondary" className={`${textSizes[size]} font-semibold ${colorClass}`}>
        {rating.toFixed(1)}/100
      </Badge>
    </div>
  );
}
