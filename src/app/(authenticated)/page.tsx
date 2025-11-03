"use client";

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/context/auth-context';
import { useUserStatsStore } from '@/store/useUserStatsStore';
import { useCollectionStore } from '@/store/useCollectionStore';
import { useProfileStore } from '@/store/useProfileStore';
import { Gamepad, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

// Composant pour les statistiques
function UserStats() {
  const { 
    total, completed, inProgress, wishlist, 
    platforms, isLoading 
  } = useUserStatsStore();
  const { totalValue } = useCollectionStore();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {/* Skeletons pour les cartes de statistiques */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-muted/50 p-3 rounded-md space-y-2">
            <div className="relative h-4 bg-muted rounded overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
            <div className="relative h-8 bg-muted rounded overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
        ))}
        {/* Skeleton pour la valeur de la collection */}
        <div className="col-span-2 bg-muted/50 p-3 rounded-md space-y-2">
          <div className="relative h-4 bg-muted rounded overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
          <div className="relative h-8 bg-muted rounded overflow-hidden w-1/2">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>
        {/* Skeletons pour les top plateformes */}
        <div className="col-span-2 mt-4 space-y-2">
          <div className="relative h-4 bg-muted rounded overflow-hidden w-24">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="relative h-4 bg-muted rounded overflow-hidden" style={{ width: `${80 + i * 20}px` }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
              <div className="relative h-6 w-16 bg-muted rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-muted/50 p-3 rounded-md">
        <p className="text-sm text-muted-foreground">Total des jeux</p>
        <p className="text-2xl font-bold">{total}</p>
      </div>
      <div className="bg-muted/50 p-3 rounded-md">
        <p className="text-sm text-muted-foreground">En cours</p>
        <p className="text-2xl font-bold">{inProgress}</p>
      </div>
      <div className="bg-muted/50 p-3 rounded-md">
        <p className="text-sm text-muted-foreground">Terminés</p>
        <p className="text-2xl font-bold">{completed}</p>
      </div>
      <div className="bg-muted/50 p-3 rounded-md">
        <p className="text-sm text-muted-foreground">Liste de souhaits</p>
        <p className="text-2xl font-bold">{wishlist}</p>
      </div>
      <div className="col-span-2 bg-muted/50 p-3 rounded-md">
        <p className="text-sm text-muted-foreground">Valeur de la collection</p>
        <p className="text-2xl font-bold">{totalValue.toFixed(2)} €</p>
      </div>

      {platforms.length > 0 && (
        <div className="col-span-2 mt-4">
          <h3 className="text-sm font-medium mb-2">Top plateformes</h3>
          <div className="space-y-2">
            {platforms.slice(0, 3).map(platform => (
              <div key={`platform-${platform.igdb_platform_id}`} className="flex justify-between items-center">
                <span className="text-sm">{platform.name}</span>
                <Badge variant="secondary">{platform.count} jeux</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Composant pour les jeux récents
function RecentGames() {
  const { recentGames, isLoading } = useUserStatsStore();
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Skeletons pour les jeux récents */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="recent-games-card group rounded-md">
            {/* Skeleton pour l'image */}
            <div className="relative w-12 h-16 shrink-0 rounded-sm overflow-hidden bg-muted">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
            
            {/* Skeleton pour les informations */}
            <div className="game-info min-w-0 space-y-2 flex-1">
              <div className="relative h-4 bg-muted rounded overflow-hidden" style={{ width: `${60 + i * 20}%` }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
              <div className="space-y-1">
                <div className="relative h-3 bg-muted rounded overflow-hidden" style={{ width: `${40 + i * 10}%` }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
                <div className="relative h-3 bg-muted rounded overflow-hidden" style={{ width: `${35 + i * 10}%` }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>
            
            {/* Skeleton pour le badge */}
            <div className="relative h-6 w-20 bg-muted rounded-full shrink-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (recentGames.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Aucun jeu récent</p>
        <Button asChild>
          <Link href="/collection">Voir la collection</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {recentGames.map(game => (
          <Link 
            href={`/games/${game.game_id}`} 
            key={`recent-game-${game.id}`}
            className="recent-games-card group hover:bg-muted/50 rounded-md transition-all cursor-pointer"
          >
            {/* Image du jeu */}
            <div className="relative w-12 h-16 shrink-0 rounded-sm overflow-hidden">
              {game.cover_url ? (
                <Image 
                  src={game.cover_url}
                  alt={game.title}
                  fill
                  sizes="(max-width: 640px) 96px, 120px"
                  className="object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">No Cover</span>
                </div>
              )}
            </div>
            
            {/* Informations du jeu */}
            <div className="game-info min-w-0">
              <p className="game-title font-medium truncate" title={game.title}>{game.title}</p>
              <div className="game-meta text-muted-foreground">
                <span className="game-meta-text inline-flex items-center gap-1">
                  <Gamepad className="h-3 w-3" />
                  {game.console_name}
                </span>
                <span className="game-meta-text inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Ajouté le {game.created_at}
                </span>
              </div>
            </div>
            
            {/* Badge de statut */}
            <Badge 
              className={cn(
                "game-status-badge shrink-0 transition-colors",
                game.status === "COMPLETED" && "bg-green-500/20 text-green-700 group-hover:bg-green-500/30",
                game.status === "IN_PROGRESS" && "bg-blue-500/20 text-blue-700 group-hover:bg-blue-500/30",
                game.status === "NOT_STARTED" && "bg-gray-500/20 text-gray-700 group-hover:bg-gray-500/30",
                game.status === "WISHLIST" && "bg-amber-500/20 text-amber-700 group-hover:bg-amber-500/30"
              )}
            >
              {game.status === "COMPLETED" && "Terminé"}
              {game.status === "IN_PROGRESS" && "En cours"}
              {game.status === "NOT_STARTED" && "Non commencé"}
              {game.status === "WISHLIST" && "Souhaité"}
            </Badge>
          </Link>
        ))}
      </div>

      <Button asChild variant="outline" className="w-full mt-2">
        <Link href="/collection">Voir toute la collection</Link>
      </Button>
    </div>
  );
}

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, fetchProfile } = useProfileStore();
  const { fetchUserStats, reset: resetStats } = useUserStatsStore();
  
  // Charger le profil si l'utilisateur est authentifié et que le profil n'est pas encore chargé
  useEffect(() => {
    if (!authLoading && user && !profile) {
      // Forcer le chargement même si profileLoading est true (au cas où le layout n'aurait pas encore commencé)
      fetchProfile();
    }
  }, [user, authLoading, profile, fetchProfile]);
  
  // Gérer le chargement des données utilisateur
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        // L'utilisateur est authentifié, charger ses stats
        fetchUserStats(user.id);
      } else {
        // L'utilisateur n'est pas authentifié, réinitialiser les stats
        resetStats();
      }
    }
  }, [user, authLoading, fetchUserStats, resetStats]);
  
  // Préparer le nom d'affichage pour personnaliser le message
  const displayName = profile?.full_name || '';
  const greeting = displayName ? `Bienvenue ${displayName}` : 'Bienvenue';
  // Afficher le skeleton si on charge OU si l'utilisateur existe mais qu'on n'a pas encore le profil
  const isLoading = profileLoading || authLoading || (user && !profile);
  
  return (
    <div className="space-y-8">
      <section className="mb-6">
        <div className="space-y-2 sm:space-y-4 max-w-2xl">
          {isLoading ? (
            <>
              {/* Skeleton pour le titre */}
              <div className="relative h-10 sm:h-12 bg-muted rounded overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
              {/* Skeleton pour la description */}
              <div className="relative h-6 sm:h-7 bg-muted rounded overflow-hidden w-3/4">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </>
          ) : (
            <>
              <h1 className="text-3xl sm:text-4xl font-bold">{greeting}</h1>
              <p className="text-lg sm:text-xl text-muted-foreground">
                Découvrez vos statistiques et continuez à enrichir votre collection
              </p>
            </>
          )}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Statistiques */}
        <div className="p-6 bg-card rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Statistiques</h3>
          <Suspense fallback={<div>Chargement...</div>}>
            <UserStats />
          </Suspense>
        </div>

        {/* Jeux récents */}
        <div className="p-6 bg-card rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Jeux récents</h3>
          <Suspense fallback={<div>Chargement...</div>}>
            <RecentGames />
          </Suspense>
        </div>

        {/* Actions rapides */}
        <div className="p-6 bg-card rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
          <div className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/search">Ajouter un jeu</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/collection">Gérer la collection</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/profile">Modifier le profil</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
