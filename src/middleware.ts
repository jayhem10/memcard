// Middleware disabled to avoid redirection loops
// We now use Client Component Guards pattern to protect routes

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Export a simple middleware function that just passes through all requests
export function middleware(req: NextRequest) {
  return NextResponse.next();
}

// Optional: You can remove this config entirely or keep it with minimal routes
export const config = {
  matcher: [],  // Empty matcher means it won't run on any routes
};
