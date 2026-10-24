import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    title: t('loginTitle'),
    description: t('loginDescription'),
    alternates: {
      canonical: `/${locale}/login`,
      languages: {
        fr: '/fr/login',
        en: '/en/login',
        'x-default': '/fr/login',
      },
    },
    openGraph: {
      url: `/${locale}/login`,
      title: t('loginTitle'),
      description: t('loginDescription'),
    },
  };
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
