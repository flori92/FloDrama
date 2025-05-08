import React, { useEffect, useState } from 'react';
import { getDiagnosticInfo, DiagnosticInfo } from '../services/diagnosticService';

// Interface étendue pour les besoins spécifiques de la page de diagnostic
interface ExtendedDiagnosticInfo extends DiagnosticInfo {
  apiBaseUrl: string;
  apiTimeout: number;
  cacheDuration: number;
  cacheStats: {
    totalItems: number;
    itemsByType: Record<string, number>;
    oldestItem: {
      key: string;
      age: number;
    } | null;
    newestItem: {
      key: string;
      age: number;
    } | null;
    averageAge: number;
  };
  apiErrors: Array<{
    endpoint: string;
    timestamp: number;
    error: string;
    params?: Record<string, any>;
  }>;
  lastApiError: {
    endpoint: string;
    timestamp: number;
    error: string;
    params?: Record<string, any>;
  } | null;
  errorCount: number;
}

const DiagnosticPage: React.FC = () => {
  const [diagnosticInfo, setDiagnosticInfo] = useState<ExtendedDiagnosticInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDiagnosticInfo = async () => {
      try {
        const info = getDiagnosticInfo();
        
        // Conversion vers le type étendu requis par l'interface
        const extendedInfo: ExtendedDiagnosticInfo = {
          ...info,
          lastApiError: info.apiErrors.length > 0 ? info.apiErrors[0] : null,
          errorCount: info.apiErrors.length
        };
        
        setDiagnosticInfo(extendedInfo);
      } catch (error) {
        console.error('Erreur lors de la récupération des informations de diagnostic:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnosticInfo();
  }, []);

  if (loading) {
    return (
      <div className="diagnostic-page">
        <h1 className="flo-section-title flo-text-gradient">Diagnostic de l'application</h1>
        <div className="loading-spinner"></div>
        <p>Chargement des informations de diagnostic...</p>
      </div>
    );
  }

  if (!diagnosticInfo) {
    return (
      <div className="diagnostic-page">
        <h1 className="flo-section-title flo-text-gradient">Diagnostic de l'application</h1>
        <div className="error-message">
          Impossible de récupérer les informations de diagnostic.
        </div>
      </div>
    );
  }

  const { cacheStats, apiErrors } = diagnosticInfo;
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('fr-FR');
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} jour${days > 1 ? 's' : ''}`;
    }
    if (hours > 0) {
      return `${hours} heure${hours > 1 ? 's' : ''}`;
    }
    if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return `${seconds} seconde${seconds > 1 ? 's' : ''}`;
  };

  return (
    <div className="diagnostic-page">
      <h1 className="flo-section-title flo-text-gradient">Diagnostic de l'application</h1>
      
      <section className="diagnostic-section">
        <h2>Informations générales</h2>
        <div className="diagnostic-card">
          <p><strong>URL de base de l'API:</strong> {diagnosticInfo.apiBaseUrl}</p>
          <p><strong>Timeout API:</strong> {diagnosticInfo.apiTimeout}ms</p>
          <p><strong>Durée du cache:</strong> {formatDuration(diagnosticInfo.cacheDuration)}</p>
          <p><strong>Nombre d'erreurs API:</strong> {diagnosticInfo.errorCount}</p>
        </div>
      </section>

      <section className="diagnostic-section">
        <h2>Statistiques du cache</h2>
        <div className="diagnostic-card">
          <p><strong>Nombre total d'éléments:</strong> {cacheStats.totalItems}</p>
          <p><strong>Âge moyen des éléments:</strong> {formatDuration(cacheStats.averageAge)}</p>
          
          {cacheStats.oldestItem && (
            <div>
              <p><strong>Élément le plus ancien:</strong> {cacheStats.oldestItem.key}</p>
              <p><strong>Âge:</strong> {formatDuration(cacheStats.oldestItem.age)}</p>
            </div>
          )}
          
          {cacheStats.newestItem && (
            <div>
              <p><strong>Élément le plus récent:</strong> {cacheStats.newestItem.key}</p>
              <p><strong>Âge:</strong> {formatDuration(cacheStats.newestItem.age)}</p>
            </div>
          )}
          
          <h3>Éléments par type</h3>
          <ul className="items-by-type">
            {Object.entries(cacheStats.itemsByType).map(([type, count]) => (
              <li key={type}>
                <span>{type}:</span> <span>{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      
      <section className="diagnostic-section">
        <h2>Erreurs API récentes</h2>
        {apiErrors.length === 0 ? (
          <p className="no-errors">Aucune erreur API récente.</p>
        ) : (
          <div className="error-list">
            {apiErrors.map((error, index) => (
              <div key={index} className="error-card">
                <p><strong>Endpoint:</strong> {error.endpoint}</p>
                <p><strong>Date:</strong> {formatDate(error.timestamp)}</p>
                <p><strong>Erreur:</strong> {error.error}</p>
                {error.params && (
                  <div>
                    <p><strong>Paramètres:</strong></p>
                    <pre>{JSON.stringify(error.params, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      
      <section className="diagnostic-section">
        <h2>Actions</h2>
        <div className="actions-card">
          <button 
            className="action-button"
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
          >
            Vider le cache local et recharger
          </button>
        </div>
      </section>
    </div>
  );
};

export default DiagnosticPage;
