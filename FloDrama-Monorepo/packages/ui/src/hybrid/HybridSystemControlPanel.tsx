import React from 'react';
import { useHybridSystem } from './useHybridSystem';

export const HybridSystemControlPanel: React.FC = () => {
  const { isLynxAvailable, forceReact, setForceReact } = useHybridSystem();

  return (
    <div
      style={{
        position: process.env.NODE_ENV === 'development' ? 'fixed' : 'none',
        bottom: '20px',
        right: '20px',
        padding: '10px',
        backgroundColor: '#f0f0f0',
        borderRadius: '5px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      <div>
        <strong>État du système hybride:</strong>
      </div>
      <div>
        Lynx disponible: {isLynxAvailable ? '✅' : '❌'}
      </div>
      <div>
        Mode forcé React: {forceReact ? '✅' : '❌'}
      </div>
      <button
        onClick={() => setForceReact(!forceReact)}
        style={{
          padding: '5px 10px',
          borderRadius: '3px',
          border: '1px solid #ccc',
          backgroundColor: forceReact ? '#ff4444' : '#44ff44',
          cursor: 'pointer'
        }}
      >
        {forceReact ? 'Désactiver React forcé' : 'Activer React forcé'}
      </button>
    </div>
  );
};
