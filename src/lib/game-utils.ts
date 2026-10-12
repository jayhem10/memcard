// Utilitaires pour transformer et formater les données de jeux

import { GameData, UserGameData } from '@/types/games';

/** Normalise un prix renvoyé par Supabase (champ numeric souvent typé en string côté client). */
export function coercePriceToNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

/**
 * Traduit un texte en utilisant l'API MyMemory (gratuite)
 * Version simple qui retourne toujours une string (pour compatibilité)
 */
export async function translateText(text: string, from: string = 'en', to: string = 'fr'): Promise<string> {
  const result = await translateTextWithStatus(text, from, to);
  return result.translated;
}

/**
 * Traduit un texte en utilisant différentes APIs de traduction
 * Priorité : DeepL (meilleur) > MyMemory (fallback gratuit)
 */
export async function translateTextWithStatus(text: string, from: string = 'en', to: string = 'fr'): Promise<{ translated: string; success: boolean }> {
  if (!text || text.trim().length === 0) return { translated: text, success: true };
  if (from === to) return { translated: text, success: true }; // Pas besoin de traduire

  // 1. Essayer d'abord DeepL (meilleure qualité, 500k caractères/mois gratuits)
  const deeplApiKey = process.env.DEEPL_API_KEY;
  if (deeplApiKey) {
    try {
      // Déterminer l'URL de l'API (Free vs Pro)
      const isFreeKey = deeplApiKey.endsWith(':fx');
      const baseUrl = isFreeKey 
        ? 'https://api-free.deepl.com/v2/translate'
        : 'https://api.deepl.com/v2/translate';

      console.log(`🌐 DeepL: Tentative de traduction...`);
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${deeplApiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: text,
          source_lang: from.toUpperCase(),
          target_lang: to.toUpperCase(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.translations && data.translations[0]?.text) {
          const translatedText = data.translations[0].text;
          const isDifferent = translatedText.trim().toLowerCase() !== text.trim().toLowerCase();
          console.log(`✅ DeepL: Traduction réussie`);
          return { translated: translatedText, success: isDifferent };
        } else {
          console.warn('⚠️ DeepL: Réponse invalide (pas de traduction dans la réponse)');
        }
      } else {
        const errorText = await response.text().catch(() => '');
        if (response.status === 456) {
          console.warn('⚠️ DeepL: Quota dépassé (456), fallback vers MyMemory');
        } else if (response.status === 403) {
          console.warn('⚠️ DeepL: Accès refusé (403) - vérifier la clé API, fallback vers MyMemory');
        } else {
          console.warn(`⚠️ DeepL error ${response.status}: ${errorText.substring(0, 100)}, fallback vers MyMemory`);
        }
      }
    } catch (error) {
      console.warn('⚠️ DeepL failed (erreur réseau ou autre):', error instanceof Error ? error.message : error);
    }
  } else {
    console.warn('⚠️ DEEPL_API_KEY non trouvée dans les variables d\'environnement, utilisation directe de MyMemory');
  }

  // 2. Fallback vers MyMemory (gratuit, 1000 traductions/jour)
  try {
    const encodedText = encodeURIComponent(text);
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${from}|${to}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MemCard/1.0)',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('❌ MyMemory: Quota dépassé (429)');
      } else {
        console.warn(`❌ MyMemory error ${response.status}`);
      }
      return { translated: text, success: false };
    }

    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
      const translatedText = data.responseData.translatedText;

      // Vérifier si c'est un message d'erreur de limite de quota
      if (translatedText.includes('MYMEMORY WARNING') ||
          translatedText.includes('USED ALL AVAILABLE FREE TRANSLATIONS') ||
          translatedText.includes('NEXT AVAILABLE IN')) {
        console.warn('❌ MyMemory: Quota dépassé');
        return { translated: text, success: false };
      }

      // Vérifier si la traduction est réellement différente du texte original
      const isDifferent = translatedText.trim().toLowerCase() !== text.trim().toLowerCase();
      console.log(`✅ MyMemory: Traduction réussie`);
      return { translated: translatedText, success: isDifferent };
    } else {
      console.warn('❌ MyMemory: Réponse invalide');
      return { translated: text, success: false };
    }
  } catch (error) {
    console.warn('❌ Toutes les APIs ont échoué:', error);
    return { translated: text, success: false };
  }
}

/**
 * Enrichit les données de jeu avec des traductions automatiques
 */
