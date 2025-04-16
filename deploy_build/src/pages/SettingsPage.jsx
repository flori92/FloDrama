import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/SettingsPage.css';

/**
 * Page des paramètres de l'application
 * Permet à l'utilisateur de configurer ses préférences
 */
const SettingsPage = () => {
  const [settings, setSettings] = useState({
    account: {
      email: 'utilisateur@example.com',
      password: '••••••••',
      notifications: true
    },
    appearance: {
      theme: 'dark',
      fontSize: 'medium',
      subtitlesSize: 'medium'
    },
    playback: {
      autoplay: true,
      quality: 'auto',
      language: 'Français',
      subtitles: true
    },
    privacy: {
      historyEnabled: true,
      dataSaving: false,
      analytics: true
    },
    storage: {
      downloadQuality: 'HD',
      autoDelete: true,
      maxStorage: '2GB'
    }
  });

  const [activeTab, setActiveTab] = useState('account');
  const [saveMessage, setSaveMessage] = useState('');

  const handleChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handleSave = () => {
    // Simuler la sauvegarde des paramètres
    setSaveMessage('Paramètres enregistrés avec succès');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <Link to="/" className="back-button">
          <i className="fas fa-arrow-left"></i> Retour
        </Link>
        <h1>Paramètres</h1>
      </header>

      <div className="settings-container">
        <div className="settings-sidebar">
          <ul className="settings-tabs">
            <li 
              className={activeTab === 'account' ? 'active' : ''} 
              onClick={() => setActiveTab('account')}
            >
              Compte
            </li>
            <li 
              className={activeTab === 'appearance' ? 'active' : ''} 
              onClick={() => setActiveTab('appearance')}
            >
              Apparence
            </li>
            <li 
              className={activeTab === 'playback' ? 'active' : ''} 
              onClick={() => setActiveTab('playback')}
            >
              Lecture
            </li>
            <li 
              className={activeTab === 'privacy' ? 'active' : ''} 
              onClick={() => setActiveTab('privacy')}
            >
              Confidentialité
            </li>
            <li 
              className={activeTab === 'storage' ? 'active' : ''} 
              onClick={() => setActiveTab('storage')}
            >
              Stockage
            </li>
          </ul>
        </div>

        <div className="settings-content">
          {activeTab === 'account' && (
            <div className="settings-section">
              <h2>Paramètres du compte</h2>
              
              <div className="setting-item">
                <label>Adresse e-mail</label>
                <div className="setting-control">
                  <input 
                    type="email" 
                    value={settings.account.email} 
                    onChange={(e) => handleChange('account', 'email', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="setting-item">
                <label>Mot de passe</label>
                <div className="setting-control">
                  <input 
                    type="password" 
                    value={settings.account.password} 
                    onChange={(e) => handleChange('account', 'password', e.target.value)}
                  />
                  <button className="secondary-button">Modifier</button>
                </div>
              </div>
              
              <div className="setting-item">
                <label>Notifications</label>
                <div className="setting-control">
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={settings.account.notifications} 
                      onChange={(e) => handleChange('account', 'notifications', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h2>Apparence</h2>
              
              <div className="setting-item">
                <label>Thème</label>
                <div className="setting-control">
                  <select 
                    value={settings.appearance.theme} 
                    onChange={(e) => handleChange('appearance', 'theme', e.target.value)}
                  >
                    <option value="dark">Sombre</option>
                    <option value="light">Clair</option>
                    <option value="system">Système</option>
                  </select>
                </div>
              </div>
              
              <div className="setting-item">
                <label>Taille de police</label>
                <div className="setting-control">
                  <select 
                    value={settings.appearance.fontSize} 
                    onChange={(e) => handleChange('appearance', 'fontSize', e.target.value)}
                  >
                    <option value="small">Petite</option>
                    <option value="medium">Moyenne</option>
                    <option value="large">Grande</option>
                  </select>
                </div>
              </div>
              
              <div className="setting-item">
                <label>Taille des sous-titres</label>
                <div className="setting-control">
                  <select 
                    value={settings.appearance.subtitlesSize} 
                    onChange={(e) => handleChange('appearance', 'subtitlesSize', e.target.value)}
                  >
                    <option value="small">Petite</option>
                    <option value="medium">Moyenne</option>
                    <option value="large">Grande</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'playback' && (
            <div className="settings-section">
              <h2>Paramètres de lecture</h2>
              
              <div className="setting-item">
                <label>Lecture automatique</label>
                <div className="setting-control">
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={settings.playback.autoplay} 
                      onChange={(e) => handleChange('playback', 'autoplay', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div className="setting-item">
                <label>Qualité vidéo</label>
                <div className="setting-control">
                  <select 
                    value={settings.playback.quality} 
                    onChange={(e) => handleChange('playback', 'quality', e.target.value)}
                  >
                    <option value="auto">Auto</option>
                    <option value="low">Basse (480p)</option>
                    <option value="medium">Moyenne (720p)</option>
                    <option value="high">Haute (1080p)</option>
                  </select>
                </div>
              </div>
              
              <div className="setting-item">
                <label>Langue préférée</label>
                <div className="setting-control">
                  <select 
                    value={settings.playback.language} 
                    onChange={(e) => handleChange('playback', 'language', e.target.value)}
                  >
                    <option value="Français">Français</option>
                    <option value="English">Anglais</option>
                    <option value="한국어">Coréen</option>
                    <option value="日本語">Japonais</option>
                  </select>
                </div>
              </div>
              
              <div className="setting-item">
                <label>Sous-titres</label>
                <div className="setting-control">
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={settings.playback.subtitles} 
                      onChange={(e) => handleChange('playback', 'subtitles', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="settings-section">
              <h2>Confidentialité</h2>
              
              <div className="setting-item">
                <label>Historique de visionnage</label>
                <div className="setting-control">
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={settings.privacy.historyEnabled} 
                      onChange={(e) => handleChange('privacy', 'historyEnabled', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div className="setting-item">
                <label>Économie de données</label>
                <div className="setting-control">
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={settings.privacy.dataSaving} 
                      onChange={(e) => handleChange('privacy', 'dataSaving', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div className="setting-item">
                <label>Analytique et amélioration</label>
                <div className="setting-control">
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={settings.privacy.analytics} 
                      onChange={(e) => handleChange('privacy', 'analytics', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div className="setting-action">
                <button className="danger-button">Effacer l'historique</button>
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="settings-section">
              <h2>Stockage et téléchargements</h2>
              
              <div className="setting-item">
                <label>Qualité des téléchargements</label>
                <div className="setting-control">
                  <select 
                    value={settings.storage.downloadQuality} 
                    onChange={(e) => handleChange('storage', 'downloadQuality', e.target.value)}
                  >
                    <option value="SD">SD (480p)</option>
                    <option value="HD">HD (720p)</option>
                    <option value="FHD">Full HD (1080p)</option>
                  </select>
                </div>
              </div>
              
              <div className="setting-item">
                <label>Suppression automatique</label>
                <div className="setting-control">
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={settings.storage.autoDelete} 
                      onChange={(e) => handleChange('storage', 'autoDelete', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
              
              <div className="setting-item">
                <label>Stockage maximum</label>
                <div className="setting-control">
                  <select 
                    value={settings.storage.maxStorage} 
                    onChange={(e) => handleChange('storage', 'maxStorage', e.target.value)}
                  >
                    <option value="1GB">1 GB</option>
                    <option value="2GB">2 GB</option>
                    <option value="5GB">5 GB</option>
                    <option value="10GB">10 GB</option>
                  </select>
                </div>
              </div>
              
              <div className="setting-action">
                <button className="danger-button">Effacer tous les téléchargements</button>
              </div>
            </div>
          )}

          {saveMessage && (
            <div className="save-message success">
              {saveMessage}
            </div>
          )}

          <div className="settings-actions">
            <button className="primary-button" onClick={handleSave}>
              Enregistrer les modifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
