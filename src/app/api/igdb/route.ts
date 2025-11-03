import { withApi, ApiError } from '@/lib/api-wrapper';
import { validateBody } from '@/lib/validation';
import { getIGDBAccessToken, IGDB_CONFIG } from '@/lib/igdb';

export const dynamic = 'force-dynamic';

export const POST = withApi(async (request) => {
  const body = await request.json();

  // Validation des champs requis
  validateBody<{ endpoint: string; query: string }>(body, ['endpoint', 'query']);

  const { endpoint, query } = body;

    // Valider que l'endpoint est bien un endpoint IGDB autorisé
    const allowedEndpoints = [
      IGDB_CONFIG.endpoints.games,
      IGDB_CONFIG.endpoints.platforms,
      IGDB_CONFIG.endpoints.covers,
    ];

    if (!allowedEndpoints.includes(endpoint)) {
    throw new ApiError('Endpoint non autorisé', 403);
    }
    
  // Récupérer le token d'accès IGDB
    const token = await getIGDBAccessToken();
    
  // Faire la requête vers IGDB
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Client-ID': IGDB_CONFIG.clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: query,
    });
    
  // Vérifier si la requête a réussi
    if (!response.ok) {
      const errorText = await response.text();
      console.error('IGDB API error:', errorText);
    throw new ApiError('Erreur lors de la récupération des données IGDB', response.status);
    }
    
  // Retourner les données
  return await response.json();
});
