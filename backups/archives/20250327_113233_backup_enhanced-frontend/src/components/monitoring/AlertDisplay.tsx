import React from 'react';

interface AlertDisplayProps {
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info' | string;
  timestamp: string | Date;
  onResolve?: () => void;
  // Suppression de la propriété key car elle est gérée par React en interne
}

/**
 * Composant d'affichage d'alerte pour le tableau de bord de monitoring
 */
export const AlertDisplay: React.FC<AlertDisplayProps> = ({
  title,
  message,
  severity,
  timestamp,
  onResolve
}) => {
  /**
   * Détermine la couleur de l'alerte en fonction de sa sévérité
   */
  const getSeverityColor = (): string => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return '#dc3545'; // Rouge
      case 'warning':
        return '#ffc107'; // Jaune
      case 'info':
        return '#17a2b8'; // Bleu
      default:
        return '#6c757d'; // Gris
    }
  };

  /**
   * Formate la date pour l'affichage
   */
  const formatTimestamp = (time: string | Date): string => {
    const date = typeof time === 'string' ? new Date(time) : time;
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return 'Date invalide';
    }
    
    // Formater la date
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  /**
   * Obtient l'icône de sévérité
   */
  const getSeverityIcon = (): string => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return '⚠️';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ️';
      default:
        return '•';
    }
  };

  return (
    <div className="alert-display" style={{ borderLeftColor: getSeverityColor() }}>
      <div className="alert-header">
        <div className="alert-title-container">
          <span className="alert-icon" style={{ color: getSeverityColor() }}>
            {getSeverityIcon()}
          </span>
          <h3 className="alert-title">{title}</h3>
        </div>
        <span className="alert-severity" style={{ backgroundColor: getSeverityColor() }}>
          {severity}
        </span>
      </div>
      
      <p className="alert-message">{message}</p>
      
      <div className="alert-footer">
        <span className="alert-timestamp">{formatTimestamp(timestamp)}</span>
        
        {onResolve && (
          <button className="alert-resolve-btn" onClick={onResolve}>
            Résoudre
          </button>
        )}
      </div>
      
      <style jsx>{`
        .alert-display {
          background-color: white;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border-left: 4px solid;
        }
        
        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .alert-title-container {
          display: flex;
          align-items: center;
        }
        
        .alert-icon {
          margin-right: 8px;
          font-size: 18px;
        }
        
        .alert-title {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
          color: #333;
        }
        
        .alert-severity {
          font-size: 12px;
          font-weight: 500;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        
        .alert-message {
          margin: 8px 0;
          font-size: 14px;
          color: #555;
        }
        
        .alert-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
          font-size: 12px;
        }
        
        .alert-timestamp {
          color: #777;
        }
        
        .alert-resolve-btn {
          background-color: transparent;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .alert-resolve-btn:hover {
          background-color: #f8f9fa;
          border-color: #aaa;
        }
      `}</style>
    </div>
  );
};

export default AlertDisplay;
