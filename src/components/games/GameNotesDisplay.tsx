'use client';

import { useTranslations } from 'next-intl';
import { UserGameData } from '@/types/games';

interface GameNotesDisplayProps {
  userGame?: UserGameData;
}

export function GameNotesDisplay({ userGame }: GameNotesDisplayProps) {
  const t = useTranslations('gameDetails');

  if (!userGame?.notes) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      <div className="relative p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-1 w-8 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
          <label className="text-lg font-bold">{t('personalNotes')}</label>
        </div>
        <p className="text-muted-foreground leading-relaxed p-4 rounded-lg bg-muted/30 border border-border/50">
          {userGame.notes}
        </p>
      </div>
    </div>
  );
}
