'use client';

import { useTranslations } from 'next-intl';
import { getStatusLabels } from '@/types/games';

interface TranslatedGameStatusProps {
  status: string | null;
  className?: string;
  showAsBadge?: boolean;
}

/**
 * Composant qui affiche le statut d'un jeu avec traduction
 */
export function TranslatedGameStatus({
  status,
  className = '',
  showAsBadge = false
}: TranslatedGameStatusProps) {
  const t = useTranslations('games');

  if (!status || status === '0') {
    return null;
  }

  // Utiliser directement les clés de traduction sans passer par getStatusLabels
  // car on est déjà dans le namespace 'games'
  const statusMap: Record<string, string> = {
    NOT_STARTED: t('status.notStarted'),
    IN_PROGRESS: t('status.inProgress'),
    COMPLETED: t('status.completed'),
    DROPPED: t('status.dropped'),
    WISHLIST: t('status.wishlist'),
  };
  
  const translatedStatus = (status && status in statusMap) ? statusMap[status] : status;

  if (showAsBadge) {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary ${className}`}>
        {translatedStatus}
      </span>
    );
  }

  return (
    <span className={className}>
      {translatedStatus}
    </span>
  );
}
