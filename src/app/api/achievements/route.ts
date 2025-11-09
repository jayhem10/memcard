import { withApi, ApiError } from '@/lib/api-wrapper';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (request: NextRequest, { supabase, user }) => {
  if (!user || !supabase) {
    throw new ApiError('Non authentifié', 401);
  }

  // Récupérer les IDs des achievements déjà débloqués AVANT la vérification
  const { data: existingAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', user.id);

  const existingAchievementIds = new Set(
    (existingAchievements || []).map((ua: any) => ua.achievement_id)
  );

  // Vérifier et débloquer automatiquement les achievements
  const { data: unlockedAchievements, error: checkError } = await supabase.rpc('check_achievements', {
    p_user_id: user.id,
  });

  if (checkError) {
    console.error('Erreur lors de la vérification des achievements:', checkError);
    // On continue quand même pour récupérer les achievements existants
  }

  // Récupérer tous les achievements de l'utilisateur avec les détails
  // Utiliser range() pour récupérer tous les achievements (Supabase limite à 1000 par défaut)
  const { data: userAchievements, error: userAchievementsError } = await supabase
    .from('user_achievements')
    .select(`
      id,
      user_id,
      achievement_id,
      unlocked_at,
      achievements:achievement_id (
        id,
        name_en,
        name_fr,
        description_en,
        description_fr,
        category,
        requirement_type,
        requirement_value,
        icon_url,
        created_at,
        rank,
        points
      )
    `)
    .eq('user_id', user.id)
    .order('unlocked_at', { ascending: false })
    .range(0, 999999); // Récupérer tous les achievements de l'utilisateur

  if (userAchievementsError) {
    console.error('Erreur lors de la récupération des achievements:', userAchievementsError);
    throw new ApiError('Erreur lors de la récupération des achievements', 500);
  }

  // Détecter les nouveaux achievements débloqués
  const newlyUnlocked = (userAchievements || [])
    .filter((ua: any) => !existingAchievementIds.has(ua.achievement_id))
    .map((ua: any) => ({
      id: ua.id,
      user_id: ua.user_id,
      achievement_id: ua.achievement_id,
      unlocked_at: ua.unlocked_at,
      achievement: ua.achievements,
    }));

  // Créer des notifications en base pour les nouveaux achievements débloqués
  if (newlyUnlocked.length > 0) {
    const notificationsToInsert = newlyUnlocked.map((ua: any) => ({
      user_id: user.id,
      achievement_id: ua.achievement_id,
      user_achievement_id: ua.id,
      is_viewed: false,
    }));

    // Insérer les notifications (ignorer les doublons)
    // On utilise insert avec ignoreDuplicates pour ignorer les erreurs de contrainte unique
    const { error: insertError } = await supabase
      .from('achievement_notifications')
      .insert(notificationsToInsert);

    // Ignorer les erreurs de doublons (code 23505 = violation de contrainte unique)
    if (insertError && insertError.code !== '23505') {
      console.error('Erreur lors de l\'insertion des notifications:', insertError);
    }
  }

  // Récupérer tous les achievements disponibles pour afficher ceux non débloqués
  // Utiliser range() pour récupérer tous les achievements (Supabase limite à 1000 par défaut)
  const { data: allAchievements, error: allAchievementsError } = await supabase
    .from('achievements')
    .select('*')
    .order('points', { ascending: false, nullsFirst: false })
    .range(0, 999999); // Récupérer tous les achievements

  if (allAchievementsError) {
    console.error('Erreur lors de la récupération de tous les achievements:', allAchievementsError);
    throw new ApiError('Erreur lors de la récupération de tous les achievements', 500);
  }

  // Créer un Set des IDs d'achievements débloqués
  const unlockedIds = new Set(
    (userAchievements || []).map((ua: any) => ua.achievement_id)
  );

  // Séparer les achievements débloqués et non débloqués
  const unlocked = (userAchievements || []).map((ua: any) => ({
    id: ua.id,
    user_id: ua.user_id,
    achievement_id: ua.achievement_id,
    unlocked_at: ua.unlocked_at,
    achievement: ua.achievements,
  }));

  const locked = (allAchievements || [])
    .filter((a: any) => !unlockedIds.has(a.id))
    .map((a: any) => ({
      id: null,
      user_id: user.id,
      achievement_id: a.id,
      unlocked_at: null,
      achievement: a,
    }));

  return {
    unlocked,
    locked,
    total: allAchievements?.length || 0,
    unlockedCount: unlocked.length,
    newlyUnlocked, // Nouveaux achievements débloqués lors de cet appel
  };
});

