import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

interface SocketError {
  message: string;
  code?: string;
  details?: unknown;
}

interface SocketDisconnectReason {
  reason: string;
  description?: string;
}

export const useSocket = () => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    // Initialisation du socket avec authentification
    socketRef.current = io(SOCKET_URL, {
      auth: {
        token: user.token
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Gestion des événements de connexion
    socketRef.current.on('connect', () => {
      console.info('Socket connecté');
    });

    socketRef.current.on('connect_error', (error: SocketError) => {
      console.error('Erreur de connexion socket:', error.message);
    });

    socketRef.current.on('disconnect', (reason: SocketDisconnectReason) => {
      console.warn('Socket déconnecté:', reason.reason);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false
  };
};
