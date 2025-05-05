import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { checkApiStatus } from './services/apiService';
import './App.css';

// Pages (à implémenter)
const Home = () => <div className="page">Page d'accueil</div>;
const Films = () => <div className="page">Films</div>;
const Dramas = () => <div className="page">Dramas</div>;
const Animes = () => <div className="page">Animes</div>;
const Bollywood = () => <div className="page">Bollywood</div>;

function App() {
  const [apiStatus, setApiStatus] = useState({ status: 'loading', message: 'Connexion à l\'API...' });

  useEffect(() => {
    const checkApi = async () => {
      try {
        const status = await checkApiStatus();
        setApiStatus({ 
          status: 'connected', 
          message: `API connectée (${status.environment})` 
        });
      } catch (error) {
        console.error('Erreur de connexion à l\'API:', error);
        setApiStatus({ 
          status: 'error', 
          message: 'Erreur de connexion à l\'API' 
        });
      }
    };

    checkApi();
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div className="logo">FloDrama</div>
        <nav className="nav">
          <Link to="/">Accueil</Link>
          <Link to="/films">Films</Link>
          <Link to="/dramas">Dramas</Link>
          <Link to="/animes">Animes</Link>
          <Link to="/bollywood">Bollywood</Link>
        </nav>
        <div className={`api-status ${apiStatus.status}`}>
          {apiStatus.message}
        </div>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/films" element={<Films />} />
          <Route path="/dramas" element={<Dramas />} />
          <Route path="/animes" element={<Animes />} />
          <Route path="/bollywood" element={<Bollywood />} />
        </Routes>
      </main>

      <footer className="footer">
        <p>FloDrama &copy; {new Date().getFullYear()} - Propulsé par Cloudflare</p>
      </footer>
    </div>
  );
}

export default App;
