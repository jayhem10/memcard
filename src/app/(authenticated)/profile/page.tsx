'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useProfileStore } from '@/store/useProfileStore';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfileThemeSelector } from '@/components/profile/profile-theme-selector';

interface ProfileFormData {
  username: string;
  full_name: string;
  email: string;
  avatar_url: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { profile, isLoading: profileLoading, updateProfile } = useProfileStore();
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ProfileFormData>();
  const newPassword = watch('newPassword');

  // Remplir le formulaire avec les données du profil
  useEffect(() => {
    if (profile) {
      setValue('username', profile.username || '');
      setValue('full_name', profile.full_name || '');
      setValue('email', user?.email || '');
      setValue('avatar_url', profile.avatar_url || '');
    }
  }, [profile, user, setValue]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      // 1. Mise à jour du profil dans la table profiles
      await updateProfile({
        username: data.username,
        full_name: data.full_name,
        avatar_url: data.avatar_url
      });
      
      // 2. Mise à jour du mot de passe si fourni
      if (data.currentPassword && data.newPassword) {
        const { error } = await supabase.auth.updateUser({
          password: data.newPassword
        });
        if (error) throw error;
        toast.success('Mot de passe mis à jour avec succès');
      }

      // 3. Mise à jour de l'email si modifié
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (userData.user.email !== data.email) {
        const { error } = await supabase.auth.updateUser({
          email: data.email
        });
        if (error) throw error;
        toast.success('Email mis à jour avec succès. Vérifiez votre boîte mail pour confirmer.');
      }
      
      // 4. Rafraîchir les données du profil
      await refreshProfile();

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profil</h1>
          <p className="mt-2 text-muted-foreground">
            Gérez vos informations personnelles et vos préférences
          </p>
        </div>
        {profile && (
          <div className="flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-2">
              <AvatarImage src={profile.avatar_url || ''} alt={profile.username || ''} />
              <AvatarFallback>{profile.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {profile.provider === 'email' ? 'Compte email' : `Via ${profile.provider}`}
            </span>
          </div>
        )}
      </div>

      <div className="grid gap-8">
        {/* Informations du profil */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Informations personnelles</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Nom d'utilisateur
              </label>
              <Input
                id="username"
                {...register('username', {
                  required: 'Le nom d\'utilisateur est requis',
                })}
                disabled={isLoading || profileLoading}
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="full_name" className="text-sm font-medium">
                Nom complet
              </label>
              <Input
                id="full_name"
                {...register('full_name')}
                disabled={isLoading || profileLoading}
                placeholder="Votre nom complet (facultatif)"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="avatar_url" className="text-sm font-medium">
                URL de l'avatar
              </label>
              <Input
                id="avatar_url"
                {...register('avatar_url')}
                disabled={isLoading || profileLoading}
                placeholder="https://exemple.com/votre-avatar.jpg"
              />
              <p className="text-xs text-muted-foreground">Laissez vide pour utiliser l'avatar par défaut</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                {...register('email', {
                  required: 'L\'email est requis',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email invalide',
                  },
                })}
                disabled={isLoading || profileLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="pt-4 space-y-4">
              <h3 className="text-lg font-medium">Changer le mot de passe</h3>
              
              <div className="space-y-2">
                <label htmlFor="currentPassword" className="text-sm font-medium">
                  Mot de passe actuel
                </label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...register('currentPassword')}
                  disabled={isLoading || profileLoading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium">
                  Nouveau mot de passe
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  {...register('newPassword', {
                    minLength: {
                      value: 6,
                      message: 'Le mot de passe doit contenir au moins 6 caractères',
                    },
                  })}
                  disabled={isLoading || profileLoading}
                />
                {errors.newPassword && (
                  <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirmer le nouveau mot de passe
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword', {
                    validate: value =>
                      value === newPassword || 'Les mots de passe ne correspondent pas',
                  })}
                  disabled={isLoading || profileLoading}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || profileLoading}>
              {isLoading || profileLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </form>
        </div>

        {/* Préférences */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Préférences</h2>
          <div className="grid gap-4">
            {/* Sélecteur de thème */}
            <ProfileThemeSelector />

            <div className="flex items-center justify-between p-4 rounded-lg bg-card">
              <div>
                <h3 className="font-medium">Notifications par email</h3>
                <p className="text-sm text-muted-foreground">
                  Recevez des notifications sur les nouveaux jeux et les mises à jour
                </p>
              </div>
              <Button variant="outline">Configurer</Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-card">
              <div>
                <h3 className="font-medium">Confidentialité du profil</h3>
                <p className="text-sm text-muted-foreground">
                  Gérez qui peut voir votre collection
                </p>
              </div>
              <Button variant="outline">Configurer</Button>
            </div>
          </div>
        </div>

        {/* Zone de danger */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-destructive">Zone de danger</h2>
          <div className="p-4 rounded-lg bg-destructive/10">
            <h3 className="font-medium text-destructive">Supprimer le compte</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Une fois que vous supprimez votre compte, il n'y a pas de retour en arrière. Soyez certain.
            </p>
            <Button
              variant="destructive"
              className="mt-4"
              onClick={() => {
                // Ajouter la logique de suppression du compte
                toast.error('Fonctionnalité non implémentée');
              }}
            >
              Supprimer le compte
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
