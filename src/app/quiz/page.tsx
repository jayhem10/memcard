import { Suspense } from 'react';
import { Metadata } from 'next';
import QuizForm from '@/components/quiz/quiz-form';
// Import translation utilities based on your project setup
// If using next-intl
// import { getTranslations } from 'next-intl/server';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Découvrez votre rang | MemCard',
  description: 'Complétez ce quiz pour découvrir votre rang de joueur',
};

// Next.js App Router doesn't use getStaticProps
// Use generateMetadata or other App Router patterns for i18n

export default function QuizPage() {
  return (
    <main className="container max-w-5xl py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Découvrez votre rang</h1>
      <p className="text-center text-muted-foreground mb-8">
        Répondez à ces questions pour découvrir quel type de joueur vous êtes
      </p>
      
      <Suspense fallback={
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <QuizForm />
      </Suspense>
    </main>
  );
}
