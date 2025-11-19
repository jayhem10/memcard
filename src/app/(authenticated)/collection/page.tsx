'use client';

import { useEffect, useState, Suspense, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { useQueryClient } from '@tanstack/react-query';
import { GameGrid, GameGridItem } from '@/components/games/game-grid';
import { GameList } from '@/components/games/game-list';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Grid2X2, List, Loader2, Database, Share2, Check, Power, ArrowUpDown, Type, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';
import { ExportButton } from '@/components/ui/export-button';
import { GameExportData } from '@/lib/excel-export';
import { useUserGames, useUserGamesStats, UserGamesFilters } from '@/hooks/useUserGames';
import { MobileFilterSelector } from '@/components/filters/mobile-filter-selector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { sortGamesByTitle } from '@/lib/game-utils';

// Types de données
type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'playing' | 'completed' | 'backlog' | 'wishlist';
type CollectionTab = 'collection' | 'wishlist';
type SortOrder = 'alphabetical' | 'date-desc';

function CollectionPageContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [consoleFilter, setConsoleFilter] = useState<string>('all');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<CollectionTab>('collection');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isShareActive, setIsShareActive] = useState<boolean | null>(null);
  const [isLoadingShare, setIsLoadingShare] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('alphabetical');

  // Préparer les filtres pour la requête
  const currentFilters: UserGamesFilters = {
    status: activeTab === 'wishlist' ? 'all' : statusFilter, // Dans wishlist, pas de filtre de statut
    console_id: consoleFilter,
    genre_id: genreFilter,
    search: searchQuery,
    tab: activeTab,
    sortOrder: sortOrder,
  };

  // Utiliser le hook React Query avec pagination côté Supabase pour les jeux
  const {
    games,
    isLoading: loading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useUserGames(currentFilters);

  // Hook séparé pour les stats complètes
  const { data: statsData, isLoading: statsLoading } = useUserGamesStats(activeTab);

  // Initialiser l'onglet et les filtres depuis l'URL si présent
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const statusParam = searchParams.get('status') as FilterStatus | null;
    const consoleParam = searchParams.get('console');
    
    // Gérer l'onglet
    if (tabParam === 'wishlist') {
      setActiveTab('wishlist');
      // Réinitialiser les filtres quand on passe à wishlist
      setStatusFilter('all');
      setConsoleFilter('all');
      setGenreFilter('all');
    } else {
      setActiveTab('collection');
    }
    
    // Initialiser le filtre de statut depuis l'URL si présent
    if (statusParam && ['all', 'playing', 'completed', 'backlog', 'wishlist'].includes(statusParam)) {
      setStatusFilter(statusParam);
    } else if (!statusParam) {
      // Réinitialiser seulement si pas de paramètre status dans l'URL
      setStatusFilter('all');
    }
    
    // Initialiser le filtre de console depuis l'URL si présent
    if (consoleParam) {
      setConsoleFilter(consoleParam);
    } else {
      setConsoleFilter('all');
    }
    
    // Réinitialiser les autres filtres
    setGenreFilter('all');
    setSearchQuery('');
  }, [searchParams]);
  
  // Get auth context
  const { user } = useAuth();

  // Gérer les erreurs de chargement
  useEffect(() => {
        if (error) {
        toast.error('Erreur lors du chargement de la collection');
    }
  }, [error]);

  // Utiliser les stats complètes depuis le hook séparé
  const { consoles, genres, totalGames } = useMemo(() => {
    if (!statsData) {
      return { consoles: [], genres: [], totalGames: 0 };
    }

    // Calculer le nombre total de jeux pour l'onglet actif
    const totalCount = statsData.consoles.find((c: { id: string; name: string; count: number }) => c.id === 'all')?.count || 0;

    // Trier les consoles et genres du plus grand nombre de jeux au plus petit
    const sortedConsoles = [...statsData.consoles].sort((a, b) => b.count - a.count);
    const sortedGenres = [...statsData.genres].sort((a, b) => b.count - a.count);

    return {
      consoles: sortedConsoles,
      genres: sortedGenres,
      totalGames: totalCount
    };
  }, [statsData]);

  // Préparer les jeux pour GameGrid (accepte null pour rating)
  const preparedGamesForGrid: GameGridItem[] = games;

  // Préparer les jeux pour GameList (n'accepte pas null pour rating et completion_percentage)
  const preparedGamesForList = games.map(game => ({
    ...game,
    rating: game.rating ?? undefined, // Convertir null en undefined
    completion_percentage: game.completion_percentage ?? undefined, // Convertir null en undefined
    play_time: game.play_time ?? undefined, // Convertir null en undefined
  }));

  // Les jeux sont maintenant filtrés côté serveur, on utilise directement les jeux
  const filteredGames = preparedGamesForGrid;

  // Hook pour l'infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  // Charger plus de données quand l'élément sentinel devient visible
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Les jeux sont maintenant filtrés et triés côté Supabase
  // On utilise directement les jeux récupérés
  const sortedGames = games;

  const filterButtons: { label: string; value: FilterStatus }[] = [
    { label: 'Tous', value: 'all' },
    { label: 'En cours', value: 'playing' },
    { label: 'Terminés', value: 'completed' },
    { label: 'À faire', value: 'backlog' },
  ];

  const handleGetShareLink = async () => {
    try {
      setIsLoadingShare(true);
      // Récupérer le token de session depuis Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/wishlist/share', {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du lien');
      }

      const data = await response.json();
      
      if (data.error) {
        console.error('API error:', data.error, data.details);
        toast.error(data.details || data.error || 'Erreur lors de la génération du lien');
        return;
      }
      
      setShareUrl(data.shareUrl);
      setIsShareActive(data.isActive !== undefined ? data.isActive : true);
    } catch (error: any) {
      console.error('Error getting share link:', error);
      toast.error(error.message || 'Erreur lors de la génération du lien');
    } finally {
      setIsLoadingShare(false);
    }
  };

  const handleToggleShare = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const newStatus = !isShareActive;
      const response = await fetch('/api/wishlist/share/toggle', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de la mise à jour du partage');
      }

      const data = await response.json();
      setIsShareActive(newStatus);
      
      // Si on active le partage et qu'on n'a pas encore d'URL, la récupérer
      if (newStatus && !shareUrl) {
        handleGetShareLink();
      }
      
      toast.success(data.message || (newStatus ? 'Partage activé' : 'Partage désactivé'));
    } catch (error: any) {
      console.error('Error toggling share:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour du partage');
    }
  };

  const handleCopyLink = async () => {
    try {
      // Si pas d'URL, récupérer d'abord
      let urlToCopy = shareUrl;
      if (!urlToCopy) {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const response = await fetch('/api/wishlist/share', {
          method: 'GET',
          credentials: 'include',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || 'Erreur lors de la récupération du lien');
        }

        const data = await response.json();
        
        if (data.error) {
          console.error('API error:', data.error, data.details);
          toast.error(data.details || data.error || 'Erreur lors de la génération du lien');
          return;
        }
        
        urlToCopy = data.shareUrl;
        setShareUrl(urlToCopy);
        setIsShareActive(data.isActive !== undefined ? data.isActive : true);
      }

      // Vérifier qu'on a bien une URL avant de copier
      if (!urlToCopy) {
        console.error('No URL to copy');
        toast.error('Impossible de récupérer le lien de partage');
        return;
      }

      // Copier l'URL dans le presse-papiers
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      toast.success('Lien copié dans le presse-papiers');
      setTimeout(() => setCopied(false), 2000);
    } catch (error: any) {
      console.error('Error copying link:', error);
      toast.error(error.message || 'Erreur lors de la copie du lien');
    }
  };

  useEffect(() => {
    if (activeTab === 'wishlist' && (shareUrl === null || isShareActive === null) && user) {
      handleGetShareLink();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  // Invalider les queries quand les filtres changent pour forcer un refetch
  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ['userGames', user?.id],
      exact: false, // Invalider toutes les queries userGames pour cet utilisateur
    });
    // Invalider aussi les stats quand l'onglet change
    queryClient.invalidateQueries({
      queryKey: ['userGamesStats', user?.id],
      exact: false,
    });
  }, [searchQuery, statusFilter, consoleFilter, genreFilter, activeTab, sortOrder, queryClient, user?.id]);

  // Forcer un refetch spécifique quand l'onglet change
  useEffect(() => {
    // Reset pagination et refetch quand l'onglet change
    queryClient.resetQueries({
      queryKey: ['userGames', user?.id],
      exact: false,
    });
  }, [activeTab, queryClient, user?.id]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              {activeTab === 'wishlist' ? 'Ma Liste de Souhaits' : 'Ma Collection'}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {activeTab === 'wishlist'
                ? `Gérez vos ${totalGames} jeu${totalGames > 1 ? 'x' : ''} souhaité${totalGames > 1 ? 's' : ''} et partagez votre liste`
                : `Gérez et explorez votre collection de ${totalGames} jeu${totalGames > 1 ? 'x' : ''}`
              }
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
          {activeTab === 'wishlist' && (
            <>
              {isLoadingShare ? (
                // Skeleton pour les boutons de partage pendant le chargement
                <>
                  <div className="relative h-9 w-28 sm:w-36 bg-muted rounded-md overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                  <div className="relative h-9 w-24 sm:w-28 bg-muted rounded-md overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                </>
              ) : (
                <>
                  <Button
                    variant={isShareActive === false ? "secondary" : "outline"}
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleShare();
                    }}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
                    title={isShareActive ? 'Désactiver le partage' : 'Activer le partage'}
                  >
                    <Power className={`h-4 w-4 ${isShareActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="hidden sm:inline text-sm">{isShareActive ? 'Partage actif' : 'Partage désactivé'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCopyLink();
                    }}
                    disabled={!isShareActive}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3"
                    title={!isShareActive ? 'Activez le partage pour copier le lien' : 'Copier le lien de partage'}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span className="hidden sm:inline text-sm">Copié !</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4" />
                        <span className="hidden sm:inline text-sm">Partager</span>
                      </>
                    )}
                  </Button>
                </>
              )}
            </>
          )}
          {loading ? (
            // Skeleton pour le bouton Export pendant le chargement
            <div className="relative h-9 w-24 sm:w-28 bg-muted rounded-md overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          ) : (
            <ExportButton 
              games={preparedGamesForGrid as GameExportData[]}
              activeTab={activeTab}
              filename="ma_collection"
              size="sm"
              filters={{
                console: consoleFilter,
                genre: genreFilter,
                status: statusFilter,
                search: searchQuery
              }}
              consoleName={consoleFilter !== 'all' ? consoles.find((c: { id: string; name: string; count: number }) => c.id === consoleFilter)?.name : undefined}
            />
          )}
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
      </section>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <SearchInput
            placeholder={activeTab === 'collection' ? "Rechercher par titre, éditeur ou développeur..." : "Rechercher par titre, éditeur ou développeur..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </div>
        {activeTab === 'collection' && !loading && (
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {filterButtons.map((button) => (
              <Button
                key={button.value}
                variant={statusFilter === button.value ? 'default' : 'outline'}
                onClick={() => setStatusFilter(button.value)}
                className={`whitespace-nowrap transition-all duration-300 ${
                  statusFilter === button.value
                    ? 'hover:bg-primary/90'
                    : 'bg-gradient-to-r from-muted/30 to-muted/10 !border-border/50 hover:!border-primary/50 hover:bg-secondary/60 hover:text-foreground'
                }`}
              >
                {button.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Filtrage par consoles */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm p-5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1 w-6 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-bold text-base">Plateformes</h3>
            </div>
          </div>
          
          {/* Mode mobile : sélecteur optimisé */}
          <div className="md:hidden">
            {statsLoading ? (
              <div className="relative h-10 bg-muted rounded-md overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            ) : (
              <MobileFilterSelector
                label="Plateforme"
                options={consoles.map((c: { id: string; name: string; count: number }) => ({ id: c.id, name: c.name, count: c.count }))}
                selectedId={consoleFilter}
                onSelect={setConsoleFilter}
                placeholder="Sélectionner une plateforme..."
              />
            )}
          </div>

          {/* Mode desktop : badges horizontaux */}
          <div className="hidden md:block">
            <ScrollArea className="h-16 whitespace-nowrap">
              <div className="flex flex-wrap gap-2 pb-1">
              {statsLoading ? (
                // Skeletons avec effet shimmer pendant le chargement
                Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="relative h-7 bg-muted rounded-full overflow-hidden"
                    style={{ width: `${80 + i * 20}px` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                ))
              ) : (
                consoles.map((console: { id: string; name: string; count: number }) => (
                  <Badge 
                    key={console.id} 
                    variant={consoleFilter === console.id ? "default" : "outline"}
                    className={`group cursor-pointer text-sm flex items-center gap-1.5 transition-all duration-300 ${
                      consoleFilter === console.id 
                        ? 'hover:bg-primary/90 text-primary-foreground' 
                        : 'bg-gradient-to-r from-muted/30 to-muted/10 border-border/50 hover:border-primary/50 hover:bg-secondary/60 hover:from-primary/10 hover:to-primary/5'
                    }`}
                    onClick={() => setConsoleFilter(console.id)}
                  >
                    <span className={consoleFilter !== console.id ? 'group-hover:text-primary transition-colors' : ''}>{console.name}</span>
                    <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-medium ${consoleFilter === console.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/20'}`}>
                      {console.count}
                    </span>
                  </Badge>
                ))
              )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Filtrage par genres */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm p-5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1 w-6 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                <path d="M5 3v4" />
                <path d="M19 17v4" />
                <path d="M3 5h4" />
                <path d="M17 19h4" />
              </svg>
              <h3 className="font-bold text-base">Genres</h3>
            </div>
          </div>
          
          {/* Mode mobile : sélecteur optimisé */}
          <div className="md:hidden">
            {statsLoading ? (
              <div className="relative h-10 bg-muted rounded-md overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            ) : (
              <MobileFilterSelector
                label="Genre"
                options={genres.map((g: { id: string; name: string; count: number }) => ({ id: g.id, name: g.name, count: g.count }))}
                selectedId={genreFilter}
                onSelect={setGenreFilter}
                placeholder="Sélectionner un genre..."
              />
            )}
          </div>

          {/* Mode desktop : badges horizontaux */}
          <div className="hidden md:block">
            <ScrollArea className="h-16 whitespace-nowrap">
              <div className="flex flex-wrap gap-2 pb-1">
              {statsLoading ? (
                // Skeletons avec effet shimmer pendant le chargement
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="relative h-7 bg-muted rounded-full overflow-hidden"
                    style={{ width: `${60 + i * 15}px` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                ))
              ) : (
                genres.map((genre: { id: string; name: string; count: number }) => (
                  <Badge 
                    key={genre.id} 
                    variant={genreFilter === genre.id ? "default" : "outline"}
                    className={`group cursor-pointer text-sm flex items-center gap-1.5 transition-all duration-300 ${
                      genreFilter === genre.id 
                        ? 'hover:bg-primary/90 text-primary-foreground' 
                        : 'bg-gradient-to-r from-muted/30 to-muted/10 border-border/50 hover:border-primary/50 hover:bg-secondary/60 hover:from-primary/10 hover:to-primary/5'
                    }`}
                    onClick={() => setGenreFilter(genre.id)}
                  >
                    <span className={genreFilter !== genre.id ? 'group-hover:text-primary transition-colors' : ''}>{genre.name}</span>
                    <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-medium ${genreFilter === genre.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/20'}`}>
                      {genre.count}
                    </span>
                  </Badge>
                ))
              )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Sélecteur de tri */}
      {!loading && sortedGames.length > 0 && (
        <div className="flex items-center justify-end">
          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
            <SelectTrigger className="w-auto sm:w-[200px] h-9 px-2 sm:px-3 text-sm border-border/50 bg-muted/30 hover:bg-muted/50">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                {sortOrder === 'alphabetical' ? (
                  <span className="hidden sm:inline">Ordre alphabétique</span>
                ) : (
                  <span className="hidden sm:inline">Plus récent au plus ancien</span>
                )}
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alphabetical">Ordre alphabétique</SelectItem>
              <SelectItem value="date-desc">Plus récent au plus ancien</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Liste des jeux */}
      <div className="min-h-[300px]">
        {loading ? (
          viewMode === 'grid' ? (
            // Skeletons pour le mode grille
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-muted via-muted/80 to-muted" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-muted-foreground/20" />
                </div>
              ))}
            </div>
          ) : (
            // Skeletons pour le mode liste
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="relative flex items-center space-x-4 p-4 rounded-lg bg-card overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  <div className="w-20 h-24 bg-muted rounded-md flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : sortedGames.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              <GameGrid games={preparedGamesForGrid} />
            ) : (
              <GameList games={preparedGamesForList} />
            )}
            {/* Élément sentinel pour l'infinite scroll */}
            {hasNextPage && (
              <div
                ref={loadMoreRef}
                className="flex justify-center py-8"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                {activeTab === 'wishlist' 
                  ? 'Aucun jeu dans votre liste de souhaits'
                  : 'Aucun jeu dans votre collection'
                }
              </p>
              <Link href="/search" className="inline-block">
                <Button variant="outline" className="rounded-lg shadow-md hover:shadow-lg transition-all">
                  Ajouter un jeu
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CollectionPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="relative h-9 w-48 bg-muted rounded overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
          <div className="flex gap-2">
            <div className="relative h-9 w-24 bg-muted rounded overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
            <div className="relative h-9 w-24 bg-muted rounded overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>
        <div className="flex h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    }>
      <CollectionPageContent />
    </Suspense>
  );
}
