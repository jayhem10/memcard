'use client';

import { StateCreator } from 'zustand';
import { supabase } from '@/lib/supabase';

interface Platform {
  consoleId: string;
  name: string;
  count: number;
  igdb_platform_id: number;
}

interface RecentGame {
  id: number;
  game_id: number;
  title: string;
  cover_url: string;
  console_name: string;
  created_at: string;
  status: string;
}

interface TopRatedGame {
  id: number;
  game_id: number;
  title: string;
  cover_url: string;
  console_name: string;
  average_rating: number | null; // Note moyenne IGDB (0-100)
  rating: number | null; // Note personnelle de l'utilisateur (0-5)
  status: string;
}

interface UserStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  wishlist: number;
  platforms: Platform[];
  recentGames: RecentGame[];
  topRatedGames: TopRatedGame[];
  isLoading: boolean;
  error: string | null;
}

interface GameConsoleData {
  game: {
    console: {
      id: number;
      name: string;
      igdb_platform_id: number;
    };
  };
}

interface GameData {
  id: number;
  title: string;
  cover_url: string;
  average_rating: number | null;
  console: {
    name: string;
  };
}

interface RecentGameData {
  id: number;
  game_id: number;
  status: string;
  created_at: string;
  game?: GameData;
}

export interface StatsSlice {
  // State
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  wishlist: number;
  platforms: Platform[];
  recentGames: RecentGame[];
  topRatedGames: TopRatedGame[];
  statsLoading: boolean;
  statsError: string | null;
  lastUserId: string | null;
  
  // Actions
  fetchUserStats: (userId: string) => Promise<void>;
  resetStats: () => void;
}

const initialState: UserStats & { lastUserId: string | null } = {
  total: 0,
  completed: 0,
  inProgress: 0,
  notStarted: 0,
  wishlist: 0,
  platforms: [],
  recentGames: [],
  topRatedGames: [],
  isLoading: false,
  error: null,
  lastUserId: null
};

export const createStatsSlice: StateCreator<
  StatsSlice,
  [],
  [],
  StatsSlice
