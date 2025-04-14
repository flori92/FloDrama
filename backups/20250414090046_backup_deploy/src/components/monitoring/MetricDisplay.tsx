import React from 'react';

interface MetricDisplayProps {
  title: string;
  value: number;
  unit?: string;
  icon?: string;
  threshold?: number;
  trend?: 'up' | 'down' | 'stable';
  isHigherBetter?: boolean;
  isLowerBetter?: boolean;
}

/**
 * Composant d'affichage de métrique pour le tableau de bord de monitoring
 */
export const MetricDisplay: React.FC<MetricDisplayProps> = ({
  title,
  value,
  unit = '',
  icon,
  threshold,
  trend,
  isHigherBetter = false,
  isLowerBetter = false
}) => {
  /**
   * Détermine la couleur de la métrique en fonction du seuil
   */
  const getStatusColor = (): string => {
    if (threshold === undefined) return '#6c757d'; // Gris par défaut

    if (isHigherBetter) {
      // Pour les métriques où une valeur plus élevée est meilleure (ex: FPS)
      if (value < threshold * 0.5) return '#dc3545'; // Rouge
      if (value < threshold) return '#ffc107'; // Jaune
      return '#28a745'; // Vert
    } else if (isLowerBetter) {
      // Pour les métriques où une valeur plus basse est meilleure (ex: latence)
      if (value > threshold * 1.5) return '#dc3545'; // Rouge
      if (value > threshold) return '#ffc107'; // Jaune
      return '#28a745'; // Vert
    } else {
      // Pour les métriques standard (ex: CPU, mémoire)
      if (value > threshold) return '#dc3545'; // Rouge
      if (value > threshold * 0.8) return '#ffc107'; // Jaune
      return '#28a745'; // Vert
    }
  };

  /**
   * Obtient l'icône de tendance
   */
  const getTrendIcon = (): string => {
    if (!trend) return '';
    
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      case 'stable':
        return '→';
      default:
        return '';
    }
  };

  /**
   * Détermine la couleur de la tendance
   */
  const getTrendColor = (): string => {
    if (!trend) return '#6c757d';
    
    if (isHigherBetter) {
      // Pour les métriques où une valeur plus élevée est meilleure
      if (trend === 'up') return '#28a745'; // Vert
      if (trend === 'down') return '#dc3545'; // Rouge
      return '#6c757d'; // Gris
    } else if (isLowerBetter) {
      // Pour les métriques où une valeur plus basse est meilleure
      if (trend === 'up') return '#dc3545'; // Rouge
      if (trend === 'down') return '#28a745'; // Vert
      return '#6c757d'; // Gris
    } else {
      // Pour les métriques standard
      return '#6c757d'; // Gris
    }
  };

  /**
   * Formate la valeur pour l'affichage
   */
  const formatValue = (val: number): string => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    } else if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}k`;
    } else if (Number.isInteger(val)) {
      return val.toString();
    } else {
      return val.toFixed(1);
    }
  };

  return (
    <div className="metric-display" style={{ borderColor: getStatusColor() }}>
      <div className="metric-header">
        <h3 className="metric-title">{title}</h3>
        {icon && <span className={`metric-icon icon-${icon}`}></span>}
      </div>
      
      <div className="metric-value-container">
        <span className="metric-value" style={{ color: getStatusColor() }}>
          {formatValue(value)}
        </span>
        {unit && <span className="metric-unit">{unit}</span>}
        
        {trend && (
          <span className="metric-trend" style={{ color: getTrendColor() }}>
            {getTrendIcon()}
          </span>
        )}
      </div>
      
      {threshold !== undefined && (
        <div className="metric-threshold">
          Seuil: {threshold}{unit}
        </div>
      )}
      
      <style jsx>{`
        .metric-display {
          background-color: white;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border-left: 4px solid;
          display: flex;
          flex-direction: column;
        }
        
        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .metric-title {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
          color: #333;
        }
        
        .metric-value-container {
          display: flex;
          align-items: baseline;
        }
        
        .metric-value {
          font-size: 28px;
          font-weight: 600;
        }
        
        .metric-unit {
          font-size: 14px;
          margin-left: 4px;
          color: #666;
        }
        
        .metric-trend {
          margin-left: 8px;
          font-size: 18px;
          font-weight: bold;
        }
        
        .metric-threshold {
          font-size: 12px;
          color: #666;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
};

export default MetricDisplay;
