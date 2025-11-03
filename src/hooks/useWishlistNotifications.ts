import { useEffect, useState, useRef, useCallback } from 'react';
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

// Singleton pour éviter les appels multiples même si plusieurs composants sont montés
class WishlistNotificationsManager {
  private static instance: WishlistNotificationsManager;
  private isFetching = false;
  private fetchTimeout: NodeJS.Timeout | null = null;
  private interval: NodeJS.Timeout | null = null;
  private focusHandler: (() => void) | null = null;
  private subscribers = new Set<(notifications: Notification[]) => void>();
  private notifications: Notification[] = [];

  static getInstance(): WishlistNotificationsManager {
    if (!WishlistNotificationsManager.instance) {
      WishlistNotificationsManager.instance = new WishlistNotificationsManager();
    }
    return WishlistNotificationsManager.instance;
  }

  subscribe(callback: (notifications: Notification[]) => void) {
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
      const headers: HeadersInit = {};
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/wishlist/notifications', {
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
      console.error('[WishlistNotifications] Error fetching notifications:', error);
    } finally {
      this.isFetching = false;
    }
  }

  async createNotifications(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    fetch('/api/wishlist/notifications/create', {
      method: 'POST',
      credentials: 'include',
      headers,
    }).catch((error) => {
      console.error('[WishlistNotifications] Error creating notifications:', error);
    });
  }

  startPolling(userId: string | null) {
    if (!userId) {
      this.stopPolling();
      this.notifications = [];
      this.notifySubscribers();
      return;
    }

    // Créer les notifications puis récupérer après un court délai
    this.createNotifications();
    
    // Annuler le timeout précédent s'il existe
    if (this.fetchTimeout) {
      clearTimeout(this.fetchTimeout);
    }
    
    this.fetchTimeout = setTimeout(() => {
      this.fetchNotifications();
    }, 500);

    // Récupérer les notifications périodiquement (toutes les 30 minutes)
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.interval = setInterval(() => {
      this.fetchNotifications();
    }, 1800000); // 30 minutes

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

export function useWishlistNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const managerRef = useRef(WishlistNotificationsManager.getInstance());
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
      // Ne pas arrêter le polling ici car d'autres composants pourraient l'utiliser
      // Il sera arrêté automatiquement si plus aucun composant n'est monté
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

