import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UserAchievement } from '@/types/profile';

type AchievementNotification = {
  id: string;
  achievement: UserAchievement['achievement'];
  unlocked_at: string;
  viewed: boolean;
};

// Singleton pour éviter les appels multiples même si plusieurs composants sont montés
class AchievementNotificationsManager {
  private static instance: AchievementNotificationsManager;
  private isFetching = false;
  private fetchTimeout: NodeJS.Timeout | null = null;
  private interval: NodeJS.Timeout | null = null;
  private focusHandler: (() => void) | null = null;
  private subscribers = new Set<(notifications: AchievementNotification[]) => void>();
  private notifications: AchievementNotification[] = [];
  private previousUnlockedIds = new Set<string>();

  static getInstance(): AchievementNotificationsManager {
    if (!AchievementNotificationsManager.instance) {
      AchievementNotificationsManager.instance = new AchievementNotificationsManager();
    }
    return AchievementNotificationsManager.instance;
  }

  subscribe(callback: (notifications: AchievementNotification[]) => void) {
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

      const response = await fetch('/api/achievements', {
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération');
      }

      const data = await response.json();
      const newlyUnlocked = data.newlyUnlocked || [];

      // Ajouter les nouveaux achievements aux notifications
      if (newlyUnlocked.length > 0) {
        const newNotifications: AchievementNotification[] = newlyUnlocked.map(
          (ua: UserAchievement) => ({
            id: `${ua.achievement_id}-${ua.unlocked_at}`,
            achievement: ua.achievement,
            unlocked_at: ua.unlocked_at,
            viewed: false,
          })
        );

        // Ajouter les nouvelles notifications au début de la liste
        this.notifications = [...newNotifications, ...this.notifications];
        this.notifySubscribers();
      }

      // Mettre à jour les IDs des achievements débloqués
      const currentUnlockedIds = new Set(
        data.unlocked.map((ua: UserAchievement) => ua.achievement_id)
      );
      this.previousUnlockedIds = currentUnlockedIds;
    } catch (error) {
      console.error('[AchievementNotifications] Error fetching notifications:', error);
    } finally {
      this.isFetching = false;
    }
  }

  markAsViewed(notificationId: string) {
    this.notifications = this.notifications.map((notif) =>
      notif.id === notificationId ? { ...notif, viewed: true } : notif
    );
    this.notifySubscribers();
  }

  markAllAsViewed() {
    this.notifications = this.notifications.map((notif) => ({
      ...notif,
      viewed: true,
    }));
    this.notifySubscribers();
  }

  removeNotification(notificationId: string) {
    this.notifications = this.notifications.filter((notif) => notif.id !== notificationId);
    this.notifySubscribers();
  }

  startPolling(userId: string | null) {
    if (!userId) {
      this.stopPolling();
      this.notifications = [];
      this.previousUnlockedIds = new Set();
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

export function useAchievementNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<AchievementNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const managerRef = useRef(AchievementNotificationsManager.getInstance());
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

  const markAsViewed = useCallback((notificationId: string) => {
    managerRef.current.markAsViewed(notificationId);
  }, []);

  const markAllAsViewed = useCallback(() => {
    managerRef.current.markAllAsViewed();
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    managerRef.current.removeNotification(notificationId);
  }, []);

  return {
    notifications,
    loading,
    fetchNotifications,
    markAsViewed,
    markAllAsViewed,
    removeNotification,
  };
}

