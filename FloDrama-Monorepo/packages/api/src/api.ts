/**
 * Configuration de base pour les requêtes API
 */
export interface ApiConfig {
  baseUrl: string;
  headers?: Record<string, string>;
}

/**
 * Client API pour FloDrama
 */
export class ApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers
    };
  }

  /**
   * Effectue une requête GET
   * @param endpoint - Le point de terminaison de l'API
   * @returns La réponse de l'API
   */
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.headers
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Effectue une requête POST
   * @param endpoint - Le point de terminaison de l'API
   * @param data - Les données à envoyer
   * @returns La réponse de l'API
   */
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return response.json();
  }
}

/**
 * Crée une instance du client API avec la configuration par défaut
 * @param config - Configuration optionnelle pour surcharger les valeurs par défaut
 * @returns Une instance du client API
 */
export const createApiClient = (config?: Partial<ApiConfig>): ApiClient => {
  const defaultConfig: ApiConfig = {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    headers: {}
  };

  return new ApiClient({
    ...defaultConfig,
    ...config,
    headers: {
      ...defaultConfig.headers,
      ...config?.headers
    }
  });
};
