// src/services/analytics/index.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types pour les événements analytics
export type AnalyticsEvent = {
  event_name: string;
  event_data?: Record<string, any>;
  user_id?: string;
  session_id: string;
  timestamp: string;
  url: string;
  referrer?: string;
  device_type: string;
  browser: string;
};

// Fonction pour récupérer les variables d'environnement de manière compatible avec Jest
const getEnvVariable = (key: string): string => {
  // Pour l'environnement de test (Jest)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  // Pour l'environnement Vite
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  return '';
};

// Configuration de l'analytics
class AnalyticsService {
  private supabase: SupabaseClient | null = null;
  private sessionId: string = '';
  private initialized: boolean = false;

  constructor() {
    // Création du client Supabase
    const supabaseUrl = getEnvVariable('VITE_SUPABASE_URL');
    const supabaseKey = getEnvVariable('VITE_SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Variables d\'environnement Supabase manquantes');
      return;
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    // Génération d'un ID de session unique
    this.sessionId = this.generateSessionId();
    
    this.initialized = true;
  }

  // Initialisation du service
  public init(): void {
    if (!this.initialized) {
      console.error('Service analytics non initialisé');
      return;
    }
    
    // Vérifier que nous sommes dans un environnement navigateur
    if (typeof window !== 'undefined') {
      // Tracking automatique des pages vues
      this.trackPageView();
      
      // Écoute des changements de route pour SPA
      window.addEventListener('popstate', () => this.trackPageView());
    }
  }

  // Tracking d'un événement personnalisé
  public trackEvent(eventName: string, eventData?: Record<string, any>): void {
    if (!this.initialized) {
      return;
    }
    
    const event = this.createEventPayload(eventName, eventData);
    this.sendEvent(event);
  }

  // Tracking d'une page vue
  private trackPageView(): void {
    if (!this.initialized || typeof window === 'undefined') {
      return;
    }
    
    const event = this.createEventPayload('page_view', {
      title: document.title,
      path: window.location.pathname
    });
    
    this.sendEvent(event);
  }

  // Création d'un payload d'événement
  private createEventPayload(eventName: string, eventData?: Record<string, any>): AnalyticsEvent {
    // Récupération des informations utilisateur si disponibles
    const userId = this.getUserId();
    
    // Vérifier que nous sommes dans un environnement navigateur
    let url = '';
    let referrer = '';
    let deviceType = 'unknown';
    let browser = 'unknown';
    
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      // Détection du navigateur et appareil
      const userAgent = navigator.userAgent;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      url = window.location.href;
      referrer = document.referrer || '';
      deviceType = isMobile ? 'mobile' : 'desktop';
      browser = this.detectBrowser(userAgent);
    }
    
    return {
      event_name: eventName,
      event_data: eventData,
      user_id: userId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      url,
      referrer,
      device_type: deviceType,
      browser
    };
  }

  // Envoi d'un événement à Supabase
  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.initialized || !this.supabase) {
      return;
    }
    
    try {
      const { error } = await this.supabase
        .from('analytics_events')
        .insert([event]);
      
      if (error) {
        console.error('Erreur lors de l\'envoi de l\'événement analytics:', error);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'événement analytics:', error);
    }
  }

  // Génération d'un ID de session unique
  private generateSessionId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Récupération de l'ID utilisateur si connecté
  private getUserId(): string | undefined {
    if (!this.initialized || !this.supabase) {
      return undefined;
    }
    
    try {
      // Version simplifiée pour éviter les problèmes avec l'API asynchrone
      // Dans un cas réel, il faudrait gérer cela de manière asynchrone
      return undefined; // À implémenter correctement lors de l'intégration avec l'authentification
    } catch (error) {
      return undefined;
    }
  }

  // Détection du navigateur
  private detectBrowser(userAgent: string): string {
    if (userAgent.indexOf('Firefox') > -1) {
      return 'Firefox';
    } else if (userAgent.indexOf('SamsungBrowser') > -1) {
      return 'Samsung Browser';
    } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
      return 'Opera';
    } else if (userAgent.indexOf('Trident') > -1) {
      return 'Internet Explorer';
    } else if (userAgent.indexOf('Edge') > -1) {
      return 'Edge';
    } else if (userAgent.indexOf('Chrome') > -1) {
      return 'Chrome';
    } else if (userAgent.indexOf('Safari') > -1) {
      return 'Safari';
    } else {
      return 'Unknown';
    }
  }
}

// Export d'une instance singleton
export const analytics = new AnalyticsService();

export default analytics;
