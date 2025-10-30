// src/lib/ebay.ts
// Utilitaires minimalistes pour interroger l'API eBay et calculer des stats de prix

type EbayPriceSample = {
  value: number;
  currency: string;
};

export type EbaySearchParams = {
  title: string;
  platformName?: string;
  regionHint?: 'EUR' | 'PAL';
};

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

// Normaliser le nom de console en format court pour eBay (PS2, PS3, PC, Switch, etc.)
function normalizeConsoleName(consoleName: string | undefined): string | undefined {
  if (!consoleName) return undefined;
  
  const name = consoleName.toLowerCase().trim();
  
  // Mapping des consoles vers leurs abréviations courantes sur eBay FR
  const consoleMap: Record<string, string> = {
    // PlayStation
    'playstation': 'PS',
    'playstation 2': 'PS2',
    'playstation 3': 'PS3',
    'playstation 4': 'PS4',
    'playstation 5': 'PS5',
    'ps': 'PS',
    'ps1': 'PS',
    'ps2': 'PS2',
    'ps3': 'PS3',
    'ps4': 'PS4',
    'ps5': 'PS5',
    // Xbox
    'xbox': 'Xbox',
    'xbox 360': 'Xbox 360',
    'xbox one': 'Xbox One',
    'xbox series': 'Xbox Series',
    // Nintendo moderne
    'nintendo switch': 'Switch',
    'switch': 'Switch',
    'nintendo ds': 'DS',
    'nintendo 3ds': '3DS',
    'game boy advance': 'GBA',
    'gameboy advance': 'GBA',
    'gba': 'GBA',
    'gamecube': 'GameCube',
    'wii': 'Wii',
    'wii u': 'Wii U',
    // Nintendo rétro
    'super nintendo': 'SNES',
    'super nintendo entertainment system': 'SNES',
    'snes': 'SNES',
    'nintendo entertainment system': 'NES',
    'nes': 'NES',
    'nintendo 64': 'N64',
    'n64': 'N64',
    // Sega
    'game gear': 'Game Gear',
    'mega drive': 'Mega Drive',
    'genesis': 'Mega Drive',
    'master system': 'Master System',
    'saturn': 'Saturn',
    'dreamcast': 'Dreamcast',
    // PC et autres
    'pc': 'PC',
    'windows': 'PC',
    'steam deck': 'Steam Deck',
    // Autres
    'atari 2600': 'Atari 2600',
    'neo geo': 'Neo Geo',
  };
  
  // Chercher une correspondance exacte
  if (consoleMap[name]) {
    return consoleMap[name];
  }
  
  // Chercher une correspondance partielle
  for (const [key, value] of Object.entries(consoleMap)) {
    if (name.includes(key) || key.includes(name)) {
      return value;
    }
  }
  
  // Si aucune correspondance, retourner le nom original (on pourrait le raccourcir)
  // Extraire juste le mot principal si c'est un nom long
  const words = consoleName.split(/\s+/);
  if (words.length > 2) {
    // Prendre les 2 derniers mots (ex: "Nintendo Switch" → "Switch")
    return words.slice(-2).join(' ');
  }
  
  return consoleName;
}

function buildQueryTokens({ title, platformName }: EbaySearchParams, opts?: { cib: boolean; includePal: boolean; variant?: 'simple' | 'withConsole' | 'noConsole' }): string {
  const tokens: string[] = [];
  
  // TOUJOURS inclure le titre
  tokens.push(title);
  
  // TOUJOURS inclure la console si disponible (critique pour éviter les résultats erronés)
  // Sauf si explicitement demandé "noConsole" (rare, seulement en dernier recours)
  if (platformName && opts?.variant !== 'noConsole') {
    tokens.push(platformName);
  }
  
  // Pour toutes les variantes, ajouter PAL et CIB si demandés
  if (opts?.includePal) tokens.push('PAL');
  if (opts?.cib) {
    if (opts.variant === 'simple') {
      // Version simple : juste "complet"
      tokens.push('complet');
    } else {
      // Version complète : tous les mots-clés CIB
      tokens.push('complet');
      tokens.push('boite');
      tokens.push('notice');
      tokens.push('CIB');
    }
  }
  
  return encodeURIComponent(tokens.join(' '));
}

