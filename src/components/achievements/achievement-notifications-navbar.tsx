'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Trophy, X } from 'lucide-react';
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
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { useAchievementNotifications } from '@/hooks/useAchievementNotifications';

export function AchievementNotificationsNavbar() {
  const { user } = useAuth();
  const router = useRouter();
  const { notifications, loading, markAsViewed, markAllAsViewed, removeNotification } = useAchievementNotifications(user?.id || null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const unreadCount = notifications.filter((n) => !n.viewed).length;

  const handleNotificationClick = (notificationId: string) => {
    markAsViewed(notificationId);
    router.push('/achievements');
  };

  const handleMarkAllAsViewed = () => {
    markAllAsViewed();
  };

  if (!user) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={0}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="relative p-2 rounded-md transition-colors text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            title="Notifications de succès"
          >
            <Trophy className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center p-0 text-xs font-semibold"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
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
          <div className="flex items-center justify-between px-2 py-1.5">
            <DropdownMenuLabel className="text-sm">
              Succès débloqués ({unreadCount > 0 ? `${unreadCount} nouveau${unreadCount > 1 ? 'x' : ''}` : notifications.length})
            </DropdownMenuLabel>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleMarkAllAsViewed}
              >
                Tout marquer comme lu
              </Button>
            )}
          </div>
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
              {notifications.map((notification) => {
                const achievement = notification.achievement;
                if (!achievement) return null;

                const name = achievement.name_fr || achievement.name_en;
                const points = achievement.points || 0;
                const isUnread = !notification.viewed;

                return (
                  <div 
                    key={notification.id} 
                    className={`p-2.5 md:p-3 hover:bg-accent/50 transition-colors border-b border-border/50 last:border-0 cursor-pointer ${
                      isUnread ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex items-center gap-2.5 md:gap-3">
                      {achievement.icon_url ? (
                        <div className="relative h-14 w-14 md:h-16 md:w-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                          <Image
                            src={achievement.icon_url}
                            alt={name}
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
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs md:text-sm font-medium line-clamp-2 leading-tight ${
                              isUnread ? 'font-semibold' : ''
                            }`}>
                              {name}
                            </p>
                            {points > 0 && (
                              <p className="text-xs text-primary font-medium mt-1">
                                +{points} points
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
                          {isUnread && (
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 md:h-9 md:w-9 flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                          >
                            <X className="h-4 w-4 md:h-5 md:w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={8} className="text-xs md:text-sm whitespace-nowrap">
                          <p>Supprimer la notification</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}

