import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL est requis');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY est requis');
}

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Custom storage implementation to handle special characters in tokens
const customStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser) return null;
    
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      // Try to parse the item safely
      try {
        JSON.parse(item);
        return item;
      } catch (e) {
        // If parsing fails, it might be due to special characters
        console.warn('Storage parse error, attempting to fix:', key);
        localStorage.removeItem(key);
        return null;
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (!isBrowser) return;
    
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting localStorage item:', error);
    }
  },
  removeItem: (key: string): void => {
    if (!isBrowser) return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing localStorage item:', error);
    }
  }
};

// Create a singleton instance of the Supabase client
// This prevents the "Multiple GoTrueClient instances" warning
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const supabase = (() => {
  if (supabaseInstance) return supabaseInstance;
  
  // Only create a new instance if one doesn't exist
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: customStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
  return supabaseInstance;
})();
