import { withApi, ApiError } from '@/lib/api-wrapper';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Forcer le bypass du cache Next.js pour avoir des données toujours à jour
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

/**
 * GET /api/notifications
 * Récupère toutes les notifications actives (non dismissées) de l'utilisateur
 */
export const GET = withApi(async (request: NextRequest, { user }) => {
  if (!user) {
    throw new ApiError('Non authentifié', 401);
  }

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

  // Récupérer uniquement les notifications actives (non dismissées)
  const { data: notificationsRaw, error } = await supabaseAdmin
    .from('notifications')
    .select(`
      id,
      user_id,
      type,
      user_game_id,
      user_achievement_id,
      friend_id,
      created_at,
      is_read,
      is_dismissed,
      read_at,
      dismissed_at
    `)
    .eq('user_id', user.id)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[API Notifications] Error fetching notifications:', error);
    throw new ApiError('Erreur lors de la récupération des notifications', 500);
  }

  const notificationsRawFiltered = notificationsRaw || [];

  // Enrichir les notifications avec les données associées
  const enrichedNotifications = await Promise.all(
    notificationsRawFiltered.map(async (notif) => {
      if (notif.type === 'wishlist') {
        const userGameId = notif.user_game_id;
        
        if (!userGameId) {
          // Dismiss automatiquement si pas d'ID
          await supabaseAdmin
            .from('notifications')
            .update({ 
              is_dismissed: true, 
              dismissed_at: new Date().toISOString() 
            })
            .eq('id', notif.id);
          return null;
        }

        // Récupérer les infos du jeu
        const { data: userGame, error: userGameError } = await supabaseAdmin
          .from('user_games')
          .select(`
            id,
            buy,
            game_id,
            games:game_id(
              id,
              title,
              cover_url
            )
          `)
          .eq('id', userGameId)
          .single();

        if (userGameError || !userGame) {
          // Dismiss si erreur ou user_game introuvable
          await supabaseAdmin
            .from('notifications')
            .update({ 
              is_dismissed: true,
              dismissed_at: new Date().toISOString()
            })
            .eq('id', notif.id);
          return null;
        }

        // Si buy = false, le trigger SQL devrait déjà avoir dismiss la notification
        // Mais on vérifie quand même pour garantir la cohérence
        if (!userGame.buy) {
          const { data: currentNotif } = await supabaseAdmin
            .from('notifications')
            .select('is_dismissed')
            .eq('id', notif.id)
            .single();
          
          if (currentNotif && !currentNotif.is_dismissed) {
            await supabaseAdmin
              .from('notifications')
              .update({ 
                is_dismissed: true,
                dismissed_at: new Date().toISOString()
              })
              .eq('id', notif.id);
          }
          
          return null;
        }

        return {
          id: notif.id,
          type: 'wishlist' as const,
          created_at: notif.created_at,
          is_read: notif.is_read,
          is_dismissed: notif.is_dismissed,
          read_at: notif.read_at,
          dismissed_at: notif.dismissed_at,
          user_game_id: userGameId,
          game: userGame.games,
        };
      } else if (notif.type === 'achievement') {
        const userAchievementId = notif.user_achievement_id;
        
        if (!userAchievementId) {
          await supabaseAdmin
            .from('notifications')
            .update({ 
              is_dismissed: true,
              dismissed_at: new Date().toISOString()
            })
            .eq('id', notif.id);
          return null;
        }

        // Récupérer les infos de l'achievement
        const { data: userAchievement, error: achievementError } = await supabaseAdmin
          .from('user_achievements')
          .select(`
            id,
            unlocked_at,
            achievement_id,
            achievements:achievement_id(
              id,
              name_en,
              name_fr,
              description_en,
              description_fr,
              icon_url,
              points
            )
          `)
          .eq('id', userAchievementId)
          .single();

        if (achievementError || !userAchievement || !userAchievement.achievements) {
          await supabaseAdmin
            .from('notifications')
            .update({ 
              is_dismissed: true,
              dismissed_at: new Date().toISOString()
            })
            .eq('id', notif.id);
          return null;
        }

        return {
          id: notif.id,
          type: 'achievement' as const,
          created_at: notif.created_at,
          is_read: notif.is_read,
          is_dismissed: notif.is_dismissed,
          read_at: notif.read_at,
          dismissed_at: notif.dismissed_at,
          achievement_id: userAchievementId,
          achievement: userAchievement.achievements,
          unlocked_at: userAchievement.unlocked_at,
        };
      }

      if (notif.type === 'friend') {
        console.log('Traitement notification ami:', { notifId: notif.id, friendId: notif.friend_id });
        const friendId = notif.friend_id;

        if (!friendId) {
          console.log('Notification ami sans friend_id, dismiss automatique');
          // Dismiss automatiquement si pas d'ID
          await supabaseAdmin
            .from('notifications')
            .update({
              is_dismissed: true,
              dismissed_at: new Date().toISOString()
            })
            .eq('id', notif.id);
          return null;
        }

        // Récupérer les infos de l'ami
        const { data: friendProfile, error: friendError } = await supabaseAdmin
          .from('profiles')
          .select(`
            id,
            username,
            full_name,
            avatar_url
          `)
          .eq('id', friendId)
          .single();

        if (friendError || !friendProfile) {
          // Dismiss si erreur ou profil introuvable
          await supabaseAdmin
            .from('notifications')
            .update({
              is_dismissed: true,
              dismissed_at: new Date().toISOString()
            })
            .eq('id', notif.id);
          return null;
        }

        return {
          id: notif.id,
          type: 'friend' as const,
          created_at: notif.created_at,
          is_read: notif.is_read,
          is_dismissed: notif.is_dismissed,
          read_at: notif.read_at,
          dismissed_at: notif.dismissed_at,
          friend_id: friendId,
          friend: friendProfile,
        };
      }

      return null;
    })
  );

  // Filtrer les notifications null et calculer les compteurs
  const validNotifications = enrichedNotifications.filter((notif) => notif !== null) as Array<{
    id: string;
    type: 'wishlist' | 'achievement';
    created_at: string;
    is_read: boolean;
    is_dismissed: boolean;
    read_at: string | null;
    dismissed_at: string | null;
    user_game_id?: string;
    game?: { id: string; title: string; cover_url: string | null };
    achievement_id?: string;
    achievement?: any;
    unlocked_at?: string;
  }>;
  const wishlistCount = validNotifications.filter((n) => n.type === 'wishlist').length;
  const achievementCount = validNotifications.filter((n) => n.type === 'achievement').length;

  const result = {
    notifications: validNotifications,
    count: validNotifications.length,
    wishlistCount,
    achievementCount,
  };

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
});