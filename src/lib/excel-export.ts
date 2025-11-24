import * as XLSX from 'xlsx';

export interface GameExportData {
  id: string;
  igdb_id: number;
  title: string;
  release_date: string | null;
  developer: string;
  publisher: string;
  description_en: string | null;
  description_fr: string | null;
  console_name?: string;
  genres: Array<{ id: string; name: string }>;
  status?: string;
  rating?: number | null;
  notes?: string;
  purchase_date?: string | null;
  play_time?: number | null;
  completion_percentage?: number | null;
  buy_price?: number | null;
}

export function exportCollectionToExcel(games: GameExportData[], filename: string = 'ma_collection', isFrench: boolean = true) {
  // Séparer les jeux possédés et la wishlist
  const ownedGames = games.filter(game => 
    game.status && !['wishlist', 'WISHLIST'].includes(game.status)
  );
  
  const wishlistGames = games.filter(game => 
    game.status && ['wishlist', 'WISHLIST'].includes(game.status)
  );

  // Créer un nouveau workbook
  const workbook = XLSX.utils.book_new();

  // Fonction pour formater les données d'un jeu
  const formatGameData = (game: GameExportData) => ({
    'Titre': game.title,
    'Développeur': game.developer,
    'Éditeur': game.publisher,
    'Date de sortie': game.release_date ? new Date(game.release_date).toLocaleDateString('fr-FR') : '',
    'Plateforme': game.console_name || '',
    'Genres': game.genres.map(g => g.name).join(', '),
    'Statut': getStatusLabel(game.status || '', isFrench),
    'Note': game.rating || '',
    'Temps de jeu (heures)': game.play_time || '',
    'Pourcentage de completion': game.completion_percentage ? `${game.completion_percentage}%` : '',
    'Date d\'achat': game.purchase_date ? new Date(game.purchase_date).toLocaleDateString('fr-FR') : '',
    'Prix d\'achat (€)': game.buy_price || '',
    'Notes': game.notes || '',
    'Description': (game.description_fr || game.description_en || '')
  });

  // Ajouter la feuille des jeux possédés
  if (ownedGames.length > 0) {
    const ownedData = ownedGames.map(formatGameData);
    const ownedSheet = XLSX.utils.json_to_sheet(ownedData);
    
    // Ajuster la largeur des colonnes
    const ownedColWidths = [
      { wch: 30 }, // Titre
      { wch: 20 }, // Développeur
      { wch: 20 }, // Éditeur
      { wch: 12 }, // Date de sortie
      { wch: 15 }, // Plateforme
      { wch: 25 }, // Genres
      { wch: 12 }, // Statut
      { wch: 8 },  // Note
      { wch: 15 }, // Temps de jeu
      { wch: 20 }, // Pourcentage
      { wch: 12 }, // Date d'achat
      { wch: 12 }, // Prix
      { wch: 30 }, // Notes
      { wch: 50 }  // Description
    ];
    ownedSheet['!cols'] = ownedColWidths;
    
    XLSX.utils.book_append_sheet(workbook, ownedSheet, 'Collection');
  }

  // Ajouter la feuille de la wishlist
  if (wishlistGames.length > 0) {
    const wishlistData = wishlistGames.map(formatGameData);
    const wishlistSheet = XLSX.utils.json_to_sheet(wishlistData);
    
    // Ajuster la largeur des colonnes
    const wishlistColWidths = [
      { wch: 30 }, // Titre
      { wch: 20 }, // Développeur
      { wch: 20 }, // Éditeur
      { wch: 12 }, // Date de sortie
      { wch: 15 }, // Plateforme
      { wch: 25 }, // Genres
      { wch: 12 }, // Statut
      { wch: 8 },  // Note
      { wch: 15 }, // Temps de jeu
      { wch: 20 }, // Pourcentage
      { wch: 12 }, // Date d'achat
      { wch: 12 }, // Prix
      { wch: 30 }, // Notes
      { wch: 50 }  // Description
    ];
    wishlistSheet['!cols'] = wishlistColWidths;
    
    XLSX.utils.book_append_sheet(workbook, wishlistSheet, 'Liste de souhaits');
  }

  // Ajouter une feuille de résumé
  const summaryData = [
    { 'Catégorie': 'Jeux possédés', 'Nombre': ownedGames.length },
    { 'Catégorie': 'Liste de souhaits', 'Nombre': wishlistGames.length },
    { 'Catégorie': 'Total', 'Nombre': games.length },
    { 'Catégorie': 'Valeur totale (€)', 'Nombre': ownedGames.reduce((sum, game) => sum + (game.buy_price || 0), 0) }
  ];
  
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé');

  // Générer le fichier et le télécharger
  const fileName = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function getStatusLabel(status: string, isFrench: boolean = true): string {
  const frenchLabels: Record<string, string> = {
    'NOT_STARTED': 'À faire',
    'IN_PROGRESS': 'En cours',
    'COMPLETED': 'Terminé',
    'DROPPED': 'Abandonné',
    'WISHLIST': 'Liste de souhaits',
    'not_started': 'À faire',
    'in_progress': 'En cours',
    'completed': 'Terminé',
    'dropped': 'Abandonné',
    'wishlist': 'Liste de souhaits'
  };

  const englishLabels: Record<string, string> = {
    'NOT_STARTED': 'To do',
    'IN_PROGRESS': 'In progress',
    'COMPLETED': 'Completed',
    'DROPPED': 'Dropped',
    'WISHLIST': 'Wishlist',
    'not_started': 'To do',
    'in_progress': 'In progress',
    'completed': 'Completed',
    'dropped': 'Dropped',
    'wishlist': 'Wishlist'
  };

  const labels = isFrench ? frenchLabels : englishLabels;
  return labels[status] || status;
}
