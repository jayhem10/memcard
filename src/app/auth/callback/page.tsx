'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // La fonction setSession est automatiquement appelée par Supabase
      // lorsqu'un utilisateur est redirigé vers cette page avec un code d'auth
      const { error } = await supabase.auth.getSession();

      if (error) {
        console.error('Erreur lors de l\'authentification:', error);
        router.push('/login?error=Échec de l\'authentification');
        return;
      }

      // Succès de l'authentification, rediriger vers la page d'accueil
      console.log('Authentification réussie, redirection vers la page d\'accueil');
      router.push('/');
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Authentification en cours...</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    </div>
  );
}
