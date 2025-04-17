import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, Database, Bell } from 'lucide-react';
import Footer from '../../components/layout/Footer';
import PageTransition from '../../components/animations/PageTransition';

/**
 * Page de Politique de confidentialité de FloDrama
 */
const PrivacyPage = () => {
  const privacySections = [
    {
      icon: <FileText size={28} />,
      title: "Collecte d'informations",
      content: "Nous collectons des informations lorsque vous vous inscrivez sur notre site, vous connectez à votre compte, effectuez un achat, participez à un concours et/ou lorsque vous vous déconnectez. Les informations collectées incluent votre nom, adresse e-mail, numéro de téléphone, et données de carte de crédit."
    },
    {
      icon: <Database size={28} />,
      title: "Utilisation des informations",
      content: "Toute information que nous collectons peut être utilisée pour personnaliser votre expérience et répondre à vos besoins individuels, améliorer notre site web, améliorer le service client et vos besoins d'assistance, traiter les transactions, administrer un concours, une promotion, ou une enquête."
    },
    {
      icon: <Lock size={28} />,
      title: "Protection des informations",
      content: "Nous mettons en œuvre une variété de mesures de sécurité pour préserver la sécurité de vos informations personnelles. Nous utilisons un cryptage à la pointe de la technologie pour protéger les informations sensibles transmises en ligne. Nous protégeons également vos informations hors ligne."
    },
    {
      icon: <Eye size={28} />,
      title: "Cookies",
      content: "Nous utilisons des cookies pour comprendre et enregistrer vos préférences pour vos futures visites, garder une trace des annonces et compiler des données agrégées sur le trafic du site et les interactions du site afin de proposer de meilleures expériences et outils à l'avenir."
    },
    {
      icon: <Bell size={28} />,
      title: "Communications",
      content: "Nous pouvons utiliser votre adresse e-mail pour vous envoyer des informations, des mises à jour concernant votre commande, des nouvelles de l'entreprise, des informations sur les produits connexes, etc. Si à tout moment vous souhaitez vous désinscrire de la réception des futurs e-mails, nous incluons des instructions de désabonnement en bas de chaque e-mail."
    },
    {
      icon: <Shield size={28} />,
      title: "Conformité RGPD",
      content: "Conformément au Règlement Général sur la Protection des Données (RGPD), nous nous engageons à protéger les données personnelles de nos utilisateurs européens. Vous avez le droit d'accéder à vos données, de les rectifier, de les supprimer et de vous opposer à leur traitement."
    }
  ];

  return (
    <PageTransition type="fade">
      <div className="bg-gray-900 text-white min-h-screen">
        
        <div className="container mx-auto px-4 py-12 pt-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-4xl font-bold mb-8 text-center">Politique de confidentialité</h1>
            <p className="text-gray-400 mb-12 text-center">Dernière mise à jour : 14 mars 2025</p>
            
            <div className="bg-gray-800 rounded-xl p-8 shadow-lg mb-12">
              <p className="mb-8 text-gray-300">
                Chez FloDrama, nous accordons une grande importance à la confidentialité de vos données. Cette politique de confidentialité décrit comment nous collectons, utilisons, partageons et protégeons vos informations personnelles lorsque vous utilisez notre service.
              </p>
              
              <div className="space-y-10">
                {privacySections.map((section, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex gap-6"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-pink-500 bg-opacity-20 rounded-lg flex items-center justify-center text-pink-500">
                      {section.icon}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold mb-3 text-pink-500">{section.title}</h2>
                      <p className="text-gray-300">{section.content}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-12 pt-8 border-t border-gray-700">
                <h2 className="text-2xl font-semibold mb-4 text-pink-500">Vos droits</h2>
                <p className="mb-4 text-gray-300">
                  Vous avez le droit de demander l'accès, la rectification ou la suppression de vos données personnelles. Vous pouvez également vous opposer au traitement de vos données ou demander la limitation de ce traitement.
                </p>
                <p className="mb-4 text-gray-300">
                  Pour exercer ces droits ou pour toute question concernant notre politique de confidentialité, veuillez nous contacter à <a href="mailto:hotline@flodrama.com" className="text-pink-500 hover:underline">hotline@flodrama.com</a>.
                </p>
              </div>
              
              <div className="mt-8 pt-8 border-t border-gray-700">
                <h2 className="text-2xl font-semibold mb-4 text-pink-500">Modifications de notre politique de confidentialité</h2>
                <p className="mb-4 text-gray-300">
                  FloDrama se réserve le droit de modifier cette politique de confidentialité à tout moment. Nous vous informerons de tout changement en publiant la nouvelle politique de confidentialité sur cette page et en mettant à jour la date de "dernière mise à jour" en haut de cette politique.
                </p>
                <p className="mb-4 text-gray-300">
                  Nous vous encourageons à consulter régulièrement cette politique de confidentialité pour prendre connaissance de tout changement.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
        
        <Footer />
      </div>
    </PageTransition>
  );
};

export default PrivacyPage;
