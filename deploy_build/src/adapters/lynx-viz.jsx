/**
 * Adaptateurs pour les fonctionnalités @lynx/viz
 * Ce fichier simule les fonctionnalités du package @lynx/viz qui n'est pas disponible
 */
import React from 'react';

// Classe de base pour les visualisations
export class Visualization {
  constructor(config = {}) {
    this.config = config;
    this.data = config.data || [];
    this.options = config.options || {};
  }

  setData(data) {
    this.data = data;
    return this;
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
    return this;
  }

  render(container) {
    console.log('Visualization render called with container:', container);
    return this;
  }
}

// Composants de visualisation
export const LineChart = ({ data, options, style }) => {
  return (
    <div style={{ 
      width: '100%', 
      height: '200px', 
      backgroundColor: '#f5f5f5', 
      borderRadius: '4px',
      padding: '8px',
      ...style 
    }}>
      <div style={{ textAlign: 'center', padding: '8px' }}>
        {options?.title && <h3 style={{ margin: '0 0 8px 0' }}>{options.title}</h3>}
        <p style={{ color: '#666', fontSize: '12px' }}>
          Graphique linéaire (simulé)
        </p>
      </div>
    </div>
  );
};

export const BarChart = ({ data, options, style }) => {
  return (
    <div style={{ 
      width: '100%', 
      height: '200px', 
      backgroundColor: '#f5f5f5', 
      borderRadius: '4px',
      padding: '8px',
      ...style 
    }}>
      <div style={{ textAlign: 'center', padding: '8px' }}>
        {options?.title && <h3 style={{ margin: '0 0 8px 0' }}>{options.title}</h3>}
        <p style={{ color: '#666', fontSize: '12px' }}>
          Graphique à barres (simulé)
        </p>
      </div>
    </div>
  );
};

export const PieChart = ({ data, options, style }) => {
  return (
    <div style={{ 
      width: '100%', 
      height: '200px', 
      backgroundColor: '#f5f5f5', 
      borderRadius: '4px',
      padding: '8px',
      ...style 
    }}>
      <div style={{ textAlign: 'center', padding: '8px' }}>
        {options?.title && <h3 style={{ margin: '0 0 8px 0' }}>{options.title}</h3>}
        <p style={{ color: '#666', fontSize: '12px' }}>
          Graphique circulaire (simulé)
        </p>
      </div>
    </div>
  );
};

// Utilitaires pour les données
export const DataProcessor = {
  aggregate: (data, groupBy, aggregateFn) => {
    // Simulation d'agrégation de données
    return data;
  },
  filter: (data, filterFn) => {
    // Simulation de filtrage de données
    return data.filter(filterFn);
  },
  sort: (data, sortFn) => {
    // Simulation de tri de données
    return [...data].sort(sortFn);
  }
};

// Thèmes pour les visualisations
export const Themes = {
  light: {
    background: '#ffffff',
    text: '#333333',
    grid: '#eeeeee',
    axis: '#999999',
    primary: '#4285f4',
    secondary: '#34a853',
    accent: '#fbbc05',
    error: '#ea4335'
  },
  dark: {
    background: '#1e1e1e',
    text: '#ffffff',
    grid: '#333333',
    axis: '#666666',
    primary: '#4285f4',
    secondary: '#34a853',
    accent: '#fbbc05',
    error: '#ea4335'
  }
};

// Exporter un objet par défaut
const lynxViz = {
  Visualization,
  LineChart,
  BarChart,
  PieChart,
  DataProcessor,
  Themes
};

export default lynxViz;
