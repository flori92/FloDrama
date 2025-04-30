import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Notification {
  notificationId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

interface NotificationCenterProps {
  userId: string;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    
    // Vérifier les nouvelles notifications toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/notifications/${userId}`);
      setNotifications(response.data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la récupération des notifications:', err);
      setError('Impossible de récupérer vos notifications. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await axios.post(`/api/notifications/${notificationId}/read`);
      
      // Mettre à jour l'état local
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif.notificationId === notificationId 
            ? { ...notif, isRead: true } 
            : notif
        )
      );
    } catch (err) {
      console.error('Erreur lors du marquage de la notification comme lue:', err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Marquer comme lue
    markAsRead(notification.notificationId);
    
    // Naviguer vers le contenu approprié selon le type de notification
    if (notification.type === 'content_found' && notification.data?.firstResult) {
      navigate(`/content/${notification.data.firstResult}`);
    } else if (notification.type === 'content_found') {
      // Si pas de résultat spécifique, naviguer vers les résultats de recherche
      navigate(`/search?q=${encodeURIComponent(notification.data?.query || '')}`);
    }
    
    // Fermer le centre de notifications
    onClose();
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'À l\'instant';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="notification-center">
      <div className="notification-header">
        <h3>Notifications</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="notification-content">
        {loading && <div className="loading">Chargement des notifications...</div>}
        
        {error && <div className="error">{error}</div>}
        
        {!loading && !error && notifications.length === 0 && (
          <div className="empty-state">
            Vous n'avez pas de notifications.
          </div>
        )}
        
        {!loading && !error && notifications.length > 0 && (
          <ul className="notification-list">
            {notifications.map((notification) => (
              <li 
                key={notification.notificationId} 
                className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon">
                  {notification.type === 'content_found' && (
                    <span className="icon-content-found">🎬</span>
                  )}
                </div>
                <div className="notification-details">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">{getTimeAgo(notification.createdAt)}</div>
                </div>
                {!notification.isRead && <div className="unread-indicator"></div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
