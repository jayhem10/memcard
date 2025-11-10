'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { SearchInput } from '@/components/ui/search-input';
import { formatIGDBReleaseDate, getIGDBReleaseYear } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import { Search, Loader2, X, Check, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { queryIGDB, IGDB_ENDPOINTS, getIGDBGameName, getIGDBGameSummary } from '@/lib/igdb';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { ConsoleSelectDialog } from '@/components/console-select-dialog';
import { useAuth } from '@/context/auth-context';
import { Badge } from "@/components/ui/badge";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

// Composant pour l'effet 3D tactile des jaquettes de jeux
const GameCover3D: React.FC<{
  gameId: number;
  imageId: string;
  gameName: string;
  pageIndex: number;
  gameIndex: number;
  children?: React.ReactNode;
}> = ({ gameId, imageId, gameName, pageIndex, gameIndex, children }) => {
  // Valeurs de mouvement pour le suivi du toucher/souris
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Transformer les mouvements en rotations avec des limites
  const rotateY = useTransform(x, [-100, 100], [10, -10]);
  const rotateX = useTransform(y, [-100, 100], [-10, 10]);
  
  // Ajouter un ressort pour des mouvements plus fluides
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 });
  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  
  // Gestionnaire pour le suivi du mouvement tactile/souris
  const handleMouse = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculer la position relative au centre
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  };
  
  // Réinitialiser la position quand le toucher/souris quitte l'élément
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };
  
  return (
    <motion.div
      className="absolute inset-0 w-full h-full"
      style={{
        perspective: "1000px",
        rotateY: springRotateY,
        rotateX: springRotateX
      }}
      onPointerMove={handleMouse}
      onPointerLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
    >
      <Image
        src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`}
        alt={gameName}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
        className="object-cover brightness-105 contrast-105"
        priority={pageIndex === 0 && gameIndex < 6} // Priorité aux premières images visibles
      />
      {/* Effet de reflet statique */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/10 pointer-events-none" />
      {/* Effet de bord 3D */}
      <div className="absolute top-0 right-0 w-[3px] h-full bg-gradient-to-l from-black/40 to-black/10 transform origin-right z-10" />
      {children}
    </motion.div>
  );
};

interface IGDBGame {
  id: number;
  name: string;
  cover?: {
    image_id: string;
  };
  first_release_date?: number;
  summary?: string;
  involved_companies?: Array<{
    company: {
      name: string;
    };
    developer?: boolean;
    publisher?: boolean;
  }>;
  genres?: Array<{
    id: number;
    name: string;
  }>;
  platforms?: Array<{
    id: number;
    name: string;
  }>;
}

interface Platform {
  id: number | string;
  name: string;
  igdb_platform_id: number;
  release_year?: number;
  image_url?: string;
  abbreviation?: string;
}

export default function SearchPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [shouldSearch, setShouldSearch] = useState<boolean>(false);
  const [selectedPlatform, setSelectedPlatform] = useState<number | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [filteredPlatforms, setFilteredPlatforms] = useState<Platform[]>([]);
  const [platformSearchQuery, setPlatformSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<IGDBGame | null>(null);
  const [isConsoleDialogOpen, setIsConsoleDialogOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isPlatformSectionExpanded, setIsPlatformSectionExpanded] = useState(false);
  
  // Référence pour le conteneur des résultats de recherche
  const searchResultsRef = useRef<HTMLDivElement>(null);
  // Référence pour le champ de recherche des plateformes
  const platformSearchInputRef = useRef<HTMLInputElement>(null);
  
  // Utiliser le contexte d'authentification pour accéder à l'utilisateur
  const { user } = useAuth();

  // Déplier automatiquement la section des plateformes si une recherche est en cours
  useEffect(() => {
    if (platformSearchQuery.trim() !== '') {
      setIsPlatformSectionExpanded(true);
    }
  }, [platformSearchQuery]);

  // Focaliser le champ de recherche des plateformes quand la section se déplie
  useEffect(() => {
    if (isPlatformSectionExpanded && platformSearchInputRef.current) {
      // Petit délai pour s'assurer que l'élément est rendu
      setTimeout(() => {
        platformSearchInputRef.current?.focus();
      }, 100);
    }
  }, [isPlatformSectionExpanded]);

  // Détecter si l'appareil est mobile
  useEffect(() => {
    // Vérifier si window est défini (client-side seulement)
    if (typeof window !== 'undefined') {
      const checkIfMobile = () => {
        setIsMobile(window.innerWidth < 640);
      };
      
      // Vérifier initialement
      checkIfMobile();
      
      // Ajouter un écouteur pour les changements de taille d'écran
      window.addEventListener('resize', checkIfMobile);
      
      // Nettoyer l'écouteur lors du démontage
      return () => window.removeEventListener('resize', checkIfMobile);
    }
  }, []);
  
  // Filtrer les plateformes lorsque la recherche change
  useEffect(() => {
    if (platforms.length > 0) {
      if (platformSearchQuery.trim() === '') {
        setFilteredPlatforms(platforms);
      } else {
        const searchValue = platformSearchQuery.toLowerCase();
        const filtered = platforms.filter(platform => 
          platform.id === 'all' || // Toujours inclure "Toutes les plateformes"
          platform.name.toLowerCase().includes(searchValue) ||
          (platform.abbreviation && platform.abbreviation.toLowerCase().includes(searchValue))
        );
        setFilteredPlatforms(filtered);
      }
    }
  }, [platformSearchQuery, platforms]);

  // Charger les plateformes depuis Supabase au démarrage
  useEffect(() => {
    const fetchPlatformsFromSupabase = async () => {
      try {
        // Définir le type pour les données de consoles
        type ConsoleData = {
          id: string | number;
          name: string;
          igdb_platform_id: number | null;
          release_year?: number | null;
          image_url?: string | null;
          abbreviation?: string | null;
        };
        
        const { data, error } = await supabase
          .from('consoles')
          .select('id, name, igdb_platform_id, release_year, image_url, abbreviation')
          .order('name')
          .returns<ConsoleData[]>();
        
        if (error) throw error;
                
        // Vérifier que les plateformes ont un igdb_platform_id valide
        const validPlatforms = data.filter(platform => {
          // Vérifier si igdb_platform_id existe et est un nombre valide
          return platform.igdb_platform_id !== null && 
                 platform.igdb_platform_id !== undefined && 
                 !isNaN(Number(platform.igdb_platform_id));
        });
                
        if (validPlatforms.length !== data.length) {
          console.warn(`${data.length - validPlatforms.length} plateformes sans igdb_platform_id ont été filtrées`);
        }
        
        // S'assurer que tous les champs sont du bon type
        const formattedPlatforms: Platform[] = validPlatforms.map(platform => ({
          id: Number(platform.id),
          name: platform.name,
          igdb_platform_id: Number(platform.igdb_platform_id),
          release_year: platform.release_year ? Number(platform.release_year) : undefined,
          image_url: platform.image_url || undefined,
          abbreviation: platform.abbreviation || undefined
        }));
        
        // Ajouter une option "Tous" en première position avec igdb_platform_id = 0
        // Pour plus de cohérence avec notre sélection par ID IGDB
        const allPlatforms: Platform[] = [
          { id: 'all', name: 'Toutes les plateformes', igdb_platform_id: 0, abbreviation: 'ALL' },
          ...formattedPlatforms
        ];
                
        setPlatforms(allPlatforms);
        setFilteredPlatforms(allPlatforms);
      } catch (error) {
        console.error('Erreur lors de la récupération des plateformes:', error);
        toast.error('Impossible de charger les plateformes');
      }
    };
    
    fetchPlatformsFromSupabase();
  }, []);



  const refetchRef = useRef<() => void>(() => {});
  
  // Fonction pour faire défiler vers les résultats de recherche
  const scrollToResults = useCallback(() => {
    // Attendre que les résultats soient chargés et rendus
    setTimeout(() => {
      if (isMobile && searchResultsRef.current) {
        searchResultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500); // Délai pour laisser le temps aux résultats de se charger
  }, [isMobile]);
  
  type QueryFnParams = { pageParam: number };
  type PageResult = { games: IGDBGame[]; nextCursor: number };
  async function fetchGames({ pageParam }: QueryFnParams): Promise<PageResult> {
      // Vérifier que nous avons un terme de recherche
      if (!searchQuery) {
        return { games: [], nextCursor: 0 };
      }
      
      // selectedPlatform contient maintenant directement l'ID IGDB
      // On cherche la plateforme par son ID IGDB pour l'affichage
      const selectedPlatformObj = selectedPlatform !== null ? 
        platforms.find(p => Number(p.igdb_platform_id) === Number(selectedPlatform)) : null;
      
      const hasPlatformFilter = selectedPlatform !== null && selectedPlatform > 0;
      const query = `
        fields name, cover.image_id, first_release_date, summary, 
          involved_companies.company.name, involved_companies.developer, 
          involved_companies.publisher, platforms.*, platforms.name, genres.*, rating, total_rating,
          alternative_names.name, alternative_names.comment;
        search "${searchQuery}";
        ${hasPlatformFilter ? `where platforms = (${selectedPlatform}) & version_parent = null;` : 'where version_parent = null;'}
        limit 12;
        offset ${pageParam};
      `;

      try {
        const result = await queryIGDB(IGDB_ENDPOINTS.games, query);
        
        // Si moins de 12 résultats, il n'y a plus de page suivante
        setHasMore(result.length >= 12);
        
        return {
          games: result,
          nextCursor: pageParam + 12
        };
      } catch (error) {
        console.error('Erreur lors de la recherche IGDB:', error);
        throw error;
      }
    }
    
  const { data, isLoading, fetchNextPage, isFetchingNextPage, isError, refetch } = useInfiniteQuery({
    queryKey: ['igdbGames', searchQuery, selectedPlatform, shouldSearch],
    initialPageParam: 0,
    queryFn: fetchGames,
    getNextPageParam: (lastPage: PageResult) => lastPage.nextCursor,
    enabled: !!searchQuery && shouldSearch, // Actif uniquement avec terme de recherche et shouldSearch=true
  });
  
  useEffect(() => {
    refetchRef.current = () => {
      refetch().then(() => {
        // Faire défiler vers les résultats après la recherche
        if (shouldSearch) {
          scrollToResults();
        }
      });
    };
  }, [refetch, scrollToResults, shouldSearch]);
  
  // Pas de recherche automatique lorsque la plateforme change, seulement lorsque l'utilisateur lance la recherche manuellement

  const [selectedConsoleName, setSelectedConsoleName] = useState<string>('');
  
  const handleAddGame = async (consoleId: string, consoleName?: string, status?: string, buyPrice?: number, condition?: string, edition?: string, editionOther?: string) => {
    // Ne pas convertir le consoleId pour préserver le format UUID
    if (!selectedGame || !user) return;
    
    // Sauvegarder le nom de la console sélectionnée pour l'affichage
    let consoleDisplayName = "cette plateforme";
    if (typeof consoleName === 'string') {
      consoleDisplayName = consoleName;
    } else {
      // Récupérer le nom de la console si non fourni
      type ConsoleNameData = { name: string };
      
      const { data: consoleData } = await supabase
        .from('consoles')
        .select('name')
        .eq('id', consoleId)
        .single<ConsoleNameData>();
      
      if (consoleData && typeof consoleData.name === 'string') {
        consoleDisplayName = consoleData.name;
      }
    }
    
    setSelectedConsoleName(consoleDisplayName);
    
    
    // Chercher le développeur et l'éditeur
    const developer = selectedGame.involved_companies?.find(company => company.developer)?.company.name;
    const publisher = selectedGame.involved_companies?.find(company => company.publisher)?.company.name;
    
    try {
      // Vérifier d'abord si l'utilisateur a déjà ce jeu dans sa collection (par IGDB ID)
      const { data: existingUserGames, error: userGamesError } = await supabase
        .from('user_games')
        .select('id, game_id')
        .eq('user_id', user.id);
      
      if (userGamesError) throw userGamesError;
      
      if (existingUserGames && existingUserGames.length > 0) {
        // Récupérer tous les jeux correspondants avec leur console_id
        const { data: games, error: gamesError } = await supabase
          .from('games')
          .select('id, igdb_id, console_id')
          .in('id', existingUserGames.map(ug => ug.game_id));
        
        if (gamesError) throw gamesError;
        
        // Vérifier si l'utilisateur a déjà ce jeu sur la même console
        if (games && games.some(game => game.igdb_id === selectedGame.id && game.console_id === consoleId)) {
          toast.error(
            `${selectedGame.name} existe déjà dans votre bibliothèque pour ${consoleDisplayName}`, 
            { 
              duration: 4000,
              icon: '🚫',
              style: {
                border: '1px solid #ef4444',
                padding: '16px',
                color: '#ef4444',
              },
            }
          );
          // Fermer le dialogue et réinitialiser
          setIsConsoleDialogOpen(false);
          setSelectedGame(null);
          return;
        }
      }
      
      // Vérifier si le jeu existe déjà dans la base de données avec le même IGDB ID et console ID
      const { data: existingGame, error: findError } = await supabase
        .from('games')
        .select('id')
        .eq('igdb_id', selectedGame.id)
        .eq('console_id', consoleId)
        .maybeSingle();

      if (findError) throw findError;
      
      // Vérifier si le jeu existe pour un autre console
      type GameIdData = { id: string }[];
      
      const { data: existingGameOtherConsole, error: findErrorOther } = await supabase
        .from('games')
        .select('id')
        .eq('igdb_id', selectedGame.id)
        .neq('console_id', consoleId)
        .returns<GameIdData>();
      
      if (findErrorOther) throw findErrorOther;
      
      let gameId;
      // Vérifier si le jeu existe déjà pour une autre console
      let isNewConsole = existingGameOtherConsole && Array.isArray(existingGameOtherConsole) && existingGameOtherConsole.length > 0;
      
      // Vérifier si l'utilisateur possède déjà ce jeu pour cette console
      if (existingGame) {
        gameId = existingGame.id;
        
        // Vérifier si l'utilisateur possède déjà ce jeu
        // S'assurer que gameId est une chaîne ou un nombre avant de l'utiliser
        const gameIdString = typeof gameId === 'string' || typeof gameId === 'number' ? String(gameId) : '';
        
        const { data: existingUserGame, error: userGameFindError } = await supabase
          .from('user_games')
          .select('id')
          .eq('user_id', user.id)
          .eq('game_id', gameIdString)
          .maybeSingle();
        
        if (userGameFindError) throw userGameFindError;
        
        if (existingUserGame) {
          // Le jeu est déjà dans la collection de l'utilisateur pour cette console
          toast.error(
            `${selectedGame.name} existe déjà dans votre bibliothèque pour ${consoleDisplayName}`, 
            { 
              duration: 4000,
              icon: '🚫',
              style: {
                border: '1px solid #ef4444',
                padding: '16px',
                color: '#ef4444',
              },
            }
          );
          return; // Arrêter le processus d'ajout
        }
      }
      
        // Créer une nouvelle entrée de jeu si nécessaire
        if (!existingGame) {
          // Le jeu n'existe pas pour cette console, on l'ajoute
          // S'assurer que release_date n'est jamais null
          const releaseDate = formatIGDBReleaseDate(selectedGame.first_release_date);
          
          // Extraire le nom (français si disponible via alternative_names, sinon anglais)
          // et la description (anglais uniquement)
          const gameName = getIGDBGameName(selectedGame);
          const gameSummary = getIGDBGameSummary(selectedGame);
          
          const { data: newGame, error: gameError } = await supabase
            .from('games')
            .insert({
              igdb_id: selectedGame.id, // Add the igdb_id to prevent not-null constraint violation
              title: gameName,
              release_date: releaseDate || '2000-01-01', // Double sécurité pour éviter null
              developer: developer || 'Unknown',
              publisher: publisher || 'Unknown',
              description_en: gameSummary,
              description_fr: null, // Sera traduit plus tard via le bouton admin
              cover_url: selectedGame.cover 
                ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${selectedGame.cover.image_id}.jpg`
                : null,
              console_id: consoleId // Remettre console_id ici
            })
            .select()
            .single();
  
        if (gameError) {
          console.error('Erreur lors de l\'ajout du jeu:', gameError);
          throw gameError;
        }
        gameId = newGame.id;
        
        // Gestion des genres si le jeu a des genres
        if (selectedGame.genres && selectedGame.genres.length > 0) {
          // Pour chaque genre du jeu
          for (const genre of selectedGame.genres) {
            // 1. Vérifier si le genre existe déjà
            const { data: existingGenre, error: genreQueryError } = await supabase
              .from('genres')
              .select('id')
              .eq('name', genre.name)
              .maybeSingle();
            
            if (genreQueryError) throw genreQueryError;
            
            let genreId;
            
            if (existingGenre) {
              genreId = existingGenre.id;
            } else {
              // 2. Ajouter le genre s'il n'existe pas
              const { data: newGenre, error: genreInsertError } = await supabase
                .from('genres')
                .insert({ name: genre.name })
                .select()
                .single();
              
              if (genreInsertError) throw genreInsertError;
              genreId = newGenre.id;
            }
            
            // 3. Créer la relation entre le jeu et le genre
            const { error: gameGenreError } = await supabase
              .from('game_genres')
              .insert({
                game_id: gameId,
                genre_id: genreId
              });
            
            if (gameGenreError) throw gameGenreError;
          }
        }
      }
      
      // Ajouter le jeu à la collection de l'utilisateur
      const finalStatus = status || 'NOT_STARTED';
      // Si le statut est WISHLIST, réinitialiser condition à NULL
      // (car un jeu en wishlist n'a pas encore d'état physique)
      const finalCondition = (finalStatus === 'WISHLIST' || finalStatus === 'wishlist') 
        ? null 
        : (condition || null);
      
      const { error: userGameError } = await supabase
        .from('user_games')
        .insert({
          user_id: user.id,
          game_id: gameId,
          status: finalStatus,
          rating: 0,
          notes: '',
          buy_price: buyPrice || null,
          condition: finalCondition,
          edition: edition || null,
          edition_other: edition === 'autres' ? (editionOther || null) : null
        });
      
      if (userGameError) throw userGameError;
      
      // Invalider le cache pour rafraîchir les listes automatiquement
      // Invalider toutes les queries userGames et game pour cet utilisateur
      queryClient.invalidateQueries({ queryKey: ['userGames', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['game'] });
      
      // Attendre un peu pour que l'invalidation se propage
      await queryClient.refetchQueries({ queryKey: ['userGames', user?.id] });
      
      // Message personnalisé selon le cas
      if (isNewConsole) {
        // Le jeu existe déjà dans la base, mais pour une autre console
        toast.success(
          `${selectedGame.name} ajouté à votre collection pour ${consoleDisplayName} !`,
          { 
            duration: 4000,
            icon: '🎉',
            style: {
              border: '1px solid #10b981',
              padding: '16px',
              color: '#10b981',
            },
          }
        );
      } else {
        // Nouveau jeu ajouté
        toast.success(
          `${selectedGame.name} ajouté à votre collection !`,
          { 
            duration: 4000,
            icon: '🎉',
            style: {
              border: '1px solid #10b981',
              padding: '16px',
              color: '#10b981',
            },
          }
        );
      }
      
      // Réinitialiser la sélection
      setSelectedGame(null);
      setIsConsoleDialogOpen(false);
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout du jeu:', error);
      console.error('Détails de l\'erreur:', error.details || 'Pas de détails');
      toast.error(error.message || 'Erreur lors de l\'ajout du jeu à votre collection');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Rechercher un jeu
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Trouvez et ajoutez des jeux à votre collection depuis la base de données IGDB
            </p>
          </div>
          
          <div className="relative">
            <SearchInput
              placeholder="Rechercher un jeu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => {
                setSearchQuery('');
                setShouldSearch(false);
              }}
              hasActionButton={true}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim() !== '') {
                  e.preventDefault();
                  setShouldSearch(true);
                  refetch().then(() => {
                    if (isMobile && searchResultsRef.current) {
                      setTimeout(() => {
                        searchResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 500);
                    }
                  });
                }
              }}
            />
            <Button 
              className="absolute right-0 top-0 h-full rounded-l-none rounded-lg shadow-md hover:shadow-lg transition-all"
              onClick={() => {
                if (searchQuery.trim() !== '') {
                  setShouldSearch(true);
                  refetch().then(() => {
                    if (isMobile && searchResultsRef.current) {
                      setTimeout(() => {
                        searchResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 500);
                    }
                  });
                }
              }}
            >
              Rechercher
            </Button>
          </div>
          <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground italic">
            Appuyez sur Entrée ou cliquez sur Rechercher pour lancer la recherche
          </p>
          <p className="text-xs text-muted-foreground italic"><span className="font-bold">Attention :</span> Si le titre n'est pas trouvé en français, il est possible que le titre soit en anglais.</p>
        </div>
        </div>
      </section>
      
      {/* Sélecteur de plateforme optimisé pour mobile et bureau avec système de dépliage */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <div className="relative">
          {/* En-tête cliquable pour déplier/replier */}
          <div 
            className="p-5 flex justify-between items-center cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => setIsPlatformSectionExpanded(!isPlatformSectionExpanded)}
          >
            <div className="flex items-center gap-3">
              <div className="h-1 w-6 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
              <h2 className="text-base font-bold">
                Sélectionner une plateforme {selectedPlatform !== null && filteredPlatforms.find(p => p.igdb_platform_id === selectedPlatform)?.name ? `(${filteredPlatforms.find(p => p.igdb_platform_id === selectedPlatform)?.name})` : '(optionnel)'}
              </h2>
            </div>
            <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isPlatformSectionExpanded ? 'rotate-180' : ''}`} />
          </div>
        
          {/* Contenu dépliable */}
          {isPlatformSectionExpanded && (
            <div className="px-5 pb-5 pt-0">
              <div className="relative">
                <div className="flex flex-col space-y-3">
                  {/* Champ de recherche pour filtrer les plateformes */}
                  <div className="relative">
                    <SearchInput 
                      ref={platformSearchInputRef}
                      className="pl-8 pr-2 rounded-lg"
                      type="text" 
                      placeholder="Rechercher une plateforme..."
                      value={platformSearchQuery}
                      onChange={(e) => setPlatformSearchQuery(e.target.value)}
                      onClear={() => setPlatformSearchQuery('')}
                      searchIcon={false}
                    />
                  </div>
                  
                  {/* Liste de plateformes compatible mobile */}
                  <div 
                    id="platform-list"
                    className="w-full border border-border/50 rounded-lg bg-background overflow-y-auto shadow-sm"
                    style={{
                      maxHeight: '40vh'
                    }}
                  >
                    {/* Option "Toutes les plateformes" */}
                    <div 
                      className={`p-3 hover:bg-accent/50 cursor-pointer transition-colors border-b border-border/50 last:border-b-0 ${selectedPlatform === null ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlatform(null);
                        if (searchQuery) {
                          setShouldSearch(true);
                          refetchRef.current();
                        }
                        if (isMobile) {
                          setIsPlatformSectionExpanded(false);
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border-2 transition-all ${selectedPlatform === null ? 'bg-primary border-primary' : 'border-muted-foreground'} mr-3`}></div>
                        <span className="font-medium">Toutes les plateformes</span>
                      </div>
                    </div>
                    
                    {/* Liste des plateformes */}
                    {filteredPlatforms
                      .filter(p => p.id !== 'all')
                      .map((platform, index) => (
                        <div 
                          key={`platform-${platform.igdb_platform_id || index}`}
                          className={`p-3 hover:bg-accent/50 cursor-pointer transition-colors border-b border-border/50 last:border-b-0 ${selectedPlatform === platform.igdb_platform_id ? 'bg-primary/10 border-l-4 border-l-primary' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlatform(platform.igdb_platform_id);
                            if (searchQuery) {
                              setShouldSearch(true);
                              refetchRef.current();
                            } else {
                              setShouldSearch(false);
                            }
                            if (isMobile) {
                              setIsPlatformSectionExpanded(false);
                            }
                          }}
                        >
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full border-2 transition-all ${selectedPlatform === platform.igdb_platform_id ? 'bg-primary border-primary' : 'border-muted-foreground'} mr-3`}></div>
                            <span className="font-medium">{platform.name} {platform.abbreviation ? <span className="text-muted-foreground">({platform.abbreviation})</span> : ''}</span>
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {selectedPlatform && selectedPlatform > 0 && (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Plateforme sélectionnée :</span>
            <Badge className="bg-primary/20 text-primary border-primary/30">
              {(() => {
                const platform = platforms.find(p => Number(p.igdb_platform_id) === Number(selectedPlatform));
                return platform ? 
                  `${platform.name}${platform.abbreviation ? ` (${platform.abbreviation})` : ''}` : 
                  `Plateforme IGDB #${selectedPlatform}`;
              })()}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive" 
              onClick={() => {
                setSelectedPlatform(null);
                if (searchQuery && shouldSearch) {
                  refetchRef.current();
                }
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {isError ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-destructive/10 via-card to-card/95 border border-destructive/20 shadow-xl backdrop-blur-sm p-12">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-destructive/5 opacity-50" />
          <div className="relative flex flex-col items-center justify-center gap-4 text-center">
            <p className="text-destructive font-medium text-lg">Une erreur est survenue lors de la recherche</p>
            <Button 
              onClick={() => {
                setShouldSearch(true);
                refetchRef.current();
              }} 
              className="rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              Réessayer
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Message quand aucune recherche n'est effectuée */}
          {!searchQuery && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm p-12">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
              <div className="relative flex flex-col items-center justify-center gap-4 text-center">
                <Search className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground text-lg">
                  {selectedPlatform !== null && selectedPlatform > 0 
                    ? `Sélectionnez un jeu sur ${platforms.find(p => p.igdb_platform_id === selectedPlatform)?.name || 'la plateforme'} ou tapez un nom de jeu` 
                    : "Tapez un nom de jeu et appuyez sur Rechercher"}
                </p>
                
                {selectedConsoleName && (
                  <div className="mt-2 rounded-lg bg-primary/20 border border-primary/30 p-3">
                    <p className="text-sm text-muted-foreground">
                      Dernière console sélectionnée: <span className="font-semibold text-primary">{selectedConsoleName}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Grille de résultats */}
          {searchQuery && data?.pages && (
            <div ref={searchResultsRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {data.pages.map((page, pageIndex) => (
                // Utiliser Fragment avec clé pour éviter les avertissements React
                <React.Fragment key={`page-${pageIndex}`}>
                  {page.games.map((game: IGDBGame, gameIndex: number) => (
                    <motion.div 
                      key={`${pageIndex}-${gameIndex}-${game.id}`}
                      className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md cursor-pointer"
                      onClick={() => setSelectedGame(game)}
                      whileHover={{ scale: 1.03 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg">
                        {game.cover ? (
                          <>
                            <GameCover3D gameId={game.id} imageId={game.cover.image_id} gameName={getIGDBGameName(game)} pageIndex={pageIndex} gameIndex={gameIndex}>
                            </GameCover3D>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-muted">
                            <span className="text-muted-foreground text-xs">No Image</span>
                          </div>
                        )}
                        {/* Badge indiquant le nombre de plateformes */}
                        {game.platforms && game.platforms.length > 0 && (
                          <div className="absolute top-2 right-2 bg-black/70 text-white px-1.5 py-0.5 rounded text-xs">
                            {game.platforms.length} {game.platforms.length > 1 ? "plateformes" : "plateforme"}
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <h3 className="font-medium text-sm truncate" title={getIGDBGameName(game)}>
                          {getIGDBGameName(game)}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {game.first_release_date 
                            ? getIGDBReleaseYear(game.first_release_date)
                            : 'Date inconnue'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          )}
          
          {/* Bouton charger plus */}
          {searchQuery && !isLoading && !isFetchingNextPage && hasMore && data?.pages && data.pages[0] && data.pages[0].games && data.pages[0].games.length > 0 && (
            <div className="flex justify-center my-6">
              <Button 
                onClick={() => fetchNextPage()} 
                variant="outline"
                className="rounded-lg shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-muted/30 to-muted/10 border-border/50 hover:border-primary/50 hover:from-primary/10 hover:to-primary/5"
              >
                Charger plus de jeux
              </Button>
            </div>
          )}
          
          {(isLoading || isFetchingNextPage) && (
            <div className="flex justify-center my-6">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          
          {searchQuery && data?.pages && data.pages[0] && data.pages[0].games && data.pages[0].games.length === 0 && !isLoading && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm p-12">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
              <div className="relative flex flex-col items-center justify-center gap-4 text-center">
                <Search className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground text-lg">Aucun résultat trouvé</p>
                <p className="text-sm text-muted-foreground/70">Essayez avec d'autres mots-clés ou une autre plateforme</p>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Modal de sélection de console */}
      {selectedGame && (
        <ConsoleSelectDialog
          isOpen={isConsoleDialogOpen || !!selectedGame}
          onClose={() => {
            setIsConsoleDialogOpen(false);
            setSelectedGame(null);
          }}
          onSelect={handleAddGame}
          gameName={selectedGame.name || 'Jeu sans nom'}
          gamePlatforms={selectedGame.platforms || []}
        />
      )}
    </div>
  );
}
