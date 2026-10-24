import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n/routing';

// Seules les pages accessibles sans connexion sont listées : les autres
// redirigent vers /login et seraient signalées en erreur par Google.
const publicPaths = ['', '/login'];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.memcard.fr';
  const lastModified = new Date();

  return publicPaths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${path}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.9,
      alternates: {
        languages: Object.fromEntries([
          ...locales.map((l) => [l, `${baseUrl}/${l}${path}`]),
          ['x-default', `${baseUrl}/fr${path}`],
        ]),
      },
    }))
  );
}
