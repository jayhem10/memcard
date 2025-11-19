'use client';

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL est requis');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY est requis');
}

// Custom storage implementation to handle special characters in tokens
const customStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      // Try to parse the item safely
      try {
        JSON.parse(item);
        return item;
      } catch (e) {
        localStorage.removeItem(key);
        return null;
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting localStorage item:', error);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing localStorage item:', error);
    }
  }
};

// Create a singleton instance of the Supabase client
// This prevents the "Multiple GoTrueClient instances" warning
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Fonction utilitaire pour obtenir l'URL de base selon l'environnement
 * Cela assure la cohérence entre le code et les templates d'emails Supabase
 */
export const getBaseUrl = () => {
  // En production, utiliser l'URL fixe
  if (process.env.NODE_ENV === 'production') {
    return 'https://memcard.fr';
  }

  // En développement, utiliser l'URL courante ou localhost
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Fallback pour le serveur
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
};

/**
 * Client Supabase pour le navigateur
 * Utilise @supabase/ssr pour une meilleure gestion des sessions
 *
 * @example
 * import { supabase } from '@/lib/supabase/client'
 * const { data } = await supabase.from('users').select('*')
 */
export const supabase = (() => {
  if (supabaseInstance) return supabaseInstance;
  
  // Only create a new instance if one doesn't exist
  supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        if (typeof document === 'undefined') return undefined;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
          return parts.pop()?.split(';').shift();
        }
        return undefined;
      },
      set(name: string, value: string, options: any) {
        if (typeof document === 'undefined') return;
        try {
          document.cookie = `${name}=${value}; path=${options?.path || '/'}; max-age=${options?.maxAge || 3600}; SameSite=${options?.sameSite || 'Lax'}`;
        } catch (error) {
          console.error('Error setting cookie:', error);
        }
      },
      remove(name: string, options: any) {
        if (typeof document === 'undefined') return;
        try {
          document.cookie = `${name}=; path=${options?.path || '/'}; max-age=0`;
        } catch (error) {
          console.error('Error removing cookie:', error);
        }
      },
    },
    auth: {
      storage: customStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
  return supabaseInstance;
})();

