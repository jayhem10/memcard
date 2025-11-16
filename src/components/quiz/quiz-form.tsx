'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Rank } from '@/types/profile';
import { Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useProfile } from '@/store';
import { useAuth } from '@/context/auth-context';
import { handleErrorSilently } from '@/lib/error-handler';

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
  const router = useRouter();
  const { fetchProfile, resetProfile, profile } = useProfile();
  const { user } = useAuth();
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRank, setUserRank] = useState<Rank | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    // Charger le profil si nécessaire
    if (!profile && user) {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Ne dépendre que de user.id pour éviter les boucles infinies

  useEffect(() => {
    // Ne pas vérifier le statut si on affiche déjà le résultat (utilisateur vient de terminer le quiz)
    if (showResult) {
      return;
    }
    
    // Vérifier d'abord si l'utilisateur a déjà complété le quiz
    const checkQuizStatus = async () => {
      try {
        if (!user) {
          // Si pas d'utilisateur, charger quand même les questions
          fetchQuizQuestions();
          return;
        }
        
        // Utiliser le profil depuis le store si disponible
        if (profile?.quiz_completed) {
          // Si le quiz est déjà complété, rediriger vers la page de profil
          router.push('/profile');
        } else {
          // Si le quiz n'est pas complété, charger les questions
          fetchQuizQuestions();
        }
      } catch (error) {
        handleErrorSilently(error, 'QuizForm - checkQuizStatus');
        // En cas d'erreur, charger quand même les questions
        fetchQuizQuestions();
      }
    };
    
    // Attendre que le profil soit chargé avant de vérifier le statut
    if (user && profile !== undefined) {
      checkQuizStatus();
    } else if (!user) {
      // Si pas d'utilisateur, charger directement les questions
      fetchQuizQuestions();
    }
  }, [router, user, profile, showResult]);

  const fetchQuizQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        // .returns<Array<{ id: string; question_en: string; question_fr: string; options: Array<{ id: number; text_en: string; text_fr: string }> }>>();
      
      if (error) {
        handleErrorSilently(error, 'QuizForm - fetchQuizQuestions');
        toast.error('Erreur lors de la récupération des questions du quiz');
        setIsLoading(false);
        return;
      }
      
      // Conversion sûre des données
      const typedQuestions: QuizQuestion[] = (data || []).map((item: any) => ({
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
      handleErrorSilently(error, 'QuizForm - fetchQuizQuestions catch');
      toast.error('Erreur lors de la récupération des questions du quiz');
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
      // Utiliser l'utilisateur depuis le contexte
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Convertir les réponses pour la Server Action
      // Convertir optionId en nombre car la fonction SQL attend un entier
      const answers = Object.entries(selectedOptions).map(([questionId, optionId]) => ({
        question_id: questionId,
        selected_option: parseInt(optionId, 10), // Convertir en nombre
      }));
      
      // Utiliser la Server Action au lieu de l'API Route
      const { submitQuiz } = await import('@/actions/quiz');
      const { rankId: rankIdFromApi } = await submitQuiz(answers);
      
      // Vérifier et convertir rankId en string pour l'utiliser comme ID
      const rankId = rankIdFromApi ? String(rankIdFromApi) : null;
      
      if (!rankId) {
        throw new Error('Échec du calcul du rang. Aucun rang retourné.');
      }
      
      // Fetch the rank details
      const { data: rankDetails, error: rankDetailsError } = await supabase
        .from('ranks')
        .select('*')
        .eq('id', rankId)
        .single();
      
      if (rankDetailsError) {
        handleErrorSilently(rankDetailsError, 'QuizForm - fetch rank details');
        throw rankDetailsError;
      }
      
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
        setShowResult(true);
        
        // Rafraîchir le profil pour mettre à jour le store (forcer le rechargement)
        resetProfile(); // Réinitialiser le cache
        await fetchProfile(true); // Forcer le rechargement
        
        toast.success('Quiz terminé avec succès ! Votre rang a été déterminé.');
      } else {
        throw new Error('Aucun détail de rang trouvé');
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la soumission du quiz';
      handleErrorSilently(error, 'QuizForm - submitQuiz');
      toast.error(errorMessage);
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
            <CardTitle className="text-2xl">Quiz terminé</CardTitle>
            <CardDescription>Votre rang a été déterminé</CardDescription>
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
                  alt={userRank.name_fr} 
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
                {userRank.name_fr}
              </h3>
              <p className="text-muted-foreground">
                {userRank.description_fr}
              </p>
            </motion.div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={handleFinish}>Continuer vers le profil</Button>
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
        <p>Aucune question disponible</p>
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
              Question {currentQuestionIndex + 1} / {questions.length}
            </CardTitle>
            <CardDescription>
              {currentQuestion.question_fr}
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
                    {option.text_fr}
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
                  {isLastQuestion ? 'Terminer' : 'Suivant'}
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
