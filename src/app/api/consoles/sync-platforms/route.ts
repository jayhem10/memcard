import { withApi, ApiError } from '@/lib/api-wrapper';
import { getIGDBAccessToken, IGDB_CONFIG } from '@/lib/igdb';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createAuthenticatedSupabaseClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export const POST = withApi(async (request, { user, supabase }) => {
    // Vérifier que l'utilisateur est admin
  const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
    throw new ApiError('Accès refusé. Admin uniquement.', 403);
    }
  
  // Récupérer le client Supabase authentifié
  const supabaseAuth = await createAuthenticatedSupabaseClient();
  
    // Get access token
    const token = await getIGDBAccessToken();
    
    // Fetch all platforms from IGDB
    const platformsQuery = `
      fields id, name, abbreviation, alternative_name, generation, created_at;
      limit 500;
      sort name asc;
    `;
    
    // Make the request to IGDB
    const response = await fetch(IGDB_CONFIG.endpoints.platforms, {
      method: 'POST',
      headers: {
        'Client-ID': IGDB_CONFIG.clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: platformsQuery,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('IGDB API error:', errorText);
      throw new ApiError('Error fetching platforms from IGDB', response.status);
    }
    
    const platforms = await response.json();
    
    if (!platforms || !Array.isArray(platforms)) {
      throw new ApiError('Failed to fetch platforms from IGDB', 500);
    }
        
    // First check if the necessary columns exist in the consoles table
    try {
      // Vérifier si les colonnes existent déjà
      const { data: existingColumns, error } = await supabaseAuth
        .from('consoles')
        .select('igdb_platform_id')
        .limit(1);
        
      if (error && error.message.includes('column "igdb_platform_id" does not exist')) {
        // Ajouter les colonnes igdb_platform_id et abbreviation à la table consoles
        await supabaseAuth.rpc('add_columns_to_consoles');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des colonnes:', error);
      // Créer la fonction RPC si elle n'existe pas encore
      await supabaseAuth.rpc('create_add_columns_function');
      // Essayer d'ajouter les colonnes
      await supabaseAuth.rpc('add_columns_to_consoles');
    }

    // Get existing consoles from database
    const { data: existingConsoles, error: consoleError } = await supabaseAuth
      .from('consoles')
      .select('id, name, igdb_platform_id');
    
    if (consoleError) {
      throw new ApiError('Failed to fetch consoles from database: ' + consoleError.message, 500);
    }
    
    // Mapping des IDs de plateformes existantes
    const existingPlatformIds = new Set(
      existingConsoles
        .filter(c => c.igdb_platform_id)
        .map(c => c.igdb_platform_id)
    );
    
    // Filtrer les plateformes à ajouter (celles qui n'existent pas déjà)
    const platformsToAdd = platforms.filter(platform => 
      !existingPlatformIds.has(platform.id) && platform.name
    );
        
    // Batch insert les nouvelles plateformes
    let added = 0;
    if (platformsToAdd.length > 0) {
      const dataToInsert = platformsToAdd.map(platform => {
        // Si created_at existe, convertir le timestamp Unix en année
        let releaseYear = 2000; // Valeur par défaut
        
        if (platform.created_at) {
          // Convertir timestamp en date
          const date = new Date(platform.created_at * 1000);
          releaseYear = date.getFullYear();
        } else if (platform.generation) {
          // Utiliser generation comme fallback
          releaseYear = 1980 + (platform.generation * 5); // Estimation grossière par génération
        }
        
        return {
          name: platform.name,
          igdb_platform_id: platform.id,
          abbreviation: platform.abbreviation || null,
          release_year: releaseYear
        };
      });
      
      // Utiliser le client authentifié pour l'insertion
      const { data, error } = await supabaseAuth
        .from('consoles')
        .insert(dataToInsert)
        .select();
      
      if (error) {
        console.error('Erreur lors de l\'ajout des consoles:', error);
      } else {
        added = data.length;
      }
    }
    
    // Mettre à jour les consoles existantes qui n'ont pas d'igdb_platform_id
    // en essayant de faire correspondre les noms
    const consolesWithoutMapping = existingConsoles.filter(c => !c.igdb_platform_id);
    let updated = 0;
    
    if (consolesWithoutMapping.length > 0) {
      for (const console of consolesWithoutMapping) {
        // Trouver une plateforme correspondante par nom
        const matchingPlatform = platforms.find(p => 
          p.name.toLowerCase() === console.name.toLowerCase() ||
          (p.alternative_name && p.alternative_name.toLowerCase() === console.name.toLowerCase()) ||
          (p.abbreviation && p.abbreviation.toLowerCase() === console.name.toLowerCase())
        );
        
        if (matchingPlatform) {
          const { data, error } = await supabaseAuth
            .from('consoles')
            .update({ igdb_platform_id: matchingPlatform.id })
            .eq('id', console.id);
          
          if (!error) {
            updated++;
          }
        }
      }
    }
    
    return {
      success: true,
      message: 'Synchronisation des plateformes terminée',
      added,
      updated,
      total: existingConsoles.length + added
    };
});
