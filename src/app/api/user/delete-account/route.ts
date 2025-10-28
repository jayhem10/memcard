import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Récupérer le token d'autorisation depuis les headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token d\'autorisation manquant' },
        { status: 401 }
      );
    }

    // Créer un client Supabase avec le token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );
    
    // Vérifier que l'utilisateur est authentifié
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Erreur d\'authentification:', authError);
      return NextResponse.json(
        { error: `Erreur d'authentification: ${authError.message}` },
        { status: 401 }
      );
    }
    
    if (!user) {
      console.error('Aucun utilisateur trouvé');
      return NextResponse.json(
        { error: 'Aucun utilisateur authentifié' },
        { status: 401 }
      );
    }

    // Récupérer l'ID utilisateur avant suppression
    const userId = user.id;

    // Supprimer les données utilisateur dans l'ordre inverse des dépendances
    // Utilisation de requêtes directes pour éviter les problèmes d'authentification
    const deleteOperations = [
      // 1. Supprimer les tentatives de quiz
      supabase.from('quiz_attempts').delete().eq('user_id', userId),
      
      // 2. Supprimer les récompenses utilisateur
      supabase.from('user_rewards').delete().eq('user_id', userId),
      
      // 3. Supprimer les statistiques utilisateur
      supabase.from('user_stats').delete().eq('user_id', userId),
      
      // 4. Supprimer les jeux de l'utilisateur
      supabase.from('user_games').delete().eq('user_id', userId),
      
      // 5. Supprimer le profil utilisateur
      supabase.from('profiles').delete().eq('id', userId)
    ];

    // Exécuter toutes les suppressions
    const results = await Promise.all(deleteOperations);
    
    // Vérifier s'il y a des erreurs
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Erreurs lors de la suppression:', errors);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression des données' },
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
