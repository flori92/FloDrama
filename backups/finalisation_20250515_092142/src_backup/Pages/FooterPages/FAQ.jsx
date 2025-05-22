/**
 * Page FAQ
 * Questions fréquemment posées sur FloDrama
 */

import React from 'react';
import FooterPage from './FooterPage';

const FAQ = () => {
  // Structure des questions/réponses
  const faqs = [
    {
      question: "Qu'est-ce que FloDrama ?",
      answer: "FloDrama est une plateforme de streaming dédiée aux dramas asiatiques, films, animes et contenus bollywood. Notre service propose une vaste bibliothèque de contenus internationaux sous-titrés en français."
    },
    {
      question: "Comment puis-je m'inscrire à FloDrama ?",
      answer: "L'inscription à FloDrama est simple et rapide. Cliquez sur le bouton 'S'inscrire' en haut à droite de la page d'accueil, puis suivez les instructions pour créer votre compte. Vous pouvez vous inscrire avec votre adresse e-mail ou via votre compte Google."
    },
    {
      question: "FloDrama est-il disponible sur tous les appareils ?",
      answer: "Oui, FloDrama est accessible sur la plupart des appareils connectés à Internet : ordinateurs, smartphones, tablettes, smart TVs et consoles de jeux. Vous pouvez également télécharger nos applications iOS et Android pour une expérience optimisée sur mobile."
    },
    {
      question: "Comment puis-je ajouter un contenu à ma liste ?",
      answer: "Pour ajouter un film ou une série à votre liste, il vous suffit de cliquer sur l'icône '+' qui apparaît lorsque vous survolez ou sélectionnez un contenu. Vous retrouverez ensuite tous vos contenus sauvegardés dans la section 'Ma Liste' accessible depuis le menu principal."
    },
    {
      question: "Comment fonctionne l'historique de visionnage ?",
      answer: "FloDrama enregistre automatiquement votre historique de visionnage. Vous pouvez consulter les contenus que vous avez regardés récemment dans la section 'Historique'. Cette fonctionnalité vous permet de reprendre facilement là où vous vous étiez arrêté."
    },
    {
      question: "Puis-je télécharger des contenus pour les regarder hors ligne ?",
      answer: "Actuellement, la fonctionnalité de téléchargement pour visionnage hors ligne n'est pas disponible sur FloDrama. Nous travaillons à l'implémentation de cette fonctionnalité dans une future mise à jour."
    },
    {
      question: "Comment puis-je signaler un problème technique ?",
      answer: "Si vous rencontrez un problème technique, vous pouvez nous contacter via la section 'Centre d'aide' accessible depuis le footer de notre site. Décrivez précisément le problème rencontré et, si possible, joignez une capture d'écran pour nous aider à le résoudre plus rapidement."
    }
  ];

  return (
    <FooterPage title="Foire Aux Questions">
      <div className="space-y-8">
        {faqs.map((faq, index) => (
          <div key={index} className="border-b border-gray-800 pb-6 last:border-b-0">
            <h3 className="text-xl font-semibold text-flodrama-fuchsia mb-3">
              {faq.question}
            </h3>
            <p className="text-gray-300">
              {faq.answer}
            </p>
          </div>
        ))}
        
        <div className="mt-10 p-6 bg-gray-900 bg-opacity-50 rounded-lg">
          <p className="text-white text-center">
            Vous n'avez pas trouvé la réponse à votre question ? Consultez notre{' '}
            <a href="/footer/centre-aide" className="text-flodrama-fuchsia hover:underline">
              Centre d'aide
            </a>{' '}
            pour plus d'informations.
          </p>
        </div>
      </div>
    </FooterPage>
  );
};

export default FAQ;
