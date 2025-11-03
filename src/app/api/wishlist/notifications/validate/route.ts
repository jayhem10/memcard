import { withApi, ApiError } from '@/lib/api-wrapper';
import { validateBody } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export const POST = withApi(async (request, { supabase }) => {
  const body = await request.json();

  // Validation
  validateBody<{ notificationId: string }>(body, ['notificationId']);

  const { notificationId } = body;

    // Appeler la fonction SQL pour valider la notification
    const { data, error } = await supabase.rpc('validate_wishlist_notification', {
      p_notification_id: notificationId,
    });

    if (error) {
      console.error('Error validating notification:', error);
    throw new ApiError('Erreur lors de la validation de la notification', 500);
    }

    if (!data) {
    throw new ApiError('Notification non trouvée ou déjà validée', 404);
    }

  return { success: true };
});

