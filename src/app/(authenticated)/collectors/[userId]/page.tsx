'use client';

import { useEffect, useState, useMemo, Suspense, useRef } from 'react';
import { GameGridReadonly } from '@/components/games/game-grid-readonly';
import { GameListReadonly } from '@/components/games/game-list-readonly';
import { OtherUserGameModal } from '@/components/games/other-user-game-modal';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Grid2X2, List, Loader2, ArrowLeft, User } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useOtherUserGames } from '@/hooks/useOtherUserGames';
import { CollectionGame } from '@/hooks/useUserGames';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'playing' | 'completed' | 'backlog';

function CollectorCollectionContent() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [consoleFilter, setConsoleFilter] = useState<string>('all');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [profile, setProfile] = useState<{ id: string; username: string | null; avatar_url: string | null } | null>(null);
  const [isProfilePublic, setIsProfilePublic] = useState<boolean | null>(null);
  const [selectedGame, setSelectedGame] = useState<CollectionGame | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasShownPrivateToastRef = useRef(false);
  const hasShownErrorToastRef = useRef(false);
  const queryClient = useQueryClient();

  // Désactiver le hook si le profil n'est pas public ou n'est pas encore vérifié
  const { data: games = [], isLoading: loading, error, refetch } = useOtherUserGames(
    isProfilePublic === true ? userId : undefined
  );

  // Le cache intelligent gère automatiquement le rafraîchissement via Realtime
  // Pas besoin de forcer le rafraîchissement à chaque montage

  // Charger les informations du profil
  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      
      // Réinitialiser les flags quand on change d'utilisateur
      if (hasShownPrivateToastRef.current) {
        hasShownPrivateToastRef.current = false;
      }
      if (hasShownErrorToastRef.current) {
        hasShownErrorToastRef.current = false;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, is_public')
          .eq('id', userId)
          .single<{ id: string; username: string | null; avatar_url: string | null; is_public: boolean }>();
        
        if (error) throw error;
        
        if (!data || !data.is_public) {
          // Afficher le toast seulement une fois par utilisateur
          if (!hasShownPrivateToastRef.current) {
            toast.error('Ce profil est privé');
            hasShownPrivateToastRef.current = true;
          }
          setIsProfilePublic(false);
          router.push('/collectors');
          return;
        }
        
        setIsProfilePublic(true);
        setProfile({
          id: data.id as string,
          username: data.username as string | null,
          avatar_url: data.avatar_url as string | null
        });
      } catch (error: any) {
        console.error('Erreur lors du chargement du profil:', error);
        // Afficher le toast seulement une fois par utilisateur
        if (!hasShownErrorToastRef.current) {
          toast.error('Erreur lors du chargement du profil');
          hasShownErrorToastRef.current = true;
        }
        router.push('/collectors');
      }
    };
    
    loadProfile();
  }, [userId, router]);

  // Gérer les erreurs de chargement des jeux (seulement si le profil est public)
  // Ne pas afficher de toast pour les erreurs de profil privé car on l'a déjà géré
  useEffect(() => {
    if (error && isProfilePublic === true && error.message === 'Ce profil est privé') {
      // Ne rien faire - le toast a déjà été affiché lors du chargement du profil
      return;
    }
    
    if (error && isProfilePublic === true && error.message !== 'Ce profil est privé') {
      toast.error(error.message || 'Erreur lors du chargement de la collection');
    }
  }, [error, isProfilePublic]);

  // Calculer les consoles et genres à partir des jeux
  const { consoles, genres } = useMemo(() => {
    const gamesArray: CollectionGame[] = Array.isArray(games) ? games : [];
    const consoleMap = new Map<string, { id: string; name: string; count: number }>();
    consoleMap.set('all', { id: 'all', name: 'Toutes les consoles', count: gamesArray.length });
    
    gamesArray.forEach((game: CollectionGame) => {
      if (game.console_id && game.console_name) {
        const existing = consoleMap.get(game.console_id);
        if (existing) {
          existing.count++;
        } else {
          consoleMap.set(game.console_id, {
            id: game.console_id,
            name: game.console_name,
            count: 1
          });
        }
      }
    });

    const genreMap = new Map<string, { id: string; name: string; count: number }>();
    genreMap.set('all', { id: 'all', name: 'Tous les genres', count: gamesArray.length });
    
    gamesArray.forEach((game: CollectionGame) => {
      game.genres?.forEach((genre: { id: string; name: string }) => {
        const existing = genreMap.get(genre.id);
        if (existing) {
          existing.count++;
        } else {
          genreMap.set(genre.id, {
            id: genre.id,
            name: genre.name,
            count: 1
          });
        }
      });
    });

    // Convertir Map en tableau et trier par nombre de jeux (décroissant)
    // "Toutes les consoles" / "Tous les genres" reste en premier
    const consoleList = Array.from(consoleMap.values());
    const genreList = Array.from(genreMap.values());
    
    // Trier par nombre de jeux décroissant (sauf "all" qui reste en premier)
    const sortByCount = (a: {id: string, count: number}, b: {id: string, count: number}) => {
      if (a.id === 'all') return -1;
      if (b.id === 'all') return 1;
      return b.count - a.count; // Tri décroissant par nombre de jeux
    };
    
    return {
      consoles: consoleList.sort(sortByCount),
      genres: genreList.sort(sortByCount)
    };
  }, [games]);

  // Préparer les jeux pour l'affichage
  // Convertir null en undefined pour les types attendus par les composants
  const gamesArray: CollectionGame[] = Array.isArray(games) ? games : [];
  const preparedGames = gamesArray.map((game: CollectionGame) => {
    // S'assurer que le rating est un nombre valide
    const rating = typeof game.rating === 'number' ? game.rating : 
                   (game.rating !== null && game.rating !== undefined ? Number(game.rating) : undefined);
    
    return {
      ...game,
      rating: rating,
      completion_percentage: game.completion_percentage ?? undefined,
      play_time: game.play_time ?? undefined,
      console_name: game.console_name
    };
  });
  
  // Filtrer les jeux
  const filteredGames = preparedGames.filter((game: CollectionGame) => {
    // Recherche textuelle
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         game.publisher.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         game.developer.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filtre de statut
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      const statusMapping: Record<FilterStatus, string[]> = {
        all: [],
        playing: ['in_progress', 'IN_PROGRESS'],
        completed: ['completed', 'COMPLETED'],
        backlog: ['not_started', 'NOT_STARTED']
      };
      matchesStatus = statusMapping[statusFilter].includes(game.status || '');
    }
    
    // Filtre de console
    let matchesConsole = true;
    if (consoleFilter !== 'all') {
      matchesConsole = game.console_id === consoleFilter;
    }
    
    // Filtre de genre
    let matchesGenre = true;
    if (genreFilter !== 'all') {
      matchesGenre = game.genres?.some((genre: { id: string; name: string }) => genre.id === genreFilter) || false;
    }
    
    return matchesSearch && matchesStatus && matchesConsole && matchesGenre;
  });

  const filterButtons: { label: string; value: FilterStatus }[] = [
    { label: 'Tous', value: 'all' },
    { label: 'En cours', value: 'playing' },
    { label: 'Terminés', value: 'completed' },
    { label: 'À faire', value: 'backlog' },
  ];

  const handleGameClick = (game: CollectionGame) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGame(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-4 sm:p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Bouton retour - Mobile : en haut, Desktop : intégré */}
        <div className="relative mb-4 md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/collectors')}
            className="flex items-center gap-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Retour aux collectionneurs</span>
          </Button>
        </div>

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Bouton retour - Desktop uniquement */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/collectors')}
              className="hidden md:flex items-center gap-2 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Retour</span>
            </Button>
            
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.username || ''} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                  {profile?.username?.[0]?.toUpperCase() || <User className="h-5 w-5 sm:h-6 sm:w-6" />}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent truncate">
                  Collection de {profile?.username || 'Collectionneur'}
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">
                  {filteredGames.length} jeu{filteredGames.length > 1 ? 'x' : ''} dans la collection
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="flex items-center gap-2"
            >
              <Grid2X2 className="h-4 w-4" />
              <span className="hidden sm:inline">Grille</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Liste</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm">
        <div className="relative p-6">
          <div className="space-y-4">
            {/* Search */}
            <SearchInput
              placeholder="Rechercher un jeu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />

            {/* Status Filters */}
            <div className="flex flex-wrap gap-2">
              {filterButtons.map((button) => (
                <Button
                  key={button.value}
                  variant={statusFilter === button.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(button.value)}
                >
                  {button.label}
                </Button>
              ))}
            </div>

            {/* Console and Genre Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Console Filter */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Plateformes
                </label>
                <ScrollArea className="h-32">
                  <div className="space-y-1">
                    {consoles.map((console) => (
                      <Button
                        key={console.id}
                        variant={consoleFilter === console.id ? 'default' : 'ghost'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setConsoleFilter(console.id)}
                      >
                        <Badge variant="secondary" className="mr-2">
                          {console.count}
                        </Badge>
                        {console.name}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Genre Filter */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Genres
                </label>
                <ScrollArea className="h-32">
                  <div className="space-y-1">
                    {genres.map((genre) => (
                      <Button
                        key={genre.id}
                        variant={genreFilter === genre.id ? 'default' : 'ghost'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setGenreFilter(genre.id)}
                      >
                        <Badge variant="secondary" className="mr-2">
                          {genre.count}
                        </Badge>
                        {genre.name}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Games Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm">
        <div className="relative p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredGames.length > 0 ? (
            viewMode === 'grid' ? (
              <GameGridReadonly games={filteredGames} onGameClick={handleGameClick} />
            ) : (
              <GameListReadonly games={filteredGames} onGameClick={handleGameClick} />
            )
          ) : (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm p-12">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
              <div className="relative flex flex-col items-center justify-center gap-4 text-center">
                <p className="text-muted-foreground text-lg">
                  Aucun jeu trouvé avec ces filtres
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modale de détails du jeu */}
      {selectedGame && userId && (
        <OtherUserGameModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          game={selectedGame}
          ownerUserId={userId}
        />
      )}
    </div>
  );
}

export default function CollectorCollectionPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <CollectorCollectionContent />
    </Suspense>
  );
}

