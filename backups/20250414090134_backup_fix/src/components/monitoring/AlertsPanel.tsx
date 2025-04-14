import React, { useEffect, useState } from 'react';
import { AlertManager } from '../../services/monitoring/AlertManager';

interface AlertsPanelProps {
  refreshInterval?: number;
  maxAlerts?: number;
  showResolved?: boolean;
  onAlertClick?: (alert: any) => void;
}

/**
 * Composant d'affichage des alertes pour FloDrama
 */
export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  refreshInterval = 30000,
  maxAlerts = 50,
  showResolved = false,
  onAlertClick
}) => {
  // État des alertes
  const [alerts, setAlerts] = useState<any[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtres
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const alertManager = new AlertManager(); // Correction: AlertManager n'a pas besoin de paramètre

    const fetchAlerts = async () => {
      try {
        setIsLoading(true);
        const activeAlerts = await alertManager.getActiveAlerts();
        setAlerts(activeAlerts);
        setError(null);
      } catch (err) {
        console.error('Erreur lors de la récupération des alertes:', err);
        setError('Erreur lors de la récupération des alertes');
      } finally {
        setIsLoading(false);
      }
    };

    // Premier chargement
    fetchAlerts();

    // Rafraîchissement périodique
    const interval = setInterval(fetchAlerts, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Filtrage et tri des alertes
  useEffect(() => {
    let filtered = [...alerts];

    // Filtre par sévérité
    if (severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severityFilter);
    }

    // Filtre par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(alert =>
        alert.metric.toLowerCase().includes(query) ||
        alert.message?.toLowerCase().includes(query)
      );
    }

    // Filtre par statut
    if (!showResolved) {
      filtered = filtered.filter(alert => alert.status === 'active');
    }

    // Tri par date
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    // Limite le nombre d'alertes
    filtered = filtered.slice(0, maxAlerts);

    setFilteredAlerts(filtered);
  }, [alerts, severityFilter, searchQuery, sortOrder, showResolved, maxAlerts]);

  /**
   * Gère le clic sur une alerte
   */
  const handleAlertClick = (alert: any) => {
    if (onAlertClick) {
      onAlertClick(alert);
    }
  };

  /**
   * Formate la date
   */
  const formatDate = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  /**
   * Obtient la couleur de la sévérité
   */
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return '#dc3545';
      case 'error':
        return '#fd7e14';
      case 'warning':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  // Rendu du composant d'erreur
  if (error) {
    return (
      <div className="alerts-error">
        <h3>Erreur</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="alerts-panel">
      {/* En-tête */}
      <div className="alerts-header">
        <h2>Alertes</h2>
        
        {/* Filtres */}
        <div className="alerts-filters">
          {/* Filtre par sévérité */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="severity-filter"
          >
            <option value="all">Toutes les sévérités</option>
            <option value="critical">Critique</option>
            <option value="error">Erreur</option>
            <option value="warning">Avertissement</option>
          </select>

          {/* Recherche */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="search-input"
          />

          {/* Tri */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="sort-button"
          >
            {sortOrder === 'desc' ? '↓' : '↑'} Date
          </button>
        </div>
      </div>

      {/* Liste des alertes */}
      <div className="alerts-list">
        {isLoading && alerts.length === 0 ? (
          <div className="alerts-loading">
            <div className="spinner"></div>
            <p>Chargement des alertes...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="no-alerts">
            <p>Aucune alerte à afficher</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="alert-item"
              onClick={() => handleAlertClick(alert)}
              style={{
                borderLeft: `4px solid ${getSeverityColor(alert.severity)}`
              }}
            >
              <div className="alert-header">
                <span className="alert-severity" style={{
                  backgroundColor: getSeverityColor(alert.severity)
                }}>
                  {alert.severity}
                </span>
                <span className="alert-timestamp">
                  {formatDate(alert.timestamp)}
                </span>
              </div>

              <div className="alert-content">
                <h4 className="alert-title">{alert.metric}</h4>
                <p className="alert-message">
                  Valeur: {alert.value} (Seuil: {alert.threshold})
                </p>
              </div>

              {alert.status === 'resolved' && (
                <div className="alert-resolved">
                  Résolu le {formatDate(alert.resolvedAt)}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {alerts.length > maxAlerts && (
        <div className="alerts-pagination">
          <p>
            Affichage de {Math.min(maxAlerts, filteredAlerts.length)} sur {alerts.length} alertes
          </p>
        </div>
      )}

      {/* Styles CSS */}
      <style jsx>{`
        .alerts-panel {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 20px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .alerts-header {
          margin-bottom: 20px;
        }

        .alerts-filters {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        .severity-filter,
        .search-input {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .search-input {
          flex: 1;
        }

        .sort-button {
          padding: 8px 12px;
          background: #f8f9fa;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }

        .sort-button:hover {
          background: #e9ecef;
        }

        .alerts-list {
          flex: 1;
          overflow-y: auto;
          margin: -10px;
          padding: 10px;
        }

        .alert-item {
          background: white;
          border-radius: 4px;
          margin-bottom: 10px;
          padding: 15px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .alert-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }

        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .alert-severity {
          padding: 4px 8px;
          border-radius: 4px;
          color: white;
          font-size: 12px;
          text-transform: uppercase;
        }

        .alert-timestamp {
          color: #6c757d;
          font-size: 12px;
        }

        .alert-title {
          margin: 0 0 5px 0;
          font-size: 16px;
          color: #333;
        }

        .alert-message {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .alert-resolved {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #eee;
          color: #28a745;
          font-size: 12px;
        }

        .alerts-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: #666;
        }

        .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 10px;
        }

        .no-alerts {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .alerts-pagination {
          text-align: center;
          padding-top: 10px;
          border-top: 1px solid #eee;
          color: #666;
          font-size: 14px;
        }

        .alerts-error {
          padding: 20px;
          text-align: center;
          color: #dc3545;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AlertsPanel;
