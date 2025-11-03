'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';

export function PublicGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // L'utilisateur est déjà connecté, le rediriger vers la page d'accueil
        window.location.href = '/';
      } else {
        setIsPublic(true);
      }
    }
  }, [user, isLoading]);

  // Pendant le chargement ou si la redirection est en cours, on affiche un spinner
  if (isLoading || !isPublic) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié, on affiche le contenu public
  return <>{children}</>;
}
