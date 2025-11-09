const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;

if (!clientId) {
  throw new Error('NEXT_PUBLIC_TWITCH_CLIENT_ID est requis');
}

// Endpoints IGDB - peuvent être utilisés côté client
export const IGDB_ENDPOINTS = {
    games: 'https://api.igdb.com/v4/games',
    covers: 'https://api.igdb.com/v4/covers',
    platforms: 'https://api.igdb.com/v4/platforms',
};

// Configuration complète - uniquement utilisée côté serveur
export const IGDB_CONFIG = {
  clientId: clientId!,
  endpoints: IGDB_ENDPOINTS,
};

let accessToken: string | null = null;
let tokenExpiration: number | null = null;

export async function getIGDBAccessToken() {
  // Cette fonction n'est appelée que côté serveur, donc on peut vérifier le secret ici
  const serverClientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  
  if (!serverClientId) {
    throw new Error('NEXT_PUBLIC_TWITCH_CLIENT_ID est requis');
  }
  
  if (!clientSecret) {
    throw new Error('TWITCH_CLIENT_SECRET est requis (côté serveur uniquement)');
  }

  if (accessToken && tokenExpiration && Date.now() < tokenExpiration) {
    return accessToken;
  }

  const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${serverClientId}&client_secret=${clientSecret}&grant_type=client_credentials`, {
    method: 'POST',
  });

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiration = Date.now() + (data.expires_in * 1000);
  return accessToken;
}

export async function queryIGDB(endpoint: string, query: string) {
  // When running on the server (e.g., in API routes), we can make direct calls to IGDB
  if (typeof window === 'undefined') {
    const token = await getIGDBAccessToken();
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Client-ID': IGDB_CONFIG.clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: query,
    });

    return response.json();
  }
  
  // When running on the client, use our API route to avoid CORS issues
  // Récupérer le token d'authentification Supabase
  const { supabase } = await import('./supabase');
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Ajouter le token dans les headers si disponible
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  
  const response = await fetch('/api/igdb', {
    method: 'POST',
    headers,
    credentials: 'include', // Inclure les cookies pour l'authentification
    body: JSON.stringify({
      endpoint,
      query,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error fetching data from IGDB');
  }

  return response.json();
}

/**
 * Extrait le nom d'un jeu IGDB en priorisant le français depuis alternative_names, avec fallback sur l'anglais
 */
export function getIGDBGameName(game: any): string {
  // Chercher un nom alternatif français dans alternative_names
  if (game.alternative_names && Array.isArray(game.alternative_names)) {
    const frenchName = game.alternative_names.find((alt: any) => 
      alt.comment && (alt.comment.toLowerCase().includes('french') || 
                      alt.comment.toLowerCase().includes('français') ||
                      alt.comment.toLowerCase().includes('france'))
    );
    if (frenchName && frenchName.name) {
      return frenchName.name;
    }
  }
  // Fallback sur le nom par défaut (généralement en anglais)
  return game.name || '';
}

/**
 * Extrait la description d'un jeu IGDB
 * Note: Les descriptions IGDB sont en anglais uniquement.
 */
export function getIGDBGameSummary(game: any): string {
  return game.summary || '';
}
