'use client';

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { ProfileUpdateRequest, UserProfile } from '@/types/profile';
import { toast } from 'sonner';

// Types pour les requêtes Supabase
type ProfileInsertData = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  theme: string;
  quiz_completed: boolean;
  rank_id: number | null;
  role: string;
  is_public: boolean;
  updated_at: string;
};

type ProfileUpdateData = ProfileUpdateRequest & {
  updated_at: string;
};

type ProfileWithRank = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  theme: string | null;
  rank_id: number | null;
  quiz_completed: boolean;
  is_public: boolean;
  role: string;
  updated_at: string;
  created_at: string;
  ranks: { id: string; name_fr: string } | null;
};

interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: (force?: boolean) => Promise<void>;
  updateProfile: (profileData: ProfileUpdateRequest) => Promise<void>;
  resetProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async (force = false) => {
    const currentProfile = get().profile;
    const isLoading = get().isLoading;

    // Si on force le rechargement, on ignore les vérifications
    if (!force) {
      // Si on a déjà un profil ou si on est en train de charger, ne rien faire
      if (currentProfile || isLoading) {
        return;
      }

      // Vérifier le délai entre les requêtes (uniquement côté client)
      if (typeof window !== 'undefined') {
        const lastFetchTime = sessionStorage.getItem('lastProfileFetch');
        const lastFetchTimeMs = lastFetchTime ? parseInt(lastFetchTime) : 0;
        const now = Date.now();
        
        // Si on a déjà fait une requête dans les 5 dernières secondes, ignorer
        if (now - lastFetchTimeMs < 5000) {
          return;
        }
      }
    }
    
    // Enregistrer le moment de cette requête (uniquement côté client)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('lastProfileFetch', Date.now().toString());
    }
    set({ isLoading: true, error: null });
    
    try {
      // Récupérer l'utilisateur authentifié actuel
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        set({ profile: null, isLoading: false });
        return;
      }
      
      // Récupérer le profil de l'utilisateur avec le nom du rang en français
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          avatar_url,
          theme,
          rank_id,
          quiz_completed,
          is_public,
          role,
          updated_at,
          created_at,
          ranks (
            id,
            name_fr
          )
        `)
        .eq('id', user.id)
        .single();
      
      if (error) {
        const defaultProfile = {
          username: user.email ? user.email.split('@')[0] : 'user_' + user.id.substring(0, 6),
          full_name: (user.user_metadata?.full_name as string) || null,
          avatar_url: (user.user_metadata?.avatar_url as string) || null,
          theme: 'dark',
          updated_at: new Date().toISOString(),
          quiz_completed: false,
          rank_id: null,
          rank_name_fr: null,
          role: 'user' as const,
          is_public: false
        };
        
        // On essaie d'insérer le profil par défaut si c'est possible
        try {
          const insertData: ProfileInsertData = {
            id: user.id,
            username: defaultProfile.username,
            full_name: defaultProfile.full_name,
            avatar_url: defaultProfile.avatar_url,
            theme: defaultProfile.theme,
            quiz_completed: defaultProfile.quiz_completed,
            rank_id: defaultProfile.rank_id,
            role: defaultProfile.role,
            is_public: defaultProfile.is_public,
            updated_at: defaultProfile.updated_at
          };
          
          await (supabase
            .from('profiles') as any)
            .insert([insertData]);
        } catch (insertErr) {
          // Ignorer les erreurs d'insertion silencieusement
        }
        const isEmailAuth = !user.app_metadata?.provider || user.app_metadata.provider === 'email';
                
        const userProfile: UserProfile = {
          id: user.id,
          email: user.email || null,
          username: defaultProfile.username || null,
          full_name: defaultProfile.full_name || null,
          avatar_url: defaultProfile.avatar_url || null,
          theme: defaultProfile.theme || 'system',
          provider: isEmailAuth ? 'email' : String(user.app_metadata?.provider),
          last_sign_in_at: user.last_sign_in_at || null,
          quiz_completed: typeof defaultProfile.quiz_completed === 'boolean' ? defaultProfile.quiz_completed : false,
          rank_id: defaultProfile.rank_id,
          rank_name_fr: defaultProfile.rank_name_fr,
          role: defaultProfile.role,
          is_public: defaultProfile.is_public
        };
        
        set({ profile: userProfile, isLoading: false, error: null });
        return;
      }

      // Fusionner les données auth.user et profiles
      const isEmailAuth = !user.app_metadata?.provider || user.app_metadata.provider === 'email';
      
      const userProfile: UserProfile = {
        id: user.id,
        email: user.email || null,
        username: typeof data?.username === 'string' ? data.username : null,
        full_name: typeof data?.full_name === 'string' ? data.full_name : null,
        avatar_url: typeof data?.avatar_url === 'string' ? data.avatar_url : null,
        theme: typeof data?.theme === 'string' ? data.theme : 'system',
        provider: isEmailAuth ? 'email' : String(user.app_metadata?.provider),
        last_sign_in_at: user.last_sign_in_at || null,
        quiz_completed: typeof data?.quiz_completed === 'boolean' ? data.quiz_completed : false,
        rank_id: data?.rank_id ? parseInt(data.rank_id.toString()) : null,
        rank_name_fr: data?.ranks && typeof data.ranks === 'object' && 'name_fr' in data.ranks ? String(data.ranks.name_fr) : null,
        role: (data?.role === 'admin' || data?.role === 'user') ? data.role : 'user',
        is_public: typeof data?.is_public === 'boolean' ? data.is_public : false
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
      const updateData: ProfileUpdateData = {
        ...profileData,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await (supabase
        .from('profiles') as any)
        .update(updateData)
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Recharger le profil complet depuis la base pour s'assurer de la cohérence
      // Forcer le rechargement même si isLoading est true
      await get().fetchProfile(true);

      // S'assurer que isLoading est bien à false après le rechargement
      set({ isLoading: false });
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
