'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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

  // Fonction utilitaire pour vérifier si une route est publique
  const isPublicRoute = (pathname: string): boolean => {
    const publicRoutes = ['/login', '/auth/callback', '/update-password'];
    const isPublic = publicRoutes.some(route => pathname === route);
    const isSharedWishlist = pathname.startsWith('/wishlist/') && pathname !== '/wishlist';
    return isPublic || isSharedWishlist;
  };

  // Gérer la déconnexion
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast.success('Vous avez été déconnecté');
      router.push('/login');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la déconnexion';
      toast.error(errorMessage);
    }
  };

  // Fonction pour gérer la redirection
  const handleRedirection = useCallback((user: User | null) => {
    if (typeof window === 'undefined') return;

    const pathname = window.location.pathname;

    // Ne pas rediriger si on est sur la page de reset de mot de passe
    if (pathname === '/update-password') {
      return;
    }

    if (user && pathname === '/login') {
      router.push('/');
    } else if (!user && !isPublicRoute(pathname)) {
      router.push('/login');
    }
  }, [router]);

  // Fonction pour nettoyer le localStorage en cas de problème avec les tokens
  const cleanupLocalStorage = () => {
    if (typeof window === 'undefined') return;
    
    try {
      // Identifier les clés liées à Supabase dans le localStorage
      const supabaseKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          supabaseKeys.push(key);
        }
      }
      
      // Vérifier et nettoyer les tokens problématiques
      supabaseKeys.forEach(key => {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            // Essayer de parser la valeur pour vérifier si elle est valide
            JSON.parse(value);
          }
        } catch (e) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error cleaning localStorage:', error);
    }
  };

  // Vérifier l'état de la session utilisateur au chargement du composant
  useEffect(() => {
    // Nettoyer le localStorage au démarrage
    cleanupLocalStorage();
    
    // Abonnement aux changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const newUser = session?.user || null;
        setUser(newUser);
        setIsLoading(false);
      }
    );

    // Vérifier la session initiale
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      setIsLoading(false);
    }).catch((error: unknown) => {
      console.error('Error getting session:', error);
      setIsLoading(false);
      // En cas d'erreur, nettoyer le localStorage
      cleanupLocalStorage();
    });

    // Nettoyer l'abonnement à la déconnexion du composant
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Gérer les redirections dans un useEffect séparé pour éviter les problèmes de rendu
  useEffect(() => {
    if (!isLoading) {
      handleRedirection(user);
    }
  }, [user, isLoading, handleRedirection]);

  // Fournir le contexte aux composants enfants
  return (
    <AuthContext.Provider value={{ user, isLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}