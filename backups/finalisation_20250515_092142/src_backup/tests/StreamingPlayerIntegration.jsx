import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import StreamingPlayer from '../components/VideoPlayer/StreamingPlayer';
import '../componets/VideoPlayer/StreamingPlayer.css';
import '../index.css';

/**
 * Page de test pour le composant StreamingPlayer
 * Permet de tester l'intégration du lecteur vidéo avec le service de proxy
 */
function StreamingPlayerTest() {
  const [contentId, setContentId] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testRunning, setTestRunning] = useState(false);
  
  // Exemples de contenus pour les tests
  const testContents = [
    { id: 'drama123', title: 'My Love From The Star Ep.1', type: 'drama' },
    { id: 'drama456', title: 'Crash Landing on You Ep.1', type: 'drama' },
    { id: 'anime789', title: 'Attack on Titan Ep.1', type: 'anime' }
  ];
  
  const runTest = async (id) => {
    setContentId(id);
    setTestRunning(true);
    setIsLoading(true);
    
    try {
      // Test de connexion à l'API proxy
      const proxyUrl = 'https://api-media.flodrama.com';
      const response = await fetch(`${proxyUrl}/stream/${id}`);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Ajout du résultat au log de test
      setTestResults(prev => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          contentId: id,
          status: 'success',
          data: {
            streaming_url: data.streaming_url ? 'URL disponible' : 'URL non disponible',
            quality: data.quality || 'Non spécifiée',
            source: data.source || 'Non spécifiée',
            expires_at: data.expires_at || 'Non spécifiée'
          }
        }
      ]);
      
      setError(null);
    } catch (err) {
      console.error('Erreur de test:', err);
      
      // Ajout de l'erreur au log de test
      setTestResults(prev => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          contentId: id,
          status: 'error',
          message: err.message
        }
      ]);
      
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fonction pour effacer les logs de test
  const clearLogs = () => {
    setTestResults([]);
    setContentId('');
    setTestRunning(false);
    setError(null);
  };
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold text-center mb-8 text-pink-600">
        Test d'intégration - StreamingPlayer
      </h1>
      
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {testContents.map((content) => (
          <div 
            key={content.id} 
            className="bg-gray-800 p-4 rounded-lg shadow-md"
          >
            <h3 className="text-xl font-bold mb-2 text-white">{content.title}</h3>
            <p className="text-gray-400 mb-4">Type: {content.type}</p>
            <button
              onClick={() => runTest(content.id)}
              disabled={isLoading}
              className="bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-md w-full"
            >
              {isLoading && contentId === content.id ? 'Test en cours...' : 'Tester ce contenu'}
            </button>
          </div>
        ))}
      </div>
      
      {testRunning && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">Lecteur de test</h2>
          <div className="streaming-player-container bg-black rounded-lg overflow-hidden">
            <StreamingPlayer
              contentId={contentId}
              title={testContents.find(c => c.id === contentId)?.title || 'Contenu de test'}
              metadata={{ episodeNumber: 1 }}
              onError={(err) => console.error('Erreur du lecteur:', err)}
            />
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Logs de test</h2>
          <button
            onClick={clearLogs}
            className="bg-gray-700 hover:bg-gray-600 text-white py-1 px-3 rounded-md"
          >
            Effacer les logs
          </button>
        </div>
        
        {testResults.length === 0 ? (
          <p className="text-gray-400 italic">Aucun test effectué</p>
        ) : (
          <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
            {testResults.map((result, index) => (
              <div 
                key={index} 
                className={`mb-4 p-3 rounded-md ${
                  result.status === 'success' ? 'bg-green-900/30' : 'bg-red-900/30'
                }`}
              >
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400 text-sm">{result.timestamp}</span>
                  <span className={`px-2 py-1 rounded-md text-xs ${
                    result.status === 'success' ? 'bg-green-700 text-white' : 'bg-red-700 text-white'
                  }`}>
                    {result.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-white font-bold mb-2">Content ID: {result.contentId}</p>
                
                {result.status === 'success' ? (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-400">URL de streaming:</div>
                    <div className="text-white">{result.data.streaming_url}</div>
                    
                    <div className="text-gray-400">Qualité:</div>
                    <div className="text-white">{result.data.quality}</div>
                    
                    <div className="text-gray-400">Source:</div>
                    <div className="text-white">{result.data.source}</div>
                    
                    <div className="text-gray-400">Expiration:</div>
                    <div className="text-white">{result.data.expires_at}</div>
                  </div>
                ) : (
                  <p className="text-red-400">{result.message}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Rendu du composant de test
const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <StreamingPlayerTest />
  </React.StrictMode>
);

export default StreamingPlayerTest;
