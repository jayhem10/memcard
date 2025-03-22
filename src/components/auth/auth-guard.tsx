'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // L'utilisateur n'est pas connecté, le rediriger vers la page de login
        window.location.href = '/login';
      } else {
        setIsAuthenticated(true);
      }
    }
  }, [user, isLoading]);

  // Pendant le chargement ou si l'utilisateur n'est pas authentifié, on ne montre rien
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si l'utilisateur est authentifié, on affiche le contenu
  return <>{children}</>;
}