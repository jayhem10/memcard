'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useProfile } from '@/store';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfileThemeSelector } from '@/components/profile/profile-theme-selector';
import { DeleteAccountDialog } from '@/components/ui/delete-account-dialog';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { profileFormSchema, type ProfileFormInput } from '@/lib/validations/profile';

export default function ProfilePage() {
  const t = useTranslations('profile');
  const { user, refreshProfile } = useAuth();
  const { profile, isLoading: profileLoading, updateProfile } = useProfile();
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<ProfileFormInput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: '',
      full_name: '',
      email: '',
      avatar_url: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  const newPassword = watch('newPassword');
  const { deleteAccount, isDeleting } = useDeleteAccount();

  // Remplir le formulaire avec les données du profil
  useEffect(() => {
    if (profile) {
      setValue('username', profile.username || '');
      setValue('full_name', profile.full_name || '');
      setValue('email', user?.email || '');
      setValue('avatar_url', profile.avatar_url || '');
    }
  }, [profile, user, setValue]);

  const onSubmit = async (data: ProfileFormInput) => {
    setIsLoading(true);
    try {
      // 1. Mise à jour du profil dans la table profiles
      // Convertir avatar_url vide en null et gérer les types
      await updateProfile({
        username: data.username || undefined,
        full_name: data.full_name || undefined,
        avatar_url: data.avatar_url && data.avatar_url.trim() !== '' ? data.avatar_url : undefined
      });

      toast.success(t('profileUpdated'));
      
      // 2. Mise à jour du mot de passe si fourni (seulement pour les comptes email)
      if (profile?.provider === 'email' && data.currentPassword && data.newPassword) {
        // Vérifier d'abord le mot de passe actuel
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user?.email || '',
          password: data.currentPassword
        });
        
        if (signInError) {
          throw new Error(t('incorrectPassword'));
        }
        
        // Si la vérification réussit, mettre à jour le mot de passe
        const { error } = await supabase.auth.updateUser({
          password: data.newPassword
        });
        if (error) throw error;
        toast.success(t('passwordUpdated'));
      }

      // 3. Mise à jour de l'email si modifié (seulement pour les comptes email)
      if (profile?.provider === 'email') {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        if (userData.user.email !== data.email) {
          // La validation de l'email est déjà faite par Zod
          const { error } = await supabase.auth.updateUser({
            email: data.email
          });
          if (error) {
            console.error('Erreur Supabase:', error);
            throw new Error(`${t('emailUpdateError')}: ${error.message}`);
          }
          toast.success(t('emailUpdated'));
        }
      }
      
      // 4. Rafraîchir les données du profil
      await refreshProfile();
      
      // 5. Réinitialiser les champs du formulaire, notamment les mots de passe
      reset({
        username: data.username,
        full_name: data.full_name || '',
        email: data.email,
        avatar_url: data.avatar_url || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

    } catch (error: any) {
      toast.error(error.message || t('profileError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-3xl"></div>
        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              {t('description')}
            </p>
          </div>
          {profile && (
            <div className="flex flex-col items-center ml-6">
              <Avatar className="h-20 w-20 md:h-24 md:w-24 mb-2 ring-4 ring-primary/20">
                <AvatarImage src={profile.avatar_url || ''} alt={profile.username || ''} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-2xl font-bold">
                  {profile.username?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-muted/50">
                {profile.provider === 'email' ? t('accountProvider') : t('accountVia', { provider: profile.provider })}
              </span>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-6">
        {/* Informations du profil */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-1 w-6 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
              <h2 className="text-lg font-bold">{t('personalInfo')}</h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t('username')}
              </label>
              <Input
                id="username"
                {...register('username')}
                disabled={isLoading || profileLoading}
                className="rounded-lg"
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="full_name" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t('fullName')}
              </label>
              <Input
                id="full_name"
                {...register('full_name')}
                disabled={isLoading || profileLoading}
                placeholder={t('fullNamePlaceholder')}
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="avatar_url" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t('avatarUrl')}
              </label>
              <Input
                id="avatar_url"
                {...register('avatar_url')}
                disabled={isLoading || profileLoading}
                placeholder={t('avatarUrlPlaceholder')}
                className="rounded-lg"
              />
              <p className="text-xs text-muted-foreground">{t('avatarUrlHint')}</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t('email')}
                {profile?.provider !== 'email' && (
                  <span className="ml-2 text-xs font-normal normal-case text-muted-foreground">
                    {t('emailManagedBy', { provider: profile?.provider })}
                  </span>
                )}
              </label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                disabled={isLoading || profileLoading || profile?.provider !== 'email'}
                className={`rounded-lg ${profile?.provider !== 'email' ? 'bg-muted' : ''}`}
              />
              {profile?.provider !== 'email' && (
                <p className="text-xs text-muted-foreground">
                  {t('emailCannotBeModified', { provider: profile?.provider })}
                </p>
              )}
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {profile?.provider === 'email' && (
              <div className="pt-4 space-y-4 border-t border-border/50">
                <h3 className="text-base font-semibold">{t('security')}</h3>
                
                <div className="space-y-2">
                  <label htmlFor="currentPassword" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t('currentPassword')}
                  </label>
                  <Input
                    id="currentPassword"
                    type="password"
                    {...register('currentPassword')}
                    disabled={isLoading || profileLoading}
                    className="rounded-lg"
                    placeholder={t('currentPasswordPlaceholder')}
                  />
                  {errors.currentPassword && (
                    <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t('newPassword')}
                  </label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...register('newPassword')}
                    disabled={isLoading || profileLoading}
                    className="rounded-lg"
                    placeholder={t('newPasswordPlaceholder')}
                  />
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {t('confirmPassword')}
                  </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword')}
                  disabled={isLoading || profileLoading}
                  className="rounded-lg"
                  placeholder={t('confirmPasswordPlaceholder')}
                />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            )}

            {profile?.provider !== 'email' && (
              <div className="pt-4 p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50">
                <h3 className="text-base font-semibold mb-2">{t('security')}</h3>
                <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('accountConnectedVia', { provider: profile?.provider }) }} />
              </div>
            )}

            <Button type="submit" className="w-full rounded-lg shadow-lg hover:shadow-xl transition-all" disabled={isLoading || profileLoading}>
              {isLoading || profileLoading ? t('saving') : t('saveProfile')}
            </Button>
          </form>
          </div>
        </div>

        {/* Préférences */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-1 w-6 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
              <h2 className="text-lg font-bold">{t('preferences')}</h2>
            </div>
            <div className="grid gap-4">
              {/* Sélecteur de thème */}
              <ProfileThemeSelector />

              {/* Confidentialité du profil */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-card to-card/95 border border-border/50">
                <div className="flex-1">
                  <h3 className="font-medium mb-1">{t('publicProfile')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {profile?.is_public 
                      ? t('profileIsPublic')
                      : t('profileIsPrivate')}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Checkbox
                    id="is_public"
                    checked={profile?.is_public || false}
                    onCheckedChange={async (checked) => {
                      try {
                        await updateProfile({ is_public: checked === true });
                        toast.success(
                          checked 
                            ? t('profileNowPublic')
                            : t('profileNowPrivate')
                        );
                      } catch (error: any) {
                        toast.error(error.message || t('profileError'));
                      }
                    }}
                    disabled={isLoading || profileLoading}
                  />
                  <Label 
                    htmlFor="is_public" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {profile?.is_public ? t('public') : t('private')}
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Zone de danger */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-destructive/10 via-destructive/5 to-destructive/10 border border-destructive/30 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-destructive/20 to-destructive/10 rounded-full blur-3xl"></div>
          <div className="relative p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-1 w-6 bg-gradient-to-r from-destructive to-destructive/50 rounded-full" />
              <h2 className="text-lg font-bold text-destructive">{t('dangerZone')}</h2>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-r from-destructive/10 to-destructive/5 border border-destructive/20">
              <h3 className="font-semibold text-destructive mb-2">{t('accountDeletion')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('accountDeletionDescription')}
              </p>
              <div>
                <DeleteAccountDialog 
                  onConfirm={deleteAccount}
                  isLoading={isDeleting}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
