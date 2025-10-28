import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Vérifier que l'utilisateur est authentifié
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer l'ID utilisateur avant suppression
    const userId = user.id;

    // Supprimer les données utilisateur directement avec l'ID
    const { error: deleteError } = await supabase.rpc('delete_user_data', {
      user_id: userId
    });

    if (deleteError) {
      console.error('Erreur lors de la suppression du compte:', deleteError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du compte' },
        { status: 500 }
      );
    }

    // Déconnexion de l'utilisateur après suppression des données
    await supabase.auth.signOut();

    return NextResponse.json(
      { message: 'Compte supprimé avec succès' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur inattendue lors de la suppression:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
