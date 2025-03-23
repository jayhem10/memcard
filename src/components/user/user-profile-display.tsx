'use client';

import React from 'react';
import { useProfileStore } from '@/store/useProfileStore';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import Link from 'next/link';

export const UserProfileDisplay = () => {
  const { profile, isLoading, fetchProfile } = useProfileStore();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user && !profile && !isLoading) {
      fetchProfile();
    }
  }, [user, profile, isLoading, fetchProfile]);

  if (isLoading) {
    return <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />;
  }

  if (!user || !profile) {
    return null;
  }

  // On prépare le texte à afficher (nom complet ou username ou email)
  const displayName = profile.full_name || profile.username || profile.email?.split('@')[0] || 'Utilisateur';
  
  // Initiales pour le fallback de l'avatar
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9">
        <AvatarImage 
          src={profile.avatar_url || ''} 
          alt={displayName} 
        />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <p className="text-sm font-medium leading-none">{displayName}</p>
        <p className="text-xs text-muted-foreground">
          {profile.provider === 'email' ? 'Compte email' : `Via ${profile.provider}`}
        </p>
      </div>
      <Button variant="ghost" size="icon" asChild>
        <Link href="/profile">
          <User className="h-4 w-4" />
          <span className="sr-only">Éditer profil</span>
        </Link>
      </Button>
    </div>
  );
};
