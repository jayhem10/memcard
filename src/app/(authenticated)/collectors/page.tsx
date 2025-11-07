'use client';

import { useState, useEffect, useRef } from 'react';
import { SearchInput } from '@/components/ui/search-input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Search, Users } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface PublicProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_public: boolean;
  created_at: string;
}

export default function CollectorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const router = useRouter();
  const fetchingRef = useRef(false);
  const lastSearchRef = useRef<string | null>(null);
  const isInitialMountRef = useRef(true);
  
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Consolider les deux useEffect en un seul pour éviter les appels multiples
  useEffect(() => {
    const searchProfiles = async () => {
      // Éviter les appels multiples simultanés
      if (fetchingRef.current) {
        return;
      }

      // Éviter les appels pour la même recherche (sauf au premier montage)
      if (!isInitialMountRef.current && lastSearchRef.current === debouncedSearch) {
        return;
      }

      // Marquer que le premier montage est terminé
      if (isInitialMountRef.current) {
        isInitialMountRef.current = false;
      }

      fetchingRef.current = true;
      lastSearchRef.current = debouncedSearch;

      setIsLoading(true);

      try {
        const url = debouncedSearch.trim() 
          ? `/api/profiles/search?username=${encodeURIComponent(debouncedSearch)}`
          : '/api/profiles/search';
        
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || 'Erreur lors du chargement');
        }
        
        const data = await response.json();
        setProfiles(data.profiles || []);
        setHasSearched(!!debouncedSearch.trim());
      } catch (error: any) {
        console.error('Erreur lors de la recherche:', error);
        toast.error(error.message || 'Erreur lors de la recherche de collectionneurs');
        setProfiles([]);
      } finally {
        setIsLoading(false);
        fetchingRef.current = false;
      }
    };

    searchProfiles();
  }, [debouncedSearch]);

  const handleProfileClick = (userId: string) => {
    router.push(`/collectors/${userId}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-3xl"></div>
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
            Collectionneurs
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Découvrez les collections des autres collectionneurs
          </p>
        </div>
      </section>

      {/* Search Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm">
        <div className="relative p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1 w-6 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
            <h2 className="text-lg font-bold">Rechercher un collectionneur</h2>
          </div>
          
          <div className="space-y-4">
            <SearchInput
              placeholder="Rechercher par nom d'utilisateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => {
                setSearchQuery('');
                setProfiles([]);
                setHasSearched(false);
              }}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm">
        <div className="relative p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : profiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">
                {hasSearched ? 'Aucun collectionneur trouvé' : 'Aucun collectionneur disponible'}
              </p>
              {hasSearched && (
                <p className="text-sm text-muted-foreground mt-2">
                  Essayez avec un autre nom d'utilisateur
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {hasSearched 
                    ? `${profiles.length} collectionneur${profiles.length > 1 ? 's' : ''} trouvé${profiles.length > 1 ? 's' : ''}`
                    : `${profiles.length} collectionneur${profiles.length > 1 ? 's' : ''} disponible${profiles.length > 1 ? 's' : ''}`
                  }
                </h3>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {profiles.map((profile) => (
                  <Card
                    key={profile.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50"
                    onClick={() => handleProfileClick(profile.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={profile.avatar_url || ''} alt={profile.username || ''} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                            {profile.username?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">
                            {profile.username || 'Utilisateur sans nom'}
                          </h4>
                          {profile.full_name && (
                            <p className="text-sm text-muted-foreground truncate">
                              {profile.full_name}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0"
                        >
                          Voir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

