/**
 * AccountPage
 * 
 * Page de gestion du compte utilisateur et des abonnements.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, User, Settings, LogOut, Bell, Shield } from 'lucide-react';
import Footer from '../components/layout/Footer';
import PageTransition from '../components/animations/PageTransition';
import { useSubscription } from '../services/SubscriptionService';
import SubscriptionStatus from '../components/payment/SubscriptionStatus';
import SubscriptionHistory from '../components/payment/SubscriptionHistory';

const AccountPage = () => {
  const [activeTab, setActiveTab] = useState('subscription');
  const { 
    subscriptionData, 
    cancelSubscription, 
    reactivateSubscription,
    hasActiveSubscription
  } = useSubscription();

  const handleCancelSubscription = () => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler votre abonnement ? Vous pourrez toujours y accéder jusqu&apos;à la fin de la période en cours.')) {
      cancelSubscription();
    }
  };

  const handleReactivateSubscription = () => {
    reactivateSubscription();
  };

  const tabs = [
    { id: 'subscription', label: 'Abonnement', icon: <CreditCard size={20} /> },
    { id: 'profile', label: 'Profil', icon: <User size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
    { id: 'security', label: 'Sécurité', icon: <Shield size={20} /> },
    { id: 'settings', label: 'Paramètres', icon: <Settings size={20} /> }
  ];

  return (
    <PageTransition type="fade">
      <div className="bg-gray-900 text-white min-h-screen">
        
        <div className="container mx-auto px-4 py-12 pt-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto"
          >
            <h1 className="text-4xl font-bold mb-4">Mon compte</h1>
            <p className="text-xl text-gray-400 mb-8">
              Gérez votre compte et vos préférences
            </p>
            
            {/* Tabs */}
            <div className="flex flex-wrap border-b border-gray-700 mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`flex items-center px-6 py-3 font-medium transition-colors ${
                    activeTab === tab.id 
                      ? 'text-pink-500 border-b-2 border-pink-500' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Contenu des onglets */}
            <div className="bg-gray-800 rounded-xl p-6 mb-8">
              {activeTab === 'subscription' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Gérer mon abonnement</h2>
                  
                  <SubscriptionStatus className="mb-8" />
                  
                  {hasActiveSubscription() && subscriptionData && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold mb-4">Options d&apos;abonnement</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-700 rounded-lg p-6">
                          <h4 className="font-medium mb-2">Renouvellement automatique</h4>
                          <p className="text-gray-300 mb-4">
                            {subscriptionData.autoRenew 
                              ? 'Votre abonnement sera automatiquement renouvelé à la fin de la période en cours.' 
                              : 'Votre abonnement ne sera pas renouvelé automatiquement et expirera à la fin de la période en cours.'}
                          </p>
                          
                          {subscriptionData.autoRenew ? (
                            <button 
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                              onClick={handleCancelSubscription}
                            >
                              Annuler l&apos;abonnement
                            </button>
                          ) : (
                            <button 
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                              onClick={handleReactivateSubscription}
                            >
                              Réactiver l&apos;abonnement
                            </button>
                          )}
                        </div>
                        
                        <div className="bg-gray-700 rounded-lg p-6">
                          <h4 className="font-medium mb-2">Changer de formule</h4>
                          <p className="text-gray-300 mb-4">
                            Vous pouvez changer de formule à tout moment. Le changement prendra effet immédiatement.
                          </p>
                          
                          <button 
                            className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors"
                            onClick={() => window.location.href = '/subscription'}
                          >
                            Voir les formules
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <SubscriptionHistory className="mb-8" />
                  
                  <div className="bg-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Méthodes de paiement</h3>
                    
                    {subscriptionData?.paymentMethod ? (
                      <div className="flex items-center justify-between p-4 bg-gray-600 rounded-lg mb-4">
                        <div className="flex items-center">
                          {subscriptionData.paymentMethod.type === 'paypal' ? (
                            <>
                              <span className="font-bold text-blue-500 mr-2">Pay</span>
                              <span className="text-blue-300">Pal</span>
                              <span className="ml-2 text-gray-300">({subscriptionData.paymentMethod.email})</span>
                            </>
                          ) : (
                            <>
                              <CreditCard size={20} className="mr-2" />
                              <span>Carte bancaire se terminant par {subscriptionData.paymentMethod.lastDigits || '****'}</span>
                            </>
                          )}
                        </div>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Par défaut</span>
                      </div>
                    ) : (
                      <p className="text-gray-300 mb-4">
                        Aucune méthode de paiement enregistrée.
                      </p>
                    )}
                    
                    <button 
                      className="text-pink-500 hover:text-pink-400 transition-colors"
                      onClick={() => window.location.href = '/subscription'}
                    >
                      Gérer les méthodes de paiement
                    </button>
                  </div>
                </div>
              )}
              
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Mon profil</h2>
                  <p className="text-gray-300">
                    Gérez vos informations personnelles et vos préférences de compte.
                  </p>
                  
                  {/* Contenu du profil - à implémenter */}
                  <div className="mt-6 p-6 bg-gray-700 rounded-lg text-center">
                    <p className="text-gray-300">
                      Cette section est en cours de développement.
                    </p>
                  </div>
                </div>
              )}
              
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Notifications</h2>
                  <p className="text-gray-300">
                    Gérez vos préférences de notifications.
                  </p>
                  
                  {/* Contenu des notifications - à implémenter */}
                  <div className="mt-6 p-6 bg-gray-700 rounded-lg text-center">
                    <p className="text-gray-300">
                      Cette section est en cours de développement.
                    </p>
                  </div>
                </div>
              )}
              
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Sécurité</h2>
                  <p className="text-gray-300">
                    Gérez la sécurité de votre compte.
                  </p>
                  
                  {/* Contenu de sécurité - à implémenter */}
                  <div className="mt-6 p-6 bg-gray-700 rounded-lg text-center">
                    <p className="text-gray-300">
                      Cette section est en cours de développement.
                    </p>
                  </div>
                </div>
              )}
              
              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Paramètres</h2>
                  <p className="text-gray-300">
                    Gérez les paramètres de votre compte.
                  </p>
                  
                  {/* Contenu des paramètres - à implémenter */}
                  <div className="mt-6 p-6 bg-gray-700 rounded-lg text-center">
                    <p className="text-gray-300">
                      Cette section est en cours de développement.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Déconnexion */}
            <div className="text-center mb-8">
              <button className="flex items-center mx-auto text-gray-400 hover:text-white transition-colors">
                <LogOut size={20} className="mr-2" />
                Déconnexion
              </button>
            </div>
          </motion.div>
        </div>
        
        <Footer />
      </div>
    </PageTransition>
  );
};

export default AccountPage;
