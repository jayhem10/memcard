import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

/**
 * Crée un client Supabase côté serveur avec gestion des cookies
 * Compatible avec Next.js App Router API routes
 */
export async function createAuthenticatedSupabaseClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            // En API routes, les cookies peuvent être en mode read-only
            // On ignore l'erreur car get() suffit pour l'authentification
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          } catch (error) {
            // En API routes, les cookies peuvent être en mode read-only
          }
        },
      },
    }
  );
}

/**
 * Authentifie un utilisateur depuis une requête API
 * Essaie d'abord avec les cookies, puis avec le token dans les headers
 * 
 * @param request La requête Next.js
 * @returns L'utilisateur authentifié, le client Supabase et l'erreur éventuelle
 */
export async function getAuthenticatedUser(request: NextRequest) {
  // 1. Essayer d'abord avec le token dans les headers (priorité pour les appels client-side)
  const authHeader = request.headers.get('authorization');
  const authToken = authHeader?.replace('Bearer ', '');
  
  if (authToken) {
    const supabaseWithToken = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      }
    );
    
    const result = await supabaseWithToken.auth.getUser();
    if (result.data.user && !result.error) {
      return { user: result.data.user, supabase: supabaseWithToken as any, error: null };
    }
  }

  // 2. Si échec, essayer avec les cookies (SSR standard)
  // Utiliser createServerClient avec les cookies de la requête HTTP directement
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieStore = new Map<string, string>();
  
  // Parser les cookies depuis le header
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (name) {
      cookieStore.set(name, valueParts.join('='));
    }
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name) || undefined;
        },
        set() {
          // En API routes, on ne peut pas setter les cookies
        },
        remove() {
          // En API routes, on ne peut pas supprimer les cookies
        },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  return { user, supabase, error: authError };
}

/**
 * Vérifie l'authentification et throw une ApiError si non authentifié
 * À utiliser avec withApi() uniquement
 * 
 * @example
 * export const POST = withApi(async (request) => {
 *   const { user, supabase } = await requireAuthOrThrow(request);
 *   // ...
 * });
 */
export async function requireAuthOrThrow(request: NextRequest) {
  const { user, supabase, error: authError } = await getAuthenticatedUser(request);

  if (authError || !user) {
    const { ApiError } = await import('./api-wrapper');
    throw new ApiError('Non authentifié', 401);
  }

  return { user, supabase };
}

