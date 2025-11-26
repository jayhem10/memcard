// Traductions des noms de plateformes/consoles
export const platformTranslations: Record<string, string> = {
  // Consoles Nintendo
  'Nintendo Entertainment System': 'Nintendo Entertainment System',
  'Super Nintendo Entertainment System': 'Super Nintendo',
  'Nintendo 64': 'Nintendo 64',
  'GameCube': 'GameCube',
  'Wii': 'Wii',
  'Wii U': 'Wii U',
  'Nintendo Switch': 'Nintendo Switch',
  'Nintendo 3DS': 'Nintendo 3DS',
  'Nintendo DS': 'Nintendo DS',
  'Game Boy': 'Game Boy',
  'Game Boy Color': 'Game Boy Color',
  'Game Boy Advance': 'Game Boy Advance',
  'Nintendo DSi': 'Nintendo DSi',

  // Sony PlayStation
  'PlayStation': 'PlayStation',
  'PlayStation 2': 'PlayStation 2',
  'PlayStation 3': 'PlayStation 3',
  'PlayStation 4': 'PlayStation 4',
  'PlayStation 5': 'PlayStation 5',
  'PlayStation Portable': 'PSP',
  'PlayStation Vita': 'PS Vita',

  // Microsoft Xbox
  'Xbox': 'Xbox',
  'Xbox 360': 'Xbox 360',
  'Xbox One': 'Xbox One',
  'Xbox Series X|S': 'Xbox Series X|S',

  // Sega
  'Sega Mega Drive': 'Mega Drive',
  'Sega Genesis': 'Genesis',
  'Sega Saturn': 'Saturn',
  'Sega Dreamcast': 'Dreamcast',
  'Sega Master System': 'Master System',
  'Sega Game Gear': 'Game Gear',

  // Autres
  'PC (Microsoft Windows)': 'PC',
  'Mac': 'Mac',
  'Linux': 'Linux',
  'Android': 'Android',
  'iOS': 'iOS',
  'Neo Geo': 'Neo Geo',
  'Neo Geo Pocket': 'Neo Geo Pocket',
  'WonderSwan': 'WonderSwan',
  'Atari 2600': 'Atari 2600',
  'Atari 5200': 'Atari 5200',
  'Atari 7800': 'Atari 7800',
  'Commodore 64': 'Commodore 64',
  'Amiga': 'Amiga',
  'ZX Spectrum': 'ZX Spectrum',
  'Amstrad CPC': 'Amstrad CPC',
};

// Traductions des noms de genres
export const genreTranslations: Record<string, string> = {
  // Genres principaux
  'Action': 'Action',
  'Adventure': 'Aventure',
  'Role-playing (RPG)': 'RPG',
  'Strategy': 'Stratégie',
  'Simulation': 'Simulation',
  'Sports': 'Sport',
  'Racing': 'Course',
  'Fighting': 'Combat',
  'Puzzle': 'Puzzle',
  'Platform': 'Plateforme',
  'Shooter': 'Tir',

  // Sous-genres et autres
  'Hack and slash/Beat \'em up': 'Beat \'em up',
  'Point-and-click': 'Point & Click',
  'Real Time Strategy (RTS)': 'Stratégie temps réel',
  'Turn-based strategy (TBS)': 'Stratégie au tour par tour',
  'Tactical': 'Tactique',
  'Life sim': 'Simulation de vie',
  'Vehicle sim': 'Simulation de véhicule',
  'Card & Board Game': 'Jeu de cartes & plateau',
  'MOBA': 'MOBA',
  'Battle Royale': 'Battle Royale',
  'MMORPG': 'MMORPG',
  'Roguelike': 'Roguelike',
  'Metroidvania': 'Metroidvania',
  'Visual Novel': 'Visual Novel',
  'Dating Sim': 'Dating Sim',
  'Survival': 'Survie',
  'Horror': 'Horreur',
  'Stealth': 'Infiltration',
  'Music': 'Musique',
  'Party': 'Fête',
  'Trivia/Board game': 'Quiz/Jeu de société',
  'Arcade': 'Arcade',
  'Indie': 'Indépendant',
};

// Fonction pour traduire un nom de plateforme
export function translatePlatform(name: string, locale: string = 'fr'): string {
  if (locale === 'fr') {
    return platformTranslations[name] || name;
  }
  return name; // Retourner le nom original pour les autres langues
}

// Fonction pour traduire un nom de genre
export function translateGenre(name: string, locale: string = 'fr'): string {
  if (locale === 'fr') {
    return genreTranslations[name] || name;
  }
  return name; // Retourner le nom original pour les autres langues
}
