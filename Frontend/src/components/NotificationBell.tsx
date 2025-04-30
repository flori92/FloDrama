import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserNotifications, markNotificationAsRead } from '../services/contentService';
import '../styles/NotificationBell.css';

interface NotificationBellProps {
  userId: string;
  token: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
  read: boolean;
  link?: string;
  contentId?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId, token }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Récupérer les notifications au chargement et périodiquement
  useEffect(() => {
    fetchNotifications();
    
    // Vérifier les nouvelles notifications toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [userId, token]);

  // Gérer les clics en dehors du menu pour le fermer
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Mettre à jour le compteur de notifications non lues
  useEffect(() => {
    const count = notifications.filter(notification => !notification.read).length;
    setUnreadCount(count);
    
    // Mettre à jour le titre de la page si des notifications non lues
    if (count > 0) {
      const originalTitle = document.title;
      document.title = `(${count}) ${originalTitle}`;
      
      return () => {
        document.title = originalTitle;
      };
    }
  }, [notifications]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await getUserNotifications(userId, token);
      setNotifications(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Marquer comme lue si ce n'est pas déjà fait
    if (!notification.read) {
      try {
        const success = await markNotificationAsRead(notification.id, userId, token);
        if (success) {
          // Mettre à jour l'état local
          setNotifications(prevNotifications => 
            prevNotifications.map(n => 
              n.id === notification.id ? { ...n, read: true } : n
            )
          );
        }
      } catch (error) {
        console.error('Erreur lors du marquage de la notification:', error);
      }
    }
    
    // Rediriger si un lien est fourni
    if (notification.link) {
      window.location.href = notification.link;
    }
    
    // Fermer le menu après avoir cliqué
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    
    if (unreadNotifications.length === 0) return;
    
    try {
      // Marquer chaque notification comme lue
      for (const notification of unreadNotifications) {
        await markNotificationAsRead(notification.id, userId, token);
      }
      
      // Mettre à jour l'état local
      setNotifications(prevNotifications => 
        prevNotifications.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="notification-bell-container" ref={notificationRef}>
      <motion.button
        className="notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Notifications"
      >
        <span className="notification-icon">🔔</span>
        {unreadCount > 0 && (
          <motion.span 
            className="notification-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            {unreadCount}
          </motion.span>
        )}
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="notification-panel"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="notification-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  className="mark-all-read-button"
                  onClick={handleMarkAllAsRead}
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
            
            <div className="notification-list">
              {isLoading && notifications.length === 0 ? (
                <div className="notification-loading">
                  <div className="notification-spinner"></div>
                  <p>Chargement des notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="notification-empty">
                  <p>Aucune notification pour le moment</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <motion.div
                    key={notification.id}
                    className={`notification-item ${notification.read ? 'read' : 'unread'} ${notification.type}`}
                    onClick={() => handleNotificationClick(notification)}
                    whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">{formatDate(notification.createdAt)}</div>
                    </div>
                    {!notification.read && <div className="unread-indicator"></div>}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
