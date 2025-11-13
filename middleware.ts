import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isDevelopment = process.env.NODE_ENV === 'development';

export function middleware(request: NextRequest) {
  // Récupérer le domaine Supabase
  let supabaseHost = '';
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    if (supabaseUrl) {
      supabaseHost = new URL(supabaseUrl).hostname;
    }
  } catch (error) {
    console.warn('NEXT_PUBLIC_SUPABASE_URL invalide');
  }

  // Construire la CSP selon l'environnement
  // En production, retirer 'unsafe-eval' pour plus de sécurité
  // Note: 'unsafe-inline' reste nécessaire pour Next.js et Tailwind, idéalement utiliser des nonces en production
  const scriptSrc = isDevelopment
    ? "'self' 'unsafe-eval' 'unsafe-inline'"
    : "'self' 'unsafe-inline'";

  // Construire connect-src dynamiquement
  const connectSrc = [
    "'self'",
    supabaseHost ? `https://${supabaseHost}` : '',
    "https://*.supabase.co",
    "https://api.igdb.com",
    "https://id.twitch.tv",
    "https://*.vercel-insights.com",
    "https://*.vercel-analytics.com",
    "https://vercel.live",
    isDevelopment ? "ws://localhost:* wss://localhost:* http://localhost:* https://localhost:*" : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Construire les directives CSP
  const cspDirectives = [
    "default-src 'self'",
    `script-src ${scriptSrc} https://vercel.live https://*.vercel-insights.com https://*.vercel-analytics.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://images.igdb.com https://cdn-icons-png.flaticon.com https://*.supabase.co",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src ${connectSrc}`,
    "frame-src 'self'",
    "object-src 'none'",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "form-action 'self'",
    "base-uri 'self'",
  ];

  // Ajouter upgrade-insecure-requests uniquement en production (évite les problèmes en dev HTTP)
  if (!isDevelopment) {
    cspDirectives.push("upgrade-insecure-requests");
  }

  const cspHeader = cspDirectives.join('; ');

  // Créer la réponse avec les headers de sécurité
  const response = NextResponse.next();

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // HSTS uniquement en production (HTTPS requis)
  if (!isDevelopment) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

// Configurer les chemins où le middleware s'applique
export const config = {
  matcher: [
    /*
     * Appliquer à tous les chemins sauf :
     * - api (routes API)
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico et autres fichiers statiques
     */
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|xml)).*)',
    },
  ],
};

