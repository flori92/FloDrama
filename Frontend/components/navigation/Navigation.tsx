import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHybridComponent } from '@/hooks/useHybridComponent';
import { HybridComponent } from '@/adapters/hybrid-component';

interface RouteItem {
  label: string;
  route: string;
  icon?: string;
}

interface NavigationProps {
  items: RouteItem[];
  className?: string;
}

/**
 * Composant de navigation principal
 * Utilise Lynx par défaut avec fallback vers React Router
 */
const Navigation: React.FC<NavigationProps> = ({ items, className = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Utilisation du hook hybride pour la navigation
  const { isUsingLynx, adaptedProps, error } = useHybridComponent('Navigation', {
    items,
    activeRoute: location.pathname,
    onRouteChange: (route: string) => navigate(route)
  });

  if (error) {
    console.error('Erreur de navigation:', error);
    // Fallback en cas d'erreur
    return (
      <nav className={`navigation-fallback ${className}`}>
        {items.map((item) => (
          <button
            key={item.route}
            onClick={() => navigate(item.route)}
            className={location.pathname === item.route ? 'active' : ''}
          >
            {item.icon && <span className="icon">{item.icon}</span>}
            {item.label}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <HybridComponent
      componentName="Navigation"
      isLynx={isUsingLynx}
      props={{
        ...adaptedProps,
        className: `navigation-container ${className}`
      }}
    />
  );
};

export default Navigation;
