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
  // 1. Essayer avec les cookies (SSR standard)
  let supabase = await createAuthenticatedSupabaseClient();
  let { data: { user }, error: authError } = await supabase.auth.getUser();

  // 2. Si échec, essayer avec le token dans les headers (client-side fetch)
  if (authError || !user) {
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
      user = result.data.user;
      authError = result.error;
      
      // Utiliser le client avec token si l'authentification réussit
      if (user) {
        supabase = supabaseWithToken as any;
      }
    }
  }

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

