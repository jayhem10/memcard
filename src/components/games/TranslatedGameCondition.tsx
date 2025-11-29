'use client';

import { useTranslations } from 'next-intl';

interface TranslatedGameConditionProps {
  condition: string | null;
  className?: string;
}

/**
 * Composant qui affiche la condition d'un jeu avec traduction
 */
export function TranslatedGameCondition({ condition, className = '' }: TranslatedGameConditionProps) {
  const t = useTranslations('gameDetails');

  if (!condition) {
    return null;
  }

  const conditionTranslations: Record<string, string> = {
    'neuf': t('conditionNew'),
    'comme neuf': t('conditionLikeNew'),
    'très bon état': t('conditionVeryGood'),
    'bon état': t('conditionGood'),
    'état moyen': t('conditionFair'),
    'mauvais état': t('conditionPoor'),
  };

  const translatedCondition = conditionTranslations[condition] || condition;

  return (
    <span className={className}>
      {translatedCondition}
    </span>
  );
}
