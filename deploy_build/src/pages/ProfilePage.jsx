import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/ProfilePage.css';

/**
 * Page de profil utilisateur
 * Affiche les informations de l'utilisateur et ses préférences
 */
const ProfilePage = () => {
  const [userData, setUserData] = useState({
    username: 'Utilisateur',
    email: 'utilisateur@example.com',
    avatar: '/assets/default-avatar.png',
    watchlist: [],
    history: [],
    preferences: {
      language: 'Français',
      subtitles: true,
      notifications: true,
      theme: 'dark'
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simuler le chargement des données utilisateur
    setTimeout(() => {
      // Données mockées pour l'exemple
      const mockWatchlist = [
        { id: 'drama1', title: 'My Love From The Star', type: 'drama', image: '/assets/placeholder.jpg' },
        { id: 'anime1', title: 'Attack on Titan', type: 'anime', image: '/assets/placeholder.jpg' },
        { id: 'movie1', title: 'Parasite', type: 'movie', image: '/assets/placeholder.jpg' }
      ];
      
      const mockHistory = [
        { id: 'drama2', title: 'Crash Landing on You', type: 'drama', progress: 80, image: '/assets/placeholder.jpg' },
        { id: 'anime2', title: 'Demon Slayer', type: 'anime', progress: 65, image: '/assets/placeholder.jpg' }
      ];
      
      setUserData(prev => ({
        ...prev,
        watchlist: mockWatchlist,
        history: mockHistory
      }));
      
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Chargement du profil...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <Link to="/" className="back-button">
          <i className="fas fa-arrow-left"></i> Retour
        </Link>
        <h1>Mon Profil</h1>
      </header>

      <div className="profile-content">
        <div className="profile-info">
          <div className="avatar-container">
            <img src={userData.avatar} alt="Avatar" className="user-avatar" />
            <button className="edit-avatar-btn">Modifier</button>
          </div>
          
          <div className="user-details">
            <h2>{userData.username}</h2>
            <p>{userData.email}</p>
            <button className="edit-profile-btn">Modifier le profil</button>
          </div>
        </div>

        <div className="profile-sections">
          <section className="watchlist-section">
            <h3>Ma Liste</h3>
            {userData.watchlist.length > 0 ? (
              <div className="content-grid">
                {userData.watchlist.map(item => (
                  <div key={item.id} className="content-card">
                    <img src={item.image} alt={item.title} />
                    <div className="content-info">
                      <h4>{item.title}</h4>
                      <span className="content-type">{item.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">Votre liste est vide</p>
            )}
            <Link to="/watchlist" className="view-all-link">Voir tout</Link>
          </section>

          <section className="history-section">
            <h3>Historique</h3>
            {userData.history.length > 0 ? (
              <div className="content-grid">
                {userData.history.map(item => (
                  <div key={item.id} className="content-card">
                    <img src={item.image} alt={item.title} />
                    <div className="content-info">
                      <h4>{item.title}</h4>
                      <div className="progress-bar">
                        <div className="progress" style={{ width: `${item.progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">Votre historique est vide</p>
            )}
            <Link to="/history" className="view-all-link">Voir tout</Link>
          </section>

          <section className="preferences-section">
            <h3>Préférences</h3>
            <div className="preferences-list">
              <div className="preference-item">
                <span>Langue</span>
                <select defaultValue={userData.preferences.language}>
                  <option value="Français">Français</option>
                  <option value="English">English</option>
                  <option value="한국어">한국어</option>
                  <option value="日本語">日本語</option>
                </select>
              </div>
              <div className="preference-item">
                <span>Sous-titres</span>
                <label className="toggle">
                  <input type="checkbox" defaultChecked={userData.preferences.subtitles} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="preference-item">
                <span>Notifications</span>
                <label className="toggle">
                  <input type="checkbox" defaultChecked={userData.preferences.notifications} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="preference-item">
                <span>Thème</span>
                <select defaultValue={userData.preferences.theme}>
                  <option value="dark">Sombre</option>
                  <option value="light">Clair</option>
                  <option value="system">Système</option>
                </select>
              </div>
            </div>
            <Link to="/settings" className="settings-link">Paramètres avancés</Link>
          </section>
        </div>
      </div>

      <footer className="profile-footer">
        <Link to="/settings" className="footer-link">Paramètres</Link>
        <Link to="/help" className="footer-link">Aide</Link>
        <button className="logout-btn">Déconnexion</button>
      </footer>
    </div>
  );
};

export default ProfilePage;
