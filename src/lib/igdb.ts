export const IGDB_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID || 'd4rab2m6s99tbh59x4v12mcibf4pda',
  clientSecret: process.env.TWITCH_CLIENT_SECRET || '3mh491quj9dlmrarz0pmtf6srq2p1y',
  endpoints: {
    games: 'https://api.igdb.com/v4/games',
    covers: 'https://api.igdb.com/v4/covers',
    platforms: 'https://api.igdb.com/v4/platforms',
  }
};

let accessToken: string | null = null;
let tokenExpiration: number | null = null;

export async function getIGDBAccessToken() {
  if (accessToken && tokenExpiration && Date.now() < tokenExpiration) {
    return accessToken;
  }

  const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${IGDB_CONFIG.clientId}&client_secret=${IGDB_CONFIG.clientSecret}&grant_type=client_credentials`, {
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
  const response = await fetch('/api/igdb', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
