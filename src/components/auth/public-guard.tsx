'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';

export function PublicGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      // L'utilisateur est déjà connecté, le rediriger vers la page d'accueil
      window.location.href = '/';
    }
  }, [user, isLoading]);

  // Spinner uniquement pendant la redirection d'un utilisateur connecté ;
  // sinon on rend le contenu public dès le SSR (indexable par les moteurs).
  if (user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
