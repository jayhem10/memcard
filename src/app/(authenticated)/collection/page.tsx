'use client';

import { useEffect, useState } from 'react';
import { GameGrid } from '@/components/games/game-grid';
import { GameList } from '@/components/games/game-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchInput } from '@/components/ui/search-input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Grid2X2, List, Loader2, Search, Database } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExportButton } from '@/components/ui/export-button';
import { GameExportData } from '@/lib/excel-export';

// Types de données
type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'playing' | 'completed' | 'backlog' | 'wishlist';
type CollectionTab = 'collection' | 'wishlist';

type Console = {
  id: string;
  name: string;
  count: number;
};

type Genre = {
  id: string;
  name: string;
  count: number;
};

type GameGenre = {
  id: string;
  name: string;
};

type Game = {
  id: string;
  igdb_id: number;
  title: string;
  release_date: string | null;
  developer: string;
  publisher: string;
  description: string;
  cover_url: string | null;
  console_id: string;
  console_name?: string;
  genres: GameGenre[];
  status?: string;
  rating?: number | null;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  purchase_date?: string | null;
  play_time?: number | null;
  completion_percentage?: number | null;
  buy_price?: number | null;
};

export default function CollectionPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [consoleFilter, setConsoleFilter] = useState<string>('all');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [games, setGames] = useState<Game[]>([]);
  const [consoles, setConsoles] = useState<Console[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CollectionTab>('collection');

  // Réinitialiser les filtres quand on change d'onglet
  useEffect(() => {
    setConsoleFilter('all');
    setGenreFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
  }, [activeTab]);
  
  // Get auth context
  const { user, isLoading: authLoading } = useAuth();

  // Charger les jeux de l'utilisateur
  useEffect(() => {
    async function fetchUserGames() {
      try {
        // Ne pas continuer si auth est en cours de chargement
        if (authLoading) {
          return;
        }

        setLoading(true);
        
        if (!user) {
          throw new Error('Utilisateur non authentifié');
        }
        
        // Fetch user's games with a join to get console information
        const { data, error } = await supabase
          .from('user_games')
          .select(`
            id,
            game_id,
            status,
            rating,
            notes,
            created_at,
            updated_at,
            purchase_date,
            play_time,
            completion_percentage,
            buy_price,
            games:game_id(id, igdb_id, title, release_date, developer, publisher, description, cover_url, console_id, consoles:console_id(id, name), game_genres(genre_id, genres(id, name)))
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Erreur lors de la récupération des jeux:', error);
          throw error;
        }
        
        // Afficher les statuts bruts pour vérifier les valeurs exactes en BDD
        const statuses = data.map(item => ({ id: item.game_id, status: item.status }));
        
        if (!data || data.length === 0) {
          setGames([]);
          setConsoles([{ id: 'all', name: 'Toutes les consoles', count: 0 }]);
          setGenres([{ id: 'all', name: 'Tous les genres', count: 0 }]);
          setLoading(false);
          return;
        }
        
        // 3. Transform the data to match our Game type
        const formattedGames: Game[] = data.map((item: any) => {
          if (!item.games) {
            console.warn('Données de jeu manquantes pour l\'item:', item);
            return null;
          }
          
          return {
            id: item.games.id,
            igdb_id: item.games.igdb_id,
            title: item.games.title,
            release_date: item.games.release_date,
            developer: item.games.developer,
            publisher: item.games.publisher,
            description: item.games.description,
            cover_url: item.games.cover_url,
            console_id: item.games.console_id,
            console_name: item.games.consoles?.name,
            genres: item.games.game_genres?.map((g: any) => ({
              id: g.genres?.id,
              name: g.genres?.name
            })) || [],
            status: item.status,
            rating: item.rating,
            notes: item.notes,
            created_at: item.created_at,
            updated_at: item.updated_at,
            purchase_date: item.purchase_date,
            play_time: item.play_time,
            completion_percentage: item.completion_percentage,
            buy_price: item.buy_price
          };
        }).filter(Boolean) as Game[];
        
        // Trier par ordre alphabétique côté client
        formattedGames.sort((a, b) => a.title.localeCompare(b.title, 'fr', { 
          numeric: true, 
          sensitivity: 'base' 
        }));
        
        setGames(formattedGames);
      } catch (error: any) {
        console.error('Error fetching games:', error);
        toast.error('Erreur lors du chargement de la collection');
      } finally {
        setLoading(false);
      }
    }
    
    // N'exécuter la requête que lorsque l'authentification est terminée et que l'utilisateur est disponible
    if (!authLoading && user) {
      fetchUserGames();
    }
  }, [user, authLoading, supabase]);

  // Recalculer les compteurs quand l'onglet change
  useEffect(() => {
    if (games.length === 0) return;

    // Filtrer les jeux selon l'onglet actif
    const tabFilteredGames = games.filter(game => {
      const status = game.status || '';
      if (activeTab === 'collection') {
        return !['wishlist', 'WISHLIST'].includes(status);
      } else {
        return ['wishlist', 'WISHLIST'].includes(status);
      }
    });

    // Calculer le nombre de jeux par console pour l'onglet actif
    const consoleMap = new Map<string, { id: string; name: string; count: number }>();
    consoleMap.set('all', { id: 'all', name: 'Toutes les consoles', count: tabFilteredGames.length });
    
    tabFilteredGames.forEach(game => {
      if (game.console_id && game.console_name) {
        const key = game.console_id;
        if (consoleMap.has(key)) {
          consoleMap.get(key)!.count++;
        } else {
          consoleMap.set(key, { id: game.console_id, name: game.console_name, count: 1 });
        }
      }
    });
    
    // Calculer le nombre de jeux par genre pour l'onglet actif
    const genreMap = new Map<string, { id: string; name: string; count: number }>();
    genreMap.set('all', { id: 'all', name: 'Tous les genres', count: tabFilteredGames.length });
    
    tabFilteredGames.forEach(game => {
      if (game.genres && game.genres.length > 0) {
        game.genres.forEach((genre) => {
          if (genre.id && genre.name) {
            const key = genre.id;
            if (genreMap.has(key)) {
              genreMap.get(key)!.count++;
            } else {
              genreMap.set(key, { id: genre.id, name: genre.name, count: 1 });
            }
          }
        });
      }
    });
    
    // Convertir Map en tableau pour l'état
    const consoleList = Array.from(consoleMap.values());
    const genreList = Array.from(genreMap.values());
    
    // Trier par ordre alphabétique (sauf "Toutes les consoles"/"Tous les genres" qui reste en premier)
    const sortItems = (a: {id: string, name: string}, b: {id: string, name: string}) => {
      if (a.id === 'all') return -1;
      if (b.id === 'all') return 1;
      return a.name.localeCompare(b.name);
    };
    
    consoleList.sort(sortItems);
    genreList.sort(sortItems);
    
    setConsoles(consoleList);
    setGenres(genreList);
  }, [games, activeTab]);

  // Log des statuts uniques pour le débogage
  useEffect(() => {
    if (games.length > 0) {
      const uniqueStatuses = [...new Set(games.map(game => game.status))];
    }
  }, [games]);

  // Préparer les jeux pour l'affichage avec les types attendus par GameGrid et GameList
  const preparedGames = games.map(game => ({
    ...game,
    // S'assurer que les propriétés requises par les composants existent
    status: game.status || 'not_started',
    rating: game.rating || undefined,
    completion_percentage: undefined,
    play_time: undefined
  }));
  
  // Filter games based on searchQuery, statusFilter, consoleFilter and activeTab
  const filteredGames = preparedGames.filter(game => {
    const status = game.status || '';
    // Filter by active tab first
    if (activeTab === 'collection' && ['wishlist', 'WISHLIST'].includes(status)) {
      return false; // Ne pas afficher les jeux wishlist dans l'onglet collection
    }
    if (activeTab === 'wishlist' && !['wishlist', 'WISHLIST'].includes(status)) {
      return false; // Afficher uniquement les jeux wishlist dans l'onglet wishlist
    }
    
    // Apply text search filter
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         game.publisher.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         game.developer.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply status filter (seulement dans l'onglet collection)
    let matchesStatus = true;
    if (activeTab === 'collection' && statusFilter !== 'all') {
      // Définir le mappage en fonction des valeurs réelles en BDD
      const statusMapping: Record<FilterStatus, string[]> = {
        all: [],
        playing: ['in_progress', 'IN_PROGRESS'],
        completed: ['completed', 'COMPLETED'],
        backlog: ['not_started', 'NOT_STARTED'],
        wishlist: ['wishlist', 'WISHLIST']
      };
      
      // Vérifier si le statut du jeu correspond à l'un des statuts attendus
      matchesStatus = statusMapping[statusFilter].includes(status);
    }
    
    // Apply console filter
    let matchesConsole = true;
    if (consoleFilter !== 'all') {
      matchesConsole = game.console_id === consoleFilter;
    }
    
    // Apply genre filter
    let matchesGenre = true;
    if (genreFilter !== 'all') {
      matchesGenre = game.genres?.some((genre) => genre.id === genreFilter) || false;
    }
    
    return matchesSearch && matchesStatus && matchesConsole && matchesGenre;
  });

  const filterButtons: { label: string; value: FilterStatus }[] = [
    { label: 'Tous', value: 'all' },
    { label: 'En cours', value: 'playing' },
    { label: 'Terminés', value: 'completed' },
    { label: 'À faire', value: 'backlog' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <h1 className="text-3xl font-bold">Ma Collection</h1>
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'collection' ? 'default' : 'outline'}
              onClick={() => setActiveTab('collection')}
              className="text-sm"
            >
              Collection
            </Button>
            <Button
              variant={activeTab === 'wishlist' ? 'default' : 'outline'}
              onClick={() => setActiveTab('wishlist')}
              className="text-sm"
            >
              Liste de souhaits
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton 
            games={filteredGames as GameExportData[]}
            activeTab={activeTab}
            filename="ma_collection"
            size="sm"
            filters={{
              console: consoleFilter,
              genre: genreFilter,
              status: statusFilter,
              search: searchQuery
            }}
            consoleName={consoleFilter !== 'all' ? consoles.find(c => c.id === consoleFilter)?.name : undefined}
          />
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid2X2 className="h-5 w-5" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <SearchInput
            placeholder={activeTab === 'collection' ? "Rechercher dans ma collection..." : "Rechercher dans ma liste de souhaits..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </div>
        {activeTab === 'collection' && (
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {filterButtons.map((button) => (
              <Button
                key={button.value}
                variant={statusFilter === button.value ? 'default' : 'outline'}
                onClick={() => setStatusFilter(button.value)}
                className="whitespace-nowrap"
              >
                {button.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Filtrage par consoles */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Plateformes</h3>
        </div>
        <ScrollArea className="h-16 whitespace-nowrap">
          <div className="flex flex-wrap gap-2 pb-1">
            {consoles.map((console) => (
              <Badge 
                key={console.id} 
                variant={consoleFilter === console.id ? "default" : "outline"}
                className={`cursor-pointer text-sm flex items-center gap-1.5 ${consoleFilter === console.id ? 'hover:bg-primary/90 text-primary-foreground' : 'hover:bg-secondary/60'}`}
                onClick={() => setConsoleFilter(console.id)}
              >
                <span>{console.name}</span>
                <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-medium ${consoleFilter === console.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/20'}`}>
                  {console.count}
                </span>
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Filtrage par genres */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
          </svg>
          <h3 className="font-medium">Genres</h3>
        </div>
        <ScrollArea className="h-16 whitespace-nowrap">
          <div className="flex flex-wrap gap-2 pb-1">
            {genres.map((genre) => (
              <Badge 
                key={genre.id} 
                variant={genreFilter === genre.id ? "default" : "outline"}
                className={`cursor-pointer text-sm flex items-center gap-1.5 ${genreFilter === genre.id ? 'hover:bg-primary/90 text-primary-foreground' : 'hover:bg-secondary/60'}`}
                onClick={() => setGenreFilter(genre.id)}
              >
                <span>{genre.name}</span>
                <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-medium ${genreFilter === genre.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/20'}`}>
                  {genre.count}
                </span>
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="min-h-[300px]">
        {loading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredGames.length > 0 ? (
          viewMode === 'grid' ? (
            <GameGrid games={filteredGames} />
          ) : (
            <GameList games={filteredGames} />
          )
        ) : (
          <div className="flex h-[300px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">Aucun jeu dans votre collection</p>
            <Link href="/search" className="inline-block">
              <Button variant="outline">
                Ajouter un jeu
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
