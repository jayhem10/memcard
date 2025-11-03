import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from './supabase-server';

/**
 * Classe d'erreur personnalisée pour les API
 * Permet de throw des erreurs HTTP avec un status code
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Context passé au handler de l'API
 */
interface ApiContext {
  user: any;
  supabase: any;
  params?: any;
}

/**
 * Handler de route API
 */
type ApiHandler<T = any> = (
  request: NextRequest,
  context: ApiContext
) => Promise<T>;

/**
 * Options pour la configuration de l'API
 */
interface ApiOptions {
  requireAuth?: boolean;
}

/**
 * Wrapper API qui gère automatiquement :
 * - Authentification (si requireAuth = true)
 * - Gestion des erreurs (try/catch)
 * - Formatage des réponses (NextResponse.json)
 * 
 * @example
 * export const POST = withApi(async (request, { user, supabase }) => {
 *   const body = await request.json();
 *   return { data: 'result' };
 * });
 */
export function withApi<T>(
  handler: ApiHandler<T>,
  options: ApiOptions = { requireAuth: true }
) {
  return async (
    request: NextRequest,
    context?: { params?: any }
  ) => {
    try {
      // Authentification si requise
      if (options.requireAuth) {
        const { user, supabase, error: authError } = await getAuthenticatedUser(request);

        if (authError || !user) {
          return NextResponse.json(
            { error: 'Non authentifié' },
            { status: 401 }
          );
        }

        // Appeler le handler avec le contexte complet
        const result = await handler(request, {
          user,
          supabase,
          params: context?.params,
        });

        return NextResponse.json(result);
      }

      // Route publique (pas d'authentification)
      const result = await handler(request, {
        user: null,
        supabase: null,
        params: context?.params,
      });

      return NextResponse.json(result);
    } catch (error: any) {
      console.error('API error:', error);

      // Gestion des erreurs ApiError (avec status code)
      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status }
        );
      }

      // Gestion des erreurs HTTP standard
      if (error.status) {
        return NextResponse.json(
          { error: error.message || 'Erreur serveur' },
          { status: error.status }
        );
      }

      // Erreur générique
      return NextResponse.json(
        { error: error.message || 'Erreur interne du serveur' },
        { status: 500 }
      );
    }
  };
}

