'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Composants Tabs simplifiés (à remplacer par vos propres composants UI)
const Tabs = ({ children, defaultValue, value, onValueChange, className }: any) => (
  <div className={className}>{children}</div>
);
const TabsList = ({ children }: any) => <div className="flex space-x-2 mb-4">{children}</div>;
const TabsTrigger = ({ children, value, onClick }: any) => (
  <button 
    className="px-4 py-2 rounded-md bg-muted hover:bg-muted-foreground/10" 
    onClick={() => onClick?.(value)}
  >
    {children}
  </button>
);
const TabsContent = ({ children, value }: any) => <div>{children}</div>;

// Toast simplifié
const useToast = () => ({
  toast: ({ title, description, variant }: { title: string; description: string; variant: string }) => {
    console.error(`${title}: ${description}`);
  }
});

// i18n simplifié
const useTranslation = () => ({
  t: (key: string) => {
    const translations: Record<string, string> = {
      'error': 'Erreur',
      'errorFetchingAchievements': 'Erreur lors de la récupération des récompenses',
      'achievements': 'Récompenses',
      'achievementsDescription': 'Débloquez des récompenses en fonction de votre collection de jeux',
      'all': 'Tous',
      'unlocked': 'Débloqués',
      'locked': 'À débloquer',
      'noAchievementsUnlocked': 'Aucune récompense débloquée pour le moment'
    };
    return translations[key] || key;
  },
  i18n: { language: 'fr' }
});
import { Achievement, UserAchievement } from '@/types/profile';
import { Loader2, Lock, Award } from 'lucide-react';
import { motion } from 'framer-motion';

interface AchievementItemProps {
  achievement: Achievement;
  isUnlocked: boolean;
  unlockedAt?: string;
  isNew?: boolean;
}

const AchievementItem = ({ achievement, isUnlocked, unlockedAt, isNew = false }: AchievementItemProps) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  
  return (
    <motion.div
      initial={isNew ? { scale: 0.8, opacity: 0 } : { opacity: 1 }}
      animate={isNew ? { scale: 1, opacity: 1 } : { opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`relative ${isUnlocked ? 'opacity-100' : 'opacity-60'}`}
    >
      <Card className={`overflow-hidden ${isNew ? 'border-primary' : ''}`}>
        <div className="flex p-4 gap-4">
          <div className="relative flex-shrink-0">
            {achievement.icon_url ? (
              <img 
                src={achievement.icon_url} 
                alt={currentLang === 'fr' ? achievement.name_fr : achievement.name_en}
                className="w-16 h-16 object-contain rounded-md"
              />
            ) : (
              <div className="w-16 h-16 bg-muted flex items-center justify-center rounded-md">
                <Award className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            {!isUnlocked && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-md">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              {currentLang === 'fr' ? achievement.name_fr : achievement.name_en}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentLang === 'fr' ? achievement.description_fr : achievement.description_en}
            </p>
            {isUnlocked && unlockedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(unlockedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          {isNew && (
            <Badge variant="default" className="absolute top-2 right-2">
              New
            </Badge>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default function AchievementsList() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setIsLoading(true);
      
      // Get user ID - Optimisé pour éviter les appels redondants
      let userId: string | undefined;
      const session = await supabase.auth.getSession();
      
      if (session.data.session) {
        userId = session.data.session.user.id;
      } else {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        userId = userData.user?.id;
      }
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Fetch all achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('category', { ascending: true });
      
      if (achievementsError) throw achievementsError;
      
      // Fetch user's unlocked achievements
      const { data: userAchievementsData, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('id, user_id, achievement_id, unlocked_at')
        .eq('user_id', userId);
      
      if (userAchievementsError) throw userAchievementsError;
      
      // Conversion sûre des données
      const typedAchievements: Achievement[] = (achievementsData || []).map(item => ({
        id: String(item.id),
        name_en: String(item.name_en),
        name_fr: String(item.name_fr),
        description_en: String(item.description_en),
        description_fr: String(item.description_fr),
        category: String(item.category),
        requirement_type: String(item.requirement_type),
        requirement_value: item.requirement_value as Record<string, any>,
        icon_url: item.icon_url ? String(item.icon_url) : null,
        created_at: String(item.created_at)
      }));
      
      const typedUserAchievements: UserAchievement[] = (userAchievementsData || []).map(item => ({
        id: String(item.id),
        user_id: String(item.user_id),
        achievement_id: String(item.achievement_id),
        unlocked_at: String(item.unlocked_at)
      }));
      
      // Check for newly unlocked achievements (unlocked in the last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const newUnlocked: string[] = typedUserAchievements
        .filter(ua => new Date(ua.unlocked_at) > oneDayAgo)
        .map(ua => ua.achievement_id);
      
      setAchievements(typedAchievements);
      setUserAchievements(typedUserAchievements);
      setNewlyUnlocked(newUnlocked);
      
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast({
        title: t('error'),
        description: t('errorFetchingAchievements'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isAchievementUnlocked = (achievementId: string) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const getUnlockedAt = (achievementId: string) => {
    const userAchievement = userAchievements.find(ua => ua.achievement_id === achievementId);
    return userAchievement?.unlocked_at;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const unlockedAchievements = achievements.filter(a => isAchievementUnlocked(a.id));
  const lockedAchievements = achievements.filter(a => !isAchievementUnlocked(a.id));

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('achievements')}</CardTitle>
          <CardDescription>
            {t('achievementsDescription')}
          </CardDescription>
          <div className="flex justify-between items-center">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                <TabsTrigger value="all">{t('all')} ({achievements.length})</TabsTrigger>
                <TabsTrigger value="unlocked">{t('unlocked')} ({unlockedAchievements.length})</TabsTrigger>
                <TabsTrigger value="locked">{t('locked')} ({lockedAchievements.length})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <TabsContent value="all" className="space-y-4 mt-0">
              {achievements.map(achievement => (
                <AchievementItem 
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={isAchievementUnlocked(achievement.id)}
                  unlockedAt={getUnlockedAt(achievement.id)}
                  isNew={newlyUnlocked.includes(achievement.id)}
                />
              ))}
            </TabsContent>
            
            <TabsContent value="unlocked" className="space-y-4 mt-0">
              {unlockedAchievements.length > 0 ? (
                unlockedAchievements.map(achievement => (
                  <AchievementItem 
                    key={achievement.id}
                    achievement={achievement}
                    isUnlocked={true}
                    unlockedAt={getUnlockedAt(achievement.id)}
                    isNew={newlyUnlocked.includes(achievement.id)}
                  />
                ))
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  {t('noAchievementsUnlocked')}
                </p>
              )}
            </TabsContent>
            
            <TabsContent value="locked" className="space-y-4 mt-0">
              {lockedAchievements.map(achievement => (
                <AchievementItem 
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={false}
                />
              ))}
            </TabsContent>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
