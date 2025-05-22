/**
 * Page Test de Connexion
 * Permet aux utilisateurs de tester la qualité de leur connexion internet
 */

import React, { useState, useEffect } from 'react';
import FooterPage from './FooterPage';

const TestConnexion = () => {
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [downloadSpeed, setDownloadSpeed] = useState(null);
  const [latency, setLatency] = useState(null);
  const [qualityLevel, setQualityLevel] = useState(null);
  const [recommendedQuality, setRecommendedQuality] = useState(null);

  // Fonction pour démarrer le test de connexion
  const startTest = () => {
    setTestStarted(true);
    setTestCompleted(false);
    setDownloadSpeed(null);
    setLatency(null);
    setQualityLevel(null);
    setRecommendedQuality(null);

    // Simulation du test de connexion (dans une application réelle, ceci serait remplacé par un vrai test)
    setTimeout(() => {
      // Génération de valeurs aléatoires pour la démo
      const speed = Math.floor(Math.random() * 100) + 10; // 10-110 Mbps
      const ping = Math.floor(Math.random() * 100) + 5; // 5-105 ms

      setDownloadSpeed(speed);
      setLatency(ping);

      // Détermination de la qualité en fonction de la vitesse
      if (speed >= 25) {
        setQualityLevel('Excellente');
        setRecommendedQuality('4K (2160p)');
      } else if (speed >= 15) {
        setQualityLevel('Bonne');
        setRecommendedQuality('Full HD (1080p)');
      } else if (speed >= 5) {
        setQualityLevel('Moyenne');
        setRecommendedQuality('HD (720p)');
      } else {
        setQualityLevel('Faible');
        setRecommendedQuality('SD (480p)');
      }

      setTestCompleted(true);
    }, 3000); // Simulation de 3 secondes
  };

  return (
    <FooterPage title="Test de Connexion">
      <section className="mb-8">
        <p className="mb-6">
          Utilisez cet outil pour tester la qualité de votre connexion internet et déterminer la meilleure qualité vidéo 
          pour votre expérience de visionnage sur FloDrama.
        </p>
        
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Comment ça fonctionne ?</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Cliquez sur le bouton "Démarrer le test"</li>
            <li>Attendez quelques secondes pendant que nous analysons votre connexion</li>
            <li>Consultez les résultats pour connaître la qualité vidéo recommandée</li>
          </ol>
        </div>

        <div className="flex justify-center mb-8">
          <button
            onClick={startTest}
            disabled={testStarted && !testCompleted}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              testStarted && !testCompleted
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-flodrama-fuchsia text-white hover:bg-flodrama-fuchsia/80'
            }`}
          >
            {testStarted && !testCompleted ? 'Test en cours...' : 'Démarrer le test'}
          </button>
        </div>

        {testStarted && !testCompleted && (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-16 h-16 border-4 border-flodrama-fuchsia border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-white">Analyse de votre connexion en cours...</p>
          </div>
        )}

        {testCompleted && (
          <div className="bg-black bg-opacity-40 rounded-lg p-6 border border-flodrama-fuchsia/30">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Résultats du Test</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-gray-400 mb-1">Vitesse de téléchargement</p>
                <p className="text-2xl font-bold text-white">{downloadSpeed} <span className="text-sm font-normal">Mbps</span></p>
              </div>
              
              <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-gray-400 mb-1">Latence (ping)</p>
                <p className="text-2xl font-bold text-white">{latency} <span className="text-sm font-normal">ms</span></p>
              </div>
            </div>
            
            <div className="bg-gray-900 p-4 rounded-lg mb-6">
              <p className="text-gray-400 mb-1">Qualité de connexion</p>
              <p className={`text-2xl font-bold ${
                qualityLevel === 'Excellente' ? 'text-green-400' :
                qualityLevel === 'Bonne' ? 'text-blue-400' :
                qualityLevel === 'Moyenne' ? 'text-yellow-400' : 'text-red-400'
              }`}>{qualityLevel}</p>
            </div>
            
            <div className="bg-flodrama-fuchsia/20 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-2">Recommandation</h3>
              <p className="text-gray-200 mb-4">
                Avec votre connexion actuelle, nous vous recommandons de regarder les contenus en :
              </p>
              <p className="text-2xl font-bold text-flodrama-fuchsia text-center">{recommendedQuality}</p>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Conseils pour améliorer votre connexion</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Rapprochez-vous de votre routeur Wi-Fi ou utilisez une connexion filaire</li>
          <li>Réduisez le nombre d'appareils connectés simultanément à votre réseau</li>
          <li>Fermez les applications consommant beaucoup de bande passante</li>
          <li>Redémarrez votre routeur si vous constatez des problèmes de connexion</li>
          <li>Contactez votre fournisseur d'accès internet si les problèmes persistent</li>
        </ul>
      </section>
    </FooterPage>
  );
};

export default TestConnexion;
