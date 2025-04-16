import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from '../ui/Logo';
import { HomeIcon, SearchIcon, ListIcon, UserIcon } from '@/assets/icons/icons';
import '@/styles/components/navigation.scss';

const MainNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      label: 'Accueil',
      path: '/',
      icon: <HomeIcon />
    },
    {
      label: 'Rechercher',
      path: '/recherche',
      icon: <SearchIcon />
    },
    {
      label: 'Ma Liste',
      path: '/ma-liste',
      icon: <ListIcon />
    },
    {
      label: 'Profil',
      path: '/profil',
      icon: <UserIcon />
    }
  ];

  return (
    <nav className="main-navigation">
      <div className="nav-header">
        <Logo variant="small" />
      </div>
      
      <div className="nav-items">
        {navigationItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>
      
      <div className="nav-footer">
        <div className="nav-categories">
          <h3>Catégories</h3>
          <button onClick={() => navigate('/dramas')}>Dramas</button>
          <button onClick={() => navigate('/animes')}>Animés</button>
          <button onClick={() => navigate('/bollywood')}>Bollywood</button>
        </div>
      </div>
    </nav>
  );
};

export default MainNavigation;
