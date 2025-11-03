import { withApi, ApiError } from '@/lib/api-wrapper';

export const dynamic = 'force-dynamic';

export const POST = withApi(async (request, { user, supabase }) => {
    // Appeler la fonction SQL pour créer les notifications
    const { data, error } = await supabase.rpc('create_wishlist_notifications', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('Error creating notifications:', error);
    throw new ApiError('Erreur lors de la création des notifications', 500);
    }

  return {
      success: true,
      count: data || 0,
  };
});

