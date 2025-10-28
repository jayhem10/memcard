import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';

export function useDeleteAccount() {
  const [isDeleting, setIsDeleting] = useState(false);
  const { signOut } = useAuth();
  const router = useRouter();

  const deleteAccount = async () => {
    setIsDeleting(true);
    
    try {
      // Récupérer le token de session depuis Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Aucune session active');
      }

      const response = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression du compte');
      }

      // La déconnexion se fait côté serveur, on redirige simplement
      router.push('/');
      
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteAccount,
    isDeleting,
  };
}
