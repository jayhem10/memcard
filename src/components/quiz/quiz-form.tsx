'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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
      'errorFetchingQuizQuestions': 'Erreur lors de la récupération des questions du quiz',
      'errorSubmittingQuiz': 'Erreur lors de la soumission du quiz',
      'quizCompleted': 'Quiz terminé',
      'yourRankHasBeenDetermined': 'Votre rang a été déterminé',
      'continueToProfile': 'Continuer vers le profil',
      'noQuestionsAvailable': 'Aucune question disponible',
      'question': 'Question',
      'finish': 'Terminer',
      'next': 'Suivant'
    };
    return translations[key] || key;
  },
  i18n: { language: 'fr' }
});
import { Rank } from '@/types/profile';
import { Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizQuestion {
  id: string;
  question_en: string;
  question_fr: string;
  options: {
    id: number;
    text_en: string;
    text_fr: string;
    points: Record<string, number>;
  }[];
}

export default function QuizForm() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const currentLang = i18n.language || 'en';
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRank, setUserRank] = useState<Rank | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    // Vérifier d'abord si l'utilisateur a déjà complété le quiz
    const checkQuizStatus = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          // Si pas d'utilisateur, charger quand même les questions
          fetchQuizQuestions();
          return;
        }
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('quiz_completed, rank_id')
          .eq('id', userData.user.id)
          .single();
          
        if (profileData?.quiz_completed) {
          // Si le quiz est déjà complété, rediriger vers la page de profil
          router.push('/profile');
        } else {
          // Si le quiz n'est pas complété, charger les questions
          fetchQuizQuestions();
        }
      } catch (error) {
        console.error('Error checking quiz status:', error);
        // En cas d'erreur, charger quand même les questions
        fetchQuizQuestions();
      }
    };
    
    checkQuizStatus();
  }, [router]);

  const fetchQuizQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*');
      
      if (error) throw error;
      
      // Conversion sûre des données
      const typedQuestions: QuizQuestion[] = (data || []).map(item => ({
        id: String(item.id),
        question_en: String(item.question_en),
        question_fr: String(item.question_fr),
        options: Array.isArray(item.options) 
          ? item.options.map((opt: any) => ({
              id: Number(opt.id),
              text_en: String(opt.text_en),
              text_fr: String(opt.text_fr),
              points: opt.points as Record<string, number>
            }))
          : []
      }));
      setQuestions(typedQuestions);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
      toast({
        title: t('error'),
        description: t('errorFetchingQuizQuestions'),
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setSelectedOptions({
      ...selectedOptions,
      [questionId]: optionId,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    
    try {
      // First, get the current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      const userId = userData.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Then, save all user answers
      const answers = Object.entries(selectedOptions).map(([questionId, optionId]) => ({
        user_id: userId,
        question_id: questionId,
        selected_option: optionId,
      }));
      
      // Utiliser upsert avec onConflict pour gérer la contrainte d'unicité
      const { error: answersError } = await supabase
        .from('user_quiz_answers')
        .upsert(answers, { 
          onConflict: 'user_id,question_id',
          ignoreDuplicates: false // Mettre à jour les entrées existantes
        });
      
      if (answersError) throw answersError;
      
      // Call the calculate_user_rank function
      const { data: rankData, error: rankError } = await supabase
        .rpc('calculate_user_rank', { p_user_id: userId });
      
      if (rankError) throw rankError;
      
      // Vérifier et convertir rankData en string pour l'utiliser comme ID
      const rankId = rankData ? String(rankData) : null;
      
      if (!rankId) {
        throw new Error('Failed to calculate user rank');
      }
      
      // Fetch the rank details
      const { data: rankDetails, error: rankDetailsError } = await supabase
        .from('ranks')
        .select('*')
        .eq('id', rankId)
        .single();
      
      if (rankDetailsError) throw rankDetailsError;
      
      // Conversion sûre des données de rang
      if (rankDetails) {
        const typedRank: Rank = {
          id: String(rankDetails.id),
          name_en: String(rankDetails.name_en),
          name_fr: String(rankDetails.name_fr),
          description_en: rankDetails.description_en ? String(rankDetails.description_en) : null,
          description_fr: rankDetails.description_fr ? String(rankDetails.description_fr) : null,
          level: Number(rankDetails.level),
          icon_url: rankDetails.icon_url ? String(rankDetails.icon_url) : null,
          created_at: String(rankDetails.created_at)
        };
        setUserRank(typedRank);
      }
      setShowResult(true);
      
      // Check for new achievements
      await supabase.rpc('check_achievements', { p_user_id: userId });
      
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: t('error'),
        description: t('errorSubmittingQuiz'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    // Rediriger vers la page de profil avec un rafraîchissement pour s'assurer que les données sont à jour
    router.push('/profile');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showResult && userRank) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('quizCompleted')}</CardTitle>
            <CardDescription>{t('yourRankHasBeenDetermined')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6 py-6">
            {userRank.icon_url && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                <img 
                  src={userRank.icon_url} 
                  alt={currentLang === 'fr' ? userRank.name_fr : userRank.name_en} 
                  className="w-32 h-32 object-contain"
                />
              </motion.div>
            )}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <h3 className="text-2xl font-bold mb-2">
                {currentLang === 'fr' ? userRank.name_fr : userRank.name_en}
              </h3>
              <p className="text-muted-foreground">
                {currentLang === 'fr' ? userRank.description_fr : userRank.description_en}
              </p>
            </motion.div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleFinish}>{t('continueToProfile')}</Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  if (!currentQuestion) {
    return (
      <div className="text-center p-4">
        <p>{t('noQuestionsAvailable')}</p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentQuestionIndex}
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -50, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>
              {t('question')} {currentQuestionIndex + 1} / {questions.length}
            </CardTitle>
            <CardDescription>
              {currentLang === 'fr' ? currentQuestion.question_fr : currentQuestion.question_en}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedOptions[currentQuestion.id]}
              onValueChange={(value) => handleOptionSelect(currentQuestion.id, value)}
              className="space-y-4"
            >
              {currentQuestion.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent">
                  <RadioGroupItem value={option.id.toString()} id={`option-${option.id}`} />
                  <Label htmlFor={`option-${option.id}`} className="flex-1 cursor-pointer">
                    {currentLang === 'fr' ? option.text_fr : option.text_en}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex-1"></div>
            <Button 
              onClick={handleNext}
              disabled={!selectedOptions[currentQuestion.id] || isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {isLastQuestion ? t('finish') : t('next')}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
