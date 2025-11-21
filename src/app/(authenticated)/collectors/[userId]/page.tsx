'use client';

import { useEffect, useState, useMemo, Suspense, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { GameGrid, GameGridItem } from '@/components/games/game-grid';
import { GameListReadonly } from '@/components/games/game-list-readonly';
import { OtherUserGameModal } from '@/components/games/other-user-game-modal';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Grid2X2, List, Loader2, ArrowLeft, User } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useOtherUserGames, useOtherUserGamesStats, OtherUserGamesFilters } from '@/hooks/useOtherUserGames';
import { CollectionGame } from '@/hooks/useUserGames';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'playing' | 'completed' | 'backlog';

function CollectorCollectionContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const userId = params.userId as string;
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [consoleFilter, setConsoleFilter] = useState<string>('all');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [profile, setProfile] = useState<{ id: string; username: string | null; avatar_url: string | null } | null>(null);
  const [isProfilePublic, setIsProfilePublic] = useState<boolean | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [selectedGame, setSelectedGame] = useState<CollectionGame | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasShownPrivateToastRef = useRef(false);
  const hasShownErrorToastRef = useRef(false);
  const queryClient = useQueryClient();

  // Hook pour la pagination infinie
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
  });

  // Construire les filtres
  const currentFilters: OtherUserGamesFilters = {
    search: searchQuery.trim() || undefined,
    console_id: consoleFilter,
    genre_id: genreFilter,
    status: statusFilter,
  };

  // Désactiver le hook si le profil n'est pas public ou n'est pas encore vérifié
  const {
    data,
    isLoading: loading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch
  } = useOtherUserGames(
    isProfilePublic === true ? userId : undefined,
    currentFilters
  );

  // Hook pour les statistiques
  const {
    data: statsData,
    isLoading: statsLoading
  } = useOtherUserGamesStats(
    isProfilePublic === true ? userId : undefined,
    'collection' // Pour l'instant, on ne gère que la collection (pas wishlist)
  );

  // Déclencher le chargement de la page suivante quand on atteint le bas
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Aplatir les pages pour obtenir tous les jeux
  const games = data?.pages.flat() ?? [];

  // Invalider le cache quand les filtres changent
  useEffect(() => {
    if (isProfilePublic === true && userId) {
      queryClient.invalidateQueries({
        queryKey: ['otherUserGames', userId]
      });
    }
  }, [searchQuery, statusFilter, consoleFilter, genreFilter, userId, isProfilePublic, queryClient]);

  // Le cache intelligent gère automatiquement le rafraîchissement via Realtime
  // Pas besoin de forcer le rafraîchissement à chaque montage

  // Charger les informations du profil
  useEffect(() => {
    const loadProfile = async () => {
      if (!userId || !user) return;

      setIsLoadingProfile(true);

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
          .single();

        if (error) throw error;

        // Vérifier l'accès :
        // 1. Si c'est le profil de l'utilisateur connecté, il peut toujours voir
        // 2. Si les utilisateurs sont amis, l'accès est autorisé
        // 3. Sinon, vérifier si le profil est public
        let hasAccess = false;

        if (userId === user.id) {
          // L'utilisateur peut toujours voir son propre profil
          hasAccess = true;
        } else {
          // Vérifier si les utilisateurs sont amis
          const { data: isFriend } = await supabase
            .rpc('are_users_friends', {
              p_user_id: user.id,
              p_friend_id: userId
            });

          if (isFriend) {
            hasAccess = true;
          } else if (data.is_public) {
            hasAccess = true;
          }
        }

        if (!hasAccess) {
          // Afficher le toast seulement une fois par utilisateur
          if (!hasShownPrivateToastRef.current) {
            toast.error('Ce profil est privé');
            hasShownPrivateToastRef.current = true;
          }
          setIsProfilePublic(false);
          setIsLoadingProfile(false);
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
        setIsLoadingProfile(false);
        router.push('/collectors');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [userId, user, router]);

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

  // Utiliser UNIQUEMENT les stats RPC (pas de calcul côté client)
  const { consoles, genres } = useMemo(() => {
    if (!statsData) {
      return {
        consoles: [{ id: 'all', name: 'Toutes les consoles', count: 0 }],
        genres: [{ id: 'all', name: 'Tous les genres', count: 0 }]
      };
    }

    // Trier les consoles et genres du plus grand nombre de jeux au plus petit
    const sortedConsoles = [...statsData.consoles].sort((a, b) => b.count - a.count);
    const sortedGenres = [...statsData.genres].sort((a, b) => b.count - a.count);

    const consoleList = [
      { id: 'all', name: 'Toutes les consoles', count: statsData.totalGames },
      ...sortedConsoles
    ];

    const genreList = [
      { id: 'all', name: 'Tous les genres', count: statsData.totalGames },
      ...sortedGenres
    ];

    return {
      consoles: consoleList,
      genres: genreList
    };
  }, [statsData]);

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

  const filterButtons: { label: string; value: FilterStatus }[] = [
    { label: 'Tous', value: 'all' },
    { label: 'En cours', value: 'playing' },
    { label: 'Terminés', value: 'completed' },
    { label: 'À faire', value: 'backlog' },
  ];

  const handleGameClick = (game: GameGridItem) => {
    // Dans ce contexte, filteredGames est toujours de type CollectionGame[]
    // donc on peut faire un cast sécurisé
    setSelectedGame(game as CollectionGame);
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
        
        {isLoadingProfile ? (
          // Skeleton pour le header
          <>
            {/* Bouton retour - Mobile : en haut */}
            <div className="relative mb-4 md:hidden">
              <div className="relative h-9 w-40 bg-muted rounded overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>

            <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3 md:gap-4">
                {/* Bouton retour - Desktop uniquement */}
                <div className="hidden md:block relative h-9 w-20 bg-muted rounded overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 sm:h-12 sm:w-12 bg-muted rounded-full flex-shrink-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="relative h-6 sm:h-7 md:h-8 lg:h-10 bg-muted rounded w-64 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    </div>
                    <div className="relative h-4 sm:h-5 bg-muted rounded w-32 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative h-9 w-20 bg-muted rounded overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
                <div className="relative h-9 w-20 bg-muted rounded overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
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
                      {statsData?.totalGames || 0} jeu{(statsData?.totalGames || 0) > 1 ? 'x' : ''} dans la collection
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
          </>
        )}
      </section>


      {/* Filters Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm">
        <div className="relative p-6">
          {loading || isLoadingProfile || statsLoading ? (
            // Skeletons pour les filtres
            <div className="space-y-4">
              {/* Search skeleton */}
              <div className="relative h-10 bg-muted rounded overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>

              {/* Status filters skeleton */}
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="relative h-9 w-20 bg-muted rounded overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                ))}
              </div>

              {/* Console and Genre filters skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Console Filter skeleton */}
                <div className="space-y-2">
                  <div className="relative h-4 w-24 bg-muted rounded overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                  <div className="relative h-32 bg-muted/50 rounded overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                </div>

                {/* Genre Filter skeleton */}
                <div className="space-y-2">
                  <div className="relative h-4 w-20 bg-muted rounded overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                  <div className="relative h-32 bg-muted/50 rounded overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* Games Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm">
        <div className="relative p-6">
          {loading || isLoadingProfile ? (
            // Skeletons pour les jeux
            viewMode === 'grid' ? (
              // Skeletons pour le mode grille
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-muted via-muted/80 to-muted" />
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-muted-foreground/20" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                  </div>
                ))}
              </div>
            ) : (
              // Skeletons pour le mode liste
              <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-4 p-4 rounded-lg bg-card"
                  >
                    <div className="relative w-20 h-24 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="relative h-5 bg-muted rounded w-3/4 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                      </div>
                      <div className="relative h-4 bg-muted rounded w-1/2 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                      </div>
                      <div className="relative h-4 bg-muted rounded w-1/4 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : preparedGames.length > 0 ? (
            <>
              {viewMode === 'grid' ? (
                <GameGrid games={preparedGames} readonly onGameClick={handleGameClick} />
              ) : (
                <GameListReadonly games={preparedGames} onGameClick={handleGameClick} />
              )}

              {/* Sentinel pour la pagination infinie */}
              {hasNextPage && (
                <div
                  ref={loadMoreRef}
                  className="flex items-center justify-center py-8"
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Chargement de plus de jeux...
                    </div>
                  )}
                </div>
              )}
            </>
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

