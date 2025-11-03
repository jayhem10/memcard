'use client';

import { UserGameData } from '@/types/games';

interface GameRecentActivitiesProps {
  userGame: UserGameData | undefined;
}

export function GameRecentActivities({ userGame }: GameRecentActivitiesProps) {
  return (
    <div className="bg-card p-4 rounded-lg shadow-sm">
      <h3 className="font-semibold border-b pb-2">Activités récentes</h3>
      <div className="mt-3 space-y-3">
        {userGame ? (
          <>
            <div className="text-sm border-l-2 border-primary pl-3 py-1">
              <p className="font-medium">Ajouté à votre collection</p>
              <p className="text-muted-foreground text-xs">
                {userGame.created_at 
                  ? new Date(userGame.created_at).toLocaleDateString() 
                  : 'Date non disponible'}
              </p>
            </div>
            {userGame.updated_at && userGame.updated_at !== userGame.created_at && (
              <div className="text-sm border-l-2 border-blue-500 pl-3 py-1">
                <p className="font-medium">Dernière modification</p>
                <p className="text-muted-foreground text-xs">
                  {new Date(userGame.updated_at).toLocaleDateString()}
                </p>
              </div>
            )}
            {userGame.status === 'COMPLETED' && (
              <div className="text-sm border-l-2 border-green-500 pl-3 py-1">
                <p className="font-medium">Terminé</p>
                <p className="text-muted-foreground text-xs">
                  {userGame.completion_percentage ?? 0}% complété
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Aucune activité enregistrée</p>
        )}
      </div>
    </div>
  );
}

