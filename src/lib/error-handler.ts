/**
 * Utilitaires pour la gestion d'erreurs de manière cohérente
 */

/**
 * Gère les erreurs Supabase de manière standardisée
 */
export function handleSupabaseError(
  error: unknown,
  context: string,
  fallbackMessage?: string
): never {
  if (error instanceof Error) {
    console.error(`[${context}]`, error);
    throw new Error(error.message || fallbackMessage || `Erreur dans ${context}`);
  }
  
  console.error(`[${context}]`, error);
  throw new Error(fallbackMessage || `Erreur inattendue dans ${context}`);
}

/**
 * Vérifie si une erreur Supabase est une erreur de "non trouvé"
 */
export function isNotFoundError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    return error.code === 'PGRST116'; // Code Supabase pour "not found"
  }
  return false;
}

/**
 * Gère les erreurs de manière silencieuse (pour les cas où l'erreur n'est pas critique)
 */
export function handleErrorSilently(
  error: unknown,
  context: string
): void {
  console.warn(`[${context}]`, error);
}

