import { withApi, ApiError } from '@/lib/api-wrapper';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// Récupérer toutes les notifications (wishlist + achievements)
export const GET = withApi(async (request: NextRequest, { supabase, user }) => {
  if (!user || !supabase) {
    throw new ApiError('Non authentifié', 401);
  }

  // Récupérer les notifications de wishlist
  const { data: wishlistNotifications, error: wishlistError } = await supabase
    .from('wishlist_notifications')
    .select(`
      id,
      user_game_id,
      created_at,
      user_games!inner(
        game_id,
        games:game_id(
          id,
          title,
          cover_url
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('is_validated', false)
    .order('created_at', { ascending: false });

  if (wishlistError) {
    console.error('Erreur lors de la récupération des notifications wishlist:', wishlistError);
  }

  // Récupérer les notifications d'achievements
  const { data: achievementNotifications, error: achievementError } = await supabase
    .from('achievement_notifications')
    .select(`
      id,
      achievement_id,
      user_achievement_id,
      created_at,
      is_viewed,
      achievements:achievement_id(
        id,
        name_en,
        name_fr,
        description_en,
        description_fr,
        icon_url,
        points
      ),
      user_achievements:user_achievement_id(
        unlocked_at
      )
    `)
    .eq('user_id', user.id)
    .eq('is_viewed', false)
    .order('created_at', { ascending: false });

  if (achievementError) {
    console.error('Erreur lors de la récupération des notifications achievements:', achievementError);
  }

  // Formater les notifications de wishlist
  const formattedWishlist = (wishlistNotifications || []).map((notif: any) => ({
    id: notif.id,
    type: 'wishlist' as const,
    user_game_id: notif.user_game_id,
    created_at: notif.created_at,
    game: (notif.user_games as any)?.games || null,
  }));

  // Formater les notifications d'achievements
  const formattedAchievements = (achievementNotifications || []).map((notif: any) => ({
    id: notif.id,
    type: 'achievement' as const,
    achievement_id: notif.achievement_id,
    user_achievement_id: notif.user_achievement_id,
    created_at: notif.created_at,
    achievement: notif.achievements,
    unlocked_at: (notif.user_achievements as any)?.unlocked_at || notif.created_at,
  }));

  // Combiner et trier par date (plus récent en premier)
  const allNotifications = [...formattedWishlist, ...formattedAchievements].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return {
    notifications: allNotifications,
    count: allNotifications.length,
    wishlistCount: formattedWishlist.length,
    achievementCount: formattedAchievements.length,
  };
});

