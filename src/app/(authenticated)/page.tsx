"use client";

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/context/auth-context';
import { useUserStatsStore } from '@/store/useUserStatsStore';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Composant pour les statistiques
function UserStats() {
  const { user } = useAuth();
  const { 
    total, completed, inProgress, wishlist, 
    platforms, isLoading, fetchUserStats 
  } = useUserStatsStore();

  useEffect(() => {
    if (user) {
      fetchUserStats(user.id);
    }
  }, [user, fetchUserStats]);

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
  const { user } = useAuth();
  const { recentGames, isLoading, fetchUserStats } = useUserStatsStore();
  
  // Log auth status
  useEffect(() => {
    console.log('Auth user:', user ? `User ID: ${user.id}` : 'No user');
  }, [user]);
  
  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      console.log('Fetching user stats for user ID:', user.id);
      fetchUserStats(user.id);
    }
  }, [user, fetchUserStats]);
  
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

  // Show all games regardless of id for debugging
  const gamesForDisplay = recentGames;

  return (
    <div className="space-y-3">
      {gamesForDisplay.map(game => (
        <Link 
          href={`/games/${game.game_id}`} 
          key={`recent-game-${game.id}`}
          className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors cursor-pointer"
        >
          <div className="relative w-12 h-16 shrink-0">
            {game.cover_url ? (
              <Image 
                src={game.cover_url}
                alt={game.title}
                fill
                sizes="(max-width: 640px) 96px, 120px"
                className="object-cover rounded-sm"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center rounded-sm">
                <span className="text-xs text-muted-foreground">No Cover</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate" title={game.title}>{game.title}</p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-xs text-muted-foreground">
              <span>{game.console_name}</span>
              <span className="hidden sm:inline">•</span>
              <span>Ajouté le {game.created_at}</span>
            </div>
          </div>
          
          <Badge 
            className={cn(
              "shrink-0",
              game.status === "COMPLETED" && "bg-green-500/20 text-green-700 hover:bg-green-500/30",
              game.status === "IN_PROGRESS" && "bg-blue-500/20 text-blue-700 hover:bg-blue-500/30",
              game.status === "NOT_STARTED" && "bg-gray-500/20 text-gray-700 hover:bg-gray-500/30",
              game.status === "WISHLIST" && "bg-amber-500/20 text-amber-700 hover:bg-amber-500/30"
            )}
          >
            {game.status === "COMPLETED" && "Terminé"}
            {game.status === "IN_PROGRESS" && "En cours"}
            {game.status === "NOT_STARTED" && "Non commencé"}
            {game.status === "WISHLIST" && "Souhaité"}
          </Badge>
        </Link>
      ))}

      <Button asChild variant="outline" className="w-full mt-2">
        <Link href="/collection">Voir toute la collection</Link>
      </Button>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold">Bienvenue sur MemCard</h1>
        <p className="text-xl text-muted-foreground">
          Gérez votre collection de jeux vidéo en toute simplicité
        </p>
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
