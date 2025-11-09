import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type WishlistNotification = {
  id: string;
  type: 'wishlist';
  user_game_id: string;
  created_at: string;
  game: {
    id: string;
    title: string;
    cover_url: string | null;
  } | null;
};

type AchievementNotification = {
  id: string;
  type: 'achievement';
  achievement_id: string;
  user_achievement_id: string | null;
  created_at: string;
  unlocked_at: string;
  achievement: {
    id: string;
    name_en: string;
    name_fr: string;
    icon_url: string | null;
    points: number | null;
  } | null;
};

export type UnifiedNotification = WishlistNotification | AchievementNotification;

// Singleton pour éviter les appels multiples même si plusieurs composants sont montés
class UnifiedNotificationsManager {
  private static instance: UnifiedNotificationsManager;
  private isFetching = false;
  private fetchTimeout: NodeJS.Timeout | null = null;
  private interval: NodeJS.Timeout | null = null;
  private focusHandler: (() => void) | null = null;
  private subscribers = new Set<(notifications: UnifiedNotification[]) => void>();
  private notifications: UnifiedNotification[] = [];

  static getInstance(): UnifiedNotificationsManager {
    if (!UnifiedNotificationsManager.instance) {
      UnifiedNotificationsManager.instance = new UnifiedNotificationsManager();
    }
    return UnifiedNotificationsManager.instance;
  }

  subscribe(callback: (notifications: UnifiedNotification[]) => void) {
    this.subscribers.add(callback);
    // Notifier immédiatement avec les notifications actuelles
    callback(this.notifications);
    return () => {
      this.subscribers.delete(callback);
      // Si plus aucun subscriber, arrêter le polling
      if (this.subscribers.size === 0) {
        this.stopPolling();
      }
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach((callback) => {
      callback(this.notifications);
    });
  }

  async fetchNotifications(): Promise<void> {
    // Éviter les appels multiples simultanés
    if (this.isFetching) {
      return;
    }

    try {
      this.isFetching = true;

      // Récupérer le token de session depuis Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        this.notifications = [];
        this.notifySubscribers();
        return;
      }

      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/notifications', {
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération');
      }

      const data = await response.json();
      this.notifications = data.notifications || [];
      this.notifySubscribers();
    } catch (error) {
      console.error('[UnifiedNotifications] Error fetching notifications:', error);
    } finally {
      this.isFetching = false;
    }
  }

  startPolling(userId: string | null) {
    if (!userId) {
      this.stopPolling();
      this.notifications = [];
      this.notifySubscribers();
      return;
    }

    // Annuler le timeout précédent s'il existe
    if (this.fetchTimeout) {
      clearTimeout(this.fetchTimeout);
    }

    this.fetchTimeout = setTimeout(() => {
      this.fetchNotifications();
    }, 500);

    // Récupérer les notifications périodiquement (toutes les 2 minutes)
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(() => {
      this.fetchNotifications();
    }, 120000); // 2 minutes

    // Récupérer les notifications quand la fenêtre regagne le focus
    if (this.focusHandler) {
      window.removeEventListener('focus', this.focusHandler);
    }
    this.focusHandler = () => {
      this.fetchNotifications();
    };
    window.addEventListener('focus', this.focusHandler);
  }

  stopPolling() {
    if (this.fetchTimeout) {
      clearTimeout(this.fetchTimeout);
      this.fetchTimeout = null;
    }
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.focusHandler) {
      window.removeEventListener('focus', this.focusHandler);
      this.focusHandler = null;
    }
  }
}

export function useUnifiedNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const managerRef = useRef(UnifiedNotificationsManager.getInstance());
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const manager = managerRef.current;

    // S'abonner aux mises à jour
    unsubscribeRef.current = manager.subscribe((notifs) => {
      setNotifications(notifs);
      setLoading(false);
    });

    // Démarrer le polling
    manager.startPolling(userId);

    // Cleanup
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [userId]);

  const fetchNotifications = useCallback(() => {
    setLoading(true);
    managerRef.current.fetchNotifications();
  }, []);

  return {
    notifications,
    loading,
    fetchNotifications,
  };
}

