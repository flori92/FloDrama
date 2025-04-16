import React, { useEffect, useState } from 'react';
import VideoPlayer from '../components/video/VideoPlayer';
import { MonitoringService } from '../services/monitoring/MonitoringService';

interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  poster: string;
  duration: number;
  views: number;
  likes: number;
  category: string;
  tags: string[];
}

/**
 * Page principale des vidéos de FloDrama
 */
export const VideosPage: React.FC = () => {
  // États
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCategory, setCurrentCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Service de monitoring
  const monitoringService = MonitoringService.getInstance();

  // Chargement initial des vidéos
  useEffect(() => {
    const loadVideos = async () => {
      try {
        setIsLoading(true);
        
        // Simulation de l'appel API (à remplacer par votre API réelle)
        const response = await fetch('/api/videos');
        const data = await response.json();
        
        setVideos(data);
        if (data.length > 0) {
          setSelectedVideo(data[0]);
        }
        
        monitoringService.logEvent('videos_loaded', { count: data.length });
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des vidéos:', err);
        setError('Erreur lors du chargement des vidéos');
        monitoringService.logError('videos_load_error', err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVideos();
  }, []);

  // Filtrage des vidéos
  const filteredVideos = videos.filter(video => {
    const matchesCategory = currentCategory === 'all' || video.category === currentCategory;
    const matchesSearch = searchQuery === '' || 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // Catégories uniques
  const categories = ['all', ...new Set(videos.map(video => video.category))];

  // Gestionnaires d'événements
  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
    monitoringService.logEvent('video_selected', {
      videoId: video.id,
      title: video.title
    });
  };

  const handleVideoPlay = () => {
    if (selectedVideo) {
      monitoringService.logEvent('video_play', {
        videoId: selectedVideo.id,
        title: selectedVideo.title
      });
    }
  };

  const handleVideoError = (error: Error) => {
    monitoringService.logError('video_playback_error', error);
  };

  const handleQualityChange = (quality: string) => {
    monitoringService.logEvent('quality_change', {
      videoId: selectedVideo?.id,
      quality
    });
  };

  return (
    <div className="videos-page">
      {/* En-tête */}
      <header className="page-header">
        <h1>Vidéos FloDrama</h1>
        
        {/* Filtres */}
        <div className="filters">
          {/* Recherche */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une vidéo..."
            className="search-input"
          />
          
          {/* Catégories */}
          <select
            value={currentCategory}
            onChange={(e) => setCurrentCategory(e.target.value)}
            className="category-select"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'Toutes les catégories' : category}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="page-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Chargement des vidéos...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>
              Réessayer
            </button>
          </div>
        ) : (
          <div className="content-layout">
            {/* Lecteur vidéo principal */}
            <section className="main-player">
              {selectedVideo && (
                <>
                  <VideoPlayer
                    videoUrl={selectedVideo.url}
                    title={selectedVideo.title}
                    poster={selectedVideo.poster}
                    onPlay={handleVideoPlay}
                    onError={handleVideoError}
                    onQualityChange={handleQualityChange}
                  />
                  
                  <div className="video-info">
                    <h2>{selectedVideo.title}</h2>
                    <p className="video-stats">
                      {selectedVideo.views.toLocaleString()} vues •
                      {selectedVideo.likes.toLocaleString()} likes
                    </p>
                    <p className="video-description">
                      {selectedVideo.description}
                    </p>
                    <div className="video-tags">
                      {selectedVideo.tags.map(tag => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </section>

            {/* Liste des vidéos */}
            <section className="videos-list">
              <h3>Vidéos ({filteredVideos.length})</h3>
              {filteredVideos.length === 0 ? (
                <p className="no-videos">Aucune vidéo trouvée</p>
              ) : (
                <div className="videos-grid">
                  {filteredVideos.map(video => (
                    <div
                      key={video.id}
                      className={`video-card ${selectedVideo?.id === video.id ? 'selected' : ''}`}
                      onClick={() => handleVideoSelect(video)}
                    >
                      <div className="video-thumbnail">
                        <img src={video.poster} alt={video.title} />
                        <span className="video-duration">
                          {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <div className="video-details">
                        <h4>{video.title}</h4>
                        <p className="video-stats">
                          {video.views.toLocaleString()} vues
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Styles CSS */}
      <style jsx>{`
        .videos-page {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 20px;
        }

        .filters {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        .search-input,
        .category-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .search-input {
          flex: 1;
        }

        .content-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
        }

        .main-player {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .video-info {
          padding: 20px;
        }

        .video-stats {
          color: #666;
          margin: 10px 0;
        }

        .video-description {
          margin: 15px 0;
          line-height: 1.5;
        }

        .video-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }

        .tag {
          background: #f0f0f0;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          color: #666;
        }

        .videos-list {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          height: fit-content;
        }

        .videos-grid {
          display: grid;
          gap: 15px;
          margin-top: 15px;
        }

        .video-card {
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 4px;
          overflow: hidden;
        }

        .video-card:hover {
          transform: translateY(-2px);
        }

        .video-card.selected {
          background: #f8f9fa;
          border-left: 4px solid #007bff;
        }

        .video-thumbnail {
          position: relative;
          width: 100%;
          padding-top: 56.25%;
        }

        .video-thumbnail img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-duration {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 2px 4px;
          border-radius: 2px;
          font-size: 12px;
        }

        .video-details {
          padding: 10px;
        }

        .video-details h4 {
          margin: 0;
          font-size: 14px;
          line-height: 1.4;
        }

        .loading-state,
        .error-state {
          text-align: center;
          padding: 40px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          margin: 0 auto 20px;
          animation: spin 1s linear infinite;
        }

        .error-state button {
          margin-top: 10px;
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          background: #dc3545;
          color: white;
          cursor: pointer;
        }

        .no-videos {
          text-align: center;
          color: #666;
          padding: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .content-layout {
            grid-template-columns: 1fr;
          }

          .videos-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .filters {
            flex-direction: column;
          }

          .video-info {
            padding: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default VideosPage;
