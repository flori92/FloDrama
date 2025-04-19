/**
 * Page d'exemple pour démontrer l'utilisation du système d'images intégré
 * avec les services de scraping et de gestion de contenu
 */

import React, { useEffect, useState } from 'react';
import ContentDataService from '../../Frontend/services/ContentService';
import FloDramaImage from '../components/FloDramaImage';
import imageIntegrationService from '../services/ImageIntegrationService';
import '../components/FloDramaImage.css';

// Styles pour la page d'exemple
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'SF Pro Display, sans-serif',
    color: '#FFFFFF',
    backgroundColor: '#121118',
    minHeight: '100vh',
  },
  header: {
    marginBottom: '30px',
    textAlign: 'center',
  },
  title: {
    fontSize: '2.5rem',
    background: 'linear-gradient(to right, #3b82f6, #d946ef)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#E2E8F0',
    marginBottom: '20px',
  },
  section: {
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '1.8rem',
    marginBottom: '20px',
    position: 'relative',
    display: 'inline-block',
  },
  sectionTitleAfter: {
    content: '""',
    position: 'absolute',
    left: '0',
    bottom: '-10px',
    width: '100%',
    height: '3px',
    background: 'linear-gradient(to right, #3b82f6, #d946ef)',
    borderRadius: '3px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#1A1926',
    borderRadius: '8px',
    overflow: 'hidden',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  cardHover: {
    transform: 'translateY(-5px)',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
  },
  cardInfo: {
    padding: '15px',
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '5px',
  },
  cardDetails: {
    fontSize: '0.85rem',
    color: '#94A3B8',
  },
  button: {
    display: 'inline-block',
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    marginRight: '10px',
  },
  buttonHover: {
    backgroundColor: '#2563eb',
    transform: 'translateY(-2px)',
  },
  statusContainer: {
    backgroundColor: '#1A1926',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  statusTitle: {
    fontSize: '1.2rem',
    marginBottom: '10px',
  },
  statusItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  statusLabel: {
    fontWeight: '600',
  },
  statusValue: {
    color: '#94A3B8',
  },
  statusValueOk: {
    color: '#10B981',
  },
  statusValueError: {
    color: '#EF4444',
  },
};

const ExamplePage = () => {
  // État pour les contenus
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cdnStatus, setCdnStatus] = useState({
    github: false,
    cloudfront: false,
  });

  // Charger les contenus et l'état des CDNs au montage du composant
  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger les contenus depuis le service de contenu
        const data = await ContentDataService.getAllContents();
        
        // Enrichir les contenus avec les URLs d'images
        const enrichedData = imageIntegrationService.enrichContentsWithImages(data);
        
        setContents(enrichedData);
        
        // Récupérer l'état des CDNs
        const status = {
          github: imageIntegrationService.cdnStatus.github,
          cloudfront: imageIntegrationService.cdnStatus.cloudfront,
        };
        
        setCdnStatus(status);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Vérifier l'état des CDNs
  const checkCdnStatus = async () => {
    await imageIntegrationService.checkAllCdnStatus();
    
    setCdnStatus({
      github: imageIntegrationService.cdnStatus.github,
      cloudfront: imageIntegrationService.cdnStatus.cloudfront,
    });
  };

  // Précharger les images pour les contenus populaires
  const preloadImages = async () => {
    await imageIntegrationService.preloadPopularContentImages();
    alert('Préchargement des images terminé !');
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>FloDrama - Système d'images</h1>
        <p style={styles.subtitle}>
          Démonstration du système d'images intégré avec les services de scraping et de gestion de contenu
        </p>
      </header>

      {/* Statut des CDNs */}
      <div style={styles.statusContainer}>
        <h2 style={styles.statusTitle}>État des CDNs</h2>
        <div style={styles.statusItem}>
          <span style={styles.statusLabel}>GitHub Pages:</span>
          <span style={cdnStatus.github ? styles.statusValueOk : styles.statusValueError}>
            {cdnStatus.github ? 'Disponible' : 'Indisponible'}
          </span>
        </div>
        <div style={styles.statusItem}>
          <span style={styles.statusLabel}>CloudFront:</span>
          <span style={cdnStatus.cloudfront ? styles.statusValueOk : styles.statusValueError}>
            {cdnStatus.cloudfront ? 'Disponible' : 'Indisponible'}
          </span>
        </div>
        <div style={{ marginTop: '15px' }}>
          <button style={styles.button} onClick={checkCdnStatus}>
            Vérifier l'état des CDNs
          </button>
          <button style={styles.button} onClick={preloadImages}>
            Précharger les images populaires
          </button>
        </div>
      </div>

      {/* Dramas */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Dramas
          <span style={styles.sectionTitleAfter}></span>
        </h2>
        {loading ? (
          <p>Chargement des dramas...</p>
        ) : (
          <div style={styles.grid}>
            {contents
              .filter((content) => content.type === 'drama')
              .map((drama) => (
                <div key={drama.id} style={styles.card}>
                  {/* Utilisation du composant FloDramaImage */}
                  <FloDramaImage
                    contentId={drama.id}
                    type="poster"
                    alt={drama.title}
                    showPlaceholder={true}
                  />
                  <div style={styles.cardInfo}>
                    <h3 style={styles.cardTitle}>{drama.title}</h3>
                    <p style={styles.cardDetails}>
                      {drama.year} • {drama.episodes} épisodes
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Films */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Films
          <span style={styles.sectionTitleAfter}></span>
        </h2>
        {loading ? (
          <p>Chargement des films...</p>
        ) : (
          <div style={styles.grid}>
            {contents
              .filter((content) => content.type === 'film')
              .map((film) => (
                <div key={film.id} style={styles.card}>
                  {/* Utilisation du composant FloDramaImage */}
                  <FloDramaImage
                    contentId={film.id}
                    type="poster"
                    alt={film.title}
                    showPlaceholder={true}
                  />
                  <div style={styles.cardInfo}>
                    <h3 style={styles.cardTitle}>{film.title}</h3>
                    <p style={styles.cardDetails}>
                      {film.year} • {film.duration} min
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Bollywood */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Bollywood
          <span style={styles.sectionTitleAfter}></span>
        </h2>
        {loading ? (
          <p>Chargement des films Bollywood...</p>
        ) : (
          <div style={styles.grid}>
            {contents
              .filter((content) => content.type === 'bollywood')
              .map((bollywood) => (
                <div key={bollywood.id} style={styles.card}>
                  {/* Utilisation du composant FloDramaImage */}
                  <FloDramaImage
                    contentId={bollywood.id}
                    type="poster"
                    alt={bollywood.title}
                    showPlaceholder={true}
                  />
                  <div style={styles.cardInfo}>
                    <h3 style={styles.cardTitle}>{bollywood.title}</h3>
                    <p style={styles.cardDetails}>
                      {bollywood.year} • {bollywood.duration} min
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ExamplePage;
