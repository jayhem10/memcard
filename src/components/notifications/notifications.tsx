'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { Bell, X, Trophy, ShoppingCart, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export function Notifications() {
  const router = useRouter();
  const { notifications, count, wishlistCount, achievementCount, dismiss, markAsRead, validate, refuse, refresh } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [processing, setProcessing] = useState<Set<string>>(new Set());

  const handleDismiss = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (processing.has(notificationId)) return;
    
    setProcessing(prev => new Set(prev).add(notificationId));
    try {
      const success = await dismiss(notificationId);
      if (!success) {
        toast.error('Erreur lors de la suppression de la notification');
      }
    } finally {
      setProcessing(prev => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  const handleValidate = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (processing.has(notificationId)) return;
    
    setProcessing(prev => new Set(prev).add(notificationId));
    try {
      const result = await validate(notificationId);
      if (result.success) {
        toast.success(result.message || 'Jeu ajouté à votre collection');
      } else {
        toast.error(result.error || 'Erreur lors de la validation');
      }
    } finally {
      setProcessing(prev => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  const handleRefuse = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (processing.has(notificationId)) return;
    
    setProcessing(prev => new Set(prev).add(notificationId));
    try {
      const result = await refuse(notificationId);
      if (result.success) {
        toast.success(result.message || 'Jeu laissé en wishlist');
      } else {
        toast.error(result.error || 'Erreur lors du refus');
      }
    } finally {
      setProcessing(prev => {
        const next = new Set(prev);
        next.delete(notificationId);
        return next;
      });
    }
  };

  const handleNotificationClick = async (notification: any, e: React.MouseEvent) => {
    // Ne pas rediriger si on clique sur un bouton d'action
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    // Marquer comme lue
    await markAsRead(notification.id);

    // Rediriger selon le type
    if (notification.type === 'wishlist') {
      router.push(`/games/${notification.game?.id}`);
    } else if (notification.type === 'achievement') {
      router.push('/achievements');
    }

    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      // Réinitialiser le state de processing quand on ferme la popup
      if (!open) {
        setProcessing(new Set());
      }
    }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {count > 9 ? '9+' : count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {count > 0 && (
            <Badge variant="secondary" className="ml-2">
              {count}
            </Badge>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {count === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Aucune notification
          </div>
        ) : (
          <>
            {wishlistCount > 0 && (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-2">
                  <ShoppingCart className="h-3 w-3" />
                  Wishlist ({wishlistCount})
                </DropdownMenuLabel>
                {notifications
                  .filter(n => n.type === 'wishlist')
                  .map(notification => {
                    const isProcessing = processing.has(notification.id);
                    return (
                      <DropdownMenuItem
                        key={notification.id}
                        className="cursor-pointer flex items-start gap-3 p-3"
                        onClick={(e) => handleNotificationClick(notification, e)}
                        disabled={isProcessing}
                      >
                        {notification.game?.cover_url ? (
                          <img
                            src={notification.game.cover_url}
                            alt={notification.game.title}
                            className="w-12 h-16 object-cover rounded shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-16 bg-muted rounded flex items-center justify-center shrink-0">
                            <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {notification.game?.title}
                          </p>
                          <p className="text-xs text-muted-foreground mb-2">
                            Quelqu'un a acheté ce jeu
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="default"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => handleValidate(notification.id, e)}
                              disabled={isProcessing}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Valider
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => handleRefuse(notification.id, e)}
                              disabled={isProcessing}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Refuser
                            </Button>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                <DropdownMenuSeparator />
              </>
            )}

            {achievementCount > 0 && (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-2">
                  <Trophy className="h-3 w-3" />
                  Succès ({achievementCount})
                </DropdownMenuLabel>
                {notifications
                  .filter(n => n.type === 'achievement')
                  .map(notification => {
                    const isProcessing = processing.has(notification.id);
                    return (
                      <DropdownMenuItem
                        key={notification.id}
                        className="cursor-pointer flex items-start gap-3 p-3"
                        onClick={(e) => handleNotificationClick(notification, e)}
                        disabled={isProcessing}
                      >
                      {notification.achievement?.icon_url ? (
                        <img
                          src={notification.achievement.icon_url}
                          alt={notification.achievement.name_fr}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Trophy className="h-6 w-6 text-yellow-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {notification.achievement?.name_fr || notification.achievement?.name_en}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          +{notification.achievement?.points} points
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={(e) => handleDismiss(notification.id, e)}
                        disabled={isProcessing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </DropdownMenuItem>
                    );
                  })}
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

