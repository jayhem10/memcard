import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface Platform {
  consoleId: number;
  name: string;
  count: number;
  igdb_platform_id: number;
}

interface RecentGame {
  id: number; // ID of the user_game record
  game_id: number; // ID of the game itself for navigation
  title: string;
  cover_url: string;
  console_name: string;
  created_at: string;
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
  isLoading: boolean;
  error: string | null;
}

interface UserStatsStore extends UserStats {
  fetchUserStats: (userId: string) => Promise<void>;
  reset: () => void;
}

// Types pour les données Supabase
interface StatsData {
  id: number;
  status: string;
}

interface ConsoleData {
  id: number;
  name: string;
  igdb_platform_id: number;
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
  console: {
    name: string;
  };
}

interface RecentGameData {
  id: number;
  game_id: number; // Direct reference to the game ID
  status: string;
  created_at: string;
  game?: GameData; // Make this optional since we might not always have the full game data
}

// État initial du store
const initialState: UserStats = {
  total: 0,
  completed: 0,
  inProgress: 0,
  notStarted: 0,
  wishlist: 0,
  platforms: [],
  recentGames: [],
  isLoading: false,
  error: null
};

export const useUserStatsStore = create<UserStatsStore>((set, get) => ({
  ...initialState,

  fetchUserStats: async (userId: string) => {
    if (!userId) {
      return;
    }
    
    // Vérifier si une requête est déjà en cours
    const isLoading = get().isLoading;
    if (isLoading) {
      return;
    }
    
    set({ isLoading: true, error: null });
    
    // Réinitialiser les stats avant de charger les nouvelles
    set(state => ({
      ...state,
      total: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      wishlist: 0,
      platforms: [],
      recentGames: []
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
        // Calculer les statistiques
        const total = statsData.length;
        const completed = statsData.filter(game => game.status === 'COMPLETED').length;
        const inProgress = statsData.filter(game => game.status === 'IN_PROGRESS').length;
        const notStarted = statsData.filter(game => game.status === 'NOT_STARTED').length;
        const wishlist = statsData.filter(game => game.status === 'WISHLIST').length;

        // Récupérer les plateformes par utilisateur
        const { data: platformData, error: platformError } = await supabase
          .from('user_games')
          .select(`
            game:game_id(console:console_id(id, name, igdb_platform_id))
          `)
          .eq('user_id', userId);

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
            consoleId: Number(consoleId),
            name: data.name,
            count: data.count,
            igdb_platform_id: data.igdb_platform_id
          }))
          .sort((a, b) => b.count - a.count);

        // Récupérer les jeux récents
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
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentError) {
          console.error('Error fetching recent games:', recentError);
          throw recentError;
        }

        // Créer le tableau de jeux récents et filtrer les éléments null
        const mappedGames = recentData
          ? (recentData as unknown as RecentGameData[]).map(item => {
              // Vérifier si l'objet game est valide
              const hasValidGame = item?.game && typeof item.game === 'object';
              if (!hasValidGame) {
                return null;
              }
              
              return {
                id: item.id,
                // Use direct game_id from the record if the game object is not available
                game_id: hasValidGame ? (item.game?.id || item.game_id || 0) : (item.game_id || 0),
                title: hasValidGame ? (item.game?.title || 'Jeu sans titre') : 'Jeu sans titre',
                cover_url: hasValidGame ? (item.game?.cover_url || '') : '',
                console_name: hasValidGame ? (item.game?.console?.name || 'Console inconnue') : 'Console inconnue',
                created_at: new Date(item.created_at).toLocaleDateString('fr-FR'),
                status: item.status
              };
            })
          : [];
          
        // Filtrer les éléments null pour s'assurer que recentGames est de type RecentGame[]
        const recentGames = mappedGames.filter((game): game is RecentGame => game !== null);

        // Mettre à jour le state
        set({
          total,
          completed,
          inProgress,
          notStarted,
          wishlist,
          platforms,
          recentGames,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
      set({ isLoading: false, error: 'Erreur lors du chargement des données' });
    }
  },

  reset: () => {
    set(initialState);
  }
}));
