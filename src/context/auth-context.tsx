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

  // Fonction utilitaire pour vérifier si une route est publique
  const isPublicRoute = (pathname: string): boolean => {
    const publicRoutes = ['/login', '/auth/callback'];
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
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la déconnexion');
    }
  };

  // Fonction pour gérer la redirection
  const handleRedirection = (user: User | null, event?: string) => {
    // Utiliser useEffect pour éviter les redirections pendant le rendu
    if (typeof window === 'undefined') return;
    
    const pathname = window.location.pathname;
    
    // Utiliser setTimeout pour éviter les redirections synchrones pendant le rendu
    setTimeout(() => {
      if (user && pathname === '/login') {
        router.push('/');
      } else if (!user && !isPublicRoute(pathname)) {
        router.push('/login');
      }
    }, 0);
  };

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
          // Si le parsing échoue, supprimer cette entrée
          console.warn(`Removing invalid token in localStorage: ${key}`);
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
      
      setTimeout(() => {
        handleRedirection(currentUser);
      }, 100); // Petit délai pour s'assurer que le routeur est initialisé
    }).catch(error => {
      console.error('Error getting session:', error);
      setIsLoading(false);
      // En cas d'erreur, nettoyer le localStorage et rediriger vers la page de connexion
      // Sauf si on est sur une route publique (wishlist partagée, login, etc.)
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        cleanupLocalStorage();
        if (!isPublicRoute(pathname)) {
          setTimeout(() => {
            router.push('/login');
          }, 0);
        }
      }
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