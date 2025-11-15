'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Award, ArrowRight } from 'lucide-react';
import { useProfile } from '@/store';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';

export default function UserRank() {
  const router = useRouter();
  const { profile, isLoading: profileLoading, fetchProfile } = useProfile();
  const { user } = useAuth();
  
  const [rankName, setRankName] = useState<string>('');
  const [rankDescription, setRankDescription] = useState<string>('');
  const [rankIcon, setRankIcon] = useState<string | null>(null);

  useEffect(() => {
    // Charger le profil si nécessaire
    if (!profile && user) {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Ne dépendre que de user.id pour éviter les boucles infinies

  useEffect(() => {
    // Charger les détails du rang si on a un rank_id
    async function loadRankDetails() {
      if (!profile?.rank_id) {
        setRankName('');
        setRankDescription('');
        setRankIcon(null);
        return;
      }

      try {
        const { data: rankData, error } = await supabase
          .from('ranks')
          .select('name_fr, description_fr, icon_url')
          .eq('id', profile.rank_id)
          .single();

        if (error) {
          console.error('Error fetching rank details:', error);
          return;
        }

        if (rankData) {
          setRankName(rankData.name_fr ? String(rankData.name_fr) : '');
          setRankDescription(rankData.description_fr ? String(rankData.description_fr) : '');
          setRankIcon(rankData.icon_url ? String(rankData.icon_url) : null);
        }
      } catch (error) {
        console.error('Error loading rank details:', error);
      }
    }

    loadRankDetails();
  }, [profile?.rank_id]);

  const handleStartQuiz = () => {
    router.push('/quiz');
  };

  const isLoading = profileLoading;
  const hasQuizCompleted = profile?.quiz_completed ?? false;

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
