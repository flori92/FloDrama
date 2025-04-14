/**
 * Composant d'insights utilisateurs pour le système de recommandations FloDrama
 * Analyse le comportement des utilisateurs et leurs interactions avec le système
 */

import React, { useState, useEffect } from 'react';
import { 
  UserIcon, 
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ClockIcon,
  FilmIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

// Données fictives pour la démo
const DEMO_USERS = [
  {
    id: 'user-1',
    username: 'cinephile92',
    registeredSince: '2023-01-15',
    lastActive: '2023-05-22T14:32:00',
    watchCount: 128,
    favoriteGenres: ['romance', 'comedy'],
    recommendationStats: {
      clickThroughRate: 0.32,
      completionRate: 0.78,
      averageRating: 4.2
    }
  },
  {
    id: 'user-2',
    username: 'dramaQueen',
    registeredSince: '2022-11-03',
    lastActive: '2023-05-21T20:15:00',
    watchCount: 256,
    favoriteGenres: ['drama', 'thriller', 'historical'],
    recommendationStats: {
      clickThroughRate: 0.41,
      completionRate: 0.85,
      averageRating: 4.7
    }
  },
  {
    id: 'user-3',
    username: 'k_drama_fan',
    registeredSince: '2023-03-22',
    lastActive: '2023-05-22T09:45:00',
    watchCount: 64,
    favoriteGenres: ['romance', 'slice_of_life'],
    recommendationStats: {
      clickThroughRate: 0.28,
      completionRate: 0.65,
      averageRating: 3.9
    }
  },
  {
    id: 'user-4',
    username: 'anime_lover',
    registeredSince: '2022-08-17',
    lastActive: '2023-05-20T22:10:00',
    watchCount: 312,
    favoriteGenres: ['fantasy', 'action', 'sci_fi'],
    recommendationStats: {
      clickThroughRate: 0.38,
      completionRate: 0.72,
      averageRating: 4.5
    }
  },
  {
    id: 'user-5',
    username: 'movie_buff',
    registeredSince: '2023-02-05',
    lastActive: '2023-05-19T18:30:00',
    watchCount: 87,
    favoriteGenres: ['thriller', 'crime', 'mystery'],
    recommendationStats: {
      clickThroughRate: 0.25,
      completionRate: 0.68,
      averageRating: 4.0
    }
  }
];

// Données fictives pour les insights utilisateur
const DEMO_USER_INSIGHTS = {
  'user-1': {
    behaviorInsights: {
      genrePreferences: {
        preferredGenres: ['romance', 'comedy', 'slice_of_life'],
        recentPreferredGenres: ['comedy', 'slice_of_life']
      },
      viewingHabits: {
        totalWatched: 128,
        inProgressCount: 3,
        completionRate: 0.78,
        multitasker: false,
        serialWatcher: true,
        prefersSeries: true,
        prefersMovies: false,
        seriesCompletionRate: 0.85,
        watchesSimilarContent: true
      },
      interactionPatterns: {
        pauseFrequency: 'medium',
        seekFrequency: 'low',
        completionRate: 'high',
        sharingFrequency: 'medium',
        downloadFrequency: 'low',
        ratingFrequency: 'high'
      },
      durationPreferences: {
        averageDuration: 45,
        preferredDuration: 'medium',
        durationDistribution: {
          short: 12,
          medium: 98,
          long: 18
        }
      },
      viewingTimes: {
        preferredTimeOfDay: 'evening',
        preferredDaysOfWeek: ['friday', 'saturday', 'sunday'],
        timeDistribution: {
          morning: 5,
          forenoon: 8,
          noon: 12,
          afternoon: 15,
          evening: 65,
          night: 23
        }
      }
    },
    recentActivity: [
      {
        type: 'watch',
        contentTitle: 'Crash Landing on You',
        timestamp: '2023-05-22T14:32:00',
        duration: 65,
        completed: true
      },
      {
        type: 'recommendation_click',
        contentTitle: 'Business Proposal',
        timestamp: '2023-05-22T13:45:00',
        recommendationType: 'similar'
      },
      {
        type: 'rating',
        contentTitle: 'Crash Landing on You',
        timestamp: '2023-05-22T15:40:00',
        rating: 5
      },
      {
        type: 'watch',
        contentTitle: 'Business Proposal',
        timestamp: '2023-05-21T20:15:00',
        duration: 58,
        completed: true
      },
      {
        type: 'add_to_list',
        contentTitle: 'Itaewon Class',
        timestamp: '2023-05-21T19:30:00',
        listName: 'À regarder'
      }
    ],
    recommendationPerformance: {
      clickThroughRateByType: {
        personalized: 0.35,
        similar: 0.42,
        trending: 0.28,
        contextual: 0.32
      },
      completionRateByType: {
        personalized: 0.82,
        similar: 0.88,
        trending: 0.65,
        contextual: 0.75
      },
      averageRatingByType: {
        personalized: 4.2,
        similar: 4.5,
        trending: 3.8,
        contextual: 4.0
      }
    }
  }
};

const UserInsights = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userInsights, setUserInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Charger les utilisateurs
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      
      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Dans une implémentation réelle, nous chargerions les données depuis l'API
      setUsers(DEMO_USERS);
      setIsLoading(false);
    };
    
    loadUsers();
  }, []);
  
  // Filtrer les utilisateurs en fonction de la recherche
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Charger les insights pour un utilisateur spécifique
  const loadUserInsights = async (userId) => {
    setIsLoading(true);
    setSelectedUser(userId);
    
    // Simuler un délai de chargement
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Dans une implémentation réelle, nous chargerions les données depuis l'API
    setUserInsights(DEMO_USER_INSIGHTS[userId] || null);
    setIsLoading(false);
  };
  
  // Formater une date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Formater une date avec l'heure
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Formater un pourcentage
  const formatPercent = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };
  
  // Rendu d'une barre de progression
  const ProgressBar = ({ value, maxValue = 1, color = 'bg-gradient-to-r from-[#3b82f6] to-[#d946ef]' }) => {
    const percentage = Math.min((value / maxValue) * 100, 100);
    
    return (
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };
  
  // Obtenir l'icône pour un type d'activité
  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'watch':
        return <FilmIcon className="h-5 w-5 text-blue-500" />;
      case 'recommendation_click':
        return <ChartBarIcon className="h-5 w-5 text-green-500" />;
      case 'rating':
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>;
      case 'add_to_list':
        return <HeartIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="bg-gray-800 bg-opacity-50 rounded-lg shadow-lg overflow-hidden">
      {/* En-tête */}
      <div className="p-4 sm:p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <UserIcon className="h-6 w-6 text-[#d946ef] mr-2" />
            <h2 className="text-xl font-bold text-white">Insights utilisateurs</h2>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 bg-opacity-50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d946ef] focus:border-transparent"
            />
          </div>
        </div>
      </div>
      
      {/* Contenu principal */}
      <div className="flex flex-col md:flex-row">
        {/* Liste des utilisateurs */}
        <div className="w-full md:w-1/3 border-r border-gray-700">
          <div className="p-4 sm:p-6">
            <h3 className="text-lg font-medium text-white mb-4">Utilisateurs</h3>
            
            {isLoading && !selectedUser ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#d946ef]"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    Aucun utilisateur trouvé pour "{searchQuery}"
                  </p>
                ) : (
                  filteredUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => loadUserInsights(user.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedUser === user.id
                          ? 'bg-gradient-to-r from-[#3b82f6] to-[#d946ef] text-white'
                          : 'hover:bg-gray-700 text-gray-300'
                      }`}
                    >
                      <div className="font-medium">{user.username}</div>
                      <div className="text-xs mt-1 opacity-80">
                        {user.watchCount} contenus regardés • Inscrit le {formatDate(user.registeredSince)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Détails de l'utilisateur sélectionné */}
        <div className="w-full md:w-2/3">
          {!selectedUser ? (
            <div className="flex flex-col items-center justify-center h-96 p-4 sm:p-6">
              <UserIcon className="h-16 w-16 text-gray-600 mb-4" />
              <p className="text-gray-400 text-center">
                Sélectionnez un utilisateur pour voir ses insights
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d946ef]"></div>
            </div>
          ) : !userInsights ? (
            <div className="flex flex-col items-center justify-center h-96 p-4 sm:p-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-400 text-center">
                Aucune donnée disponible pour cet utilisateur
              </p>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              {/* Informations de l'utilisateur */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-2">
                  {users.find(u => u.id === selectedUser)?.username || 'Utilisateur'}
                </h3>
                <div className="text-sm text-gray-400">
                  Dernière activité: {formatDateTime(users.find(u => u.id === selectedUser)?.lastActive)}
                </div>
              </div>
              
              {/* Onglets */}
              <div className="border-b border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-8">
                  {['Comportement', 'Activité récente', 'Performance'].map((tab, index) => (
                    <button
                      key={index}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        index === 0
                          ? 'border-[#d946ef] text-[#d946ef]'
                          : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>
              
              {/* Insights de comportement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Préférences de genre */}
                <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-white mb-3">Préférences de genre</h4>
                  <div className="space-y-3">
                    {userInsights.behaviorInsights.genrePreferences.preferredGenres.map((genre, index) => (
                      <div key={index} className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-[#d946ef] mr-2"></span>
                        <span className="text-gray-300 capitalize">{genre.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Habitudes de visionnage */}
                <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-white mb-3">Habitudes de visionnage</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Taux de complétion</span>
                        <span className="text-white">{formatPercent(userInsights.behaviorInsights.viewingHabits.completionRate)}</span>
                      </div>
                      <ProgressBar value={userInsights.behaviorInsights.viewingHabits.completionRate} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Taux de complétion des séries</span>
                        <span className="text-white">{formatPercent(userInsights.behaviorInsights.viewingHabits.seriesCompletionRate)}</span>
                      </div>
                      <ProgressBar value={userInsights.behaviorInsights.viewingHabits.seriesCompletionRate} />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Type de spectateur:</span>
                      <span className="text-white">
                        {userInsights.behaviorInsights.viewingHabits.serialWatcher ? 'Séquentiel' : 'Multitâche'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Préférence:</span>
                      <span className="text-white">
                        {userInsights.behaviorInsights.viewingHabits.prefersSeries ? 'Séries' : userInsights.behaviorInsights.viewingHabits.prefersMovies ? 'Films' : 'Mixte'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Moments de visionnage */}
                <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-white mb-3">Moments de visionnage</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Moment préféré:</span>
                      <span className="text-white capitalize">
                        {userInsights.behaviorInsights.viewingTimes.preferredTimeOfDay}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Jours préférés:</span>
                      <span className="text-white capitalize">
                        {userInsights.behaviorInsights.viewingTimes.preferredDaysOfWeek.slice(0, 2).join(', ')}
                      </span>
                    </div>
                    
                    <div className="mt-2">
                      <div className="text-xs text-gray-400 mb-2">Distribution horaire</div>
                      <div className="grid grid-cols-6 gap-1 h-20">
                        {Object.entries(userInsights.behaviorInsights.viewingTimes.timeDistribution).map(([time, count], index) => {
                          const maxCount = Math.max(...Object.values(userInsights.behaviorInsights.viewingTimes.timeDistribution));
                          const height = (count / maxCount) * 100;
                          
                          return (
                            <div key={index} className="flex flex-col items-center justify-end">
                              <div 
                                className={`w-full bg-gradient-to-t from-[#3b82f6] to-[#d946ef] rounded-t-sm`}
                                style={{ height: `${height}%` }}
                              ></div>
                              <div className="text-xs text-gray-500 mt-1 capitalize">{time.substring(0, 1)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Préférences de durée */}
                <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-white mb-3">Préférences de durée</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Durée moyenne:</span>
                      <span className="text-white">
                        {userInsights.behaviorInsights.durationPreferences.averageDuration} min
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Durée préférée:</span>
                      <span className="text-white capitalize">
                        {userInsights.behaviorInsights.durationPreferences.preferredDuration}
                      </span>
                    </div>
                    
                    <div className="mt-2">
                      <div className="text-xs text-gray-400 mb-2">Distribution des durées</div>
                      <div className="space-y-2">
                        {Object.entries(userInsights.behaviorInsights.durationPreferences.durationDistribution).map(([duration, count], index) => {
                          const total = Object.values(userInsights.behaviorInsights.durationPreferences.durationDistribution).reduce((sum, val) => sum + val, 0);
                          const percentage = (count / total) * 100;
                          
                          return (
                            <div key={index}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-400 capitalize">{duration}</span>
                                <span className="text-white">{percentage.toFixed(1)}%</span>
                              </div>
                              <ProgressBar value={count} maxValue={total} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Activité récente */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-white mb-4">Activité récente</h3>
                <div className="bg-gray-900 bg-opacity-50 rounded-lg p-4">
                  <div className="space-y-4">
                    {userInsights.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-white">{activity.contentTitle}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {activity.type === 'watch' && `Regardé pendant ${activity.duration} min`}
                            {activity.type === 'recommendation_click' && `Recommandation ${activity.recommendationType}`}
                            {activity.type === 'rating' && `Noté ${activity.rating}/5`}
                            {activity.type === 'add_to_list' && `Ajouté à "${activity.listName}"`}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDateTime(activity.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserInsights;
