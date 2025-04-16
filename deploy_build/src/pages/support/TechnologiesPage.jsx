import React from 'react';
import { motion } from 'framer-motion';
import { Code, Server, Globe, Cpu, Cloud, Shield } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import PageTransition from '../../components/animations/PageTransition';

/**
 * Page Technologies pour FloDrama
 * Présente les technologies utilisées dans la plateforme
 */
const TechnologiesPage = () => {
  const frontendTechnologies = [
    {
      name: 'React',
      description: 'Bibliothèque JavaScript pour la construction d\'interfaces utilisateur interactives',
      features: [
        'Composants réutilisables',
        'État local et global',
        'Hooks personnalisés',
        'Rendu conditionnel',
        'Gestion des formulaires'
      ]
    },
    {
      name: 'Framer Motion',
      description: 'Bibliothèque d\'animations pour React',
      features: [
        'Transitions de page',
        'Animations d\'interface',
        'Gestes tactiles',
        'Parallaxe',
        'Animations sur événements'
      ]
    },
    {
      name: 'React Router',
      description: 'Bibliothèque de routage pour React',
      features: [
        'Navigation entre les pages',
        'Routes dynamiques',
        'Gestion de l\'historique',
        'Paramètres d\'URL',
        'Redirections'
      ]
    }
  ];
  
  const backendTechnologies = [
    {
      name: 'Bunny CDN',
      description: 'Réseau de distribution de contenu pour la diffusion vidéo',
      features: [
        'Streaming vidéo optimisé',
        'URLs signées sécurisées',
        'Détection automatique de la qualité',
        'Mécanisme de fallback',
        'Couverture mondiale'
      ]
    },
    {
      name: 'CloudFront',
      description: 'Service CDN d\'Amazon Web Services',
      features: [
        'Fallback pour les vidéos',
        'Distribution des fichiers statiques',
        'Mise en cache globale',
        'Faible latence',
        'Haute disponibilité'
      ]
    },
    {
      name: 'Système de Surveillance',
      description: 'Outil personnalisé pour surveiller l\'état de l\'application',
      features: [
        'Vérification des fichiers critiques',
        'Validation des types MIME',
        'Mesure des temps de chargement',
        'Vérification des API',
        'Génération de rapports'
      ]
    }
  ];
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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
    <PageTransition type="fade">
      <div className="bg-gray-900 text-white min-h-screen">
        <Navbar />
        
        <div className="container mx-auto px-4 py-12 pt-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-5xl mx-auto"
          >
            <div className="flex items-center justify-center mb-10">
              <div className="bg-gray-800 p-6 rounded-lg shadow-lg inline-block">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 bg-blue-500 rounded-lg opacity-20"></div>
                  <div className="absolute inset-2 bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-pink-500 text-5xl transform translate-x-1">▶</div>
                  </div>
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-center mb-2 text-pink-500">FloDrama</h1>
            <h2 className="text-2xl font-semibold text-center mb-10 text-gray-300">
              Technologies et Architecture
            </h2>
            
            <div className="mb-16">
              <div className="flex items-center mb-6">
                <Code size={24} className="text-pink-500 mr-3" />
                <h3 className="text-2xl font-semibold">Frontend (React)</h3>
              </div>
              
              <p className="text-gray-300 mb-8">
                L'interface utilisateur de FloDrama est développée avec React, offrant une expérience utilisateur fluide et réactive. 
                Voici les principales technologies frontend utilisées :
              </p>
              
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-3 gap-6"
              >
                {frontendTechnologies.map((tech, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="bg-gray-800 rounded-lg p-6"
                  >
                    <h4 className="text-xl font-medium mb-3 text-pink-500">{tech.name}</h4>
                    <p className="text-gray-400 mb-4 text-sm">{tech.description}</p>
                    <ul className="space-y-1">
                      {tech.features.map((feature, fIndex) => (
                        <li key={fIndex} className="text-gray-300 text-sm flex items-start">
                          <span className="text-pink-500 mr-2">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </motion.div>
            </div>
            
            <div className="mb-16">
              <div className="flex items-center mb-6">
                <Server size={24} className="text-pink-500 mr-3" />
                <h3 className="text-2xl font-semibold">Backend et Infrastructure</h3>
              </div>
              
              <p className="text-gray-300 mb-8">
                Notre infrastructure backend est conçue pour offrir une diffusion vidéo optimale et une haute disponibilité. 
                Voici les principales technologies utilisées côté serveur :
              </p>
              
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-3 gap-6"
              >
                {backendTechnologies.map((tech, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="bg-gray-800 rounded-lg p-6"
                  >
                    <h4 className="text-xl font-medium mb-3 text-pink-500">{tech.name}</h4>
                    <p className="text-gray-400 mb-4 text-sm">{tech.description}</p>
                    <ul className="space-y-1">
                      {tech.features.map((feature, fIndex) => (
                        <li key={fIndex} className="text-gray-300 text-sm flex items-start">
                          <span className="text-pink-500 mr-2">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </motion.div>
            </div>
            
            <div className="mb-16">
              <div className="flex items-center mb-6">
                <Globe size={24} className="text-pink-500 mr-3" />
                <h3 className="text-2xl font-semibold">Architecture Hybride</h3>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-8">
                <p className="text-gray-300 mb-6">
                  FloDrama utilise une architecture hybride qui combine le meilleur de React pour le frontend et 
                  une infrastructure CDN optimisée pour la diffusion de contenu vidéo :
                </p>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-medium mb-3 flex items-center">
                      <Cpu size={20} className="text-pink-500 mr-2" />
                      <span>Fonctionnalités gérées par React</span>
                    </h4>
                    <ul className="space-y-2 text-gray-300">
                      <li className="flex items-start">
                        <span className="text-pink-500 mr-2">•</span>
                        Interface utilisateur interactive et animations
                      </li>
                      <li className="flex items-start">
                        <span className="text-pink-500 mr-2">•</span>
                        Navigation entre les pages et transitions
                      </li>
                      <li className="flex items-start">
                        <span className="text-pink-500 mr-2">•</span>
                        Gestion de l'état de l'application
                      </li>
                      <li className="flex items-start">
                        <span className="text-pink-500 mr-2">•</span>
                        Recherche et filtrage des contenus
                      </li>
                      <li className="flex items-start">
                        <span className="text-pink-500 mr-2">•</span>
                        Formulaires et interactions utilisateur
                      </li>
                      <li className="flex items-start">
                        <span className="text-pink-500 mr-2">•</span>
                        Affichage des métadonnées et informations
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-medium mb-3 flex items-center">
                      <Cloud size={20} className="text-pink-500 mr-2" />
                      <span>Services d'infrastructure</span>
                    </h4>
                    <ul className="space-y-2 text-gray-300">
                      <li className="flex items-start">
                        <span className="text-pink-500 mr-2">•</span>
                        Diffusion vidéo optimisée via Bunny CDN
                      </li>
                      <li className="flex items-start">
                        <span className="text-pink-500 mr-2">•</span>
                        Fallback automatique vers CloudFront
                      </li>
                      <li className="flex items-start">
                        <span className="text-pink-500 mr-2">•</span>
                        Système de surveillance et monitoring
                      </li>
                      <li className="flex items-start">
                        <span className="text-pink-500 mr-2">•</span>
                        Gestion des métadonnées et API
                      </li>
                      <li className="flex items-start">
                        <span className="text-pink-500 mr-2">•</span>
                        Authentification et gestion des utilisateurs
                      </li>
                      <li className="flex items-start">
                        <span className="text-pink-500 mr-2">•</span>
                        Sécurité et protection du contenu
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <Shield size={24} className="text-pink-500 mr-3" />
                <h3 className="text-2xl font-semibold">Sécurité et Performance</h3>
              </div>
              
              <p className="text-gray-300 mb-6">
                FloDrama accorde une importance particulière à la sécurité et aux performances :
              </p>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="text-pink-500 mr-2 font-bold">•</span>
                    <div>
                      <span className="font-medium">URLs signées</span> - Protection du contenu vidéo contre l'accès non autorisé
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-pink-500 mr-2 font-bold">•</span>
                    <div>
                      <span className="font-medium">Mécanisme de fallback</span> - Garantie de disponibilité même en cas de défaillance d'un CDN
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-pink-500 mr-2 font-bold">•</span>
                    <div>
                      <span className="font-medium">Optimisation des performances</span> - Chargement paresseux, code splitting et mise en cache
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-pink-500 mr-2 font-bold">•</span>
                    <div>
                      <span className="font-medium">Surveillance continue</span> - Détection proactive des problèmes et alertes automatiques
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-pink-500 mr-2 font-bold">•</span>
                    <div>
                      <span className="font-medium">Adaptation de la qualité</span> - Sélection automatique de la meilleure qualité vidéo selon la connexion
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="text-center mt-16">
              <p className="text-gray-400 mb-6">
                FloDrama est en constante évolution pour vous offrir la meilleure expérience possible.
                <br />Notre équipe technique travaille continuellement à l'amélioration de la plateforme.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/support/contact" 
                  className="px-6 py-3 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
                >
                  Contacter l'équipe technique
                </a>
                <a 
                  href="/support/faq" 
                  className="px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Consulter la FAQ
                </a>
              </div>
            </div>
          </motion.div>
        </div>
        
        <Footer />
      </div>
    </PageTransition>
  );
};

export default TechnologiesPage;
