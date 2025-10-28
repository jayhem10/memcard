'use client';

import { useProfileStore } from '@/store/useProfileStore';
import { useAuth } from '@/context/auth-context';
import { useEffect, useState } from 'react';

export function useUserRole() {
  const { profile, isLoading } = useProfileStore();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  useEffect(() => {
    if (!isLoading && profile) {
      // S'assurer que le rôle est bien défini et valide
      const role = profile.role || 'user';
      setIsAdmin(role === 'admin');
      setIsLoadingRole(false);
    } else if (!isLoading && !profile && user) {
      // Si pas de profil mais utilisateur connecté, considérer comme user
      setIsAdmin(false);
      setIsLoadingRole(false);
    } else if (!isLoading && !user) {
      // Si pas d'utilisateur connecté
      setIsAdmin(false);
      setIsLoadingRole(false);
    }
  }, [profile, isLoading, user]);

  return {
    isAdmin,
    isLoadingRole,
    role: profile?.role || 'user',
    canAccessAdmin: isAdmin
  };
}
