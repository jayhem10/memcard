'use client';

import { UserGameData } from '@/types/games';
import { Calendar, Edit, CheckCircle2 } from 'lucide-react';

interface GameRecentActivitiesProps {
  userGame: UserGameData | undefined;
}

export function GameRecentActivities({ userGame }: GameRecentActivitiesProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      <div className="relative p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-1 w-8 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
          <h3 className="text-lg font-bold">Activités récentes</h3>
        </div>
        
        <div className="space-y-4">
        {userGame ? (
          <>
              <div className="relative pl-4 border-l-2 border-primary/50 group hover:border-primary transition-colors">
                <div className="absolute -left-2 top-1 w-3 h-3 rounded-full bg-primary ring-2 ring-background" />
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Ajouté à votre collection</p>
                    <p className="text-muted-foreground text-xs mt-1">
                {userGame.created_at 
                        ? new Date(userGame.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })
                  : 'Date non disponible'}
              </p>
            </div>
                </div>
              </div>
              
            {userGame.updated_at && userGame.updated_at !== userGame.created_at && (
                <div className="relative pl-4 border-l-2 border-blue-500/50 group hover:border-blue-500 transition-colors">
                  <div className="absolute -left-2 top-1 w-3 h-3 rounded-full bg-blue-500 ring-2 ring-background" />
                  <div className="flex items-start gap-3">
                    <Edit className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Dernière modification</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        {new Date(userGame.updated_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                </p>
                    </div>
                  </div>
              </div>
            )}
              
            {userGame.status === 'COMPLETED' && (
                <div className="relative pl-4 border-l-2 border-green-500/50 group hover:border-green-500 transition-colors">
                  <div className="absolute -left-2 top-1 w-3 h-3 rounded-full bg-green-500 ring-2 ring-background" />
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Terminé</p>
                      <p className="text-muted-foreground text-xs mt-1">
                  {userGame.completion_percentage ?? 0}% complété
                </p>
                    </div>
                  </div>
              </div>
            )}
          </>
        ) : (
            <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Aucune activité enregistrée</p>
            </div>
        )}
        </div>
      </div>
    </div>
  );
}

