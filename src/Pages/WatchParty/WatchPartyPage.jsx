/**
 * Page principale WatchParty
 * Permet de créer ou rejoindre un salon de visionnage
 */

import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { AuthContext } from '../../Context/UserContext';
import { useWatchParty } from '../../Context/WatchPartyContext';
import Navbar from '../../componets/Header/Navbar';
import Footer from '../../componets/Footer/Footer';
import WatchPartyPlayer from './WatchPartyPlayer';
import WatchPartyChat from './WatchPartyChat';
import WatchPartyParticipants from './WatchPartyParticipants';

const WatchPartyPage = () => {
  const { User } = useContext(AuthContext);
  const { partyId, participants, playerState, createParty, joinParty, leaveParty } = useWatchParty();
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  
  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    if (!User) {
      navigate('/signin', { state: { from: location.pathname } });
    }
  }, [User, navigate, location]);
  
  // Rejoindre automatiquement une WatchParty si l'ID est dans l'URL
  useEffect(() => {
    if (params.partyId && !partyId) {
      setJoinCode(params.partyId);
      handleJoinParty();
    }
  }, [params.partyId, partyId]);
  
  // Créer automatiquement une WatchParty si des données de contenu sont passées
  useEffect(() => {
    if (location.state?.contentId && !partyId && !isCreating && !isJoining) {
      handleCreateParty();
    }
  }, [location.state, partyId, isCreating, isJoining]);
  
  // Gérer la copie du code d'invitation
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);
  
  // Créer une nouvelle WatchParty
  const handleCreateParty = () => {
    if (!User) {
      navigate('/signin', { state: { from: location.pathname } });
      return;
    }
    
    setIsCreating(true);
    setError('');
    
    try {
      const contentId = location.state?.contentId || '';
      const contentTitle = location.state?.contentTitle || 'Film sans titre';
      const contentPoster = location.state?.contentPoster || '';
      
      if (!contentId) {
        setError('Aucun contenu sélectionné pour la WatchParty');
        setIsCreating(false);
        return;
      }
      
      const newPartyId = createParty(contentId, contentTitle, contentPoster);
      
      if (newPartyId) {
        // Mettre à jour l'URL avec l'ID de la WatchParty
        navigate(`/watch-party/${newPartyId}`, { 
          replace: true,
          state: location.state
        });
      } else {
        setError('Impossible de créer la WatchParty. Veuillez réessayer.');
      }
    } catch (err) {
      console.error('Erreur lors de la création de la WatchParty:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsCreating(false);
    }
  };
  
  // Rejoindre une WatchParty existante
  const handleJoinParty = () => {
    if (!User) {
      navigate('/signin', { state: { from: location.pathname } });
      return;
    }
    
    if (!joinCode.trim()) {
      setError('Veuillez entrer un code d\'invitation valide');
      return;
    }
    
    setIsJoining(true);
    setError('');
    
    try {
      const success = joinParty(joinCode.trim());
      
      if (success) {
        // Mettre à jour l'URL avec l'ID de la WatchParty
        navigate(`/watch-party/${joinCode.trim()}`, { replace: true });
      } else {
        setError('Impossible de rejoindre la WatchParty. Vérifiez le code d\'invitation.');
      }
    } catch (err) {
      console.error('Erreur lors de la connexion à la WatchParty:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsJoining(false);
    }
  };
  
  // Quitter la WatchParty
  const handleLeaveParty = () => {
    leaveParty();
    navigate('/home');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">WatchParty</h1>
        
        {error && (
          <div className="bg-red-900/30 text-white p-4 rounded-lg mb-6">
            <p>{error}</p>
          </div>
        )}
        
        {partyId === null ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Créer une WatchParty */}
            <div className="bg-gray-900 bg-opacity-60 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Créer une WatchParty</h2>
              <p className="text-gray-300 mb-6">
                Créez un salon de visionnage et invitez vos amis à regarder un film ou une série ensemble.
              </p>
              
              {location.state?.contentTitle ? (
                <div className="mb-6">
                  <p className="text-white mb-2">Contenu sélectionné :</p>
                  <div className="flex items-center bg-black bg-opacity-50 p-3 rounded-lg">
                    {location.state.contentPoster && (
                      <img 
                        src={location.state.contentPoster} 
                        alt={location.state.contentTitle}
                        className="w-12 h-16 object-cover rounded mr-3"
                      />
                    )}
                    <div>
                      <h3 className="text-white font-medium">{location.state.contentTitle}</h3>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-yellow-400 mb-6">
                  Aucun contenu sélectionné. Veuillez choisir un film ou une série à regarder.
                </p>
              )}
              
              <button
                onClick={handleCreateParty}
                disabled={isCreating || !location.state?.contentId}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isCreating || !location.state?.contentId
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-flodrama-fuchsia text-white hover:bg-flodrama-fuchsia/80'
                }`}
              >
                {isCreating ? 'Création en cours...' : 'Créer une WatchParty'}
              </button>
              
              {!location.state?.contentId && (
                <p className="text-gray-400 text-sm mt-2">
                  Sélectionnez d'abord un film ou une série depuis la page d'accueil.
                </p>
              )}
            </div>
            
            {/* Rejoindre une WatchParty */}
            <div className="bg-gray-900 bg-opacity-60 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Rejoindre une WatchParty</h2>
              <p className="text-gray-300 mb-6">
                Rejoignez une WatchParty existante avec le code d'invitation partagé par un ami.
              </p>
              
              <div className="mb-6">
                <label htmlFor="join-code" className="block text-white mb-2">
                  Code d'invitation
                </label>
                <input
                  id="join-code"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Entrez le code d'invitation"
                  className="w-full bg-black bg-opacity-50 text-white border border-gray-700 rounded-lg py-3 px-4 focus:outline-none focus:border-flodrama-fuchsia"
                />
              </div>
              
              <button
                onClick={handleJoinParty}
                disabled={isJoining || !joinCode.trim()}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isJoining || !joinCode.trim()
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-flodrama-fuchsia text-white hover:bg-flodrama-fuchsia/80'
                }`}
              >
                {isJoining ? 'Connexion en cours...' : 'Rejoindre la WatchParty'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-8">
            {/* En-tête de la WatchParty active */}
            <div className="bg-gray-900 bg-opacity-60 rounded-lg p-4 md:p-6 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">
                    {playerState.contentTitle || 'WatchParty'}
                  </h2>
                  <div className="flex flex-col md:flex-row items-start md:items-center mb-4 md:mb-0">
                    <div className="flex items-center mb-2 md:mb-0">
                      <span className="text-gray-300 mr-2">Code d'invitation :</span>
                      <span className="bg-black bg-opacity-50 text-white px-3 py-1 rounded font-mono">{partyId}</span>
                      <CopyToClipboard text={partyId} onCopy={() => setCopied(true)}>
                        <button className="ml-2 text-flodrama-fuchsia hover:text-flodrama-fuchsia/80 transition-colors">
                          {copied ? (
                            <span className="text-green-400">Copié !</span>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                            </svg>
                          )}
                        </button>
                      </CopyToClipboard>
                    </div>
                    <div className="flex space-x-2 ml-0 md:ml-4">
                      <CopyToClipboard text={`${window.location.origin}/watch-party/${partyId}`} onCopy={() => setCopied(true)}>
                        <button className="bg-flodrama-fuchsia hover:bg-flodrama-fuchsia/80 text-white py-1 px-3 rounded-lg text-sm transition-colors flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          Copier le lien
                        </button>
                      </CopyToClipboard>
                      <button 
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: `WatchParty - ${playerState.contentTitle || 'FloDrama'}`,
                              text: `Rejoins-moi pour regarder "${playerState.contentTitle || 'un film'}" sur FloDrama !`,
                              url: `${window.location.origin}/watch-party/${partyId}`
                            })
                            .catch(err => console.error('Erreur de partage:', err));
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-lg text-sm transition-colors flex items-center"
                        style={{ display: navigator.share ? 'flex' : 'none' }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        Partager
                      </button>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleLeaveParty}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Quitter la WatchParty
                </button>
              </div>
            </div>
            
            {/* Contenu principal de la WatchParty */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Lecteur vidéo (occupe 3 colonnes sur grand écran) */}
              <div className="lg:col-span-3">
                <WatchPartyPlayer />
              </div>
              
              {/* Panneau latéral (chat et participants) */}
              <div className="lg:col-span-1">
                <div className="bg-gray-900 bg-opacity-60 rounded-lg overflow-hidden">
                  <div className="border-b border-gray-800">
                    <WatchPartyParticipants participants={participants} />
                  </div>
                  <WatchPartyChat />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default WatchPartyPage;
