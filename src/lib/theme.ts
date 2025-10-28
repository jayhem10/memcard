'use client';

export type Theme = 'light' | 'dark' | 'cyberpunk' | 'retro' | 'fantasy' | 'nintendo' | 'playstation' | 'xbox';

export interface ThemeConfig {
  name: string;
  value: Theme;
  icon: 'sun' | 'moon' | 'zap' | 'gamepad' | 'sword' | 'circle' | 'square' | 'x';
  description: string;
}

export const themes: ThemeConfig[] = [
  {
    name: 'Clair',
    value: 'light',
    icon: 'sun',
    description: 'Thème clair par défaut'
  },
  {
    name: 'Sombre',
    value: 'dark',
    icon: 'moon',
    description: 'Thème sombre par défaut'
  },
  {
    name: 'Cyberpunk',
    value: 'cyberpunk',
    icon: 'zap',
    description: 'Style futuriste et néon'
  },
  {
    name: 'Rétro',
    value: 'retro',
    icon: 'gamepad',
    description: 'Style console rétro'
  },
  {
    name: 'Fantasy',
    value: 'fantasy',
    icon: 'sword',
    description: 'Thème médiéval et fantastique'
  },
  {
    name: 'Nintendo',
    value: 'nintendo',
    icon: 'circle',
    description: 'Style Nintendo'
  },
  {
    name: 'PlayStation',
    value: 'playstation',
    icon: 'square',
    description: 'Style PlayStation'
  },
  {
    name: 'Xbox',
    value: 'xbox',
    icon: 'x',
    description: 'Style Xbox'
  }
];
