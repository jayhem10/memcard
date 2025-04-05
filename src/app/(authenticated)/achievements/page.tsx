import { Suspense } from 'react';
import { Metadata } from 'next';
import AchievementsList from '@/components/achievements/achievements-list';
// Import translation utilities based on your project setup
// If using next-intl
// import { getTranslations } from 'next-intl/server';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Récompenses | MemCard',
  description: 'Découvrez et débloquez des récompenses en fonction de votre collection de jeux',
};

// Next.js App Router doesn't use getStaticProps
// Use generateMetadata or other App Router patterns for i18n

export default function AchievementsPage() {
  return (
    <main className="container max-w-5xl py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Récompenses</h1>
      <p className="text-center text-muted-foreground mb-8">
        Débloquez des récompenses en fonction de votre collection de jeux
      </p>
      
      <Suspense fallback={
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <AchievementsList />
      </Suspense>
    </main>
  );
}
