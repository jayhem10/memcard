'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Profile, ProfileUpdateRequest, UserProfile } from '@/types/profile';
import toast from 'react-hot-toast';

interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (profileData: ProfileUpdateRequest) => Promise<void>;
  resetProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    const currentProfile = get().profile;
    const isLoading = get().isLoading;

    // Si on a déjà un profil ou si on est en train de charger, ne rien faire
    if (currentProfile || isLoading) {
      return;
    }

    // Vérifier le délai entre les requêtes
    const lastFetchTime = sessionStorage.getItem('lastProfileFetch');
    const lastFetchTimeMs = lastFetchTime ? parseInt(lastFetchTime) : 0;
    const now = Date.now();
    
    // Si on a déjà fait une requête dans les 5 dernières secondes, ignorer
    if (now - lastFetchTimeMs < 5000) {
      return;
    }
    
    // Enregistrer le moment de cette requête
    sessionStorage.setItem('lastProfileFetch', now.toString());
    set({ isLoading: true, error: null });
    
    try {
      // Récupérer l'utilisateur authentifié actuel
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        set({ profile: null, isLoading: false });
        return;
      }
      
      // Récupérer le profil de l'utilisateur dans la table profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Si erreur mais que c'est juste que la table n'existe pas ou l'enregistrement n'est pas trouvé
      // On crée un profil par défaut
      if (error) {
        console.warn('⚠️ Erreur lors de la récupération du profil:', error.message);
        
        // Profil par défaut
        const defaultProfile = {
          username: user.email ? user.email.split('@')[0] : 'user_' + user.id.substring(0, 6),
          full_name: (user.user_metadata?.full_name as string) || null,
          avatar_url: (user.user_metadata?.avatar_url as string) || null,
          theme: 'dark',
          updated_at: new Date().toISOString()
        };
        
        // On essaie d'insérer le profil par défaut si c'est possible
        try {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([{
              id: user.id,
              ...defaultProfile
            }]);
            
          if (insertError) {
            console.warn('⚠️ Impossible de créer le profil, la table n\'existe probablement pas:', insertError.message);
          }
        } catch (insertErr) {
          console.warn('⚠️ Erreur lors de la tentative de création du profil:', insertErr);
        }
        
        // On utilise le profil par défaut même si l'insertion a échoué
        // Détecter le type d'authentification pour mieux gérer les différences
        const isEmailAuth = !user.app_metadata?.provider || user.app_metadata.provider === 'email';
                
        const userProfile: UserProfile = {
          id: user.id,
          email: user.email || null,
          username: defaultProfile.username || null,
          full_name: defaultProfile.full_name || null,
          avatar_url: defaultProfile.avatar_url || null,
          theme: defaultProfile.theme || 'system',
          provider: isEmailAuth ? 'email' : String(user.app_metadata?.provider),
          last_sign_in_at: user.last_sign_in_at || null
        };
        
        set({ profile: userProfile, isLoading: false, error: null });
        return;
      }

      // Fusionner les données auth.user et profiles
      // Détecter le type d'authentification
      const isEmailAuth = !user.app_metadata?.provider || user.app_metadata.provider === 'email';
      
      const userProfile: UserProfile = {
        id: user.id,
        email: user.email || null,
        username: typeof data?.username === 'string' ? data.username : null,
        full_name: typeof data?.full_name === 'string' ? data.full_name : null,
        avatar_url: typeof data?.avatar_url === 'string' ? data.avatar_url : null,
        theme: typeof data?.theme === 'string' ? data.theme : 'system',
        provider: isEmailAuth ? 'email' : String(user.app_metadata?.provider),
        last_sign_in_at: user.last_sign_in_at || null
      };
      
      set({ profile: userProfile, isLoading: false });
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération du profil:', error);
      set({ 
        error: error.message || 'Erreur lors de la récupération du profil', 
        isLoading: false 
      });
    }
  },

  updateProfile: async (profileData: ProfileUpdateRequest) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }
      
      // Mettre à jour le profil avec les données fournies
      const { error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Mettre à jour le store avec les nouvelles données
      const currentProfile = get().profile;
      set({ 
        profile: currentProfile ? { ...currentProfile, ...profileData } : null,
        isLoading: false 
      });
      
      toast.success('Profil mis à jour avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      set({ 
        error: error.message || 'Erreur lors de la mise à jour du profil', 
        isLoading: false 
      });
      toast.error(error.message || 'Erreur lors de la mise à jour du profil');
    }
  },

  resetProfile: () => {
    set({ profile: null, error: null });
  }
}));
