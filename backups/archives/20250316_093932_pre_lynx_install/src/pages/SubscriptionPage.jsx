import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, CreditCard, Calendar, Smartphone, Tv, Monitor, Tablet } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import PageTransition from '../components/animations/PageTransition';

/**
 * Page d'abonnement et tarifs de FloDrama
 */
const SubscriptionPage = () => {
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  
  const plans = [
    {
      name: 'Essentiel',
      description: 'L\'essentiel pour découvrir FloDrama',
      monthlyPrice: 7.99,
      yearlyPrice: 79.99,
      features: [
        { text: 'Accès à tous les dramas', included: true },
        { text: 'Qualité HD', included: true },
        { text: 'Visionnage sur 1 écran à la fois', included: true },
        { text: 'Téléchargements', included: false },
        { text: 'Sans publicité', included: false },
        { text: 'Accès anticipé aux nouveautés', included: false }
      ],
      color: 'bg-blue-500',
      popular: false
    },
    {
      name: 'Premium',
      description: 'Notre offre la plus populaire',
      monthlyPrice: 11.99,
      yearlyPrice: 119.99,
      features: [
        { text: 'Accès à tous les dramas', included: true },
        { text: 'Qualité Full HD', included: true },
        { text: 'Visionnage sur 2 écrans à la fois', included: true },
        { text: 'Téléchargements', included: true },
        { text: 'Sans publicité', included: true },
        { text: 'Accès anticipé aux nouveautés', included: false }
      ],
      color: 'bg-pink-500',
      popular: true
    },
    {
      name: 'Ultimate',
      description: 'L\'expérience FloDrama ultime',
      monthlyPrice: 15.99,
      yearlyPrice: 159.99,
      features: [
        { text: 'Accès à tous les dramas', included: true },
        { text: 'Qualité 4K + HDR', included: true },
        { text: 'Visionnage sur 4 écrans à la fois', included: true },
        { text: 'Téléchargements', included: true },
        { text: 'Sans publicité', included: true },
        { text: 'Accès anticipé aux nouveautés', included: true }
      ],
      color: 'bg-purple-500',
      popular: false
    }
  ];
  
  const devices = [
    { name: 'Smartphone', icon: <Smartphone size={24} /> },
    { name: 'Tablette', icon: <Tablet size={24} /> },
    { name: 'Ordinateur', icon: <Monitor size={24} /> },
    { name: 'Smart TV', icon: <Tv size={24} /> }
  ];
  
  const faqs = [
    {
      question: 'Puis-je annuler mon abonnement à tout moment ?',
      answer: 'Oui, vous pouvez annuler votre abonnement à tout moment. L\'annulation prendra effet à la fin de votre période de facturation en cours.'
    },
    {
      question: 'Comment puis-je payer mon abonnement ?',
      answer: 'Nous acceptons les paiements par carte bancaire (Visa, Mastercard, American Express) et PayPal.'
    },
    {
      question: 'Puis-je changer de formule d\'abonnement ?',
      answer: 'Oui, vous pouvez passer à une formule supérieure à tout moment. Le changement prendra effet immédiatement et nous ajusterons votre facturation au prorata.'
    },
    {
      question: 'Y a-t-il une période d\'essai gratuite ?',
      answer: 'Oui, nous offrons une période d\'essai gratuite de 7 jours pour tous les nouveaux abonnés.'
    },
    {
      question: 'FloDrama est-il disponible dans mon pays ?',
      answer: 'FloDrama est actuellement disponible dans plus de 190 pays à travers le monde. Veuillez vérifier la disponibilité dans votre région sur notre page de support.'
    }
  ];
  
  return (
    <PageTransition type="fade">
      <div className="bg-gray-900 text-white min-h-screen">
        <Navbar />
        
        <div className="container mx-auto px-4 py-12 pt-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto"
          >
            <h1 className="text-4xl font-bold mb-4 text-center">Choisissez votre abonnement</h1>
            <p className="text-xl text-gray-400 mb-12 text-center">
              Accédez à des milliers de dramas et films asiatiques en streaming illimité
            </p>
            
            {/* Sélecteur de période de facturation */}
            <div className="flex justify-center mb-12">
              <div className="bg-gray-800 p-1 rounded-full inline-flex">
                <button
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                    billingPeriod === 'monthly' ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setBillingPeriod('monthly')}
                >
                  Mensuel
                </button>
                <button
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                    billingPeriod === 'yearly' ? 'bg-pink-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setBillingPeriod('yearly')}
                >
                  Annuel <span className="text-xs font-bold text-pink-500">-17%</span>
                </button>
              </div>
            </div>
            
            {/* Cartes des plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`bg-gray-800 rounded-xl overflow-hidden shadow-lg ${
                    plan.popular ? 'ring-2 ring-pink-500 transform md:-translate-y-4' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="bg-pink-500 text-white text-center py-1 text-sm font-medium">
                      Le plus populaire
                    </div>
                  )}
                  
                  <div className="p-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-gray-400 mb-6">{plan.description}</p>
                    
                    <div className="mb-6">
                      <div className="flex items-end">
                        <span className="text-4xl font-bold">
                          {billingPeriod === 'monthly' 
                            ? `${plan.monthlyPrice.toFixed(2)}€` 
                            : `${plan.yearlyPrice.toFixed(2)}€`}
                        </span>
                        <span className="text-gray-400 ml-2 mb-1">
                          {billingPeriod === 'monthly' ? '/mois' : '/an'}
                        </span>
                      </div>
                      {billingPeriod === 'yearly' && (
                        <p className="text-sm text-gray-400 mt-1">
                          Soit {(plan.yearlyPrice / 12).toFixed(2)}€ par mois
                        </p>
                      )}
                    </div>
                    
                    <button className={`w-full py-3 rounded-lg font-medium transition-colors ${
                      plan.popular 
                        ? 'bg-pink-500 hover:bg-pink-600 text-white' 
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}>
                      Commencer l'essai gratuit
                    </button>
                    
                    <div className="mt-6 pt-6 border-t border-gray-700">
                      <h4 className="font-medium mb-4">Ce qui est inclus :</h4>
                      <ul className="space-y-3">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
                              feature.included ? `${plan.color}` : 'bg-gray-700'
                            }`}>
                              {feature.included ? (
                                <Check size={12} className="text-white" />
                              ) : (
                                <X size={12} className="text-gray-400" />
                              )}
                            </span>
                            <span className={feature.included ? 'text-white' : 'text-gray-500'}>
                              {feature.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Appareils compatibles */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-gray-800 rounded-xl p-8 mb-16"
            >
              <h2 className="text-2xl font-bold mb-8 text-center">Regardez sur tous vos appareils</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {devices.map((device, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-3">
                      {device.icon}
                    </div>
                    <p className="text-center">{device.name}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* Moyens de paiement */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-gray-800 rounded-xl p-8 mb-16"
            >
              <h2 className="text-2xl font-bold mb-6 text-center">Moyens de paiement acceptés</h2>
              
              <div className="flex flex-wrap justify-center gap-6">
                <div className="flex items-center">
                  <CreditCard size={24} className="mr-2" />
                  <span>Carte bancaire</span>
                </div>
                <div className="flex items-center">
                  <span className="font-bold text-blue-500 mr-2">Pay</span>
                  <span>PayPal</span>
                </div>
                <div className="flex items-center">
                  <Calendar size={24} className="mr-2" />
                  <span>Facturation mensuelle ou annuelle</span>
                </div>
              </div>
            </motion.div>
            
            {/* FAQ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mb-16"
            >
              <h2 className="text-2xl font-bold mb-8 text-center">Questions fréquentes</h2>
              
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-medium mb-3">{faq.question}</h3>
                    <p className="text-gray-400">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* CTA final */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-2xl font-bold mb-4">Prêt à découvrir FloDrama ?</h2>
              <p className="text-gray-400 mb-6">Essai gratuit de 7 jours, annulable à tout moment</p>
              <button className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-lg font-medium transition-colors">
                Commencer mon essai gratuit
              </button>
            </motion.div>
          </motion.div>
        </div>
        
        <Footer />
      </div>
    </PageTransition>
  );
};

export default SubscriptionPage;
