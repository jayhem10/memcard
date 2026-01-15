'use client';

import { TranslatedGameStatus } from './TranslatedGameStatus';
import { useTranslations } from 'next-intl';
import { getEditionOptions, UserGameData } from '@/types/games';

interface GameStatusDisplayProps {
  userGame?: UserGameData;
}

export function GameStatusDisplay({ userGame }: GameStatusDisplayProps) {
  const t = useTranslations('gameDetails');
  const tGames = useTranslations('games');
  const editionOptions = getEditionOptions((key) => tGames(key));

  const getConditionLabel = (condition?: string | null) => {
    if (!condition) return t('notSpecified');
    const map: Record<string, string> = {
      'neuf': t('conditionNew'),
      'comme neuf': t('conditionLikeNew'),
      'très bon état': t('conditionVeryGood'),
      'bon état': t('conditionGood'),
      'état moyen': t('conditionFair'),
      'mauvais état': t('conditionPoor'),
    };
    return map[condition.toLowerCase()] ?? condition;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      <div className="relative p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-1 w-8 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
          <h2 className="text-lg font-bold">{t('statusAndProgress')}</h2>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('status')}</label>
            <p className="text-lg font-semibold text-foreground">
              {userGame?.status ? <TranslatedGameStatus status={userGame.status} /> : t('notDefined')}
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('gameCondition')}</label>
            <p className="text-lg font-semibold text-foreground">
              {getConditionLabel(userGame?.condition)}
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('edition')}</label>
            <p className="text-lg font-semibold text-foreground">
              {userGame?.edition === 'autres' && userGame?.edition_other
                ? userGame.edition_other
                : userGame?.edition
                ? editionOptions.find(opt => opt.value === userGame.edition)?.label || userGame.edition
                : tGames('edition.standard')}
            </p>
          </div>
          
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t('progress')}</label>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-foreground">
                {userGame?.completion_percentage ?? 0}%
              </p>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
                  style={{ width: `${userGame?.completion_percentage ?? 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
