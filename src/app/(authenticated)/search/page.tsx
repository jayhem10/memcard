'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { formatIGDBReleaseDate, getIGDBReleaseYear } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import { Search, Loader2, X, Check } from 'lucide-react';
import Image from 'next/image';
import { queryIGDB, IGDB_CONFIG } from '@/lib/igdb';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { ConsoleSelectDialog } from '@/components/console-select-dialog';
import { useAuth } from '@/context/auth-context';
import { Badge } from "@/components/ui/badge";

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
  const [searchQuery, setSearchQuery] = useState('');
  const [shouldSearch, setShouldSearch] = useState<boolean>(false);
  const [selectedPlatform, setSelectedPlatform] = useState<number | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedGame, setSelectedGame] = useState<IGDBGame | null>(null);
  const [isConsoleDialogOpen, setIsConsoleDialogOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // Utiliser le contexte d'authentification pour accéder à l'utilisateur
  const { user } = useAuth();

  // Charger les plateformes depuis Supabase au démarrage
  useEffect(() => {
    const fetchPlatformsFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('consoles')
          .select('id, name, igdb_platform_id, release_year, image_url, abbreviation')
          .order('name');
        
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
        const formattedPlatforms = validPlatforms.map(platform => ({
          ...platform,
          id: Number(platform.id),
          igdb_platform_id: Number(platform.igdb_platform_id)
        }));
        
        // Ajouter une option "Tous" en première position avec igdb_platform_id = 0
        // Pour plus de cohérence avec notre sélection par ID IGDB
        const allPlatforms = [
          { id: 'all', name: 'Toutes les plateformes', igdb_platform_id: 0, abbreviation: 'ALL' },
          ...formattedPlatforms
        ];
                
        setPlatforms(allPlatforms);
      } catch (error) {
        console.error('Erreur lors de la récupération des plateformes:', error);
        toast.error('Impossible de charger les plateformes');
      }
    };
    
    fetchPlatformsFromSupabase();
  }, []);



  const refetchRef = useRef<() => void>(() => {});
  
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
          involved_companies.publisher, platforms.*, platforms.name, genres.*, rating, total_rating;
        search "${searchQuery}";
        ${hasPlatformFilter ? `where platforms = (${selectedPlatform}) & version_parent = null;` : 'where version_parent = null;'}
        limit 12;
        offset ${pageParam};
      `;

      try {
        const result = await queryIGDB(IGDB_CONFIG.endpoints.games, query);
        
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
    refetchRef.current = refetch;
  }, [refetch]);
  
  // Pas de recherche automatique lorsque la plateforme change, seulement lorsque l'utilisateur lance la recherche manuellement

  const [selectedConsoleName, setSelectedConsoleName] = useState<string>('');
  
  const handleAddGame = async (consoleId: string, consoleName?: string) => {
    // Ne pas convertir le consoleId pour préserver le format UUID
    if (!selectedGame || !user) return;
    
    // Sauvegarder le nom de la console sélectionnée pour l'affichage
    let consoleDisplayName = "cette plateforme";
    if (consoleName) {
      consoleDisplayName = consoleName;
    } else {
      // Récupérer le nom de la console si non fourni
      const { data: consoleData } = await supabase
        .from('consoles')
        .select('name')
        .eq('id', consoleId)
        .single();
      
      if (consoleData) {
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
      const { data: existingGameOtherConsole, error: findErrorOther } = await supabase
        .from('games')
        .select('id')
        .eq('igdb_id', selectedGame.id)
        .neq('console_id', consoleId);
      
      if (findErrorOther) throw findErrorOther;
      
      let gameId;
      let isNewConsole = existingGameOtherConsole && existingGameOtherConsole.length > 0;
      
      // Vérifier si l'utilisateur possède déjà ce jeu pour cette console
      if (existingGame) {
        gameId = existingGame.id;
        
        // Vérifier si l'utilisateur possède déjà ce jeu
        const { data: existingUserGame, error: userGameFindError } = await supabase
          .from('user_games')
          .select('id')
          .eq('user_id', user.id)
          .eq('game_id', gameId)
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
        const { data: newGame, error: gameError } = await supabase
          .from('games')
          .insert({
            igdb_id: selectedGame.id, // Add the igdb_id to prevent not-null constraint violation
            title: selectedGame.name,
            release_date: formatIGDBReleaseDate(selectedGame.first_release_date),
            developer: developer || 'Unknown',
            publisher: publisher || 'Unknown',
            description: selectedGame.summary || '',
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
      const { error: userGameError } = await supabase
        .from('user_games')
        .insert({
          user_id: user.id,
          game_id: gameId,
          status: 'NOT_STARTED',
          rating: 0,
          notes: ''
        });
      
      if (userGameError) throw userGameError;
      
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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Rechercher un jeu</h1>
      </div>
      
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-10 pr-24"
          placeholder="Rechercher un jeu..."
          value={searchQuery}
          // Input optimisé pour être plus rapide
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setShouldSearch(true);
              refetchRef.current();
            }
          }}
        />
        <Button 
          className="absolute right-0 top-0 h-full rounded-l-none"
          onClick={() => {
            setShouldSearch(true);
            refetchRef.current();
          }}
        >
          Rechercher
        </Button>
      </div>
      
      <div className="mb-6 text-xs text-muted-foreground italic text-center">
        Appuyez sur Entrée ou cliquez sur Rechercher pour lancer la recherche
      </div>
      
      {/* Sélecteur de plateforme simplifié */}
      <div className="mb-6 p-4 bg-muted/30 rounded-lg">
        <h2 className="text-sm font-medium mb-3">Sélectionner une plateforme (optionnel)</h2>
        
        <div className="relative">
          <div className="flex flex-col space-y-2">
            {/* Champ de recherche pour filtrer les plateformes */}
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                className="pl-8 pr-2"
                type="text" 
                placeholder="Rechercher une plateforme..."
                onChange={(e) => {
                  // Filtre local du select, ne lance pas de requête
                  const searchValue = e.target.value.toLowerCase();
                  // Le filtrage est géré via le CSS dynamique des options
                  document.querySelectorAll('#platform-select option').forEach((option: Element) => {
                    const optionElement = option as HTMLOptionElement;
                    // Toujours afficher l'option "Toutes les plateformes"
                    if (optionElement.textContent?.toLowerCase().includes(searchValue) || optionElement.value === '') {
                      optionElement.classList.remove('hidden');
                    } else {
                      optionElement.classList.add('hidden');
                    }
                  });
                  
                  // Faire défiler vers le haut pour voir les résultats
                  const selectElement = document.getElementById('platform-select');
                  if (selectElement) {
                    selectElement.scrollTop = 0;
                  }
                }}
              />
            </div>
            
            <select
              id="platform-select"
              className="w-full p-2 border rounded-md bg-background min-h-[180px] hover:cursor-pointer focus:ring-1 focus:ring-primary"
              value={selectedPlatform || ""}
              onChange={(e) => {
                const value = e.target.value;
                const parsedValue = value ? parseInt(value, 10) : null;
                
                setSelectedPlatform(parsedValue);
                
                // Lancer une recherche si du texte existe
                if (searchQuery) {
                  setShouldSearch(true);
                  refetchRef.current();
                } else {
                  setShouldSearch(false);
                }
              }}
              size={6}
              style={{ overflowY: 'auto' }}
            >
              <option value="">Toutes les plateformes</option>
              {platforms
                .filter(p => p.id !== 'all')
                .map((platform, index) => (
                  <option key={`platform-${platform.igdb_platform_id || index}`} value={platform.igdb_platform_id || ''}>
                    {platform.name} {platform.abbreviation ? `(${platform.abbreviation})` : ''}
                  </option>
              ))}
            </select>
          </div>
        </div>

        {selectedPlatform && selectedPlatform > 0 && (
          <div className="flex items-center mt-3">
            <span className="text-sm text-muted-foreground">Plateforme sélectionnée :</span>
            <Badge className="ml-2">
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
              className="ml-2 h-5 w-5 p-0" 
              onClick={() => {
                setSelectedPlatform(null);
                // Si une recherche existe déjà, relancer la recherche
                if (searchQuery && shouldSearch) {
                  refetchRef.current();
                }
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
      
      {isError ? (
        <div className="text-center py-12">
          <p className="text-destructive">Une erreur est survenue lors de la recherche</p>
          <Button onClick={() => {
            setShouldSearch(true);
            refetchRef.current();
          }} className="mt-4">
            Réessayer
          </Button>
        </div>
      ) : (
        <>
          {/* Message quand aucune recherche n'est effectuée */}
          {!searchQuery && (
            <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
              <p className="text-muted-foreground">
                {selectedPlatform && selectedPlatform > 0 
                  ? `Sélectionnez un jeu sur ${platforms.find(p => p.igdb_platform_id === selectedPlatform)?.name || 'la plateforme'} ou tapez un nom de jeu` 
                  : "Tapez un nom de jeu et appuyez sur Rechercher"}
              </p>
              
              {selectedConsoleName && (
                <div className="mt-4 rounded-md bg-primary/20 p-2 mx-auto inline-block">
                  <p className="text-sm">Dernière console sélectionnée: <span className="font-medium">{selectedConsoleName}</span></p>
                </div>
              )}
            </div>
          )}
          
          {/* Grille de résultats */}
          {searchQuery && data?.pages && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {data.pages.map((page, pageIndex) => (
                page.games.map((game: IGDBGame, gameIndex: number) => (
                  <div 
                    key={`${pageIndex}-${gameIndex}-${game.id}`}
                    className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedGame(game)}
                  >
                    <div className="relative aspect-[3/4]">
                      {game.cover ? (
                        <Image
                          src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`}
                          alt={game.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                          className="object-cover"
                        />
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
                      <h3 className="font-medium text-sm truncate" title={game.name}>
                        {game.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {game.first_release_date 
                          ? getIGDBReleaseYear(game.first_release_date)
                          : 'Date inconnue'}
                      </p>
                    </div>
                  </div>
                ))
              ))}
            </div>
          )}
          
          {/* Bouton charger plus */}
          {searchQuery && !isLoading && !isFetchingNextPage && hasMore && data?.pages && data.pages[0]?.games?.length > 0 && (
            <div className="flex justify-center my-6">
              <Button onClick={() => fetchNextPage()} variant="outline">
                Charger plus de jeux
              </Button>
            </div>
          )}
          
          {(isLoading || isFetchingNextPage) && (
            <div className="flex justify-center my-6">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          
          {searchQuery && data?.pages && data.pages[0]?.games?.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucun résultat trouvé</p>
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
          gameName={selectedGame.name}
          gamePlatforms={selectedGame.platforms}
        />
      )}
    </div>
  );
}
