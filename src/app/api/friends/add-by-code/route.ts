import { withApi, ApiError } from '@/lib/api-wrapper';
import { NextRequest } from 'next/server';

export const POST = withApi(async (request: NextRequest, { user, supabase }) => {
  if (!user || !supabase) {
    throw new ApiError('Non authentifié', 401);
  }


  const { friendCode } = await request.json();

  if (!friendCode || typeof friendCode !== 'string') {
    throw new ApiError('Code ami requis', 400);
  }

  const normalizedCode = friendCode.trim().toUpperCase();

  if (normalizedCode.length !== 8) {
    throw new ApiError('Le code ami doit contenir 8 caractères', 400);
  }

  // Trouver l'utilisateur avec ce code ami (les profils sont lisibles par tous les utilisateurs authentifiés)
  const { data: friendProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('friend_code', normalizedCode)
    .single();

  if (profileError || !friendProfile) {
    throw new ApiError('INVALID_FRIEND_CODE', 404);
  }

  // Vérifier que ce n'est pas l'utilisateur lui-même
  if (friendProfile.id === user.id) {
    throw new ApiError('CANNOT_ADD_YOURSELF', 400);
  }

  // Vérifier si ils sont déjà amis en utilisant la fonction RPC sécurisée
  const { data: existingFriendship, error: friendCheckError } = await supabase
    .rpc('are_users_friends', {
      p_user_id: user.id,
      p_friend_id: friendProfile.id
    });

  if (friendCheckError) {
    console.error('Erreur lors de la vérification d\'amitié:', friendCheckError);
    throw new ApiError('Erreur lors de la vérification', 500);
  }

  if (existingFriendship) {
    throw new ApiError('ALREADY_FRIENDS', 400);
  }

  // Créer seulement une relation (user -> friend) - les fonctions RPC gèrent la bidirectionnalité
  // Cela évite les problèmes RLS complexes avec les relations bidirectionnelles

  const { error: insertError } = await supabase
    .from('user_friends')
    .insert([
      { user_id: user.id, friend_id: friendProfile.id }
    ]);

  if (insertError) {
    console.error('Erreur lors de l\'ajout d\'ami:', {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint
    });

    // Gérer les erreurs de contrainte unique (si quelqu'un d'autre a ajouté entre temps)
    if (insertError.code === '23505') {
      throw new ApiError('ALREADY_FRIENDS', 400);
    }

    // Gérer les erreurs de clé étrangère (utilisateur n'existe pas)
    if (insertError.code === '23503') {
      throw new ApiError('USER_NOT_FOUND', 404);
    }

    throw new ApiError(`Erreur lors de l'ajout de l'ami: ${insertError.message}`, 500);
  }

  // Créer une notification pour l'utilisateur ajouté via RPC sécurisée
  try {
    console.log('Création notification ami:', {
      user_id: friendProfile.id, // L'utilisateur qui reçoit la notification
      type: 'friend',
      friend_id: user.id, // L'utilisateur qui a ajouté
      friend_username: friendProfile.username
    });

    // Utiliser une fonction RPC qui gère la création côté serveur
    const { error: notificationError } = await supabase
      .rpc('create_friend_notification', {
        friend_user_id: friendProfile.id,
        adder_user_id: user.id
      });

    if (notificationError) {
      console.error('Erreur lors de la création de la notification ami:', notificationError);
      // Ne pas échouer l'ajout d'ami si la notification échoue
    } else {
      console.log('Notification ami créée avec succès via RPC');
    }
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    // Ne pas échouer l'ajout d'ami si la notification échoue
  }

  return {
    success: true,
    message: `${friendProfile.username} ajouté à vos amis !`,
    friendId: friendProfile.id,
    addedById: user.id
  };
});