function getBearer(): string | undefined {
  return process.env.EBAY_BEARER_TOKEN;
}

function getEbayApiBase(): string {
  const env = (process.env.EBAY_ENV || '').toLowerCase();
  // Utiliser le domaine sandbox si EBAY_ENV=sandbox, sinon production
  return env === 'sandbox' ? 'https://api.sandbox.ebay.com' : 'https://api.ebay.com';
}

function getMarketplaceId(): string {
  // Permettre override manuel si besoin
  const override = process.env.EBAY_MARKETPLACE_ID;
  if (override) return override;
  const env = (process.env.EBAY_ENV || '').toLowerCase();
  // En sandbox, EBAY_FR n'est pas supporté; utiliser EBAY_US
  return env === 'sandbox' ? 'EBAY_US' : 'EBAY_FR';
}

async function getOAuthToken(): Promise<string> {
  // 1) Si EBAY_BEARER_TOKEN est présent, on l'utilise (pratique en dev/tests)
  const staticBearer = getBearer();
  if (staticBearer) return staticBearer;

  // 2) Sinon, on génère un token via client credentials
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('EBAY_CLIENT_ID/EBAY_CLIENT_SECRET manquants et aucun EBAY_BEARER_TOKEN fourni');
  }

  // Cache mémoire simple pour éviter de redemander à chaque requête
  const now = Date.now();
  if (cachedAccessToken && now < cachedAccessToken.expiresAt - 60_000) {
    // encore valable (1 minute de marge)
    return cachedAccessToken.token;
  }

  const base = getEbayApiBase();
  const tokenUrl = `${base}/identity/v1/oauth2/token`;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  // Le scope est le même pour sandbox ET production
  const scope = 'https://api.ebay.com/oauth/api_scope';

  const resp = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: `grant_type=client_credentials&scope=${scope}`,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`eBay OAuth error: ${resp.status} - ${text}`);
  }

  const data: any = await resp.json();
  const token: string | undefined = data?.access_token;
  const expiresIn: number = Number(data?.expires_in || 0);
  if (!token || !expiresIn) {
    throw new Error('Réponse OAuth eBay invalide');
  }

  cachedAccessToken = {
    token,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  return token;
}

