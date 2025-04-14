import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Star, Calendar, Clock, ChevronLeft, Share, Plus, Check } from 'lucide-react';
import { useMetadata } from '../hooks/useMetadata';
import { useWatchlist } from '../hooks/useWatchlist';
import { getAssetUrl } from '../api/metadata';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import AppleStyleCard from '../components/cards/AppleStyleCard';
import MotionWrapper from '../components/animations/MotionWrapper';

/**
 * Page de détail pour un contenu spécifique (drama, film, etc.)
 */
const DetailPage = () => {
  const { type, id } = useParams();
  const { getItemById, getSectionItems, isLoading, error } = useMetadata();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  
  const [item, setItem] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isInList, setIsInList] = useState(false);
  const [animateHeart, setAnimateHeart] = useState(false);
  
  // Charger les données du contenu
  useEffect(() => {
    if (isLoading || error) return;
    
    const contentItem = getItemById(id);
    if (contentItem) {
      setItem(contentItem);
      
      // Récupérer les recommandations
      const recommendedItems = getSectionItems('recommended').items;
      if (recommendedItems && recommendedItems.length > 0) {
        // Filtrer pour exclure l'élément actuel et limiter à 6 recommandations
        const filteredRecs = recommendedItems
          .filter(rec => rec.id !== id)
          .slice(0, 6);
        setRecommendations(filteredRecs);
      }
    }
  }, [id, isLoading, error, getItemById, getSectionItems]);
  
  // Vérifier si l'élément est dans la liste au chargement
  useEffect(() => {
    if (item && item.id) {
      setIsInList(isInWatchlist(item.id));
    }
  }, [item, isInWatchlist]);
  
  // Gérer l'ajout/suppression de la liste
  const handleWatchlistToggle = () => {
    if (item) {
      const added = toggleWatchlist(item);
      setIsInList(added);
      
      // Animation du cœur
      setAnimateHeart(true);
      setTimeout(() => setAnimateHeart(false), 500);
    }
  };
  
  // Afficher un état de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-white">Chargement...</p>
        </div>
      </div>
    );
  }
  
  // Afficher une erreur si nécessaire
  if (error || !item) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Contenu non trouvé</h1>
          <p className="text-gray-400 mb-6">{error || "Ce contenu n'existe pas ou a été supprimé."}</p>
          <Link 
            to="/"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }
  
  // Obtenir la durée formatée
  const getDuration = () => {
    if (item.duration) return item.duration;
    if (item.episodes) return `${item.episodes} épisodes`;
    return '';
  };
  
  // Animation pour les sections
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      
      {/* Bannière du contenu */}
      <div className="relative h-screen-80">
        <motion.div 
          className="absolute inset-0"
          initial={{ scale: 1.05, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 6, ease: "easeOut" }}
        >
          <img 
            src={getAssetUrl(item.banner || item.poster)} 
            alt={item.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
        </motion.div>
        
        {/* Bouton retour */}
        <div className="absolute top-24 left-6 z-10">
          <Link to="/" className="flex items-center text-white hover:text-red-500 transition-colors">
            <ChevronLeft size={20} className="mr-1" />
            <span>Retour</span>
          </Link>
        </div>
        
        {/* Contenu principal */}
        <div className="relative container mx-auto px-6 flex flex-col md:flex-row items-end h-full pb-12">
          {/* Poster */}
          <MotionWrapper animation="scale" delay={0.2}>
            <div className="w-48 h-72 md:w-64 md:h-96 rounded-lg overflow-hidden shadow-2xl mb-6 md:mb-0 md:mr-8 flex-shrink-0">
              <img 
                src={getAssetUrl(item.poster)} 
                alt={item.title} 
                className="w-full h-full object-cover"
              />
            </div>
          </MotionWrapper>
          
          {/* Informations */}
          <motion.div 
            className="flex-grow"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.h1 
              className="text-4xl md:text-5xl font-bold mb-3"
              variants={itemVariants}
            >
              {item.title}
            </motion.h1>
            
            {/* Métadonnées */}
            <motion.div 
              className="flex flex-wrap items-center space-x-4 mb-4"
              variants={itemVariants}
            >
              {item.rating && (
                <span className="bg-red-600 px-2 py-1 rounded text-sm text-white flex items-center">
                  <Star size={14} className="mr-1" />
                  {item.rating}
                </span>
              )}
              
              <span className="text-white flex items-center">
                <Calendar size={14} className="mr-1" />
                {item.year}
              </span>
              
              {getDuration() && (
                <span className="text-white flex items-center">
                  <Clock size={14} className="mr-1" />
                  {getDuration()}
                </span>
              )}
              
              {item.categories && item.categories.length > 0 && (
                <span className="text-gray-300">
                  {item.categories.join(' • ')}
                </span>
              )}
            </motion.div>
            
            {/* Actions */}
            <motion.div 
              className="flex space-x-4 mb-6"
              variants={itemVariants}
            >
              <Link 
                to={`/${type}/${id}/watch`}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium flex items-center"
              >
                <Play size={18} className="mr-2" />
                Regarder
              </Link>
              
              <button 
                className={`${isInList ? 'bg-red-600' : 'bg-gray-800 hover:bg-gray-700'} text-white px-4 py-2 rounded flex items-center transition-colors`}
                onClick={handleWatchlistToggle}
              >
                <motion.div
                  animate={animateHeart ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {isInList ? (
                    <Check size={18} className="mr-2" />
                  ) : (
                    <Plus size={18} className="mr-2" />
                  )}
                </motion.div>
                {isInList ? 'Dans ma liste' : 'Ajouter à ma liste'}
              </button>
              
              <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center">
                <Share size={18} className="mr-2" />
                Partager
              </button>
            </motion.div>
            
            {/* Description */}
            <motion.p 
              className="text-gray-300 mb-6 max-w-3xl"
              variants={itemVariants}
            >
              {item.description}
            </motion.p>
            
            {/* Informations supplémentaires */}
            <motion.div 
              className="flex flex-wrap text-sm"
              variants={itemVariants}
            >
              {item.director && (
                <div className="mr-8 mb-2">
                  <span className="text-gray-400">Réalisateur: </span>
                  <span className="text-white">{item.director}</span>
                </div>
              )}
              
              {item.country && (
                <div className="mr-8 mb-2">
                  <span className="text-gray-400">Pays: </span>
                  <span className="text-white">{item.country}</span>
                </div>
              )}
              
              {item.language && (
                <div className="mr-8 mb-2">
                  <span className="text-gray-400">Langue: </span>
                  <span className="text-white">{item.language}</span>
                </div>
              )}
              
              {item.network && (
                <div className="mr-8 mb-2">
                  <span className="text-gray-400">Réseau: </span>
                  <span className="text-white">{item.network}</span>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
      
      {/* Contenu détaillé */}
      <div className="container mx-auto px-6 py-12">
        {/* Onglets */}
        <div className="border-b border-gray-800 mb-8">
          <div className="flex space-x-8">
            <button 
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === 'overview' 
                  ? 'text-red-500 border-b-2 border-red-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Aperçu
            </button>
            
            {item.episodes && (
              <button 
                className={`pb-4 px-2 font-medium transition-colors ${
                  activeTab === 'episodes' 
                    ? 'text-red-500 border-b-2 border-red-500' 
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('episodes')}
              >
                Épisodes
              </button>
            )}
            
            <button 
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === 'more' 
                  ? 'text-red-500 border-b-2 border-red-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('more')}
            >
              Plus d'infos
            </button>
          </div>
        </div>
        
        {/* Contenu des onglets */}
        <div className="mb-12">
          {activeTab === 'overview' && (
            <MotionWrapper animation="fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Synopsis */}
                <div className="md:col-span-2">
                  <h2 className="text-2xl font-bold mb-4">Synopsis</h2>
                  <p className="text-gray-300">{item.description}</p>
                  
                  {/* Casting */}
                  {item.cast && item.cast.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-xl font-bold mb-4">Casting</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {item.cast.map((actor, index) => (
                          <div key={index} className="flex items-center">
                            <div className="w-12 h-12 rounded-full overflow-hidden mr-3">
                              <img 
                                src={actor.image ? getAssetUrl(actor.image) : 'https://via.placeholder.com/100'} 
                                alt={actor.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium">{actor.name}</p>
                              <p className="text-sm text-gray-400">{actor.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Détails */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">Détails</h2>
                  <div className="bg-gray-800 rounded-lg p-6">
                    <div className="mb-4">
                      <p className="text-gray-400 mb-1">Titre original</p>
                      <p>{item.original_title || item.title}</p>
                    </div>
                    
                    {item.status && (
                      <div className="mb-4">
                        <p className="text-gray-400 mb-1">Statut</p>
                        <p>{item.status}</p>
                      </div>
                    )}
                    
                    {item.release_date && (
                      <div className="mb-4">
                        <p className="text-gray-400 mb-1">Date de sortie</p>
                        <p>{item.release_date}</p>
                      </div>
                    )}
                    
                    {item.genres && item.genres.length > 0 && (
                      <div className="mb-4">
                        <p className="text-gray-400 mb-1">Genres</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {item.genres.map((genre, index) => (
                            <span 
                              key={index}
                              className="bg-gray-700 text-xs px-2 py-1 rounded"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {item.tags && item.tags.length > 0 && (
                      <div>
                        <p className="text-gray-400 mb-1">Tags</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {item.tags.map((tag, index) => (
                            <span 
                              key={index}
                              className="bg-gray-700 text-xs px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </MotionWrapper>
          )}
          
          {activeTab === 'episodes' && item.episodes && (
            <MotionWrapper animation="fadeIn">
              <h2 className="text-2xl font-bold mb-6">Épisodes</h2>
              
              <div className="space-y-4">
                {Array.from({ length: item.episodes }, (_, i) => (
                  <div 
                    key={i}
                    className="bg-gray-800 rounded-lg overflow-hidden flex flex-col md:flex-row"
                  >
                    <div className="md:w-48 h-32 relative">
                      <img 
                        src={getAssetUrl(item.poster)} 
                        alt={`Épisode ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button className="bg-red-600 rounded-full p-3 text-white">
                          <Play size={24} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4 flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">Épisode {i + 1}</h3>
                          <p className="text-gray-400 text-sm">
                            {item.episode_titles ? item.episode_titles[i] : `${item.title} - Épisode ${i + 1}`}
                          </p>
                        </div>
                        <span className="text-gray-400 text-sm">
                          {item.episode_duration || '45 min'}
                        </span>
                      </div>
                      
                      <p className="mt-2 text-gray-300 text-sm">
                        {item.episode_descriptions ? item.episode_descriptions[i] : 'Aucune description disponible pour cet épisode.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </MotionWrapper>
          )}
          
          {activeTab === 'more' && (
            <MotionWrapper animation="fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Informations supplémentaires */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">Informations supplémentaires</h2>
                  
                  <div className="bg-gray-800 rounded-lg p-6">
                    {item.awards && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium mb-2">Récompenses</h3>
                        <p className="text-gray-300">{item.awards}</p>
                      </div>
                    )}
                    
                    {item.production && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium mb-2">Production</h3>
                        <p className="text-gray-300">{item.production}</p>
                      </div>
                    )}
                    
                    {item.writer && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium mb-2">Scénariste</h3>
                        <p className="text-gray-300">{item.writer}</p>
                      </div>
                    )}
                    
                    {item.music && (
                      <div>
                        <h3 className="text-lg font-medium mb-2">Musique</h3>
                        <p className="text-gray-300">{item.music}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Galerie d'images */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">Galerie</h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {item.gallery ? (
                      item.gallery.map((image, index) => (
                        <div key={index} className="rounded-lg overflow-hidden aspect-video">
                          <img 
                            src={getAssetUrl(image)} 
                            alt={`${item.title} - ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))
                    ) : (
                      // Images par défaut si pas de galerie
                      <>
                        <div className="rounded-lg overflow-hidden aspect-video">
                          <img 
                            src={getAssetUrl(item.poster)} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="rounded-lg overflow-hidden aspect-video">
                          <img 
                            src={getAssetUrl(item.banner || item.poster)} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </MotionWrapper>
          )}
        </div>
        
        {/* Recommandations */}
        {recommendations.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Vous pourriez aussi aimer</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {recommendations.map((rec, index) => (
                <AppleStyleCard 
                  key={rec.id} 
                  item={rec} 
                  index={index}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default DetailPage;
