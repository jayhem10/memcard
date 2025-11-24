'use client';

import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error('Error occurred:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4">
      <h2 className="text-2xl font-bold mb-4">Quelque chose s'est mal passé</h2>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        Une erreur est survenue. Vous pouvez essayer de réinitialiser la page ou revenir à l'accueil.
      </p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => reset()}>
          Réessayer
        </Button>
        <Button onClick={() => window.location.href = '/'}>
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
}
