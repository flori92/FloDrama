/**
 * Page Comment Regarder
 * Guide d'utilisation de FloDrama pour les utilisateurs
 */

import React from 'react';
import FooterPage from './FooterPage';

const CommentRegarder = () => {
  return (
    <FooterPage title="Comment Regarder sur FloDrama">
      <section className="mb-8">
        <p className="mb-6">
          Bienvenue sur FloDrama ! Ce guide vous explique comment profiter pleinement de notre plateforme 
          et accéder à tous nos contenus sur différents appareils.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Sur ordinateur</h2>
        
        <div className="bg-gray-900 bg-opacity-60 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-medium text-white mb-3">Configuration requise</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Navigateurs recommandés</strong> : Chrome, Firefox, Safari, Edge (dernières versions)</li>
            <li><strong>Connexion internet</strong> : 5 Mbps minimum (15+ Mbps recommandé pour la HD)</li>
            <li><strong>Système d'exploitation</strong> : Windows 10+, macOS 10.13+, Linux (distributions récentes)</li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="bg-flodrama-fuchsia text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0 mt-1">1</div>
            <div>
              <h4 className="text-lg font-medium text-white">Créez votre compte ou connectez-vous</h4>
              <p className="text-gray-300">
                Rendez-vous sur la page d'accueil et cliquez sur "S'inscrire" ou "Se connecter" en haut à droite.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-flodrama-fuchsia text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0 mt-1">2</div>
            <div>
              <h4 className="text-lg font-medium text-white">Parcourez notre catalogue</h4>
              <p className="text-gray-300">
                Explorez les différentes catégories depuis la barre de navigation ou utilisez la fonction de recherche 
                pour trouver un contenu spécifique.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-flodrama-fuchsia text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0 mt-1">3</div>
            <div>
              <h4 className="text-lg font-medium text-white">Lancez la lecture</h4>
              <p className="text-gray-300">
                Cliquez sur l'affiche du film ou de la série qui vous intéresse, puis sur le bouton de lecture. 
                La vidéo se lancera automatiquement.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-flodrama-fuchsia text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0 mt-1">4</div>
            <div>
              <h4 className="text-lg font-medium text-white">Personnalisez votre expérience</h4>
              <p className="text-gray-300">
                Utilisez les contrôles du lecteur pour ajuster la qualité vidéo, activer les sous-titres, 
                ou passer en mode plein écran.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Sur smartphone et tablette</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-900 bg-opacity-60 rounded-lg p-6">
            <h3 className="text-xl font-medium text-white mb-3">iOS (iPhone/iPad)</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>iOS 14.0 ou version ultérieure</li>
              <li>Application FloDrama disponible sur l'App Store</li>
              <li>Ou utilisez Safari pour accéder au site web</li>
            </ul>
          </div>
          
          <div className="bg-gray-900 bg-opacity-60 rounded-lg p-6">
            <h3 className="text-xl font-medium text-white mb-3">Android</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Android 7.0 ou version ultérieure</li>
              <li>Application FloDrama disponible sur Google Play</li>
              <li>Ou utilisez Chrome pour accéder au site web</li>
            </ul>
          </div>
        </div>
        
        <p className="mb-6">
          Pour une expérience optimale sur mobile :
        </p>
        
        <ul className="list-disc pl-6 space-y-2 mb-6">
          <li>Téléchargez notre application officielle pour une meilleure performance</li>
          <li>Connectez-vous au Wi-Fi pour éviter une consommation excessive de données mobiles</li>
          <li>Activez la rotation automatique de l'écran pour profiter du mode paysage</li>
          <li>Utilisez des écouteurs pour une meilleure expérience audio</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Sur Smart TV et appareils de streaming</h2>
        
        <p className="mb-6">
          FloDrama est disponible sur plusieurs plateformes de télévision connectée :
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900 bg-opacity-60 rounded-lg p-4 text-center">
            <h3 className="text-lg font-medium text-white mb-2">Android TV</h3>
            <p className="text-sm text-gray-300">Version 8.0 ou ultérieure</p>
          </div>
          
          <div className="bg-gray-900 bg-opacity-60 rounded-lg p-4 text-center">
            <h3 className="text-lg font-medium text-white mb-2">Apple TV</h3>
            <p className="text-sm text-gray-300">tvOS 14.0 ou ultérieure</p>
          </div>
          
          <div className="bg-gray-900 bg-opacity-60 rounded-lg p-4 text-center">
            <h3 className="text-lg font-medium text-white mb-2">Amazon Fire TV</h3>
            <p className="text-sm text-gray-300">Fire OS 6 ou ultérieure</p>
          </div>
          
          <div className="bg-gray-900 bg-opacity-60 rounded-lg p-4 text-center">
            <h3 className="text-lg font-medium text-white mb-2">Roku</h3>
            <p className="text-sm text-gray-300">Roku OS 9.4 ou ultérieure</p>
          </div>
          
          <div className="bg-gray-900 bg-opacity-60 rounded-lg p-4 text-center">
            <h3 className="text-lg font-medium text-white mb-2">Samsung Smart TV</h3>
            <p className="text-sm text-gray-300">Modèles 2018 ou plus récents</p>
          </div>
          
          <div className="bg-gray-900 bg-opacity-60 rounded-lg p-4 text-center">
            <h3 className="text-lg font-medium text-white mb-2">LG Smart TV</h3>
            <p className="text-sm text-gray-300">WebOS 4.0 ou ultérieure</p>
          </div>
        </div>
        
        <p>
          Pour installer FloDrama sur votre Smart TV, recherchez "FloDrama" dans la boutique d'applications 
          de votre appareil et suivez les instructions d'installation.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Résolution des problèmes courants</h2>
        
        <div className="space-y-6">
          <div className="bg-gray-900 bg-opacity-60 rounded-lg p-6">
            <h3 className="text-xl font-medium text-white mb-3">Problèmes de lecture vidéo</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Vérifiez votre connexion internet avec notre <a href="/footer/test-connexion" className="text-flodrama-fuchsia hover:underline">outil de test</a></li>
              <li>Réduisez la qualité vidéo si votre connexion est lente</li>
              <li>Fermez les autres applications ou onglets consommant de la bande passante</li>
              <li>Redémarrez votre appareil et votre routeur</li>
            </ul>
          </div>
          
          <div className="bg-gray-900 bg-opacity-60 rounded-lg p-6">
            <h3 className="text-xl font-medium text-white mb-3">Problèmes de compte</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Utilisez la fonction "Mot de passe oublié" si vous ne pouvez pas vous connecter</li>
              <li>Vérifiez que votre abonnement est actif dans les paramètres de votre compte</li>
              <li>Déconnectez-vous puis reconnectez-vous si vous rencontrez des problèmes</li>
              <li>Effacez le cache et les cookies de votre navigateur</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Besoin d'aide supplémentaire ?</h2>
        <p className="mb-4">
          Si vous rencontrez toujours des difficultés, n'hésitez pas à consulter notre 
          <a href="/footer/faq" className="text-flodrama-fuchsia hover:underline mx-1">FAQ</a> 
          ou à contacter notre équipe de support via notre 
          <a href="/footer/centre-aide" className="text-flodrama-fuchsia hover:underline mx-1">Centre d'aide</a>.
        </p>
        <p>
          Notre équipe est disponible 7j/7 pour vous aider à profiter pleinement de votre expérience FloDrama.
        </p>
      </section>
    </FooterPage>
  );
};

export default CommentRegarder;
