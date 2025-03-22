import { NextRequest, NextResponse } from 'next/server';
import { getIGDBAccessToken, IGDB_CONFIG } from '@/lib/igdb';

export async function POST(request: NextRequest) {
  try {
    // Get the request body which contains the IGDB endpoint and query
    const { endpoint, query } = await request.json();
    
    // Validate the request
    if (!endpoint || !query) {
      return NextResponse.json(
        { error: 'Endpoint and query are required' },
        { status: 400 }
      );
    }
    
    // Get access token
    const token = await getIGDBAccessToken();
    
    // Make the request to IGDB
    const response = await fetch(endpoint, {
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
        { error: 'Error fetching data from IGDB' },
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
