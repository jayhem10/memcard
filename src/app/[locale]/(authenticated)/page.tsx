"use client";

import { useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/context/auth-context';
import { useStats, useCollection, useProfile } from '@/store';
import { supabase } from '@/lib/supabase';
import { Gamepad, Calendar, TrendingUp, Trophy, Heart, Euro, Zap, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { TranslatedGameStatus } from '@/components/games/TranslatedGameStatus';

// Composant pour les statistiques
function UserStats() {
  const t = useTranslations('home');
  const {
    total, completed, inProgress, wishlist,
    platforms, isLoading
  } = useStats();
  const { totalValue } = useCollection();

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeletons pour les cartes de statistiques */}
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="relative overflow-hidden rounded-xl bg-muted/30 border border-border/50 p-4 space-y-2">
              <div className="relative h-4 bg-muted/50 rounded overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
              <div className="relative h-8 bg-muted/50 rounded overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
        {/* Skeleton pour la valeur de la collection */}
        <div className="relative overflow-hidden rounded-2xl bg-muted/30 border border-border/50 p-6 space-y-2">
          <div className="relative h-4 bg-muted/50 rounded overflow-hidden w-48">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
          <div className="relative h-10 bg-muted/50 rounded overflow-hidden w-32">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>
        {/* Skeletons pour les top plateformes */}
        <div className="relative overflow-hidden rounded-2xl bg-muted/30 border border-border/50 p-6 space-y-3">
          <div className="relative h-5 bg-muted/50 rounded overflow-hidden w-32">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
              <div className="relative h-4 bg-muted/50 rounded overflow-hidden" style={{ width: `${80 + i * 20}px` }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
              <div className="relative h-6 w-16 bg-muted/50 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de statistiques avec design moderne */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/collection" className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50/50 via-card to-blue-50/30 dark:from-blue-950/20 dark:via-card dark:to-blue-950/10 border border-border/50 hover:border-primary/50 hover:from-primary/10 hover:to-primary/5 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-blue-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-3.5 w-3.5 text-blue-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide group-hover:text-primary transition-colors">{t('total')}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{total}</p>
          </div>
        </Link>
        
        <Link href="/collection?status=playing" className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50/50 via-card to-purple-50/30 dark:from-purple-950/20 dark:via-card dark:to-purple-950/10 border border-border/50 hover:border-primary/50 hover:from-primary/10 hover:to-primary/5 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-purple-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-purple-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide group-hover:text-primary transition-colors">{t('inProgress')}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{inProgress}</p>
          </div>
        </Link>
        
        <Link href="/collection?status=completed" className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50/50 via-card to-green-50/30 dark:from-green-950/20 dark:via-card dark:to-green-950/10 border border-border/50 hover:border-primary/50 hover:from-primary/10 hover:to-primary/5 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-green-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-3.5 w-3.5 text-green-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide group-hover:text-primary transition-colors">{t('completed')}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{completed}</p>
          </div>
        </Link>
        
        <Link href="/collection?tab=wishlist" className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50/50 via-card to-amber-50/30 dark:from-amber-950/20 dark:via-card dark:to-amber-950/10 border border-border/50 hover:border-primary/50 hover:from-primary/10 hover:to-primary/5 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-amber-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-3.5 w-3.5 text-amber-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide group-hover:text-primary transition-colors">{t('wishlist')}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{wishlist}</p>
          </div>
        </Link>
      </div>

      {/* Card valeur de la collection */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50/50 via-card to-teal-50/50 dark:from-emerald-950/20 dark:via-card dark:to-teal-950/20 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl" />
        <div className="relative p-5">
          <div className="flex items-center gap-2.5 mb-2">
            <Euro className="h-4 w-4 text-emerald-500" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('collectionValue')}</p>
          </div>
          <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
            {totalValue.toFixed(2)} €
          </p>
        </div>
      </div>

      {/* Top plateformes */}
      {platforms.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-6 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
              <h3 className="text-base font-bold">{t('topPlatforms')}</h3>
            </div>
            <div className="space-y-3">
              {platforms.slice(0, 3).map(platform => (
                <Link
                  key={`platform-${platform.igdb_platform_id}`}
                  href={`/collection?console=${platform.consoleId}`}
                  className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 hover:border-primary/50 hover:from-primary/10 hover:to-primary/5 transition-all duration-300 group cursor-pointer"
                >
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">{platform.name}</span>
                  <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                    {platform.count} {t('games')}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Composant pour les jeux récents
function RecentGames() {
  const t = useTranslations('home');
  const { recentGames, isLoading } = useStats();
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        {/* Skeletons pour les jeux récents */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
            {/* Skeleton pour l'image */}
            <div className="relative w-16 h-20 shrink-0 rounded-lg overflow-hidden bg-muted/50">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
            
            {/* Skeleton pour les informations */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="relative h-4 bg-muted/50 rounded overflow-hidden" style={{ width: `${60 + i * 20}%` }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
              <div className="space-y-1.5">
                <div className="relative h-3 bg-muted/50 rounded overflow-hidden" style={{ width: `${40 + i * 10}%` }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
                <div className="relative h-3 bg-muted/50 rounded overflow-hidden" style={{ width: `${35 + i * 10}%` }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>
            
            {/* Skeleton pour le badge */}
            <div className="relative h-7 w-20 bg-muted/50 rounded-lg shrink-0 overflow-hidden">
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
        <p className="text-muted-foreground">{t('noRecentGames')}</p>
        <Button asChild>
          <Link href="/collection">{t('viewCollection')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {recentGames.map(game => (
          <Link 
            href={`/games/${game.game_id}`} 
            key={`recent-game-${game.id}`}
            className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 hover:border-primary/50 hover:from-primary/10 hover:to-primary/5 transition-all duration-300 group shadow-sm hover:shadow-md"
          >
            {/* Image du jeu */}
            <div className="relative w-14 h-20 shrink-0 rounded-lg overflow-hidden bg-muted shadow-md group-hover:shadow-lg transition-shadow">
              {game.cover_url ? (
                <Image 
                  src={game.cover_url}
                  alt={game.title}
                  fill
                  sizes="(max-width: 640px) 56px, 80px"
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground font-medium">{t('noCover')}</span>
                </div>
              )}
            </div>
            
            {/* Informations du jeu */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors" title={game.title}>
                {game.title}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Gamepad className="h-3.5 w-3.5" />
                  {game.console_name}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {game.created_at}
                </span>
              </div>
            </div>
            
            {/* Badge de statut */}
            <Badge 
              className={cn(
                "shrink-0 transition-all duration-300 rounded-lg px-2.5 py-1 font-semibold text-xs backdrop-blur-sm",
                game.status === "COMPLETED" && "bg-gradient-to-r from-green-600/90 to-green-500/90 dark:from-green-500/90 dark:to-green-400/90 text-white border border-green-400/50 dark:border-green-300/50 group-hover:from-green-600 group-hover:to-green-500 dark:group-hover:from-green-500 dark:group-hover:to-green-400 shadow-sm",
                game.status === "IN_PROGRESS" && "bg-gradient-to-r from-blue-600/90 to-blue-500/90 dark:from-blue-500/90 dark:to-blue-400/90 text-white border border-blue-400/50 dark:border-blue-300/50 group-hover:from-blue-600 group-hover:to-blue-500 dark:group-hover:from-blue-500 dark:group-hover:to-blue-400 shadow-sm",
                game.status === "NOT_STARTED" && "bg-gradient-to-r from-gray-600/90 to-gray-500/90 dark:from-gray-500/90 dark:to-gray-400/90 text-white border border-gray-400/50 dark:border-gray-300/50 group-hover:from-gray-600 group-hover:to-gray-500 dark:group-hover:from-gray-500 dark:group-hover:to-gray-400 shadow-sm",
                game.status === "WISHLIST" && "bg-gradient-to-r from-amber-600/90 to-amber-500/90 dark:from-amber-500/90 dark:to-amber-400/90 text-white border border-amber-400/50 dark:border-amber-300/50 group-hover:from-amber-600 group-hover:to-amber-500 dark:group-hover:from-amber-500 dark:group-hover:to-amber-400 shadow-sm"
              )}
            >
              <TranslatedGameStatus status={game.status} />
            </Badge>
          </Link>
        ))}
      </div>

      <Button asChild variant="outline" className="w-full mt-3 rounded-lg shadow-md hover:shadow-lg transition-all text-sm">
        <Link href="/collection">{t('viewFullCollection')}</Link>
      </Button>
    </div>
  );
}

// Composant pour les meilleurs jeux notés
function TopRatedGames() {
  const t = useTranslations('home');
  const { topRatedGames, isLoading } = useStats();
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        {/* Skeletons pour les meilleurs jeux */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
            {/* Skeleton pour l'image */}
            <div className="relative w-16 h-20 shrink-0 rounded-lg overflow-hidden bg-muted/50">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
            
            {/* Skeleton pour les informations */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="relative h-4 bg-muted/50 rounded overflow-hidden" style={{ width: `${60 + i * 20}%` }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
              <div className="space-y-1.5">
                <div className="relative h-3 bg-muted/50 rounded overflow-hidden" style={{ width: `${40 + i * 10}%` }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
                <div className="relative h-3 bg-muted/50 rounded overflow-hidden" style={{ width: `${35 + i * 10}%` }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>
            
            {/* Skeleton pour le badge */}
            <div className="relative h-7 w-20 bg-muted/50 rounded-lg shrink-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (topRatedGames.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">{t('noRatedGames')}</p>
        <Button asChild>
          <Link href="/collection">{t('viewCollection')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {topRatedGames.map((game: { id: number; game_id: number; title: string; cover_url: string; console_name: string; average_rating: number | null; rating: number | null; status: string }) => (
          <Link 
            href={`/games/${game.game_id}`} 
            key={`top-rated-game-${game.id}`}
            className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50 hover:border-primary/50 hover:from-primary/10 hover:to-primary/5 transition-all duration-300 group shadow-sm hover:shadow-md"
          >
            {/* Image du jeu */}
            <div className="relative w-14 h-20 shrink-0 rounded-lg overflow-hidden bg-muted shadow-md group-hover:shadow-lg transition-shadow">
              {game.cover_url ? (
                <Image 
                  src={game.cover_url}
                  alt={game.title}
                  fill
                  sizes="(max-width: 640px) 56px, 80px"
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground font-medium">{t('noCover')}</span>
                </div>
              )}
            </div>
            
            {/* Informations du jeu */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors" title={game.title}>
                {game.title}
              </p>
              <div className="flex flex-col gap-1 mt-1.5 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Gamepad className="h-3.5 w-3.5" />
                    {game.console_name}
                  </span>
                </div>
                {/* Notes côte à côte */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Note moyenne IGDB */}
                  {game.average_rating !== null && (
                    <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                      <Star className="h-3.5 w-3.5 fill-blue-500 text-blue-500" />
                      {game.average_rating.toFixed(1)}/100
                    </span>
                  )}
                  {/* Note personnelle */}
                  {game.rating !== null ? (
                    <span className="inline-flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400 font-medium">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      {game.rating}/5 {t('yourRating')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xs">
                      {t('notRated')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Badge de statut */}
            <Badge 
              className={cn(
                "shrink-0 transition-all duration-300 rounded-lg px-2.5 py-1 font-semibold text-xs backdrop-blur-sm",
                game.status === "COMPLETED" && "bg-gradient-to-r from-green-600/90 to-green-500/90 dark:from-green-500/90 dark:to-green-400/90 text-white border border-green-400/50 dark:border-green-300/50 group-hover:from-green-600 group-hover:to-green-500 dark:group-hover:from-green-500 dark:group-hover:to-green-400 shadow-sm",
                game.status === "IN_PROGRESS" && "bg-gradient-to-r from-blue-600/90 to-blue-500/90 dark:from-blue-500/90 dark:to-blue-400/90 text-white border border-blue-400/50 dark:border-blue-300/50 group-hover:from-blue-600 group-hover:to-blue-500 dark:group-hover:from-blue-500 dark:group-hover:to-blue-400 shadow-sm",
                game.status === "NOT_STARTED" && "bg-gradient-to-r from-gray-600/90 to-gray-500/90 dark:from-gray-500/90 dark:to-gray-400/90 text-white border border-gray-400/50 dark:border-gray-300/50 group-hover:from-gray-600 group-hover:to-gray-500 dark:group-hover:from-gray-500 dark:group-hover:to-gray-400 shadow-sm",
                game.status === "WISHLIST" && "bg-gradient-to-r from-amber-600/90 to-amber-500/90 dark:from-amber-500/90 dark:to-amber-400/90 text-white border border-amber-400/50 dark:border-amber-300/50 group-hover:from-amber-600 group-hover:to-amber-500 dark:group-hover:from-amber-500 dark:group-hover:to-amber-400 shadow-sm"
              )}
            >
              <TranslatedGameStatus status={game.status} />
            </Badge>
          </Link>
        ))}
      </div>

      <Button asChild variant="outline" className="w-full mt-3 rounded-lg shadow-md hover:shadow-lg transition-all text-sm">
        <Link href="/collection">{t('viewFullCollection')}</Link>
      </Button>
    </div>
  );
}

export default function HomePage() {
  const t = useTranslations('home');
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, fetchProfile } = useProfile();
  const { fetchUserStats, resetStats } = useStats();
  const { calculateTotalFromGames, setUserId, resetCollection } = useCollection();
  const lastFetchedUserIdRef = useRef<string | null>(null);
  
  // Charger la valeur de la collection (uniquement sur la page d'accueil)
  useEffect(() => {
    const fetchCollectionValue = async () => {
      if (!user) {
        resetCollection();
        lastFetchedUserIdRef.current = null;
        return;
      }

      // Éviter les appels multiples pour le même utilisateur (React StrictMode en développement)
      if (lastFetchedUserIdRef.current === user.id) {
        return;
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        return;
      }

      lastFetchedUserIdRef.current = user.id;

      setUserId(user.id);
      // Définir le type pour les données de jeux
      type GameWithPrice = {
        buy_price: number | null;
      };
      
      const { data: games, error } = await supabase
        .from('user_games')
        .select('buy_price')
        .eq('user_id', user.id)
        // .returns();

      if (error) {
        console.error('Erreur lors de la récupération de la valeur de la collection:', error);
        return;
      }

      if (games) {
        // Transformer les données pour s'assurer que buy_price est toujours un nombre
        const gamesWithValidPrices = games.map((game: { buy_price: number | null }) => ({
          buy_price: typeof game.buy_price === 'number' ? game.buy_price : 0
        }));
        
        calculateTotalFromGames(gamesWithValidPrices);
      }
    };

    fetchCollectionValue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Charger le profil si l'utilisateur est authentifié et que le profil n'est pas encore chargé
  useEffect(() => {
    if (!authLoading && user && !profile) {
      // Si le profil est en cours de chargement depuis le layout, attendre un peu
      // Sinon, forcer le chargement immédiatement
      if (profileLoading) {
        // Attendre que le chargement du layout se termine
        const timer = setTimeout(() => {
          // Si après 1 seconde le profil n'est toujours pas chargé, forcer le chargement
          // Vérifier à nouveau l'état du profil au moment du timeout
          fetchProfile(true).catch(() => {
            // Si le chargement échoue, réessayer une fois
            fetchProfile(true);
          });
        }, 1000);
        
        return () => clearTimeout(timer);
      } else {
        // Pas de chargement en cours, charger directement
        fetchProfile(true); // Forcer pour éviter les problèmes de timing
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]); // Ne dépendre que de user.id et authLoading pour éviter les boucles infinies
  
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]); // Ne dépendre que de user.id et authLoading
  
  // Préparer le nom d'affichage pour personnaliser le message
  const displayName = profile?.full_name || '';
  const greeting = displayName ? `${t('welcome')} ${displayName}` : t('welcome');
  // Afficher le skeleton si on charge OU si l'utilisateur existe mais qu'on n'a pas encore le profil
  const isLoading = profileLoading || authLoading || (user && !profile);
  
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-3xl" />
        <div className="relative space-y-2">
          {isLoading ? (
            <>
              {/* Skeleton pour le titre */}
              <div className="relative h-8 sm:h-10 bg-muted/50 rounded overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
              {/* Skeleton pour la description */}
              <div className="relative h-5 sm:h-6 bg-muted/50 rounded overflow-hidden w-3/4">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                {greeting}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
                {t('discoverStats')}
              </p>
            </>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Statistiques - Prend toute la largeur sur mobile, 1/3 sur desktop */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-6 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
              <h3 className="text-base font-bold">{t('statistics')}</h3>
            </div>
            <Suspense fallback={<div>Chargement...</div>}>
              <UserStats />
            </Suspense>
          </div>
        </div>

        {/* Jeux récents */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-6 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
              <h3 className="text-base font-bold">{t('recentGames')}</h3>
            </div>
            <Suspense fallback={<div>Chargement...</div>}>
              <RecentGames />
            </Suspense>
          </div>
        </div>

        {/* Meilleurs jeux notés */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/95 border border-border/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
          <div className="relative p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1 w-6 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
              <h3 className="text-base font-bold">{t('topRatedGames')}</h3>
            </div>
            <Suspense fallback={<div>Chargement...</div>}>
              <TopRatedGames />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
