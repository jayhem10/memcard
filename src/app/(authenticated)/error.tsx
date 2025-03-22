'use client';

import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function AuthenticatedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error('Authenticated route error:', error);
  }, [error]);

  return (
    <div className="container mx-auto flex flex-col items-center justify-center py-20 px-4">
      <h2 className="text-2xl font-bold mb-4">Une erreur est survenue</h2>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        Désolé, une erreur s'est produite lors du chargement de cette page.
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
