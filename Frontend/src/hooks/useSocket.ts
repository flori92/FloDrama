// Version stub temporaire de useSocket.ts pour permettre la compilation
import { useRef } from 'react';
import { useAuth } from './useAuth';

// Interface de remplacement pour Socket
interface MockSocket {
  connected: boolean;
  on: (event: string, callback: Function) => void;
  emit: (event: string, ...args: any[]) => void;
  disconnect: () => void;
}

export const useSocket = () => {
  const { user } = useAuth();
  const socketRef = useRef<MockSocket | null>(null);

  // Simulation d'un socket connecté
  if (user && !socketRef.current) {
    socketRef.current = {
      connected: true,
      on: (event: string, callback: Function) => {
        console.log(`[MockSocket] Événement enregistré: ${event}`);
      },
      emit: (event: string, ...args: any[]) => {
        console.log(`[MockSocket] Émission de l'événement: ${event}`, args);
      },
      disconnect: () => {
        console.log('[MockSocket] Déconnexion');
      }
    };
  }

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false
  };
};
