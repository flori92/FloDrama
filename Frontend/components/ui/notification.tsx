import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

// Types pour les notifications
export interface NotificationProps {
  id: string;
  title: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number; // en millisecondes
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Composant de notification individuelle
 * Affiche une notification avec un titre, un message et des actions
 */
export const Notification: React.FC<NotificationProps> = ({
  title,
  message,
  type = 'info',
  duration = 5000,
  onClose,
  action,
  className
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  // Icônes pour les différents types de notification
  const icons = {
    info: (
      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    error: (
      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  };

  // Couleurs pour les différents types de notification
  const colors = {
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200'
  };

  // Gérer la fermeture de la notification
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose && onClose();
    }, 300); // Attendre la fin de l'animation de sortie
  }, [onClose]);

  // Effet pour la barre de progression et la fermeture automatique
  useEffect(() => {
    if (!isVisible || isPaused || duration === Infinity) return;

    const startTime = Date.now();
    const endTime = startTime + duration * (progress / 100);
    const remainingTime = endTime - startTime;

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      const newProgress = Math.max(0, 100 - (elapsed / remainingTime) * 100);
      
      setProgress(newProgress);
      
      if (newProgress <= 0) {
        clearInterval(timer);
        handleClose();
      }
    }, 10);

    return () => clearInterval(timer);
  }, [isVisible, isPaused, duration, progress, handleClose]);

  return (
    <div
      className={cn(
        "notification max-w-md w-full rounded-lg border shadow-lg transition-all duration-300 overflow-hidden",
        colors[type],
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {icons[type]}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">{title}</p>
            {message && (
              <p className="mt-1 text-sm text-gray-500">{message}</p>
            )}
            {action && (
              <div className="mt-3">
                <button
                  onClick={action.onClick}
                  className="text-sm font-medium text-primary hover:text-primary-dark focus:outline-none focus:underline"
                >
                  {action.label}
                </button>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-transparent rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={handleClose}
            >
              <span className="sr-only">Fermer</span>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Barre de progression */}
      {duration !== Infinity && (
        <div 
          className="h-1 bg-primary/30"
          style={{ width: `${progress}%`, transition: isPaused ? 'none' : 'width linear 10ms' }}
        />
      )}
    </div>
  );
};

/**
 * Gestionnaire de notifications
 * Gère l'affichage et la suppression des notifications
 */
interface NotificationManagerProps {
  notifications: NotificationProps[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  className?: string;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({
  notifications,
  onClose,
  position = 'top-right',
  className
}) => {
  // Classes pour les différentes positions
  const positionClasses = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'top-center': 'top-0 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-0 left-1/2 transform -translate-x-1/2'
  };

  return (
    <div
      className={cn(
        "fixed z-50 p-4 flex flex-col space-y-4 pointer-events-none",
        positionClasses[position],
        className
      )}
    >
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <Notification
            {...notification}
            onClose={() => onClose(notification.id)}
          />
        </div>
      ))}
    </div>
  );
};

// Contexte pour gérer les notifications globalement
export const createNotificationContext = () => {
  const NotificationContext = React.createContext<{
    notifications: NotificationProps[];
    addNotification: (notification: Omit<NotificationProps, 'id'>) => string;
    removeNotification: (id: string) => void;
    clearAllNotifications: () => void;
  }>({
    notifications: [],
    addNotification: () => '',
    removeNotification: () => {},
    clearAllNotifications: () => {}
  });

  const NotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [notifications, setNotifications] = useState<NotificationProps[]>([]);

    const addNotification = (notification: Omit<NotificationProps, 'id'>) => {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setNotifications((prev) => [...prev, { ...notification, id }]);
      return id;
    };

    const removeNotification = (id: string) => {
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    };

    const clearAllNotifications = () => {
      setNotifications([]);
    };

    return (
      <NotificationContext.Provider
        value={{
          notifications,
          addNotification,
          removeNotification,
          clearAllNotifications
        }}
      >
        {children}
        <NotificationManager
          notifications={notifications}
          onClose={removeNotification}
        />
      </NotificationContext.Provider>
    );
  };

  const useNotifications = () => {
    const context = React.useContext(NotificationContext);
    if (context === undefined) {
      throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
  };

  return { NotificationProvider, useNotifications };
};

// Export du contexte de notification
export const { NotificationProvider, useNotifications } = createNotificationContext();
