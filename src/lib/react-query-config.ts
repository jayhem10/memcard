/**
 * Configuration centralisée pour React Query
 * 
 * Optimisations de performance :
 * - staleTime : Temps pendant lequel les données sont considérées fraîches
 * - gcTime (anciennement cacheTime) : Temps de conservation en cache
 * - refetchOnWindowFocus : Évite les refetch inutiles
 * - refetchOnMount : Contrôle le refetch au montage
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Configuration par défaut pour toutes les queries
 */
export const defaultQueryOptions = {
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 30,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  refetchOnReconnect: true,
  retry: 1,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

/**
 * Configuration pour les queries de données utilisateur (profil, stats)
 * Ces données changent peu souvent
 */
export const userDataQueryOptions = {
  ...defaultQueryOptions,
  staleTime: 1000 * 60 * 10,
  gcTime: 1000 * 60 * 60,
};

/**
 * Configuration pour les queries de collection (jeux)
 * Ces données changent plus souvent (ajout/suppression de jeux)
 */
export const collectionQueryOptions = {
  ...defaultQueryOptions,
  staleTime: 1000 * 30,
  gcTime: 1000 * 60 * 15,
};

/**
 * Configuration pour les queries de recherche IGDB
 * Ces données sont statiques (pas de cache nécessaire)
 */
export const searchQueryOptions = {
  ...defaultQueryOptions,
  staleTime: Infinity,
  gcTime: 1000 * 60 * 60,
};

/**
 * Configuration pour les queries de prix
 * Ces données changent rarement
 */
export const priceQueryOptions = {
  ...defaultQueryOptions,
  staleTime: 1000 * 60 * 60,
  gcTime: 1000 * 60 * 60 * 24,
};

/**
 * Crée un QueryClient optimisé avec les configurations par défaut
 */
export function createOptimizedQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: defaultQueryOptions,
      mutations: {
        retry: 1,
        retryDelay: 1000,
      },
    },
  });
}

/**
 * Query keys centralisées pour éviter les erreurs de typo
 */
export const queryKeys = {
  profile: (userId?: string) => ['profile', userId] as const,
  userGames: (userId?: string, filters?: any) => ['userGames', userId, filters] as const,
  otherUserGames: (userId?: string) => ['otherUserGames', userId] as const,
  userStats: (userId?: string) => ['userStats', userId] as const,
  game: (gameId: string, userId?: string) => ['game', gameId, userId] as const,
  igdbGames: (query: string, platform?: number | null) => ['igdbGames', query, platform] as const,
  gamePrices: (gameId: string) => ['gamePrices', gameId] as const,
  similarGames: (gameId: string, userId?: string) => ['similarGames', gameId, userId] as const,
  consoles: () => ['consoles'] as const,
  notifications: (userId?: string) => ['notifications', userId] as const,
  achievementNotifications: (userId?: string) => ['achievementNotifications', userId] as const,
  wishlistNotifications: (userId?: string) => ['wishlistNotifications', userId] as const,
} as const;

