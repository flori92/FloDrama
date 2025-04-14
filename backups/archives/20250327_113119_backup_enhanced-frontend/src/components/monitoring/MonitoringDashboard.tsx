import React, { useEffect, useState } from 'react';
import { MonitoringService } from '../../services/monitoring/MonitoringService';
import monitoringConfig from '../../../monitoring.config';

// Import direct depuis les fichiers locaux
import { MetricDisplay } from './MetricDisplay.tsx';
import { AlertDisplay } from './AlertDisplay.tsx';
import { ChartDisplay } from './ChartDisplay.tsx';

interface MonitoringDashboardProps {
  refreshInterval?: number;
  defaultDashboard?: string;
}

/**
 * Composant de tableau de bord de monitoring pour FloDrama
 */
export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  refreshInterval = 60000,
  defaultDashboard = 'main'
}) => {
  // Services
  const [monitoringService, setMonitoringService] = useState<MonitoringService | null>(null);
  
  // État du dashboard
  const [currentDashboard, setCurrentDashboard] = useState<string>(defaultDashboard);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Données
  const [metrics, setMetrics] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  
  // Initialisation des services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Création d'une instance unique de MonitoringService (singleton)
        const service = MonitoringService.getInstance();
        
        // Configuration du service avec les paramètres du fichier de configuration
        service.configure(monitoringConfig);
        
        await service.startMonitoring();
        setMonitoringService(service);
        setError(null);
      } catch (err) {
        console.error('Erreur lors de l\'initialisation des services:', err);
        setError('Erreur lors de l\'initialisation du monitoring');
      }
    };

    initializeServices();

    return () => {
      if (monitoringService) {
        monitoringService.stopMonitoring();
      }
    };
  }, [monitoringService]);

  // Rafraîchissement périodique des données
  useEffect(() => {
    if (!monitoringService) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Récupération des métriques
        const currentMetrics = await monitoringService.getCurrentMetrics();
        setMetrics(currentMetrics);
        
        // Récupération des alertes
        const activeAlerts = await monitoringService.getActiveAlerts();
        setAlerts(activeAlerts);
        
        setError(null);
      } catch (err) {
        console.error('Erreur lors de la récupération des données:', err);
        setError('Erreur lors de la récupération des données');
      } finally {
        setIsLoading(false);
      }
    };

    // Premier chargement
    fetchData();

    // Rafraîchissement périodique
    const interval = setInterval(fetchData, refreshInterval);

    return () => clearInterval(interval);
  }, [monitoringService, refreshInterval]);

  /**
   * Change le dashboard actif
   */
  const handleDashboardChange = (dashboard: string) => {
    setCurrentDashboard(dashboard);
  };

  /**
   * Gère le rafraîchissement manuel
   */
  const handleRefresh = async () => {
    if (!monitoringService) return;

    try {
      setIsLoading(true);
      
      const currentMetrics = await monitoringService.getCurrentMetrics();
      setMetrics(currentMetrics);
      
      const activeAlerts = await monitoringService.getActiveAlerts();
      setAlerts(activeAlerts);
      
      setError(null);
    } catch (err) {
      console.error('Erreur lors du rafraîchissement:', err);
      setError('Erreur lors du rafraîchissement des données');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Génère un rapport
   */
  const handleGenerateReport = async () => {
    if (!monitoringService) return;

    try {
      setIsLoading(true);
      
      // Utilisation d'une méthode alternative pour générer un rapport
      // puisque generateReport n'existe pas dans MonitoringService
      const reportData = {
        metrics: await monitoringService.getCurrentMetrics(),
        alerts: await monitoringService.getActiveAlerts(),
        timestamp: new Date().toISOString(),
        period: '24h',
        format: 'pdf'
      };
      
      console.log('Génération du rapport avec les données:', reportData);
      // Dans une implémentation réelle, on pourrait appeler une API ou un service externe
      
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la génération du rapport:', err);
      setError('Erreur lors de la génération du rapport');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de gestion des alertes
  const handleResolveAlert = (alertId: string | number) => {
    // Implémentation de la logique de résolution d'alerte
    console.log(`Résolution de l'alerte ${alertId}`);
    // Ici, nous pourrions appeler le service de monitoring pour marquer l'alerte comme résolue
  };

  // Rendu du composant d'erreur
  if (error) {
    return (
      <div className="monitoring-error">
        <h2>Erreur</h2>
        <p>{error}</p>
        <button onClick={handleRefresh}>Réessayer</button>
      </div>
    );
  }

  // Rendu du composant de chargement
  if (isLoading && !metrics.performance) {
    return (
      <div className="monitoring-loading">
        <h2>Chargement...</h2>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="monitoring-dashboard">
      {/* En-tête */}
      <header className="dashboard-header">
        <h1>Monitoring FloDrama</h1>
        
        {/* Sélection du dashboard */}
        <div className="dashboard-selector">
          <select
            value={currentDashboard}
            onChange={(e) => handleDashboardChange(e.target.value)}
          >
            <option value="main">Dashboard Principal</option>
            <option value="streaming">Dashboard Streaming</option>
          </select>
        </div>
        
        {/* Actions */}
        <div className="dashboard-actions">
          <button onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? 'Rafraîchissement...' : 'Rafraîchir'}
          </button>
          <button onClick={handleGenerateReport} disabled={isLoading}>
            Générer un Rapport
          </button>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="dashboard-content">
        {/* Dashboard principal */}
        {currentDashboard === 'main' && (
          <div className="main-dashboard">
            {/* Métriques de performance */}
            <section className="metrics-section">
              <h2>Performance</h2>
              <div className="metrics-grid">
                {/* CPU */}
                <MetricDisplay
                  title="CPU"
                  value={metrics.cpu_usage || 0}
                  unit="%"
                  icon="cpu"
                  threshold={80}
                  trend={metrics.cpu_trend}
                />
                
                {/* Mémoire */}
                <MetricDisplay
                  title="Mémoire"
                  value={metrics.memory_usage || 0}
                  unit="%"
                  icon="memory"
                  threshold={90}
                  trend={metrics.memory_trend}
                />
                
                {/* FPS */}
                <MetricDisplay
                  title="FPS"
                  value={metrics.fps || 60}
                  unit=""
                  icon="video"
                  threshold={24}
                  trend={metrics.fps_trend}
                  isHigherBetter
                />
              </div>
            </section>
            
            {/* Graphiques */}
            <section className="charts-section">
              <h2>Graphiques</h2>
              <div className="charts-grid">
                {/* Utilisation CPU */}
                <ChartDisplay
                  title="Utilisation CPU"
                  type="line"
                  data={metrics.cpu_history || []}
                  options={{
                    yAxis: { min: 0, max: 100 },
                    unit: '%'
                  }}
                />
                
                {/* Utilisation Mémoire */}
                <ChartDisplay
                  title="Utilisation Mémoire"
                  type="line"
                  data={metrics.memory_history || []}
                  options={{
                    yAxis: { min: 0, max: 100 },
                    unit: '%'
                  }}
                />
              </div>
            </section>
            
            {/* Alertes */}
            <section className="alerts-section">
              <h2>Alertes</h2>
              <div className="alerts-list">
                {alerts.length === 0 ? (
                  <p className="no-alerts">Aucune alerte active</p>
                ) : (
                  // Utilisation d'un div comme conteneur avec une clé pour chaque alerte
                  alerts.map((alert, index) => (
                    <div key={`alert-${index}`}>
                      <AlertDisplay 
                        title={alert.name}
                        message={alert.message}
                        severity={alert.level}
                        timestamp={alert.timestamp}
                        onResolve={() => handleResolveAlert(alert.id)}
                      />
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
        
        {/* Dashboard streaming */}
        {currentDashboard === 'streaming' && (
          <div className="streaming-dashboard">
            {/* Métriques de streaming */}
            <section className="metrics-section">
              <h2>Streaming</h2>
              <div className="metrics-grid">
                {/* Utilisateurs actifs */}
                <MetricDisplay
                  title="Utilisateurs"
                  value={metrics.active_users || 0}
                  unit=""
                  icon="users"
                  trend={metrics.users_trend}
                />
                
                {/* Bande passante */}
                <MetricDisplay
                  title="Bande passante"
                  value={metrics.bandwidth || 0}
                  unit="Mbps"
                  icon="network"
                  threshold={1000}
                  trend={metrics.bandwidth_trend}
                />
                
                {/* Latence */}
                <MetricDisplay
                  title="Latence"
                  value={metrics.latency || 0}
                  unit="ms"
                  icon="clock"
                  threshold={500}
                  trend={metrics.latency_trend}
                  isLowerBetter
                />
              </div>
            </section>
            
            {/* Graphiques */}
            <section className="charts-section">
              <h2>Graphiques</h2>
              <div className="charts-grid">
                {/* Utilisateurs actifs */}
                <ChartDisplay
                  title="Utilisateurs actifs"
                  type="line"
                  data={metrics.users_history || []}
                  options={{
                    yAxis: { min: 0 }
                  }}
                />
                
                {/* Qualité vidéo */}
                <ChartDisplay
                  title="Qualité vidéo"
                  type="pie"
                  data={metrics.quality_distribution || []}
                  options={{
                    labels: ['SD', 'HD', 'Full HD', '4K']
                  }}
                />
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default MonitoringDashboard;
