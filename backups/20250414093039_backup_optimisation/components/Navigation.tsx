import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
 * Composant de navigation principal pour FloDrama
 * Version React pure pour Vercel
 */
const Navigation: React.FC<NavigationProps> = ({ items, className = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className={`navigation-container ${className}`}>
      <div className="logo-container">
        <div className="logo">
          <span className="logo-text">FloDrama</span>
        </div>
      </div>
      
      <div className="nav-links">
        {items.map((item) => (
          <button
            key={item.route}
            onClick={() => navigate(item.route)}
            className={`nav-item ${location.pathname === item.route ? 'active' : ''}`}
          >
            {item.icon && <span className="icon">{item.icon}</span>}
            <span className="label">{item.label}</span>
          </button>
        ))}
      </div>
      
      <div className="user-actions">
        <button className="search-button">
          <span className="icon">🔍</span>
        </button>
        <button className="profile-button">
          <span className="icon">👤</span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
