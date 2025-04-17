import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainNavigation from '../components/navigation/MainNavigation';
import ContentGrid from '../components/content/ContentGrid';
import LoadingSpinner from '../components/LoadingSpinner';
import ContentDataService from '../services/ContentDataService';
import '../styles/MyListPage.css';

/**
 * Page "Ma Liste" pour afficher les contenus sauvegardés par l'utilisateur
 */
const MyListPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myList, setMyList] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  // Charger la liste de l'utilisateur
  useEffect(() => {
    const fetchMyList = async () => {
      try {
        setIsLoading(true);
        
        // Vérifier si l'utilisateur est connecté
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (!isLoggedIn) {
          setError('Vous devez être connecté pour accéder à votre liste.');
          setIsLoading(false);
          return;
        }
        
        // Récupérer la liste depuis ContentDataService
        let userList = [];
        
        if (ContentDataService && ContentDataService.getUserList) {
          userList = await ContentDataService.getUserList();
        } else {
          // Fallback vers localStorage si le service n'est pas disponible
          const savedList = localStorage.getItem('userList');
          userList = savedList ? JSON.parse(savedList) : [];
        }
        
        setMyList(userList);
      } catch (error) {
        console.error('Erreur lors du chargement de la liste:', error);
        setError('Impossible de charger votre liste. Veuillez réessayer plus tard.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMyList();
  }, []);

  // Filtrer la liste selon l'onglet actif
  const getFilteredList = () => {
    if (activeTab === 'all') {
      return myList;
    }
    
    return myList.filter(item => item.type === activeTab);
  };

  // Supprimer un élément de la liste
  const removeFromList = async (contentId) => {
    try {
      // Supprimer via ContentDataService
      if (ContentDataService && ContentDataService.removeFromUserList) {
        await ContentDataService.removeFromUserList(contentId);
      }
      
      // Mettre à jour l'état local
      setMyList(prevList => prevList.filter(item => item.id !== contentId));
      
      // Mettre à jour localStorage (fallback)
      const updatedList = myList.filter(item => item.id !== contentId);
      localStorage.setItem('userList', JSON.stringify(updatedList));
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'élément:', error);
    }
  };

  // Afficher le chargement
  if (isLoading) {
    return (
      <div className="my-list-page">
        <MainNavigation />
        <div className="loading-container">
          <LoadingSpinner />
          <p>Chargement de votre liste...</p>
        </div>
      </div>
    );
  }

  // Afficher une erreur
  if (error) {
    return (
      <div className="my-list-page">
        <MainNavigation />
        <div className="error-container">
          <h2>Erreur</h2>
          <p>{error}</p>
          {error.includes('connecté') && (
            <button 
              className="login-button"
              onClick={() => navigate('/profil')}
            >
              Se connecter
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="my-list-page">
      <MainNavigation />
      
      <div className="my-list-content">
        <header className="my-list-header">
          <h1 className="my-list-title">Ma Liste</h1>
          
          <div className="my-list-tabs">
            <button 
              className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              Tous
            </button>
            <button 
              className={`tab-button ${activeTab === 'drama' ? 'active' : ''}`}
              onClick={() => setActiveTab('drama')}
            >
              Dramas
            </button>
            <button 
              className={`tab-button ${activeTab === 'anime' ? 'active' : ''}`}
              onClick={() => setActiveTab('anime')}
            >
              Animés
            </button>
            <button 
              className={`tab-button ${activeTab === 'movie' ? 'active' : ''}`}
              onClick={() => setActiveTab('movie')}
            >
              Films
            </button>
          </div>
        </header>
        
        {/* Contenu de la liste */}
        {getFilteredList().length > 0 ? (
          <ContentGrid 
            contents={getFilteredList()} 
            showRemoveButton={true}
            onRemove={removeFromList}
          />
        ) : (
          <div className="empty-list">
            <p>Votre liste est vide.</p>
            <button 
              className="browse-button"
              onClick={() => navigate('/')}
            >
              Parcourir le catalogue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyListPage;
