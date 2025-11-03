/**
 * Utilitaires pour la gestion des dates dans l'application
 */

/**
 * Convertit un timestamp Unix IGDB en date au format YYYY-MM-DD
 * @param timestamp Timestamp Unix provenant de l'API IGDB
 * @returns Date formatée ou une date par défaut (2000-01-01) si le timestamp est invalide
 */
export function formatIGDBReleaseDate(timestamp?: number): string {
  if (!timestamp) {
    // Retourner une date par défaut au lieu de null pour éviter les erreurs NOT NULL
    return '2000-01-01';
  }
  
  try {
    const date = new Date(timestamp * 1000); // Conversion du timestamp Unix en millisecondes
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return '2000-01-01';
    }
    
    return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
  } catch (error) {
    console.error('Erreur lors de la conversion de la date:', error);
    // Retourner une date par défaut au lieu de null
    return '2000-01-01';
  }
}

/**
 * Extrait l'année d'un timestamp Unix IGDB
 * @param timestamp Timestamp Unix provenant de l'API IGDB
 * @returns Année de sortie ou null si le timestamp est invalide
 */
export function getIGDBReleaseYear(timestamp?: number): number | null {
  if (!timestamp) return null;
  
  try {
    const date = new Date(timestamp * 1000);
    return date.getFullYear();
  } catch (error) {
    console.error('Erreur lors de l\'extraction de l\'année:', error);
    return null;
  }
}
