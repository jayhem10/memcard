import { withApi, ApiError } from '@/lib/api-wrapper';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const POST = withApi(async (request: NextRequest, { user, supabase }) => {
  if (!user || !supabase) {
    throw new ApiError('Non authentifié', 401);
  }


  // Créer un client admin pour les opérations système
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

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

  // Créer une notification pour l'utilisateur ajouté via insert direct (TEMPORAIRE)
  try {


    // TEMPORAIRE : Insert direct jusqu'à ce que la RPC soit déployée en prod
    const { data: insertData, error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: friendProfile.id, // L'utilisateur qui reçoit la notification
        type: 'friend',
        friend_id: user.id // L'utilisateur qui a ajouté
      })
      .select();


    if (notificationError) {
      console.error('Erreur lors de la création de la notification ami:', notificationError);
    }
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
  }

  return {
    success: true,
    message: `${friendProfile.username} ajouté à vos amis !`,
    friendId: friendProfile.id,
    addedById: user.id
  };
});