// NOTE: L'API "marketplace insights" sold items est la plus adaptée,
// mais peut nécessiter des accès partenaires. On tente d'abord le Browse API
// comme fallback pour un MVP, sachant que ce ne sont pas des ventes terminées.
export async function fetchEbayPriceSamples(params: EbaySearchParams): Promise<{used: EbayPriceSample[], new: EbayPriceSample[]}> {
  const bearer = await getOAuthToken();

  const base = getEbayApiBase();

  async function searchOnce(q: string, requireComplete: boolean, priceCurrency: 'EUR' | 'USD' = 'EUR', requireCondition: boolean = true, conditionType: 'USED' | 'NEW' | 'ANY' = 'USED', attempt = 1, offset = 0, limit = 200): Promise<EbayPriceSample[]> {
    // Construire le filtre : condition optionnelle
    let conditionFilter = '';
    if (requireCondition && conditionType !== 'ANY') {
      conditionFilter = `,conditions:{${conditionType}}`;
    }
    // Maximum 200 par requête eBay
    const effectiveLimit = Math.min(limit, 200);
    const endpoint = `${base}/buy/browse/v1/item_summary/search?q=${q}&limit=${effectiveLimit}&offset=${offset}&filter=priceCurrency:${priceCurrency}${conditionFilter}`;
    const resp = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${bearer}`,
        'Content-Type': 'application/json',
        'X-EBAY-C-MARKETPLACE-ID': getMarketplaceId(),
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      // Considérer 400/404 comme "aucun résultat utilisable" => renvoyer [] pour être traité en "skipped"
      if (resp.status === 400 || resp.status === 404) {
        return [];
      }
      // Si 401, retenter une fois en régénérant un token (cache invalide ou expiré)
      if (resp.status === 401 && attempt === 1) {
        cachedAccessToken = null;
        const fresh = await getOAuthToken();
        const retry = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${fresh}`,
            'Content-Type': 'application/json',
            'X-EBAY-C-MARKETPLACE-ID': getMarketplaceId(),
          },
        });
        if (!retry.ok) {
          const t2 = await retry.text();
          if (retry.status === 400 || retry.status === 404) return [];
          throw new Error(`eBay API error ${retry.status}: ${t2}`);
        }
        const jd2 = await retry.json();
        const items2: any[] = Array.isArray(jd2?.itemSummaries) ? jd2.itemSummaries : [];
        return items2
          .map((it) => {
            const priceValue = parseFloat(it?.price?.value);
            const currency = it?.price?.currency || 'EUR';
            const title: string = (it?.title || '').toLowerCase();
            const isComplete = title.includes('complet') || title.includes('cib') || (title.includes('boite') && title.includes('notice'));
            const isCorrectCurrency = currency === priceCurrency;
            
            // Conditions assouplies : accepter "used", "occasion", "très bon état", etc. OU "new", "neuf", etc.
            const conditionStr = (it?.condition || '').toLowerCase();
            const usedKeywords = ['used', 'occasion', 'très bon', 'très bon état', 'bon état', 'bon', 'état correct', 'correct', 'acceptable'];
            const newKeywords = ['new', 'neuf', 'comme neuf'];
            
            // Si requireCondition est false, accepter tous les résultats (même sans condition claire)
            let hasValidCondition = true;
            if (requireCondition) {
              if (conditionType === 'NEW') {
                hasValidCondition = newKeywords.some(keyword => conditionStr.includes(keyword));
              } else if (conditionType === 'USED') {
                hasValidCondition = usedKeywords.some(keyword => conditionStr.includes(keyword)) || conditionStr === ''; // Accepter aussi si pas de condition
              } else if (conditionType === 'ANY') {
                hasValidCondition = usedKeywords.some(keyword => conditionStr.includes(keyword)) || 
                                  newKeywords.some(keyword => conditionStr.includes(keyword)) ||
                                  conditionStr === ''; // Accepter aussi si pas de condition
              }
            }
            
            const passComplete = requireComplete ? isComplete : true;
            if (isFinite(priceValue) && isCorrectCurrency && hasValidCondition && passComplete) {
              return { value: priceValue, currency } as EbayPriceSample;
            }
            return null;
          })
          .filter(Boolean) as EbayPriceSample[];
      }
      // Pour 403/429/5xx: remonter l'erreur pour être compté en "error"
      throw new Error(`eBay API error ${resp.status}: ${text}`);
    }

    const data = await resp.json();
    const items: any[] = Array.isArray(data?.itemSummaries) ? data.itemSummaries : [];

    const samples: EbayPriceSample[] = items
      .map((it) => {
        const priceValue = parseFloat(it?.price?.value);
        const currency = it?.price?.currency || 'EUR';
        const title: string = (it?.title || '').toLowerCase();
        const isComplete = title.includes('complet') || title.includes('cib') || (title.includes('boite') && title.includes('notice'));
        const isCorrectCurrency = currency === priceCurrency;
        
        // Conditions assouplies : accepter "used", "occasion", "très bon état", etc. OU "new", "neuf", etc.
        const conditionStr = (it?.condition || '').toLowerCase();
        const usedKeywords = ['used', 'occasion', 'très bon', 'très bon état', 'bon état', 'bon', 'état correct', 'correct', 'acceptable'];
        const newKeywords = ['new', 'neuf', 'comme neuf'];
        
        // Si requireCondition est false, accepter tous les résultats (même sans condition claire)
        let hasValidCondition = true;
        if (requireCondition) {
          if (conditionType === 'NEW') {
            hasValidCondition = newKeywords.some(keyword => conditionStr.includes(keyword));
          } else if (conditionType === 'USED') {
            hasValidCondition = usedKeywords.some(keyword => conditionStr.includes(keyword)) || conditionStr === ''; // Accepter aussi si pas de condition
          } else if (conditionType === 'ANY') {
            hasValidCondition = usedKeywords.some(keyword => conditionStr.includes(keyword)) || 
                              newKeywords.some(keyword => conditionStr.includes(keyword)) ||
                              conditionStr === ''; // Accepter aussi si pas de condition
          }
        }
        
        const passComplete = requireComplete ? isComplete : true;
        if (isFinite(priceValue) && isCorrectCurrency && hasValidCondition && passComplete) {
          return { value: priceValue, currency } as EbayPriceSample;
        }
        return null;
      })
      .filter(Boolean) as EbayPriceSample[];

    return samples;
  }

  // Fonction helper pour récupérer plusieurs pages et avoir au moins 20-30 échantillons
  async function searchWithPagination(q: string, requireComplete: boolean, priceCurrency: 'EUR' | 'USD', requireCondition: boolean, conditionType: 'USED' | 'NEW' | 'ANY', minSamples = 20): Promise<EbayPriceSample[]> {
    let allSamples: EbayPriceSample[] = [];
    let offset = 0;
    const limitPerPage = 200;
    const maxPages = 5; // Maximum 5 pages (1000 résultats)
    
    for (let page = 0; page < maxPages && allSamples.length < minSamples; page++) {
      const pageResults = await searchOnce(q, requireComplete, priceCurrency, requireCondition, conditionType, 1, offset, limitPerPage);
      
      if (pageResults.length === 0) break; // Plus de résultats disponibles
      
      allSamples = [...allSamples, ...pageResults];
      offset += pageResults.length;
      
      // Si on a moins que la limite, on a récupéré tous les résultats disponibles
      // eBay retourne max 200 par page, donc si on a < 200, on a tout
      if (pageResults.length < limitPerPage) break;
    }
    
    // Dédupliquer par valeur ET par URL (au cas où même prix mais annonces différentes)
    const unique = new Map<string, EbayPriceSample>();
    for (const sample of allSamples) {
      unique.set(`${sample.value}-${sample.currency}`, sample);
    }
    
    return Array.from(unique.values());
  }
  
  // Fonction helper pour filtrer les prix aberrants (jeux neufs dans échantillons occasion)
  function filterOutliers(samples: EbayPriceSample[], isUsed: boolean): EbayPriceSample[] {
    if (samples.length < 5) return samples; // Pas assez d'échantillons pour filtrer
    
    const values = samples.map(s => s.value).sort((a, b) => a - b);
    const q1Index = Math.floor(values.length * 0.25);
    const q3Index = Math.floor(values.length * 0.75);
    const q1 = values[q1Index];
    const q3 = values[q3Index];
    const median = values[Math.floor(values.length / 2)];
    const iqr = q3 - q1;
    
    // Pour les échantillons occasion : exclure ceux > 2.5x la médiane (probablement neufs)
    // Pour les échantillons neufs : exclure ceux < 0.5x la médiane (probablement occasion)
    const upperBound = isUsed ? median * 2.5 : q3 + 1.5 * iqr;
    const lowerBound = isUsed ? q1 - 1.5 * iqr : median * 0.5;
    
    return samples.filter(s => s.value >= lowerBound && s.value <= upperBound);
  }

  // Stratégie best-effort: adaptée selon le marketplace
  const marketplace = getMarketplaceId();
  const priceCurrency: 'EUR' | 'USD' = marketplace === 'EBAY_US' ? 'USD' : 'EUR';
  const isEBayFR = marketplace === 'EBAY_FR';
  
  let samples: EbayPriceSample[] = [];
  const minSamplesDesired = 20; // Objectif: au moins 20 échantillons pour un calcul fiable
  
  // Normaliser le nom de console en format court pour eBay
  const shortConsoleName = normalizeConsoleName(params.platformName);
  
  if (isEBayFR) {
    // Stratégie simplifiée pour eBay FR : juste titre + console courte
    // 1) Recherche simple avec pagination: titre + console courte + condition USED
    const qSimple = shortConsoleName 
      ? encodeURIComponent(`${params.title} ${shortConsoleName}`)
      : encodeURIComponent(params.title);
    samples = await searchWithPagination(qSimple, false, priceCurrency, true, 'USED', minSamplesDesired);
    
    // 2) Si < 20 résultats, essayer sans condition (pour avoir plus d'échantillons)
    if (samples.length < minSamplesDesired) {
      const more = await searchWithPagination(qSimple, false, priceCurrency, false, 'ANY', minSamplesDesired - samples.length);
      samples = [...samples, ...more];
      samples = Array.from(new Map(samples.map(s => [s.value, s])).values());
    }
    
    // 3) Si toujours < 20, essayer avec console originale si différente de courte
    if (samples.length < minSamplesDesired && params.platformName && shortConsoleName !== params.platformName.toLowerCase().trim()) {
      const qFull = encodeURIComponent(`${params.title} ${params.platformName}`);
      const more = await searchWithPagination(qFull, false, priceCurrency, false, 'ANY', minSamplesDesired - samples.length);
      samples = [...samples, ...more];
      samples = Array.from(new Map(samples.map(s => [s.value, s])).values());
    }
    
    // 4) Dernier recours: essayer SANS console si vraiment pas assez
    if (samples.length < minSamplesDesired && params.platformName) {
      const qNoConsole = encodeURIComponent(params.title);
      const more = await searchWithPagination(qNoConsole, false, priceCurrency, false, 'ANY', minSamplesDesired - samples.length);
      samples = [...samples, ...more];
      samples = Array.from(new Map(samples.map(s => [s.value, s])).values());
    }
    
    // Filtrer les prix aberrants (jeux neufs dans échantillons occasion)
    samples = filterOutliers(samples, true);
  } else {
    // Stratégie complète pour autres marketplaces (US, etc.)
    // 1) Recherche stricte: titre + console + PAL + CIB complet + condition USED
    const qStrict = buildQueryTokens(params, { cib: true, includePal: true, variant: 'withConsole' });
    samples = await searchWithPagination(qStrict, true, priceCurrency, true, 'USED', minSamplesDesired);
    
    // 2) Si < 20 résultats, essayer avec console mais PAL relâché + condition assouplie
    if (samples.length < minSamplesDesired) {
      const qLoosePal = buildQueryTokens(params, { cib: true, includePal: false, variant: 'withConsole' });
      const more = await searchWithPagination(qLoosePal, false, priceCurrency, true, 'USED', minSamplesDesired - samples.length);
      samples = [...samples, ...more];
      samples = Array.from(new Map(samples.map(s => [s.value, s])).values());
    }
    
    // 3) Si toujours < 20, essayer sans CIB mais avec console + condition assouplie
    if (samples.length < minSamplesDesired) {
      const qNoCib = buildQueryTokens(params, { cib: false, includePal: false, variant: 'simple' });
      const more = await searchWithPagination(qNoCib, false, priceCurrency, true, 'USED', minSamplesDesired - samples.length);
      samples = [...samples, ...more];
      samples = Array.from(new Map(samples.map(s => [s.value, s])).values());
    }
    
    // 4) Si toujours < 20, essayer titre + console seulement (sans PAL/CIB) + condition optionnelle
    if (samples.length < minSamplesDesired) {
      const qMinimal = buildQueryTokens(params, { cib: false, includePal: false, variant: 'simple' });
      const more = await searchWithPagination(qMinimal, false, priceCurrency, false, 'ANY', minSamplesDesired - samples.length);
      samples = [...samples, ...more];
      samples = Array.from(new Map(samples.map(s => [s.value, s])).values());
    }
    
    // 5) Recherche finale: titre + console seulement (sans aucun autre mot-clé) + sans condition
    if (samples.length < minSamplesDesired) {
      const qMinimal = params.platformName 
        ? encodeURIComponent(`${params.title} ${params.platformName}`)
        : encodeURIComponent(params.title);
      const more = await searchWithPagination(qMinimal, false, priceCurrency, false, 'ANY', minSamplesDesired - samples.length);
      samples = [...samples, ...more];
      samples = Array.from(new Map(samples.map(s => [s.value, s])).values());
    }
    
    // 6) Fallback: si marketplace US et toujours < 20, essayer aussi EUR avec titre + console
    if (samples.length < minSamplesDesired && priceCurrency === 'USD') {
      const qEUR = params.platformName 
        ? encodeURIComponent(`${params.title} ${params.platformName}`)
        : encodeURIComponent(params.title);
      const more = await searchWithPagination(qEUR, false, 'EUR', false, 'ANY', minSamplesDesired - samples.length);
      samples = [...samples, ...more];
      samples = Array.from(new Map(samples.map(s => [s.value, s])).values());
    }
    
    // Filtrer les prix aberrants (jeux neufs dans échantillons occasion)
    samples = filterOutliers(samples, true);
  }
  
  // 8) Recherche spécifique pour jeux NEUFS (en parallèle)
  let newSamples: EbayPriceSample[] = [];
  if (isEBayFR) {
    // Pour eBay FR : juste titre + console courte avec pagination
    const qNew = shortConsoleName 
      ? encodeURIComponent(`${params.title} ${shortConsoleName}`)
      : encodeURIComponent(params.title);
    newSamples = await searchWithPagination(qNew, false, priceCurrency, true, 'NEW', 10);
    
    // Si peu de résultats neufs, essayer sans condition
    if (newSamples.length < 10) {
      const more = await searchWithPagination(qNew, false, priceCurrency, false, 'ANY', 20 - newSamples.length);
      // Filtrer pour garder seulement les nouveaux (prix > médiane occasion * 1.5)
      const usedMedian = samples.length > 0 ? samples.map(s => s.value).sort((a, b) => a - b)[Math.floor(samples.length / 2)] : 0;
      const filtered = more.filter(s => {
        return usedMedian > 0 && s.value > usedMedian * 1.5; // Prix neuf généralement 50%+ plus cher
      });
      newSamples = [...newSamples, ...filtered];
    }
    
    // Filtrer les prix aberrants (jeux occasion dans échantillons neufs)
    newSamples = filterOutliers(newSamples, false);
  } else {
    // Pour autres marketplaces : utiliser buildQueryTokens avec pagination
    const qNew = buildQueryTokens(params, { cib: false, includePal: false, variant: 'simple' });
    newSamples = await searchWithPagination(qNew, false, priceCurrency, true, 'NEW', 10);
    
    // Si peu de résultats neufs, essayer sans condition
    if (newSamples.length < 10) {
      const more = await searchWithPagination(qNew, false, priceCurrency, false, 'ANY', 20 - newSamples.length);
      // Filtrer pour garder seulement les nouveaux
      const usedMedian = samples.length > 0 ? samples.map(s => s.value).sort((a, b) => a - b)[Math.floor(samples.length / 2)] : 0;
      const filtered = more.filter(s => {
        return usedMedian > 0 && s.value > usedMedian * 1.5; // Prix neuf généralement 50%+ plus cher
      });
      newSamples = [...newSamples, ...filtered];
    }
    
    // Filtrer les prix aberrants (jeux occasion dans échantillons neufs)
    newSamples = filterOutliers(newSamples, false);
  }
  
  // Dédupliquer par valeur (éviter les doublons si même prix)
  const unique = Array.from(new Map(samples.map(s => [s.value, s])).values());
  const uniqueNew = Array.from(new Map(newSamples.map(s => [s.value, s])).values());
  
  // Retourner un objet avec used et new séparés
  return {
    used: unique,
    new: uniqueNew,
  };
}

