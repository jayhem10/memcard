import { withApi, ApiError } from '@/lib/api-wrapper';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

export const GET = withApi(async (request, { user, supabase }) => {
    // Récupérer ou créer un token de partage
    const { data: existingShare, error: fetchError } = await supabase
      .from('wishlist_shares')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching share:', fetchError);
    throw new ApiError('Erreur lors de la récupération du partage', 500);
    }

    // Si un partage actif existe, le retourner
    if (existingShare) {
    return {
        token: existingShare.token,
        shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/wishlist/${existingShare.token}`,
        isActive: existingShare.is_active,
    };
    }

    // Vérifier s'il existe un partage inactif
    const { data: inactiveShare } = await supabase
      .from('wishlist_shares')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', false)
      .maybeSingle();

    // Si un partage inactif existe, retourner seulement le statut
    if (inactiveShare) {
    return { isActive: false };
    }

    // Aucun partage trouvé - retourner seulement le statut
  return { isActive: false };
});

export const POST = withApi(async (request, { user, supabase }) => {
    // Désactiver les anciens partages
    await supabase
      .from('wishlist_shares')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Créer un nouveau token
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
    throw new ApiError('Erreur lors de la création du partage', 500);
    }

  return {
      token: newShare.token,
      shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/wishlist/${newShare.token}`,
  };
});

