"use client";

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/context/auth-context';
import { useUserStatsStore } from '@/store/useUserStatsStore';
import { useCollectionStore } from '@/store/useCollectionStore';
import { Loader2, Gamepad, Calendar } from 'lucide-react';
import { UserProfileDisplay } from '@/components/user/user-profile-display';
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
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
  const { fetchUserStats, reset: resetStats } = useUserStatsStore();
  
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
  
  return (
    <div className="space-y-8">
      <section className="flex items-start justify-between mb-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Bienvenue sur MemCard</h1>
          <p className="text-xl text-muted-foreground">
            Gérez votre collection de jeux vidéo en toute simplicité
          </p>
        </div>
        <div className="bg-card p-4 rounded-lg shadow-sm">
          <UserProfileDisplay />
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
