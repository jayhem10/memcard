/**
 * Utilitaires pour la gestion des dates dans l'application
 */

/**
 * Convertit un timestamp Unix IGDB en date au format YYYY-MM-DD
 * @param timestamp Timestamp Unix provenant de l'API IGDB
 * @returns Date formatée ou null si le timestamp est invalide
 */
export function formatIGDBReleaseDate(timestamp?: number): string | null {
  if (!timestamp) return null;
  
  try {
    const date = new Date(timestamp * 1000); // Conversion du timestamp Unix en millisecondes
    return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
  } catch (error) {
    console.error('Erreur lors de la conversion de la date:', error);
    return null;
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

/**
 * Formate une date pour affichage utilisateur
 * @param dateString Date au format ISO ou timestamp
 * @returns Date formatée pour l'affichage (ex: "25 juin 2023")
 */
export function formatDisplayDate(dateString?: string | number): string | null {
  if (!dateString) return null;
  
  try {
    const date = typeof dateString === 'number' 
      ? new Date(dateString * 1000) 
      : new Date(dateString);
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return null;
  }
}
