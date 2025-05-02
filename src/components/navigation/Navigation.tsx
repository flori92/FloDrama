import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavigationProps {
  items: { route: string; label: string; icon?: React.ReactNode }[];
  className?: string;
}

/**
 * Composant de navigation principal (React pur)
 */
const Navigation: React.FC<NavigationProps> = ({ items, className = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();

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
};

export default Navigation;
