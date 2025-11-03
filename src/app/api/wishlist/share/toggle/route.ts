import { withApi, ApiError } from '@/lib/api-wrapper';
import { validateBody } from '@/lib/validation';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

export const POST = withApi(async (request, { user, supabase }) => {
  const body = await request.json();

  // Validation
  validateBody<{ isActive: boolean }>(body, ['isActive']);

    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
    throw new ApiError('Le paramètre isActive doit être un boolean', 400);
    }

    // Si on active et qu'il n'y a pas de partage, en créer un
    if (isActive) {
      // Vérifier s'il existe déjà un partage (actif ou non)
      const { data: existingShare } = await supabase
        .from('wishlist_shares')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingShare) {
        // Créer un nouveau token de partage
        const token = randomBytes(32).toString('hex');
        const { data: newShare, error: createError } = await supabase
          .from('wishlist_shares')
          .insert({
            user_id: user.id,
            token,
            is_active: true,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating share:', createError);
          const { supabaseAdmin } = await import('@/lib/supabaseAdmin');
          const adminResult = await supabaseAdmin
            .from('wishlist_shares')
            .insert({
              user_id: user.id,
              token,
              is_active: true,
            })
            .select()
            .single();

          if (adminResult.error) {
            throw new ApiError('Erreur lors de la création du partage', 500);
          }
        }

        return {
          success: true,
          isActive: true,
          message: 'Partage de la wishlist activé'
        };
      } else {
        // Mettre à jour le partage existant pour l'activer
        const { error: updateError } = await supabase
          .from('wishlist_shares')
          .update({ is_active: true })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating share status:', updateError);
          const { supabaseAdmin } = await import('@/lib/supabaseAdmin');
          const adminResult = await supabaseAdmin
            .from('wishlist_shares')
            .update({ is_active: true })
            .eq('user_id', user.id);

          if (adminResult.error) {
            throw new ApiError('Erreur lors de la mise à jour du partage', 500);
          }
        }
      }
    } else {
      // Désactiver tous les partages de l'utilisateur
      const { error: updateError } = await supabase
        .from('wishlist_shares')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating share status:', updateError);
        const { supabaseAdmin } = await import('@/lib/supabaseAdmin');
        const adminResult = await supabaseAdmin
          .from('wishlist_shares')
          .update({ is_active: false })
          .eq('user_id', user.id);

        if (adminResult.error) {
          throw new ApiError('Erreur lors de la mise à jour du partage', 500);
        }
      }
    }

    return {
      success: true,
      isActive,
      message: isActive ? 'Partage de la wishlist activé' : 'Partage de la wishlist désactivé'
    };
});