export function summarizePrices(samples: EbayPriceSample[], newSamples?: EbayPriceSample[]) {
  if (!samples.length) return null;
  
  // Séparer EUR et USD
  const eurSamples = samples.filter(s => s.currency === 'EUR');
  const usdSamples = samples.filter(s => s.currency === 'USD');
  
  // Taux de change approximatif (1 USD ≈ 0.92 EUR)
  const USD_TO_EUR = 0.92;
  
  // Convertir tout en EUR pour calcul homogène
  let allValuesInEUR = samples.map(s => {
    return s.currency === 'USD' ? s.value * USD_TO_EUR : s.value;
  }).sort((a, b) => a - b);
  
  // Filtrer les outliers (valeurs aberrantes) si on a assez d'échantillons
  if (allValuesInEUR.length >= 5) {
    // Calculer Q1 (premier quartile) et Q3 (troisième quartile)
    const q1Index = Math.floor(allValuesInEUR.length * 0.25);
    const q3Index = Math.floor(allValuesInEUR.length * 0.75);
    const q1 = allValuesInEUR[q1Index];
    const q3 = allValuesInEUR[q3Index];
    const iqr = q3 - q1; // Interquartile Range
    
    // Filtrer les valeurs en dehors de [Q1 - 1.5*IQR, Q3 + 1.5*IQR]
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    allValuesInEUR = allValuesInEUR.filter(v => v >= lowerBound && v <= upperBound);
  }
  
  // Re-trier après filtrage
  allValuesInEUR.sort((a, b) => a - b);
  
  if (allValuesInEUR.length === 0) return null;
  
  // Calculer statistiques robustes
  const min = allValuesInEUR[0];
  const max = allValuesInEUR[allValuesInEUR.length - 1];
  
  // Utiliser la médiane pour la moyenne (plus robuste aux outliers)
  const median = allValuesInEUR.length % 2 === 0
    ? (allValuesInEUR[allValuesInEUR.length / 2 - 1] + allValuesInEUR[allValuesInEUR.length / 2]) / 2
    : allValuesInEUR[Math.floor(allValuesInEUR.length / 2)];
  
  // Utiliser moyenne trimmed (exclure 10% des valeurs extrêmes) si possible
  let avg: number;
  if (allValuesInEUR.length >= 10) {
    const trimCount = Math.floor(allValuesInEUR.length * 0.1);
    const trimmed = allValuesInEUR.slice(trimCount, allValuesInEUR.length - trimCount);
    avg = trimmed.reduce((acc, v) => acc + v, 0) / trimmed.length;
  } else {
    // Sinon utiliser la moyenne classique
    avg = allValuesInEUR.reduce((acc, v) => acc + v, 0) / allValuesInEUR.length;
  }

  // Utiliser EUR comme devise principale (ou USD si seulement USD)
  const dominantCurrency = eurSamples.length >= usdSamples.length ? 'EUR' : 'USD';
  
  // Calculer le prix neuf si des échantillons neufs sont fournis
  let newPrice = 0;
  if (newSamples && newSamples.length > 0) {
    const newValues = newSamples.map(s => {
      return s.currency === 'USD' ? s.value * USD_TO_EUR : s.value;
    }).sort((a, b) => a - b);
    
    // Filtrer les outliers pour les prix neufs aussi
    if (newValues.length >= 5) {
      const q1Index = Math.floor(newValues.length * 0.25);
      const q3Index = Math.floor(newValues.length * 0.75);
      const q1 = newValues[q1Index];
      const q3 = newValues[q3Index];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      const filtered = newValues.filter(v => v >= lowerBound && v <= upperBound);
      if (filtered.length > 0) {
        newPrice = filtered.length >= 10
          ? (() => {
              const trimCount = Math.floor(filtered.length * 0.1);
              const trimmed = filtered.slice(trimCount, filtered.length - trimCount);
              return trimmed.reduce((acc, v) => acc + v, 0) / trimmed.length;
            })()
          : filtered.reduce((acc, v) => acc + v, 0) / filtered.length;
      }
    } else {
      newPrice = newValues.reduce((acc, v) => acc + v, 0) / newValues.length;
    }
  }
  
  return {
    min_price: min,
    max_price: max,
    average_price: avg,
    new_price: newPrice,
    currency: dominantCurrency,
  };
}


