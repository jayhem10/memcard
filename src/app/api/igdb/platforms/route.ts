import { NextRequest, NextResponse } from 'next/server';
import { getIGDBAccessToken, IGDB_CONFIG } from '@/lib/igdb';

export async function GET(request: NextRequest) {
  try {
    // Get access token
    const token = await getIGDBAccessToken();
    
    // Build query to get all platforms
    const query = `
      fields id, name, abbreviation, alternative_name;
      limit 500;
    `;
    
    // Make the request to IGDB
    const response = await fetch(IGDB_CONFIG.endpoints.platforms, {
      method: 'POST',
      headers: {
        'Client-ID': IGDB_CONFIG.clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: query,
    });
    
    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('IGDB API error:', errorText);
      return NextResponse.json(
        { error: 'Error fetching platforms from IGDB' },
        { status: response.status }
      );
    }
    
    // Return the data
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
