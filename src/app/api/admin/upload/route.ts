import { withApi, ApiError } from '@/lib/api-wrapper';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

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

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'ranks';

    if (!file) {
      throw new ApiError('Aucun fichier fourni', 400);
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      throw new ApiError('Le fichier doit être une image', 400);
    }

    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new ApiError('Le fichier ne doit pas dépasser 5MB', 400);
    }

    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Convertir le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload vers Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('images')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      throw new ApiError(error.message, 500);
    }

    // Obtenir l'URL publique du fichier
    const { data: urlData } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(filePath);

    return {
      success: true,
      data: {
        url: urlData.publicUrl,
        path: filePath,
        fileName: fileName
      },
      message: 'Image uploadée avec succès'
    };

  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || 'Erreur lors de l\'upload', 500);
  }
});
