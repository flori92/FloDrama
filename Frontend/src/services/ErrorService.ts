import { toast } from 'react-hot-toast';
import { useStore } from '../store/useStore';
import { AxiosError } from 'axios';

export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
  originalError?: any;
}

class ErrorService {
  private static instance: ErrorService;
  private store = useStore.getState();

  private constructor() {}

  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  public handleError(error: unknown): void {
    const appError = this.normalizeError(error);
    console.error('Application Error:', appError);

    switch (appError.type) {
      case ErrorType.NETWORK:
        this.handleNetworkError(appError);
        break;
      case ErrorType.AUTHENTICATION:
        this.handleAuthenticationError(appError);
        break;
      case ErrorType.VALIDATION:
        this.handleValidationError(appError);
        break;
      case ErrorType.SERVER:
        this.handleServerError(appError);
        break;
      default:
        this.handleUnknownError(appError);
    }
  }

  private normalizeError(error: unknown): AppError {
    if (this.isAxiosError(error)) {
      return this.normalizeAxiosError(error);
    }
    
    if (error instanceof Error) {
      return {
        type: ErrorType.UNKNOWN,
        message: error.message,
        originalError: error,
      };
    }

    return {
      type: ErrorType.UNKNOWN,
      message: 'Une erreur inattendue est survenue',
      originalError: error,
    };
  }

  private normalizeAxiosError(error: AxiosError): AppError {
    if (error.response) {
      const status = error.response.status;
      
      if (status === 401 || status === 403) {
        return {
          type: ErrorType.AUTHENTICATION,
          message: 'Session expirée ou non autorisée',
          code: `HTTP_${status}`,
          details: error.response.data,
          originalError: error,
        };
      }

      if (status === 400) {
        return {
          type: ErrorType.VALIDATION,
          message: this.extractValidationMessage(error.response.data),
          code: `HTTP_${status}`,
          details: error.response.data,
          originalError: error,
        };
      }

      if (status >= 500) {
        return {
          type: ErrorType.SERVER,
          message: 'Erreur serveur',
          code: `HTTP_${status}`,
          details: error.response.data,
          originalError: error,
        };
      }
    }

    if (error.code === 'ECONNABORTED' || error.message.includes('Network Error')) {
      return {
        type: ErrorType.NETWORK,
        message: 'Erreur de connexion',
        code: error.code,
        originalError: error,
      };
    }

    return {
      type: ErrorType.UNKNOWN,
      message: error.message || 'Une erreur inattendue est survenue',
      originalError: error,
    };
  }

  private extractValidationMessage(data: any): string {
    if (typeof data === 'string') return data;
    if (data?.message) return data.message;
    if (data?.errors) {
      return Object.values(data.errors).flat().join(', ');
    }
    return 'Données invalides';
  }

  private handleNetworkError(error: AppError): void {
    toast.error('Erreur de connexion. Veuillez vérifier votre connexion internet.');
    // Log l'erreur pour le monitoring
    console.error('Network Error:', error);
  }

  private handleAuthenticationError(error: AppError): void {
    toast.error('Session expirée. Veuillez vous reconnecter.');
    // Déconnecter l'utilisateur
    this.store.setUser(null);
    // Redirection vers la page de connexion
    window.location.href = '/login';
  }

  private handleValidationError(error: AppError): void {
    toast.error(error.message);
    // Log l'erreur pour le debugging
    console.warn('Validation Error:', error);
  }

  private handleServerError(error: AppError): void {
    toast.error('Erreur serveur. Veuillez réessayer plus tard.');
    // Log l'erreur pour le monitoring
    console.error('Server Error:', error);
  }

  private handleUnknownError(error: AppError): void {
    toast.error('Une erreur inattendue est survenue');
    // Log l'erreur pour le debugging
    console.error('Unknown Error:', error);
  }

  private isAxiosError(error: unknown): error is AxiosError {
    return (error as AxiosError)?.isAxiosError === true;
  }
}

export const errorService = ErrorService.getInstance(); 