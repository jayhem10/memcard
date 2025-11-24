import { Suspense } from 'react';
import { Metadata } from 'next';
import QuizForm from '@/components/quiz/quiz-form';
import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'quiz' });

  return {
    title: `${t('discoverYourRank')} | MemCard`,
    description: t('discoverRankDescription'),
  };
}

// Next.js App Router doesn't use getStaticProps
// Use generateMetadata or other App Router patterns for i18n

export default function QuizPage() {
  return (
    <QuizPageClient />
  );
}

function QuizPageClient() {
  const t = useTranslations('quiz');

  return (
    <main className="container max-w-5xl py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">{t('quizTitle')}</h1>
      <p className="text-center text-muted-foreground mb-8">
        {t('quizDescription')}
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
