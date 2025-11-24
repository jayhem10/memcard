'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Nettoyer les erreurs précédentes
        localStorage.removeItem('auth_error');

        // Exchange the callback URL for a session (pour OAuth normal)
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        
        if (error) {
          console.error('OAuth authentication failed:', error);
          window.location.replace('/login?error=auth_failed');
          return;
        }
        
        // Verify we have a session
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          console.error('No session found after OAuth exchange');
          window.location.replace('/login?error=no_session');
          return;
        }
        
        // Nettoyer le localStorage
        localStorage.removeItem('auth_error');
        
        // Direct to homepage
        window.location.replace('/');
      } catch (err) {
        console.error('Critical error during OAuth processing:', err);
        window.location.replace('/login?error=critical');
      }
    };
    
    handleAuthCallback();
  }, []);

  return (
    <div className="flex flex-col h-screen w-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <p className="text-muted-foreground">Authentification en cours...</p>
    </div>
  );
}
