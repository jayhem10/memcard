'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

type AuthFormData = {
  email: string;
  password: string;
};

export function AuthForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<AuthFormData>();

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        toast.success('Vérifiez votre email pour confirmer votre inscription');
      } else {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        
        console.log('Login successful, redirecting to homepage');
        toast.success('Connexion réussie');
        
        // La redirection sera gérée par le AuthGuard via le contexte d'authentification
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'discord') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('OAuth error:', error);
      toast.error(error.message);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-lg shadow-lg">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{isSignUp ? 'Créer un compte' : 'Se connecter'}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSignUp
            ? 'Déjà un compte ?'
            : 'Pas encore de compte ?'}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="ml-1 text-primary hover:underline"
          >
            {isSignUp ? 'Se connecter' : "S'inscrire"}
          </button>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Input
            {...register('email', {
              required: 'Email requis',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email invalide',
              },
            })}
            type="email"
            placeholder="Email"
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Input
            {...register('password', {
              required: 'Mot de passe requis',
              minLength: {
                value: 6,
                message: 'Le mot de passe doit contenir au moins 6 caractères',
              },
            })}
            type="password"
            placeholder="Mot de passe"
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Chargement...
            </span>
          ) : (
            isSignUp ? "S'inscrire" : "Se connecter"
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Ou continuer avec
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => handleOAuthLogin('google')}
          >
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => handleOAuthLogin('discord')}
          >
            Discord
          </Button>
        </div>
      </form>
    </div>
  );
}
