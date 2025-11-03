import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
      // 1. Supprimer les réponses de quiz de l'utilisateur
      { name: 'user_quiz_answers', operation: supabase.from('user_quiz_answers').delete().eq('user_id', userId) },
      
      // 2. Supprimer les achievements de l'utilisateur
      { name: 'user_achievements', operation: supabase.from('user_achievements').delete().eq('user_id', userId) },
      
      // 3. Supprimer les jeux de l'utilisateur
      { name: 'user_games', operation: supabase.from('user_games').delete().eq('user_id', userId) },
      
      // 4. Supprimer le profil utilisateur
      { name: 'profiles', operation: supabase.from('profiles').delete().eq('id', userId) }
    ];

    // Exécuter toutes les suppressions
    console.log('Executing delete operations...');
    const results = await Promise.all(deleteOperations.map(op => op.operation));
    
    // Vérifier s'il y a des erreurs
    const errors = results.filter((result, index) => {
      if (result.error) {
        console.error(`Error deleting ${deleteOperations[index].name}:`, result.error);
        return true;
      }
      return false;
    });
    
    if (errors.length > 0) {
      console.error('Erreurs lors de la suppression:', errors);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression des données' },
        { status: 500 }
      );
    }
    
    console.log('All data deleted successfully');

    // Supprimer l'utilisateur de auth.users via l'API Admin avec la clé de service
    try {
      const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      
      const { error: deleteUserError } = await adminSupabase.auth.admin.deleteUser(userId);
      if (deleteUserError) {
        console.error('Erreur lors de la suppression de l\'utilisateur auth:', deleteUserError);
        // Ne pas faire échouer la requête car les données sont déjà supprimées
      } else {
        console.log('User deleted from auth.users');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression auth:', error);
    }

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
