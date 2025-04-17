import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown, ChevronRight, PlayCircle, Wifi, CreditCard, Monitor, Download, User, Mail } from 'lucide-react';
import Footer from '../../components/layout/Footer';
import PageTransition from '../../components/animations/PageTransition';

/**
 * Page d'aide et support de FloDrama
 */
const HelpPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  
  const helpCategories = [
    {
      id: 'account',
      icon: <User size={24} />,
      title: 'Compte et abonnement',
      questions: [
        {
          id: 'account-1',
          question: 'Comment créer un compte FloDrama ?',
          answer: 'Pour créer un compte FloDrama, cliquez sur le bouton "S\'inscrire" en haut à droite de la page d\'accueil. Remplissez le formulaire avec votre adresse e-mail, créez un mot de passe sécurisé et suivez les instructions pour finaliser votre inscription. Vous pourrez ensuite choisir votre formule d\'abonnement.'
        },
        {
          id: 'account-2',
          question: 'Comment modifier mes informations personnelles ?',
          answer: 'Connectez-vous à votre compte FloDrama, puis cliquez sur votre avatar en haut à droite de l\'écran. Sélectionnez "Paramètres du compte" dans le menu déroulant. Vous pourrez alors modifier vos informations personnelles, y compris votre nom, adresse e-mail et mot de passe.'
        },
        {
          id: 'account-3',
          question: 'Comment annuler mon abonnement ?',
          answer: 'Pour annuler votre abonnement, connectez-vous à votre compte, accédez aux "Paramètres du compte", puis sélectionnez "Abonnement". Cliquez sur "Annuler l\'abonnement" et suivez les instructions. Votre abonnement restera actif jusqu\'à la fin de la période de facturation en cours.'
        }
      ]
    },
    {
      id: 'payment',
      icon: <CreditCard size={24} />,
      title: 'Paiement et facturation',
      questions: [
        {
          id: 'payment-1',
          question: 'Quels moyens de paiement acceptez-vous ?',
          answer: 'FloDrama accepte les paiements par carte bancaire (Visa, Mastercard, American Express) et PayPal. Toutes les transactions sont sécurisées et vos informations de paiement sont cryptées.'
        },
        {
          id: 'payment-2',
          question: 'Quand suis-je facturé pour mon abonnement ?',
          answer: 'Vous êtes facturé au début de chaque période d\'abonnement (mensuelle ou annuelle). La date de facturation correspond à la date à laquelle vous avez initialement souscrit à l\'abonnement. Vous recevrez une confirmation de paiement par e-mail à chaque renouvellement.'
        },
        {
          id: 'payment-3',
          question: 'Comment obtenir une facture ?',
          answer: 'Les factures sont automatiquement envoyées par e-mail après chaque paiement. Vous pouvez également les retrouver dans la section "Historique de facturation" de votre compte. Si vous avez besoin d\'une facture spécifique, contactez notre service client à hotline@flodrama.com.'
        }
      ]
    },
    {
      id: 'streaming',
      icon: <PlayCircle size={24} />,
      title: 'Lecture et streaming',
      questions: [
        {
          id: 'streaming-1',
          question: 'Pourquoi la vidéo ne se lance pas ?',
          answer: 'Si la vidéo ne se lance pas, vérifiez d\'abord votre connexion internet. Essayez ensuite d\'actualiser la page ou de redémarrer votre navigateur. Si le problème persiste, videz le cache de votre navigateur ou essayez un autre navigateur. Si rien ne fonctionne, contactez notre support technique.'
        },
        {
          id: 'streaming-2',
          question: 'Comment améliorer la qualité vidéo ?',
          answer: 'La qualité vidéo s\'ajuste automatiquement en fonction de votre connexion internet. Pour une meilleure qualité, assurez-vous d\'avoir une connexion stable et rapide. Vous pouvez également sélectionner manuellement la qualité vidéo en cliquant sur l\'icône d\'engrenage dans le lecteur vidéo et en choisissant la résolution souhaitée.'
        },
        {
          id: 'streaming-3',
          question: 'Comment activer/désactiver les sous-titres ?',
          answer: 'Pour activer ou désactiver les sous-titres, cliquez sur l\'icône "CC" ou "Sous-titres" dans la barre de contrôle du lecteur vidéo. Vous pouvez également choisir la langue des sous-titres si plusieurs options sont disponibles.'
        }
      ]
    },
    {
      id: 'technical',
      icon: <Wifi size={24} />,
      title: 'Problèmes techniques',
      questions: [
        {
          id: 'technical-1',
          question: 'FloDrama ne fonctionne pas sur mon appareil',
          answer: 'FloDrama est compatible avec la plupart des navigateurs web modernes (Chrome, Firefox, Safari, Edge) et des appareils (ordinateurs, smartphones, tablettes, Smart TV). Assurez-vous que votre système d\'exploitation et votre navigateur sont à jour. Si le problème persiste, contactez notre support technique en précisant le type d\'appareil et le navigateur que vous utilisez.'
        },
        {
          id: 'technical-2',
          question: "J'ai des problèmes de connexion à mon compte",
          answer: 'Si vous ne parvenez pas à vous connecter à votre compte, vérifiez que vous utilisez la bonne adresse e-mail et le bon mot de passe. Utilisez l\'option "Mot de passe oublié" si nécessaire. Si vous êtes sûr de vos identifiants mais que le problème persiste, votre compte pourrait être temporairement bloqué pour des raisons de sécurité. Contactez notre support à hotline@flodrama.com.'
        },
        {
          id: 'technical-3',
          question: "L'application plante ou se fige",
          answer: 'Si l\'application plante ou se fige, essayez de l\'actualiser ou de la redémarrer. Videz également le cache de votre navigateur. Sur mobile, fermez complètement l\'application et relancez-la. Si le problème persiste, désinstallez et réinstallez l\'application, ou contactez notre support technique avec une description détaillée du problème.'
        }
      ]
    },
    {
      id: 'content',
      icon: <Monitor size={24} />,
      title: 'Contenu et catalogue',
      questions: [
        {
          id: 'content-1',
          question: 'Quand de nouveaux dramas sont-ils ajoutés ?',
          answer: 'De nouveaux dramas sont ajoutés chaque semaine à notre catalogue. Les sorties récentes sont généralement disponibles dans les 24 heures suivant leur diffusion dans le pays d\'origine, sous réserve des droits de diffusion. Consultez la section "Nouveautés" sur la page d\'accueil pour voir les derniers ajouts.'
        },
        {
          id: 'content-2',
          question: 'Pourquoi certains dramas ne sont pas disponibles dans ma région ?',
          answer: 'La disponibilité des dramas varie selon les régions en raison des droits de diffusion et des licences. Nous nous efforçons d\'offrir un catalogue aussi complet que possible dans chaque pays, mais certaines restrictions peuvent s\'appliquer. Notre équipe travaille constamment pour élargir notre offre de contenu dans toutes les régions.'
        },
        {
          id: 'content-3',
          question: 'Comment suggérer un drama à ajouter au catalogue ?',
          answer: 'Nous apprécions vos suggestions ! Vous pouvez nous recommander des dramas à ajouter en envoyant un e-mail à hotline@flodrama.com avec le sujet "Suggestion de contenu". Incluez le titre du drama, le pays d\'origine et pourquoi vous aimeriez le voir sur FloDrama. Nous examinerons toutes les suggestions.'
        }
      ]
    },
    {
      id: 'download',
      icon: <Download size={24} />,
      title: 'Téléchargements',
      questions: [
        {
          id: 'download-1',
          question: 'Comment télécharger des épisodes pour les regarder hors ligne ?',
          answer: 'Pour télécharger un épisode, ouvrez la page de l\'épisode et cliquez sur l\'icône de téléchargement à côté du titre. Le téléchargement commencera automatiquement. Cette fonctionnalité est disponible uniquement pour les abonnés Premium et Ultimate. Les contenus téléchargés sont accessibles dans la section "Mes téléchargements" de votre compte.'
        },
        {
          id: 'download-2',
          question: 'Combien de temps les téléchargements restent-ils disponibles ?',
          answer: 'Les téléchargements restent disponibles pendant 30 jours à partir de la date de téléchargement. Une fois que vous commencez à regarder un contenu téléchargé, vous avez 48 heures pour terminer le visionnage avant qu\'il n\'expire. Vous pouvez retélécharger le contenu si nécessaire.'
        },
        {
          id: 'download-3',
          question: 'Sur combien d\'appareils puis-je télécharger du contenu ?',
          answer: 'Le nombre d\'appareils sur lesquels vous pouvez télécharger du contenu dépend de votre formule d\'abonnement. Les abonnés Premium peuvent télécharger sur 2 appareils, tandis que les abonnés Ultimate peuvent télécharger sur 4 appareils. Vous pouvez gérer vos appareils dans les paramètres de votre compte.'
        }
      ]
    }
  ];
  
  // Filtrer les catégories et questions en fonction de la recherche
  const filteredCategories = searchQuery
    ? helpCategories.map(category => ({
        ...category,
        questions: category.questions.filter(q => 
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.questions.length > 0)
    : helpCategories;
  
  const handleCategoryClick = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    setExpandedQuestion(null);
  };
  
  const handleQuestionClick = (questionId) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  };
  
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
            <h1 className="text-4xl font-bold mb-4 text-center">Centre d&apos;aide FloDrama</h1>
            <p className="text-xl text-gray-400 mb-12 text-center">
              Comment pouvons-nous vous aider aujourd&apos;hui ?
            </p>
            
            {/* Barre de recherche */}
            <div className="relative mb-12">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                className="bg-gray-800 text-white w-full pl-10 pr-4 py-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Rechercher dans l&apos;aide..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Catégories d&apos;aide */}
            <div className="space-y-4">
              {filteredCategories.map((category) => (
                <div key={category.id} className="bg-gray-800 rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-6 focus:outline-none"
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-pink-500 bg-opacity-20 rounded-lg flex items-center justify-center text-pink-500 mr-4">
                        {category.icon}
                      </div>
                      <h2 className="text-xl font-semibold">{category.title}</h2>
                    </div>
                    {expandedCategory === category.id ? (
                      <ChevronDown size={20} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={20} className="text-gray-400" />
                    )}
                  </button>
                  
                  {expandedCategory === category.id && (
                    <div className="px-6 pb-6">
                      <div className="space-y-4">
                        {category.questions.map((q) => (
                          <div key={q.id} className="bg-gray-700 rounded-lg overflow-hidden">
                            <button
                              className="w-full flex items-center justify-between p-4 focus:outline-none text-left"
                              onClick={() => handleQuestionClick(q.id)}
                            >
                              <h3 className="font-medium pr-8">{q.question}</h3>
                              {expandedQuestion === q.id ? (
                                <ChevronDown size={16} className="flex-shrink-0 text-gray-400" />
                              ) : (
                                <ChevronRight size={16} className="flex-shrink-0 text-gray-400" />
                              )}
                            </button>
                            
                            {expandedQuestion === q.id && (
                              <div className="p-4 pt-0 text-gray-300">
                                <p>{q.answer}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Contact direct */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-gray-800 rounded-xl p-8 mt-12 text-center"
            >
              <h2 className="text-2xl font-semibold mb-4">Vous n&apos;avez pas trouvé de réponse ?</h2>
              <p className="text-gray-300 mb-6">
                Notre équipe de support est disponible 7j/7 pour vous aider avec toutes vos questions.
              </p>
              <a
                href="mailto:hotline@flodrama.com"
                className="inline-flex items-center bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Mail size={20} className="mr-2" />
                Contacter le support
              </a>
            </motion.div>
          </motion.div>
        </div>
        
        <Footer />
      </div>
    </PageTransition>
  );
};

export default HelpPage;
