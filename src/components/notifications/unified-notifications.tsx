'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCircle2, Loader2, XCircle, Trophy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { useUnifiedNotifications, UnifiedNotification } from '@/hooks/useUnifiedNotifications';
import { supabase } from '@/lib/supabase';

export function UnifiedNotifications() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { notifications, loading, fetchNotifications } = useUnifiedNotifications(user?.id || null);
  const [validating, setValidating] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [dismissing, setDismissing] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleValidateWishlist = async (notification: UnifiedNotification) => {
    if (notification.type !== 'wishlist') return;

    try {
      setValidating(notification.id);
      
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/wishlist/notifications/validate', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ notificationId: notification.id }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la validation');
      }

      if (notification.game?.id && user?.id) {
        queryClient.invalidateQueries({ queryKey: ['game', notification.game.id, user.id] });
      }
      
      queryClient.invalidateQueries({ queryKey: ['userGames', user?.id] });

      await new Promise(resolve => setTimeout(resolve, 200));
      await fetchNotifications();
      setTimeout(() => {
        fetchNotifications();
      }, 300);

      toast.success('Jeu ajouté à votre collection');
    } catch (error) {
      console.error('Error validating notification:', error);
      toast.error('Erreur lors de la validation');
    } finally {
      setValidating(null);
    }
  };

  const handleCancelWishlist = async (notification: UnifiedNotification) => {
    if (notification.type !== 'wishlist') return;

    try {
      setCancelling(notification.id);
      
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/wishlist/buy', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          userGameId: notification.user_game_id,
          buy: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'annulation');
      }

      if (notification.game?.id && user?.id) {
        queryClient.invalidateQueries({ queryKey: ['game', notification.game.id, user.id] });
      }
      
      queryClient.invalidateQueries({ queryKey: ['userGames', user?.id] });

      await new Promise(resolve => setTimeout(resolve, 200));
      await fetchNotifications();
      setTimeout(() => {
        fetchNotifications();
      }, 300);

      toast.success('Jeu gardé en wishlist');
    } catch (error) {
      console.error('Error cancelling notification:', error);
      toast.error('Erreur lors de l\'annulation');
    } finally {
      setCancelling(null);
    }
  };

  const handleDismiss = async (notification: UnifiedNotification) => {
    try {
      setDismissing(notification.id);

      if (notification.type === 'wishlist') {
        // Pour wishlist, on annule simplement
        await handleCancelWishlist(notification);
      } else if (notification.type === 'achievement') {
        // Pour achievement, on supprime la notification
        const { data: { session } } = await supabase.auth.getSession();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const response = await fetch(`/api/notifications/achievement/${notification.id}`, {
          method: 'DELETE',
          headers,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la suppression');
        }

        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDismissing(null);
    }
  };

  const handleAchievementClick = async (notification: UnifiedNotification) => {
    if (notification.type !== 'achievement') return;

    try {
      // Supprimer la notification (comme le bouton X)
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      await fetch(`/api/notifications/achievement/${notification.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      await fetchNotifications();
      router.push('/achievements');
    } catch (error) {
      console.error('Error deleting achievement notification:', error);
      // Rediriger quand même
      router.push('/achievements');
    }
  };

  if (!user) {
    return null;
  }

  const notificationCount = notifications.length;

  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={0}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="relative p-2 rounded-md transition-colors text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center p-0 text-xs font-semibold"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </Badge>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align={isMobile ? "center" : "end"}
          alignOffset={0}
          sideOffset={8}
          className="w-[calc(100vw-2rem)] max-w-80 md:w-80"
          side="bottom"
        >
          <DropdownMenuLabel className="text-sm">
            Notifications ({notificationCount})
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Chargement...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucune notification
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className="p-2.5 md:p-3 hover:bg-accent/50 transition-colors border-b border-border/50 last:border-0"
                >
                  {notification.type === 'wishlist' ? (
                    // Notification wishlist
                    <div className="flex items-center gap-2.5 md:gap-3">
                      {notification.game?.cover_url ? (
                        <div className="relative h-14 w-10 md:h-16 md:w-11 flex-shrink-0 rounded overflow-hidden bg-muted">
                          <Image
                            src={notification.game.cover_url}
                            alt={notification.game.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 40px, 44px"
                          />
                        </div>
                      ) : (
                        <div className="h-14 w-10 md:h-16 md:w-11 flex-shrink-0 rounded bg-muted" />
                      )}
                      <div className="flex-1 min-w-0 pr-1.5 md:pr-2">
                        <p className="text-xs md:text-sm font-medium line-clamp-2 leading-tight">
                          {notification.game?.title || 'Jeu inconnu'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Jeu offert à valider
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-10 w-10 md:h-9 md:w-9 flex-shrink-0 text-muted-foreground hover:text-primary hover:bg-accent"
                              onClick={() => handleValidateWishlist(notification)}
                              disabled={validating === notification.id || cancelling === notification.id || dismissing === notification.id}
                            >
                              {validating === notification.id ? (
                                <Loader2 className="h-5 w-5 md:h-5 md:w-5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-5 w-5 md:h-5 md:w-5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8} className="text-xs md:text-sm whitespace-nowrap">
                            <p>Valider et ajouter à la collection</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-10 w-10 md:h-9 md:w-9 flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                              onClick={() => handleDismiss(notification)}
                              disabled={validating === notification.id || cancelling === notification.id || dismissing === notification.id}
                            >
                              {dismissing === notification.id ? (
                                <Loader2 className="h-5 w-5 md:h-5 md:w-5 animate-spin text-muted-foreground" />
                              ) : (
                                <X className="h-5 w-5 md:h-5 md:w-5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8} className="text-xs md:text-sm whitespace-nowrap">
                            <p>Supprimer la notification</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ) : (
                    // Notification achievement
                    <div 
                      className="flex items-center gap-2.5 md:gap-3 cursor-pointer"
                      onClick={() => handleAchievementClick(notification)}
                    >
                      {notification.achievement?.icon_url ? (
                        <div className="relative h-14 w-14 md:h-16 md:w-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                          <Image
                            src={notification.achievement.icon_url}
                            alt={notification.achievement.name_fr || notification.achievement.name_en}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 56px, 64px"
                          />
                        </div>
                      ) : (
                        <div className="h-14 w-14 md:h-16 md:w-16 flex-shrink-0 rounded bg-primary/10 flex items-center justify-center">
                          <Trophy className="h-7 w-7 md:h-8 md:w-8 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 pr-1.5 md:pr-2">
                        <p className="text-xs md:text-sm font-medium line-clamp-2 leading-tight">
                          {notification.achievement?.name_fr || notification.achievement?.name_en || 'Succès débloqué'}
                        </p>
                        {notification.achievement?.points && notification.achievement.points > 0 && (
                          <p className="text-xs text-primary font-medium mt-1">
                            +{notification.achievement.points} points
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.unlocked_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 md:h-9 md:w-9 flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismiss(notification);
                            }}
                            disabled={dismissing === notification.id}
                          >
                            {dismissing === notification.id ? (
                              <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin text-muted-foreground" />
                            ) : (
                              <X className="h-4 w-4 md:h-5 md:w-5" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={8} className="text-xs md:text-sm whitespace-nowrap">
                          <p>Supprimer la notification</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}

