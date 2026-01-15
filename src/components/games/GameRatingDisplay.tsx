'use client';

import { Star, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UserGameData } from '@/types/games';

interface GameRatingDisplayProps {
  userGame?: UserGameData;
}

export function GameRatingDisplay({ userGame }: GameRatingDisplayProps) {
  const t = useTranslations('gameDetails');

  return (
    <div className="space-y-6">
      {/* Card Évaluation */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-50/30 via-card to-orange-50/30 dark:from-yellow-950/20 dark:via-card dark:to-orange-950/20 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-full blur-3xl" />
        <div className="relative p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-1 w-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full" />
            <h2 className="text-lg font-bold">{t('rating')}</h2>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide block">{t('ratingLabel')}</label>
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star}
                      className={`h-6 w-6 ${
                        userGame?.rating && star <= userGame.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`} 
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold">
                  {userGame?.rating || t('notRated')}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide block">{t('playTime')}</label>
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold">
                  {userGame?.play_time
                    ? `${Math.floor(userGame.play_time / 60)}h ${userGame.play_time % 60}m`
                    : t('playTimeNotDefined')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Avis */}
      {userGame?.review && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50/50 via-card to-pink-50/50 dark:from-purple-950/20 dark:via-card dark:to-pink-950/20 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
          <div className="relative p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
              <label className="text-lg font-bold">{t('myReview')}</label>
            </div>
            <p className="text-foreground leading-relaxed p-4 rounded-lg bg-muted/30 border border-border/50 whitespace-pre-wrap">
              {userGame.review}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
