import { Metadata } from 'next';
import { Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Accès refusé | MemCard',
  description: 'Cette fonctionnalité est temporairement indisponible',
};

export default function AchievementsPage() {
  return (
    <main className="container max-w-2xl py-20">
      <div className="text-center">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <Lock className="h-12 w-12 text-muted-foreground" />
        </div>
        
        <h1 className="text-4xl font-bold mb-4">Accès refusé</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Cette fonctionnalité est temporairement indisponible.
        </p>
        
        <Link href="/">
          <Button className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Button>
        </Link>
      </div>
    </main>
  );
}
