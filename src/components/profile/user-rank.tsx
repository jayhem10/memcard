'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Import toast from your UI library
// If you're using shadcn/ui, you might need to create these components
const useToast = () => ({
  toast: ({ title, description, variant }: { title: string; description: string; variant: string }) => {
    console.error(`${title}: ${description}`);
  }
});

// Mock translation function until you set up i18n
const useTranslation = () => ({
  t: (key: string) => {
    const translations: Record<string, string> = {
      'error': 'Erreur',
      'errorFetchingProfile': 'Erreur lors de la récupération du profil',
      'errorFetchingRankDetails': 'Erreur lors de la récupération des détails du rang',
      'discoverYourRank': 'Découvrez votre rang',
      'completeQuizToGetRank': 'Complétez le quiz pour obtenir votre rang de joueur',
      'startQuiz': 'Commencer le quiz',
      'yourRank': 'Votre rang',
      'yourGameProfileRank': 'Votre rang de profil de joueur'
    };
    return translations[key] || key;
  },
  i18n: { language: 'fr' }
});
import { Profile, Rank } from '@/types/profile';
import { Loader2, Award, ArrowRight } from 'lucide-react';

export default function UserRank() {
  const router = useRouter();
  
  const [hasQuizCompleted, setHasQuizCompleted] = useState<boolean>(false);
  const [rankName, setRankName] = useState<string>('');
  const [rankDescription, setRankDescription] = useState<string>('');
  const [rankIcon, setRankIcon] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkUserRank() {
      try {
        setIsLoading(true);
        
        // Get current user
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        
        // Get profile data with rank information in one query
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`
            quiz_completed,
            rank_id,
            ranks (
              name_fr,
              description_fr,
              icon_url
            )
          `)
          .eq('id', userData.user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return;
        }
        
        setHasQuizCompleted(!!profileData.quiz_completed);
        
        // Set rank data if available
        if (profileData.ranks) {
          const rankData = profileData.ranks as any;
          setRankName(rankData.name_fr ? String(rankData.name_fr) : '');
          setRankDescription(rankData.description_fr ? String(rankData.description_fr) : '');
          setRankIcon(rankData.icon_url ? String(rankData.icon_url) : null);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkUserRank();
  }, []);

  const handleStartQuiz = () => {
    router.push('/quiz');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!hasQuizCompleted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Découvrez votre rang</CardTitle>
          <CardDescription>
            Complétez le quiz pour obtenir votre rang de joueur
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <Award className="h-16 w-16 text-muted-foreground" />
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleStartQuiz} className="flex items-center gap-2">
            Commencer le quiz
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Votre rang</CardTitle>
        <CardDescription>
          Votre rang de profil de joueur
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4 py-4">
        {rankIcon && (
          <img 
            src={rankIcon} 
            alt={rankName} 
            className="w-24 h-24 object-contain"
          />
        )}
        <div className="text-center">
          <h3 className="text-xl font-bold mb-1">
            {rankName}
          </h3>
          <p className="text-sm text-muted-foreground">
            {rankDescription}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
