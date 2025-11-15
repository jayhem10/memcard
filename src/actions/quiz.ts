'use server';

import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Schéma de validation pour les réponses du quiz
 */
const quizAnswersSchema = z.object({
  answers: z.array(
    z.object({
      question_id: z.string(),
      selected_option: z.number(),
    })
  ).min(1, 'Au moins une réponse est requise'),
});

/**
 * Server Action pour soumettre les réponses du quiz
 * 
 * @param answers - Tableau des réponses du quiz
 * @returns L'ID du rang calculé pour l'utilisateur
 */
export async function submitQuiz(answers: Array<{ question_id: string; selected_option: number }>) {
  // Validation avec Zod
  const validatedData = quizAnswersSchema.parse({ answers });

  // Récupérer le client Supabase serveur
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: any) {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );
  
  // Récupérer l'utilisateur authentifié
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Non authentifié');
  }

  const userId = user.id;

  // Préparer les réponses avec le user_id de l'utilisateur authentifié
  // La colonne selected_option est de type TEXT dans la table
  const answersWithUserId = validatedData.answers.map((answer) => ({
    user_id: userId,
    question_id: answer.question_id,
    selected_option: answer.selected_option.toString(), // Convertir en string car la colonne est TEXT
  }));

  // Utiliser le client admin pour insérer les réponses (contourne RLS)
  const { error: answersError } = await supabaseAdmin
    .from('user_quiz_answers')
    .upsert(answersWithUserId, { 
      onConflict: 'user_id,question_id',
      ignoreDuplicates: false
    });
  
  if (answersError) {
    console.error('Error saving quiz answers:', answersError);
    throw new Error(
      answersError.message || 'Erreur lors de la sauvegarde des réponses'
    );
  }

  // Appeler la fonction calculate_user_rank avec le client admin
  const { data: rankId, error: rankError } = await supabaseAdmin
    .rpc('calculate_user_rank', { p_user_id: userId });

  if (rankError) {
    console.error('Error calculating rank:', rankError);
    throw new Error(
      rankError.message || 'Erreur lors du calcul du rang'
    );
  }

  if (!rankId) {
    throw new Error('Aucun rang retourné');
  }

  return { rankId: String(rankId) };
}

