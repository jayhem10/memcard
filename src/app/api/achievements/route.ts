import { withApi, ApiError } from '@/lib/api-wrapper';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

  // Créer des notifications SEULEMENT pour les achievements qui n'ont PAS DÉJÀ de notification
  if (newlyUnlocked.length > 0) {
    console.log(`[Achievements API] ${newlyUnlocked.length} nouveaux achievements détectés`);
    
    // Créer supabaseAdmin pour bypasser RLS
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
    
    // Vérifier quelles notifications existent déjà (TOUTES, même dismissed)
    // Comportement : une notification par achievement, une seule fois dans la vie
    const newlyUnlockedIds = newlyUnlocked.map((ua: any) => ua.id);
    console.log(`[Achievements API] 🔍 Checking for existing notifications for ${newlyUnlockedIds.length} achievements`);
    
    // Vérifier les notifications existantes
    const { data: existingNotifications, error: notifCheckError } = await supabaseAdmin
      .from('notifications')
      .select('user_achievement_id, dismissed_at')
      .eq('user_id', user.id)
      .eq('type', 'achievement')
      .in('user_achievement_id', newlyUnlockedIds);
    // ⚠️ PAS de filtre sur dismissed_at → une notif par achievement, une seule fois

    if (notifCheckError) {
      console.error('[Achievements API] ❌ Error checking existing notifications:', notifCheckError);
    }

    console.log(`[Achievements API] 📊 Found ${existingNotifications?.length || 0} existing notifications:`, 
      existingNotifications?.map(n => ({
        id: n.user_achievement_id?.substring(0, 8),
        dismissed: n.dismissed_at !== null
      }))
    );

    const existingNotificationIds = new Set(
      (existingNotifications || []).map((n: any) => n.user_achievement_id)
    );

    console.log(`[Achievements API] ${existingNotificationIds.size} notifications existent déjà (incluant dismissed)`);

    // Filtrer pour ne créer que les notifications qui n'existent pas encore
    const achievementsNeedingNotification = newlyUnlocked.filter(
      (ua: any) => !existingNotificationIds.has(ua.id)
    );

    if (achievementsNeedingNotification.length > 0) {
      const notificationsToInsert = achievementsNeedingNotification.map((ua: any) => ({
        user_id: user.id,
        type: 'achievement',
        user_achievement_id: ua.id,
        created_at: new Date().toISOString(),
        is_read: false, // ⬅️ Booléen, pas une chaîne
        is_dismissed: false, // ⬅️ Booléen, pas une chaîne
        read_at: null,
        dismissed_at: null,
      }));

      console.log(`[Achievements API] Tentative de création de ${notificationsToInsert.length} notification(s)`);

      // Insérer les notifications dans la nouvelle table unifiée
      // Note: La contrainte UNIQUE sur (user_id, user_achievement_id) empêche les doublons
      const { data: insertedNotifs, error: insertError } = await supabaseAdmin
        .from('notifications')
        .insert(notificationsToInsert)
        .select();

      // Ignorer les erreurs de doublons (code 23505 = violation de contrainte unique)
      if (insertError) {
        if (insertError.code === '23505') {
          console.log(`⚠️ Certaines notifications d'achievements existent déjà (ignoré)`);
        } else {
          console.error('❌ Erreur lors de l\'insertion des notifications d\'achievements:', insertError);
        }
      } else {
        const insertedCount = insertedNotifs?.length || 0;
        console.log(`✅ ${insertedCount} notification(s) d'achievement créée(s) pour l'utilisateur ${user.id}`);
      }
    } else {
      console.log(`ℹ️ Aucune nouvelle notification à créer (toutes existent déjà)`);
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

