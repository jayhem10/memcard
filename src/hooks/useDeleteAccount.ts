import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export function useDeleteAccount() {
  const [isDeleting, setIsDeleting] = useState(false);
  const { signOut } = useAuth();
  const router = useRouter();

  const deleteAccount = async () => {
    setIsDeleting(true);
    
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression du compte');
      }

      // Déconnexion de l'utilisateur après suppression
      await signOut();
      
      // Redirection vers la page d'accueil
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
