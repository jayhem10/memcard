import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { userId, answers } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId requis' },
        { status: 400 }
      );
    }

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: 'Les réponses sont requises' },
        { status: 400 }
      );
    }

    // Préparer les réponses avec le user_id
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
      return NextResponse.json(
        { error: answersError.message || 'Erreur lors de la sauvegarde des réponses' },
        { status: 500 }
      );
    }

    // Appeler la fonction calculate_user_rank avec le client admin
    const { data: rankId, error: rankError } = await supabaseAdmin
      .rpc('calculate_user_rank', { p_user_id: userId });

    if (rankError) {
      console.error('Error calculating rank:', rankError);
      return NextResponse.json(
        { error: rankError.message || 'Erreur lors du calcul du rang' },
        { status: 500 }
      );
    }

    if (!rankId) {
      return NextResponse.json(
        { error: 'Aucun rang retourné' },
        { status: 500 }
      );
    }

    // Vérifier les achievements
    await supabaseAdmin.rpc('check_achievements', { p_user_id: userId });

    return NextResponse.json({ rankId: String(rankId) });
  } catch (error: any) {
    console.error('Error in quiz submit API:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

