import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * Navigation principale de FloDrama
 */
export const MainNavigation: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="main-navigation">
      {/* Logo et titre */}
      <div className="nav-brand">
        <Link to="/" className="brand-link">
          <span className="brand-name">FloDrama</span>
        </Link>
      </div>

      {/* Bouton menu mobile */}
      <button
        className="menu-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
      >
        <span className="menu-icon"></span>
      </button>

      {/* Menu de navigation */}
      <div className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
        <Link
          to="/"
          className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
        >
          Accueil
        </Link>
        
        <Link
          to="/videos"
          className={`nav-item ${location.pathname.startsWith('/videos') ? 'active' : ''}`}
        >
          Vidéos
        </Link>
        
        <Link
          to="/monitoring"
          className={`nav-item ${location.pathname.startsWith('/monitoring') ? 'active' : ''}`}
        >
          Monitoring
        </Link>
        
        <Link
          to="/documentation"
          className={`nav-item ${location.pathname.startsWith('/documentation') ? 'active' : ''}`}
        >
          Documentation
        </Link>
      </div>

      {/* Styles CSS */}
      <style jsx>{`
        .main-navigation {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2rem;
          background: #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
        }

        .nav-brand {
          display: flex;
          align-items: center;
        }

        .brand-link {
          text-decoration: none;
          color: #333;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .brand-name {
          font-size: 1.5rem;
          font-weight: bold;
          color: #007bff;
        }

        .nav-menu {
          display: flex;
          gap: 1.5rem;
          align-items: center;
        }

        .nav-item {
          text-decoration: none;
          color: #666;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .nav-item:hover {
          color: #007bff;
          background: #f8f9fa;
        }

        .nav-item.active {
          color: #007bff;
          background: #e9ecef;
        }

        .menu-toggle {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
        }

        .menu-icon {
          display: block;
          width: 24px;
          height: 2px;
          background: #333;
          position: relative;
          transition: all 0.2s;
        }

        .menu-icon::before,
        .menu-icon::after {
          content: '';
          position: absolute;
          width: 24px;
          height: 2px;
          background: #333;
          transition: all 0.2s;
        }

        .menu-icon::before {
          top: -6px;
        }

        .menu-icon::after {
          bottom: -6px;
        }

        @media (max-width: 768px) {
          .menu-toggle {
            display: block;
          }

          .nav-menu {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            flex-direction: column;
            background: #ffffff;
            padding: 1rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .nav-menu.open {
            display: flex;
          }

          .nav-item {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </nav>
  );
};

export default MainNavigation;
