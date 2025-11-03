import { withApi, ApiError } from '@/lib/api-wrapper';
import { validateBody } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export const POST = withApi(async (request, { user }) => {
  const body = await request.json();

  // Validation
  validateBody<{ answers: Array<{ question_id: string; selected_option: number }> }>(body, ['answers']);

  const { answers } = body;

  if (!Array.isArray(answers) || answers.length === 0) {
    throw new ApiError('Les réponses sont requises et doivent être un tableau non vide', 400);
    }

  // Utiliser l'ID de l'utilisateur authentifié
    const userId = user.id;

    // Préparer les réponses avec le user_id de l'utilisateur authentifié
    // La colonne selected_option est de type TEXT dans la table
    const answersWithUserId = answers.map((answer: { question_id: string; selected_option: number }) => ({
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
    throw new ApiError(
      answersError.message || 'Erreur lors de la sauvegarde des réponses',
      500
      );
    }

    // Appeler la fonction calculate_user_rank avec le client admin
    const { data: rankId, error: rankError } = await supabaseAdmin
      .rpc('calculate_user_rank', { p_user_id: userId });

    if (rankError) {
      console.error('Error calculating rank:', rankError);
    throw new ApiError(
      rankError.message || 'Erreur lors du calcul du rang',
      500
      );
    }

    if (!rankId) {
    throw new ApiError('Aucun rang retourné', 500);
    }

    // Vérifier les achievements
    await supabaseAdmin.rpc('check_achievements', { p_user_id: userId });

  return { rankId: String(rankId) };
});

