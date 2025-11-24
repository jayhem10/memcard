import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const locales = ['fr', 'en'] as const;
export const defaultLocale = 'fr';

// Configuration pour le routing avec préfixes de langue
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always' // Toujours afficher le préfixe de langue
});

// Navigation
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
