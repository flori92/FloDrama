export enum MessageType {
  TEXT = 'text',
  EMOJI = 'emoji',
  GIF = 'gif',
  SYSTEM = 'system'
}

export interface WatchPartyMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: string;
  type: MessageType;
}

export interface WatchPartyMember {
  userId: string;
  username: string;
  isHost: boolean;
  isReady: boolean;
}

export interface WatchPartyState {
  roomId: string;
  messages: WatchPartyMessage[];
  members: WatchPartyMember[];
  videoUrl: string;
  isPlaying: boolean;
  currentTime: number;
}

export interface WatchPartyJoinPayload {
  roomId: string;
  userId: string;
  username: string;
}

export interface WatchPartyMessagePayload {
  roomId: string;
  message: WatchPartyMessage;
}

export interface VideoControlPayload {
  roomId: string;
  action: 'play' | 'pause' | 'seek';
  time?: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
}

export interface PaymentMethod {
  id: string;
  type: 'paypal' | 'credit_card';
  lastFour?: string;
  expiryDate?: string;
  isDefault: boolean;
}

export interface SubscriptionStatus {
  isActive: boolean;
  currentPlan?: SubscriptionPlan;
  startDate?: string;
  endDate?: string;
  autoRenew: boolean;
  paymentMethods: PaymentMethod[];
}
