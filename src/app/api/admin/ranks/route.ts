import { withApi, ApiError } from '@/lib/api-wrapper';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Rank } from '@/types/profile';

export const dynamic = 'force-dynamic';

// GET - Récupérer tous les ranks
export const GET = withApi(async (request, { user, supabase }) => {
  // Vérifier que l'utilisateur est admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    throw new ApiError('Accès refusé. Admin uniquement.', 403);
  }

  // Récupérer tous les ranks triés par level puis par nom
  const { data: ranks, error } = await supabaseAdmin
    .from('ranks')
    .select('*')
    .order('level', { ascending: true })
    .order('name_en', { ascending: true });

  if (error) {
    throw new ApiError(error.message, 500);
  }

  return { success: true, data: ranks };
});

// POST - Créer un nouveau rank
export const POST = withApi(async (request, { user, supabase }) => {
  // Vérifier que l'utilisateur est admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    throw new ApiError('Accès refusé. Admin uniquement.', 403);
  }

  const body: Omit<Rank, 'id' | 'created_at'> = await request.json();

  // Validation basique
  if (!body.name_en || !body.name_fr || !body.level) {
    throw new ApiError('Les champs name_en, name_fr et level sont requis', 400);
  }

  // Utiliser le client admin pour créer le rank
  const { data: rank, error } = await supabaseAdmin
    .from('ranks')
    .insert({
      name_en: body.name_en,
      name_fr: body.name_fr,
      description_en: body.description_en || null,
      description_fr: body.description_fr || null,
      level: body.level,
      icon_url: body.icon_url || null,
    })
    .select()
    .single();

  if (error) {
    throw new ApiError(error.message, 500);
  }

  return { success: true, data: rank, message: 'Rank créé avec succès' };
});

// PUT - Modifier un rank existant
export const PUT = withApi(async (request, { user, supabase }) => {
  // Vérifier que l'utilisateur est admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    throw new ApiError('Accès refusé. Admin uniquement.', 403);
  }

  const body: Rank = await request.json();

  // Validation basique
  if (!body.id || !body.name_en || !body.name_fr || !body.level) {
    throw new ApiError('Les champs id, name_en, name_fr et level sont requis', 400);
  }

  // Utiliser le client admin pour modifier le rank
  const { data: rank, error } = await supabaseAdmin
    .from('ranks')
    .update({
      name_en: body.name_en,
      name_fr: body.name_fr,
      description_en: body.description_en || null,
      description_fr: body.description_fr || null,
      level: body.level,
      icon_url: body.icon_url || null,
    })
    .eq('id', body.id)
    .select()
    .single();

  if (error) {
    throw new ApiError(error.message, 500);
  }

  return { success: true, data: rank, message: 'Rank modifié avec succès' };
});

// DELETE - Supprimer un rank
export const DELETE = withApi(async (request, { user, supabase }) => {
  // Vérifier que l'utilisateur est admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    throw new ApiError('Accès refusé. Admin uniquement.', 403);
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    throw new ApiError('Le paramètre id est requis', 400);
  }

  // Vérifier si le rank est utilisé par des utilisateurs
  const { data: usersWithRank, error: checkError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('rank_id', id)
    .limit(1);

  if (checkError) {
    throw new ApiError(checkError.message, 500);
  }

  if (usersWithRank && usersWithRank.length > 0) {
    throw new ApiError('Impossible de supprimer ce rank car il est utilisé par des utilisateurs', 400);
  }

  // Supprimer le rank
  const { error } = await supabaseAdmin
    .from('ranks')
    .delete()
    .eq('id', id);

  if (error) {
    throw new ApiError(error.message, 500);
  }

  return { success: true, message: 'Rank supprimé avec succès' };
});
