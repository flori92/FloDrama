/**
 * Types pour le système de Watch Party de FloDrama
 */

export interface WatchPartyConfig {
  /** Intervalle de synchronisation en ms */
  syncInterval: number;
  /** Taille maximale de l'historique du chat */
  maxChatHistory: number;
  /** Configuration de la synchronisation */
  sync: {
    /** Tolérance de désynchronisation en ms */
    tolerance: number;
    /** Mode de synchronisation */
    mode: 'strict' | 'flexible';
    /** Délai maximum de rattrapage */
    maxCatchupDelay: number;
  };
  /** Configuration du chat */
  chat: {
    /** Taille maximale des messages */
    maxMessageLength: number;
    /** Types de messages autorisés */
    allowedMessageTypes: MessageType[];
    /** Modération automatique */
    autoModeration: boolean;
  };
}

export type MessageType = 
  | 'text'
  | 'emoji'
  | 'gif'
  | 'reaction'
  | 'system';

export type MemberRole = 
  | 'host'    // Hôte de la Watch Party
  | 'member'  // Membre standard
  | 'mod';    // Modérateur

export interface PartyMember {
  /** ID unique du membre */
  id: string;
  /** Rôle dans la Watch Party */
  role: MemberRole;
  /** Date de connexion */
  joinedAt: Date;
  /** État actuel du membre */
  state: {
    /** Prêt à regarder */
    ready: boolean;
    /** En cours de buffering */
    buffering: boolean;
    /** Position de lecture */
    timestamp?: number;
    /** Vitesse de lecture */
    playbackSpeed?: number;
  };
  /** Préférences utilisateur */
  preferences?: {
    /** Langue préférée */
    language: string;
    /** Notifications activées */
    notifications: boolean;
    /** Mode de synchronisation préféré */
    syncMode: 'strict' | 'flexible';
  };
}

export interface ChatMessage {
  /** ID unique du message */
  id: string;
  /** ID de l'expéditeur */
  senderId: string;
  /** Type de message */
  type: MessageType;
  /** Contenu du message */
  content: string;
  /** Horodatage */
  timestamp: Date;
  /** Métadonnées */
  metadata?: {
    /** Référence à un autre message */
    replyTo?: string;
    /** Mentions d'utilisateurs */
    mentions?: string[];
    /** URL des médias */
    mediaUrl?: string;
  };
  /** État du message */
  status: 'sent' | 'delivered' | 'read' | 'deleted';
}

export interface SyncState {
  /** Lecture en cours */
  playing: boolean;
  /** Position actuelle en ms */
  timestamp: number;
  /** Vitesse de lecture */
  speed: number;
  /** États des membres */
  memberStates?: {
    [memberId: string]: {
      ready: boolean;
      buffering: boolean;
      timestamp?: number;
    };
  };
}

export interface PartyInvitation {
  /** ID unique de l'invitation */
  id: string;
  /** ID de l'expéditeur */
  senderId: string;
  /** ID du destinataire */
  recipientId: string;
  /** ID de la Watch Party */
  partyId: string;
  /** Message personnalisé */
  message?: string;
  /** Date d'expiration */
  expiresAt: Date;
  /** État de l'invitation */
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface WatchPartyEvent {
  /** Type d'événement */
  type: 
    | 'memberJoined'
    | 'memberLeft'
    | 'stateChanged'
    | 'chatMessage'
    | 'invitationSent'
    | 'hostChanged'
    | 'error';
  /** Données de l'événement */
  data: any;
  /** Horodatage */
  timestamp: Date;
  /** Métadonnées */
  metadata?: {
    /** ID de l'émetteur */
    sourceId?: string;
    /** Informations de débogage */
    debug?: any;
  };
}

export interface WatchPartyStats {
  /** Nombre total de membres */
  totalMembers: number;
  /** Durée de la session */
  duration: number;
  /** Statistiques du chat */
  chat: {
    /** Nombre total de messages */
    totalMessages: number;
    /** Messages par minute */
    messagesPerMinute: number;
    /** Utilisateurs actifs */
    activeUsers: number;
  };
  /** Métriques de synchronisation */
  sync: {
    /** Décalage moyen */
    averageOffset: number;
    /** Nombre de resynchronisations */
    resyncCount: number;
    /** Qualité de la synchronisation */
    syncQuality: number;
  };
}
