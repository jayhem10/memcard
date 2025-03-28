'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

// Définir le type pour le contexte d'authentification
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

// Créer le contexte avec des valeurs par défaut
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => useContext(AuthContext);

// Provider pour envelopper l'application
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  // Gérer la déconnexion
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast.success('Vous avez été déconnecté');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la déconnexion');
    }
  };

  // Fonction pour gérer la redirection
  const handleRedirection = (user: User | null, event?: string) => {
    const pathname = window.location.pathname;
    
    if (user && pathname === '/login') {
      window.location.href = '/';
    } else if (!user && pathname !== '/login') {
      window.location.href = '/login';
    }
  };

  // Vérifier l'état de la session utilisateur au chargement du composant
  useEffect(() => {
    // Abonnement aux changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const newUser = session?.user ?? null;
        setUser(newUser);
        setIsLoading(false);
        
        // Rediriger l'utilisateur en fonction de l'événement
        handleRedirection(newUser, event);
      }
    );

    // Vérifier la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsLoading(false);
      
      // Rediriger dès la vérification initiale
      setTimeout(() => {
        handleRedirection(currentUser);
      }, 100); // Petit délai pour s'assurer que le routeur est initialisé
    });

    // Nettoyer l'abonnement à la déconnexion du composant
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Fournir le contexte aux composants enfants
  return (
    <AuthContext.Provider value={{ user, isLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}