export async function enrichGameWithTranslations(gameData: GameData): Promise<GameData> {
  // Si on a déjà une description française, pas besoin de traduire
  if (gameData.description_fr) {
    return gameData;
  }

  // Si on a une description anglaise mais pas française, on la traduit
  if (gameData.description_en && !gameData.description_fr) {
    try {
      console.log(`🌐 Traduction automatique de la description pour "${gameData.title}"`);
      const translatedDescription = await translateText(gameData.description_en, 'en', 'fr');
      return {
        ...gameData,
        description_fr: translatedDescription,
      };
    } catch (error) {
      console.warn(`❌ Échec de la traduction pour "${gameData.title}":`, error);
      // En cas d'échec, on garde la description anglaise
      return gameData;
    }
  }

  // Pas de description du tout ou seulement française
  return gameData;
}

// Types pour les données Supabase brutes
interface SupabaseGameGenre {
  genre_id: string;
  genres: {
    id: string;
    name: string;
  };
}

interface SupabaseGameData {
  id: number;
  igdb_id: number;
  title: string;
  release_date: string | null;
  developer: string | null;
  publisher: string | null;
  description_en: string | null;
  description_fr: string | null;
  cover_url: string | null;
  console_id: string;
  average_rating: number | null;
  game_genres?: SupabaseGameGenre[];
  [key: string]: unknown;
}

interface SupabaseUserGameItem {
  id: string;
  game_id: number;
  status: string;
  rating: number | null;
  notes: string | null;
  review: string | null;
  created_at: string;
  updated_at: string;
  purchase_date: string | null;
  play_time: number | null;
  completion_percentage: number | null;
  buy_price: number | null;
  sell_price: number | null;
  edition?: string | null;
  edition_other?: string | null;
  games: {
    id: number;
    igdb_id: number;
    title: string;
    release_date: string | null;
    developer: string | null;
    publisher: string | null;
    description_en: string | null;
    description_fr: string | null;
    cover_url: string | null;
    console_id: string;
    average_rating: number | null;
    consoles?: {
      name: string;
    } | null;
    game_genres?: Array<{
      genres?: {
        id: string;
        name: string;
      } | null;
    }>;
  };
}

/**
 * Transforme les genres depuis la structure Supabase vers la structure attendue
 */
export function transformGenres(gameGenres: SupabaseGameGenre[]): Array<{
  genre_id: string;
  genres: {
    id: string;
    name: string;
  };
}> {
  if (!gameGenres || !Array.isArray(gameGenres)) {
    return [];
  }
  
  return gameGenres.map((item) => ({
    genre_id: item.genre_id,
    genres: item.genres
  }));
}

/**
 * Combine les données d'un jeu avec les données utilisateur
 */
export function combineGameData(
  gameData: SupabaseGameData,
  userGameData: UserGameData | UserGameData[] | null
): GameData {
  const genres = transformGenres(gameData.game_genres || []);
  
  // Extraire console et game_genres du spread pour éviter les conflits
  const { game_genres, console, ...gameDataWithoutGenres } = gameData;
  
  // Formater la console si elle existe
  const formattedConsole = console && typeof console === 'object' && 'id' in console && 'name' in console
    ? {
        id: String(console.id),
        name: String(console.name)
      }
    : null;
  
  return {
    ...gameDataWithoutGenres,
    id: String(gameData.id), // Convertir l'id en string pour correspondre au type GameData
    genres: genres,
    console: formattedConsole,
    user_games: Array.isArray(userGameData) ? userGameData : userGameData ? [userGameData] : []
  };
}

/**
 * Transforme les données d'un user_game avec ses relations (version synchrone)
 */
export function transformUserGameItemSync(item: SupabaseUserGameItem): {
  id: string;
  user_game_id: string;
  igdb_id: number;
  title: string;
  release_date: string | null;
  developer: string | null;
  publisher: string | null;
  description_en: string | null;
  description_fr: string | null;
  cover_url: string | null;
  console_id: string;
  console_name?: string;
  average_rating: number | null;
  genres: Array<{ id: string; name: string }>;
  status: string;
  rating: number | null;
  notes: string | null;
  review: string | null;
  created_at: string;
  updated_at: string;
  purchase_date: string | null;
  play_time: number | null;
  completion_percentage: number | null;
  buy_price: number | null;
  sell_price: number | null;
  edition: string | null;
  edition_other: string | null;
} | null {
  if (!item.games) {
    return null;
  }

  return {
    id: String(item.games.id),
    user_game_id: String(item.id),
    igdb_id: item.games.igdb_id,
    title: item.games.title,
    release_date: item.games.release_date,
    developer: item.games.developer || 'Développeur inconnu',
    publisher: item.games.publisher || 'Éditeur inconnu',
    description_en: item.games.description_en || null,
    description_fr: item.games.description_fr || null,
    cover_url: item.games.cover_url,
    console_id: item.games.console_id,
    console_name: item.games.consoles?.name,
    average_rating: item.games.average_rating || null,
    genres: item.games.game_genres?.map((g) => ({
      id: g.genres?.id || '',
      name: g.genres?.name || ''
    })).filter(g => g.id && g.name) || [],
    status: item.status,
    rating: item.rating !== null && item.rating !== undefined ? Number(item.rating) : null,
    notes: item.notes,
    review: item.review,
    created_at: item.created_at,
    updated_at: item.updated_at,
    purchase_date: item.purchase_date,
    play_time: item.play_time,
    completion_percentage: item.completion_percentage,
    buy_price: item.buy_price,
    sell_price: item.sell_price,
    edition: item.edition ?? null,
    edition_other: item.edition_other ?? null,
  };
}

