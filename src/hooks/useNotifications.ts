import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query-config';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  type: 'wishlist' | 'achievement';
  created_at: string;
  is_read: boolean;
  is_dismissed: boolean;
  read_at: string | null;
  dismissed_at: string | null;
  // Wishlist specific
  user_game_id?: string;
  game?: {
    id: string;
    title: string;
    cover_url: string | null;
  };
  // Achievement specific
  achievement_id?: string;
  achievement?: {
    id: string;
    name_en: string;
    name_fr: string;
    description_en: string;
    description_fr: string;
    icon_url: string | null;
    points: number;
  };
  unlocked_at?: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  count: number;
  wishlistCount: number;
  achievementCount: number;
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [achievementCount, setAchievementCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recentlyDismissedRef = useRef<Set<string>>(new Set());
  const isFetchingRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    // Éviter les appels concurrents
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const timestamp = Date.now();
      const cacheBuster = `t=${timestamp}&cb=${Math.random()}`;
      const response = await fetch(`/api/notifications?${cacheBuster}`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: NotificationsResponse = await response.json();
      
      // Nettoyer le Set des notifications récemment dismissed si elles sont retournées par l'API
      const receivedIds = new Set(data.notifications.map(n => n.id));
      recentlyDismissedRef.current.forEach(id => {
        if (receivedIds.has(id)) {
          recentlyDismissedRef.current.delete(id);
        }
      });
      
      // Filtrer les notifications récemment dismissed localement
      const activeNotifications = data.notifications.filter(n => {
        if (recentlyDismissedRef.current.has(n.id)) return false;
        if (n.is_dismissed === true) return false;
        return true;
      });
      
      // Calculer les compteurs une seule fois
      const wishlistCount = activeNotifications.filter(n => n.type === 'wishlist').length;
      const achievementCount = activeNotifications.filter(n => n.type === 'achievement').length;
      
      setNotifications(activeNotifications);
      setCount(activeNotifications.length);
      setWishlistCount(wishlistCount);
      setAchievementCount(achievementCount);
      setError(null);
    } catch (err) {
      console.error('[useNotifications] Error fetching:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      await response.json();

      // Re-fetch pour avoir les vraies données de l'API
      await fetchNotifications();

      return true;
    } catch (err) {
      console.error('[useNotifications] ❌ Error marking as read:', err);
      return false;
    }
  }, [fetchNotifications]);

  const dismiss = useCallback(async (notificationId: string) => {
    // Récupérer la notification avant de la dismiss pour invalider le cache si nécessaire
    const dismissedNotification = notifications.find(n => n.id === notificationId);
    try {
      const response = await fetch(`/api/notifications/${notificationId}/dismiss`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 404) {
          // Notification déjà dismissed, re-fetch pour avoir l'état correct
          await fetchNotifications();
          return true;
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      await response.json();

      // Ajouter à la liste des récemment dismissed (timeout réduit car l'API devrait déjà filtrer)
      recentlyDismissedRef.current.add(notificationId);
      setTimeout(() => {
        recentlyDismissedRef.current.delete(notificationId);
        console.log(`[useNotifications] 🧹 Auto-removed ${notificationId.substring(0, 8)} from recentlyDismissed after timeout`);
      }, 10 * 1000); // 10 secondes au lieu de 60

      // ⚠️ IMPORTANT: Ne pas modifier le state localement, utiliser les vraies données de l'API
      // Re-fetch immédiatement pour avoir les vraies données
      await fetchNotifications();
      setNotifications(prev => {
        const filtered = prev.filter(n => n.id !== notificationId);
        const dismissed = prev.find(n => n.id === notificationId);
        
        setCount(filtered.length);
        if (dismissed?.type === 'wishlist') {
          setWishlistCount(c => Math.max(0, c - 1));
        } else if (dismissed?.type === 'achievement') {
          setAchievementCount(c => Math.max(0, c - 1));
        }
        
        return filtered;
      });

      return true;
    } catch (err) {
      console.error('[useNotifications] Error dismissing:', err);
      await fetchNotifications();
      return false;
    }
  }, [fetchNotifications, notifications]);

  const validate = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/validate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      // Récupérer la notification avant de la dismiss pour invalider le cache
      const dismissedNotification = notifications.find(n => n.id === notificationId);

      // Ajouter à la liste des récemment dismissed temporairement
      recentlyDismissedRef.current.add(notificationId);
      setTimeout(() => {
        recentlyDismissedRef.current.delete(notificationId);
      }, 10 * 1000);

      // Invalider les caches React Query pour refléter les changements
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.userGames(user.id) });
        if (dismissedNotification?.game?.id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.game(dismissedNotification.game.id, user.id) });
        }
      }

      // Re-fetch pour avoir les vraies données de l'API
      await fetchNotifications();

      return { success: true, message: result.message || 'Jeu ajouté à votre collection' };
    } catch (err) {
      console.error('[useNotifications] Error validating:', err);
      await fetchNotifications();
      return { success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' };
    }
  }, [fetchNotifications, queryClient, user?.id, notifications]);

  const refuse = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/refuse`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      // Récupérer la notification avant de la dismiss pour invalider le cache
      const dismissedNotification = notifications.find(n => n.id === notificationId);

      // Ajouter à la liste des récemment dismissed temporairement
      recentlyDismissedRef.current.add(notificationId);
      setTimeout(() => {
        recentlyDismissedRef.current.delete(notificationId);
      }, 10 * 1000);

      // Invalider les caches React Query pour refléter les changements
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.userGames(user.id) });
        if (dismissedNotification?.game?.id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.game(dismissedNotification.game.id, user.id) });
        }
      }

      // Re-fetch pour avoir les vraies données de l'API
      await fetchNotifications();

      return { success: true, message: result.message || 'Jeu laissé en wishlist' };
    } catch (err) {
      console.error('[useNotifications] Error refusing:', err);
      await fetchNotifications();
      return { success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' };
    }
  }, [fetchNotifications, queryClient, user?.id, notifications]);

  // ✅ Fetch initial - une seule fois
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]); // ✅ fetchNotifications est stable, pas besoin de le mettre en dépendance

  // Realtime subscription pour les mises à jour instantanées
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchNotifications]);

  // Polling toutes les 30 secondes (backup si Realtime échoue)
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 secondes

    return () => {
      clearInterval(interval);
    };
  }, [user?.id, fetchNotifications]);

  // ✅ Fetch au focus de la fenêtre
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id) {
        fetchNotifications();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.id, fetchNotifications]); // ✅ fetchNotifications est stable

  return {
    notifications,
    count,
    wishlistCount,
    achievementCount,
    isLoading,
    error,
    markAsRead,
    dismiss,
    validate,
    refuse,
    refresh: fetchNotifications,
  };
}