> = (set, get) => ({
  ...initialState,
  statsLoading: false,
  statsError: null,

  fetchUserStats: async (userId: string) => {
    if (!userId) {
      return;
    }
    
    // Vérifier si une requête est déjà en cours
    const currentState = get();
    if (currentState.statsLoading) {
      return;
    }
    
    // Vérifier si les données sont déjà chargées pour cet utilisateur
    if (currentState.lastUserId === userId && (currentState.total > 0 || currentState.recentGames.length > 0 || currentState.wishlist > 0)) {
      return;
    }
    
    set({ statsLoading: true, statsError: null });
    
    // Réinitialiser les stats avant de charger les nouvelles
    set(state => ({
      ...state,
      total: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      wishlist: 0,
      platforms: [],
      recentGames: [],
      topRatedGames: []
    }));

    try {
      // Récupérer les statistiques des jeux
      const { data: statsData, error: statsError } = await supabase
        .from('user_games')
        .select(`
          id,
          status
        `)
        .eq('user_id', userId);

      if (statsError) throw statsError;

      if (statsData) {
        // Filtrer les jeux pour exclure la wishlist
        const ownedGames = statsData.filter((game: any) => game.status !== 'WISHLIST');
        
        // Calculer les statistiques uniquement sur les jeux possédés
        const total = ownedGames.length;
        const completed = ownedGames.filter((game: any) => game.status === 'COMPLETED').length;
        const inProgress = ownedGames.filter((game: any) => game.status === 'IN_PROGRESS').length;
        const notStarted = ownedGames.filter((game: any) => game.status === 'NOT_STARTED').length;
        const wishlist = statsData.filter((game: any) => game.status === 'WISHLIST').length;

        // Récupérer les plateformes par utilisateur (exclure la wishlist)
        const { data: platformData, error: platformError } = await supabase
          .from('user_games')
          .select(`
            game:game_id(console:console_id(id, name, igdb_platform_id)),
            status
          `)
          .eq('user_id', userId)
          .neq('status', 'WISHLIST');

        if (platformError) throw platformError;

        // Calculer le nombre de jeux par plateforme
        const platformCounts: Record<string, { name: string; count: number; igdb_platform_id: number }> = {};

        if (platformData) {
          (platformData as unknown as GameConsoleData[]).forEach(item => {
            if (item.game && item.game.console) {
              const consoleId = item.game.console.id;
              const consoleName = item.game.console.name;
              const igdbPlatformId = item.game.console.igdb_platform_id;

              if (!platformCounts[consoleId]) {
                platformCounts[consoleId] = { 
                  name: consoleName, 
                  count: 0, 
                  igdb_platform_id: igdbPlatformId 
                };
              }

              platformCounts[consoleId].count++;
            }
          });
        }

        // Convertir en tableau et trier par nombre de jeux
        const platforms = Object.entries(platformCounts)
          .map(([consoleId, data]) => ({
            consoleId: consoleId,
            name: data.name,
            count: data.count,
            igdb_platform_id: data.igdb_platform_id
          }))
          .sort((a, b) => b.count - a.count);

        // Récupérer les jeux récents (exclure la wishlist)
        const { data: recentData, error: recentError } = await supabase
          .from('user_games')
          .select(`
            id,
            game_id, 
            status,
            created_at,
            game:game_id(id, title, cover_url, console:console_id(name))
          `)
          .eq('user_id', userId)
          .neq('status', 'WISHLIST')
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentError) {
          console.error('Error fetching recent games:', recentError);
          throw recentError;
        }

        // Créer le tableau de jeux récents et filtrer les éléments null
        const mappedGames = recentData
          ? (recentData as unknown as RecentGameData[]).map((item: any) => {
              const hasValidGame = item?.game && typeof item.game === 'object';
              if (!hasValidGame) {
                return null;
              }
              
              return {
                id: item.id,
                game_id: hasValidGame ? (item.game?.id || item.game_id || 0) : (item.game_id || 0),
                title: hasValidGame ? (item.game?.title || 'Jeu sans titre') : 'Jeu sans titre',
                cover_url: hasValidGame ? (item.game?.cover_url || '') : '',
                console_name: hasValidGame ? (item.game?.console?.name || 'Console inconnue') : 'Console inconnue',
                created_at: new Date(item.created_at).toLocaleDateString('fr-FR'),
                status: item.status
              };
            })
          : [];
          
        // Filtrer les éléments null
        const recentGames = mappedGames.filter((game): game is RecentGame => game !== null);

        // Récupérer les meilleurs jeux selon la note moyenne IGDB (exclure la wishlist)
        const { data: topRatedData, error: topRatedError } = await supabase
          .from('user_games')
          .select(`
            id,
            game_id,
            rating,
            status,
            game:game_id(id, title, cover_url, average_rating, console:console_id(name))
          `)
          .eq('user_id', userId)
          .neq('status', 'WISHLIST') // Exclure les jeux de la wishlist
          .not('game.average_rating', 'is', null); // Uniquement les jeux avec une note moyenne IGDB

        if (topRatedError) {
          console.error('Error fetching top rated games:', topRatedError);
          // Ne pas throw, juste logger l'erreur pour ne pas bloquer le reste
        }

        // Créer le tableau des meilleurs jeux notés
        const mappedTopRated = topRatedData
          ? (topRatedData as unknown as Array<{
              id: number;
              game_id: number;
              rating: number | null;
              status: string;
              game?: GameData;
            }>).map((item: any) => {
              const hasValidGame = item?.game && typeof item.game === 'object';
              if (!hasValidGame) {
                return null;
              }
              
              return {
                id: item.id,
                game_id: hasValidGame ? (item.game?.id || item.game_id || 0) : (item.game_id || 0),
                title: hasValidGame ? (item.game?.title || 'Jeu sans titre') : 'Jeu sans titre',
                cover_url: hasValidGame ? (item.game?.cover_url || '') : '',
                console_name: hasValidGame ? (item.game?.console?.name || 'Console inconnue') : 'Console inconnue',
                average_rating: hasValidGame ? (item.game?.average_rating || null) : null,
                rating: item.rating !== undefined && item.rating !== null ? Number(item.rating) : null,
                status: item.status
              };
            })
          : [];
          
        // Filtrer les éléments null et trier par average_rating décroissant
        const topRatedGames = mappedTopRated
          .filter((game): game is TopRatedGame => game !== null && game.average_rating !== null)
          .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
          .slice(0, 5);

        // Mettre à jour le state
        set({
          total,
          completed,
          inProgress,
          notStarted,
          wishlist,
          platforms,
          recentGames,
          topRatedGames,
          statsLoading: false,
          lastUserId: userId
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
      set({ statsLoading: false, statsError: 'Erreur lors du chargement des données' });
    }
  },

  resetStats: () => {
    set({ ...initialState, lastUserId: null });
  }
});

