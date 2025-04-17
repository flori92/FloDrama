import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Footer from '../../components/layout/Footer';
import PageTransition from '../../components/animations/PageTransition';

/**
 * Page de FAQ pour FloDrama
 * Répond aux questions fréquemment posées par les utilisateurs
 */
const FAQPage = () => {
  const [openItem, setOpenItem] = React.useState(null);
  
  const toggleItem = (index) => {
    setOpenItem(openItem === index ? null : index);
  };
  
  const faqItems = [
    {
      question: "Qu'est-ce que FloDrama ?",
      answer: "FloDrama est votre plateforme de streaming dédiée aux dramas asiatiques, films asiatiques, Bollywood et animes. Nous vous proposons des histoires captivantes du monde entier, avec un accent particulier sur les contenus asiatiques."
    },
    {
      question: "Comment puis-je m'abonner à FloDrama ?",
      answer: "Pour vous abonner, rendez-vous sur la page d'accueil et cliquez sur le bouton 'S'abonner'. Vous pourrez ensuite choisir parmi nos différentes formules d'abonnement et profiter immédiatement de notre catalogue."
    },
    {
      question: "Quels types de contenus proposez-vous ?",
      answer: "Notre catalogue comprend des dramas asiatiques (coréens, chinois, japonais, thaïlandais), des films asiatiques, des productions Bollywood et des animes. Tous nos contenus sont disponibles avec des sous-titres en français."
    },
    {
      question: "Sur quels appareils puis-je regarder FloDrama ?",
      answer: "FloDrama est accessible sur ordinateur (PC/Mac), smartphones et tablettes (iOS/Android), et sur certaines Smart TV. Vous pouvez également utiliser Chromecast ou AirPlay pour diffuser nos contenus sur votre téléviseur."
    },
    {
      question: "Les sous-titres sont-ils disponibles ?",
      answer: "Oui, tous nos contenus sont disponibles avec des sous-titres en français. Certains titres proposent également des sous-titres en anglais et d'autres langues."
    },
    {
      question: "Puis-je télécharger les contenus pour les regarder hors ligne ?",
      answer: "Oui, avec notre formule Premium, vous pouvez télécharger vos dramas et films préférés pour les regarder hors ligne sur vos appareils mobiles."
    },
    {
      question: "Comment puis-je contacter le service client ?",
      answer: "Vous pouvez nous contacter via notre formulaire de contact dans la section 'Support', ou par email à support@flodrama.com. Notre équipe est disponible 7j/7 pour répondre à vos questions."
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
              Foire Aux Questions
            </h2>
            
            <div className="space-y-4 mt-8">
              {faqItems.map((item, index) => (
                <motion.div 
                  key={index}
                  className="bg-gray-800 rounded-lg overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <button
                    className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none"
                    onClick={() => toggleItem(index)}
                  >
                    <span className="font-medium text-lg">{item.question}</span>
                    {openItem === index ? (
                      <ChevronUp className="text-pink-500" size={20} />
                    ) : (
                      <ChevronDown className="text-pink-500" size={20} />
                    )}
                  </button>
                  
                  <motion.div
                    initial={false}
                    animate={{ height: openItem === index ? 'auto' : 0, opacity: openItem === index ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 text-gray-300">
                      {item.answer}
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-gray-400">
                Vous n'avez pas trouvé la réponse à votre question ?
              </p>
              <a 
                href="/support/contact" 
                className="inline-block mt-4 px-6 py-3 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
              >
                Contactez-nous
              </a>
            </div>
          </motion.div>
        </div>
        
        <Footer />
      </div>
    </PageTransition>
  );
};

export default FAQPage;