/**
 * Transforme les données d'un user_game avec ses relations (version asynchrone avec traduction)
 */
export async function transformUserGameItem(item: SupabaseUserGameItem, autoTranslate: boolean = false): Promise<{
  id: string;
  igdb_id: number;
  title: string;
  release_date: string | null;
  developer: string | null;
  publisher: string | null;
  description_en: string | null;
  description_fr: string | null;
  cover_url: string | null;
  console_id: string;
  console_name?: string;
  average_rating: number | null;
  genres: Array<{ id: string; name: string }>;
  status: string;
  rating: number | null;
  notes: string | null;
  review: string | null;
  created_at: string;
  updated_at: string;
  purchase_date: string | null;
  play_time: number | null;
  completion_percentage: number | null;
  buy_price: number | null;
  sell_price: number | null;
} | null> {
  if (!item.games) {
    return null;
  }

  let description_fr = item.games.description_fr || null;

  // Traduction automatique si demandée et pas de description française
  if (autoTranslate && item.games.description_en && !description_fr) {
    try {
      console.log(`🌐 Traduction automatique pour "${item.games.title}"`);
      description_fr = await translateText(item.games.description_en, 'en', 'fr');
    } catch (error) {
      console.warn(`❌ Échec de la traduction pour "${item.games.title}":`, error);
    }
  }

  return {
    id: String(item.games.id),
    igdb_id: item.games.igdb_id,
    title: item.games.title,
    release_date: item.games.release_date,
    developer: item.games.developer || 'Développeur inconnu',
    publisher: item.games.publisher || 'Éditeur inconnu',
    description_en: item.games.description_en || null,
    description_fr: description_fr,
    cover_url: item.games.cover_url,
    console_id: item.games.console_id,
    console_name: item.games.consoles?.name,
    average_rating: item.games.average_rating || null,
    genres: item.games.game_genres?.map((g) => ({
      id: g.genres?.id || '',
      name: g.genres?.name || ''
    })).filter(g => g.id && g.name) || [],
    status: item.status,
    rating: item.rating !== null && item.rating !== undefined ? Number(item.rating) : null,
    notes: item.notes,
    review: item.review,
    created_at: item.created_at,
    updated_at: item.updated_at,
    purchase_date: item.purchase_date,
    play_time: item.play_time,
    completion_percentage: item.completion_percentage,
    buy_price: item.buy_price,
    sell_price: item.sell_price,
  };
}

/**
 * Trie les jeux par titre (ordre alphabétique français)
 */
export function sortGamesByTitle<T extends { title: string }>(games: T[]): T[] {
  return [...games].sort((a, b) => 
    a.title.localeCompare(b.title, 'fr', { 
      numeric: true, 
      sensitivity: 'base' 
    })
  );
}

/**
 * Génère une URL d'image IGDB avec la taille optimale
 * @param imageId L'ID de l'image IGDB
 * @param size La taille souhaitée ('thumb', 'cover_small', 'cover_big', '720p', '1080p')
 * @returns URL de l'image IGDB
 * 
 * Tailles disponibles:
 * - thumb: 90x128 (micro thumbnail)
 * - cover_small: 90x128 (petite couverture)
 * - cover_big: 264x374 (couverture moyenne - ancienne taille par défaut)
 * - 720p: 720x auto (HD - bon compromis qualité/performance)
 * - 1080p: 1080x auto (Full HD - meilleure qualité)
 */
export function getIGDBImageUrl(
  imageId: string,
  size: 'thumb' | 'cover_small' | 'cover_big' | '720p' | '1080p' = '720p'
): string {
  const sizeMap = {
    'thumb': 't_thumb',
    'cover_small': 't_cover_small',
    'cover_big': 't_cover_big',
    '720p': 't_720p',
    '1080p': 't_1080p'
  };
  
  const sizeParam = sizeMap[size];
  return `https://images.igdb.com/igdb/image/upload/${sizeParam}/${imageId}.jpg`;
}

