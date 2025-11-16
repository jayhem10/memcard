'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Lock, Award } from 'lucide-react';
import { UserAchievement, Achievement } from '@/types/profile';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface AchievementsData {
  unlocked: UserAchievement[];
  locked: UserAchievement[];
  total: number;
  unlockedCount: number;
}

export default function AchievementsPage() {
  const [data, setData] = useState<AchievementsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Récupérer le token d'authentification
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Non authentifié');
        }

        const response = await fetch('/api/achievements', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          credentials: 'include', // Inclure les cookies pour l'authentification
          cache: 'no-store', // Désactiver le cache du navigateur
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Erreur lors du chargement des achievements');
        }

        const achievementsData = await response.json();
        setData(achievementsData);
      } catch (err: any) {
        console.error('Erreur lors du chargement des achievements:', err);
        setError(err.message || 'Erreur lors du chargement des achievements');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAchievements();
  }, []);

  const getDisplayedAchievements = () => {
    if (!data) return [];
    
    // Afficher uniquement les achievements débloqués
    const achievements: UserAchievement[] = data.unlocked;
    
    // Trier les achievements :
    // 1. Par nombre de jeux requis (du plus petit au plus grand)
    // 2. Par ordre alphabétique (nom)
    return achievements.sort((a, b) => {
      const achievementA = a.achievement;
      const achievementB = b.achievement;
      
      if (!achievementA || !achievementB) return 0;
      
      // Extraire le nombre de jeux requis
      const countA = achievementA.requirement_value?.count || 0;
      const countB = achievementB.requirement_value?.count || 0;
      
      // D'abord trier par nombre de jeux (croissant)
      if (countA !== countB) {
        return countA - countB;
      }
      
      // Ensuite trier par ordre alphabétique (nom français ou anglais)
      const nameA = (achievementA.name_fr || achievementA.name_en || '').toLowerCase();
      const nameB = (achievementB.name_fr || achievementB.name_en || '').toLowerCase();
      
      return nameA.localeCompare(nameB, 'fr');
    });
  };

  // Calculer le total des points des achievements débloqués
  const totalPoints = data ? data.unlocked.reduce((total, ua) => {
    const points = ua.achievement?.points || 0;
    return total + points;
  }, 0) : 0;

  const AchievementCard = ({ userAchievement }: { userAchievement: UserAchievement }) => {
    const achievement = userAchievement.achievement;
    if (!achievement) return null;

    const isUnlocked = !!userAchievement.unlocked_at;
    const name = achievement.name_fr || achievement.name_en;
    const description = achievement.description_fr || achievement.description_en;

    return (
      <Card className={`relative overflow-hidden transition-all duration-300 ${
        isUnlocked 
          ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg' 
          : 'opacity-60 border-muted bg-muted/20'
      }`}>
        <div className={`absolute top-0 right-0 w-24 h-24 ${
          isUnlocked ? 'bg-primary/10' : 'bg-muted/20'
        } rounded-full blur-2xl`} />
        
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Icône */}
            <div className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ${
              isUnlocked ? 'ring-2 ring-primary/20' : 'grayscale'
            }`}>
              {achievement.icon_url ? (
                <Image
                  src={achievement.icon_url}
                  alt={name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${
                  isUnlocked ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  {isUnlocked ? (
                    <Trophy className="w-8 h-8 text-primary" />
                  ) : (
                    <Lock className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
              )}
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg mb-1 ${
                    isUnlocked ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {description}
                  </p>
                </div>
                {isUnlocked ? (
                  <Badge variant="default" className="flex-shrink-0">
                    <Award className="w-3 h-3 mr-1" />
                    Débloqué
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex-shrink-0">
                    <Lock className="w-3 h-3 mr-1" />
                    Verrouillé
                  </Badge>
                )}
              </div>

              {/* Métadonnées */}
              <div className="flex items-center justify-between gap-4 mt-3 text-xs text-muted-foreground">
                {achievement.points && (
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    {achievement.points} points
                  </span>
                )}
                {isUnlocked && userAchievement.unlocked_at && (
                  <span>
                    {new Date(userAchievement.unlocked_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const displayedAchievements = getDisplayedAchievements();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-3xl"></div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Succès
            </h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">
            Découvrez vos accomplissements et défiez-vous à en débloquer plus
          </p>
          
          {/* Statistiques */}
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.unlockedCount}</p>
                <p className="text-xs text-muted-foreground">Succès débloqués</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPoints}</p>
                <p className="text-xs text-muted-foreground">Points totaux</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Liste des achievements */}
      {displayedAchievements.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Aucun succès débloqué pour le moment
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayedAchievements.map((userAchievement) => (
            <AchievementCard 
              key={userAchievement.achievement_id || userAchievement.id} 
              userAchievement={userAchievement} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

