import { withApi, ApiError } from '@/lib/api-wrapper';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (request, { user, supabase }) => {
    // Récupérer les notifications non validées avec les informations du jeu
    const { data: notifications, error: fetchError } = await supabase
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

    if (fetchError) {
      console.error('Error fetching notifications:', fetchError);
    throw new ApiError('Erreur lors de la récupération des notifications', 500);
    }

    // Formater les notifications
    const formattedNotifications = (notifications || []).map((notif: any) => ({
      id: notif.id,
      user_game_id: notif.user_game_id,
      created_at: notif.created_at,
      game: (notif.user_games as any)?.games || null,
    }));

  return {
      notifications: formattedNotifications,
      count: formattedNotifications.length,
  };
});

