'use client';

import { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Loader2 } from 'lucide-react';
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
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { useWishlistNotifications } from '@/hooks/useWishlistNotifications';
import { supabase } from '@/lib/supabase';

type Notification = {
  id: string;
  user_game_id: string;
  created_at: string;
  game: {
    id: string;
    title: string;
    cover_url: string | null;
  } | null;
};

export function WishlistNotifications() {
  const { user } = useAuth();
  const { notifications, loading, fetchNotifications } = useWishlistNotifications(user?.id || null);
  const [validating, setValidating] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleValidate = async (notificationId: string) => {
    try {
      setValidating(notificationId);
      
      // Récupérer le token de session depuis Supabase
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
        body: JSON.stringify({ notificationId }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la validation');
      }

      // Rafraîchir les notifications pour mettre à jour tous les composants
      await fetchNotifications();

      toast.success('Jeu ajouté à votre collection');
    } catch (error) {
      console.error('Error validating notification:', error);
      toast.error('Erreur lors de la validation');
    } finally {
      setValidating(null);
    }
  };

  if (!user) {
    return null;
  }

  const notificationCount = notifications.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative p-2 rounded-md transition-colors text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          title="Notifications de wishlist"
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
          Jeux offerts à valider ({notificationCount})
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
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 md:h-8 md:w-8 flex-shrink-0 text-muted-foreground hover:text-primary hover:bg-accent"
                    onClick={() => handleValidate(notification.id)}
                    disabled={validating === notification.id}
                    title="Valider et ajouter à la collection"
                  >
                    {validating === notification.id ? (
                      <Loader2 className="h-5 w-5 md:h-4 md:w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 md:h-4 md:w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

