/**
 * Composant pour ajouter des données structurées Schema.org
 * Améliore le SEO et l'affichage dans les résultats de recherche Google
 */

export function WebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MemCard',
    alternateName: 'MemCard - Gestion de Collection de Jeux Vidéo',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.memcard.fr',
    description: 'Gérez et suivez votre collection de jeux vidéo avec MemCard. Catalogue complet, suivi des prix, liste de souhaits et bien plus encore.',
    inLanguage: 'fr-FR',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.memcard.fr'}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MemCard',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.memcard.fr',
    logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.memcard.fr'}/icon-512x512.png`,
    description: 'Plateforme de gestion de collection de jeux vidéo',
    sameAs: [
      'https://www.instagram.com/memcard.fr',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebApplicationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'MemCard',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.memcard.fr',
    applicationCategory: 'Entertainment',
    operatingSystem: 'All',
    description: 'Gérez et suivez votre collection de jeux vidéo avec MemCard. Catalogue complet, suivi des prix, liste de souhaits et bien plus encore.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface GameSchemaProps {
  name: string;
  image?: string;
  releaseDate?: string;
  description?: string;
  genre?: string[];
  platform?: string[];
  publisher?: string;
  developer?: string;
  aggregateRating?: {
    ratingValue: number;
    ratingCount: number;
  };
}

export function VideoGameSchema({
  name,
  image,
  releaseDate,
  description,
  genre = [],
  platform = [],
  publisher,
  developer,
  aggregateRating,
}: GameSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name,
    ...(image && { image }),
    ...(releaseDate && { datePublished: releaseDate }),
    ...(description && { description }),
    ...(genre.length > 0 && { genre }),
    ...(platform.length > 0 && { gamePlatform: platform }),
    ...(publisher && { publisher: { '@type': 'Organization', name: publisher } }),
    ...(developer && { author: { '@type': 'Organization', name: developer } }),
    ...(aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: aggregateRating.ratingValue,
        ratingCount: aggregateRating.ratingCount,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

