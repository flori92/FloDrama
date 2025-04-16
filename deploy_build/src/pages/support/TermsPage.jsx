import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import PageTransition from '../../components/animations/PageTransition';

/**
 * Page des Conditions d'utilisation de FloDrama
 */
const TermsPage = () => {
  return (
    <PageTransition type="fade">
      <div className="bg-gray-900 text-white min-h-screen">
        <Navbar />
        
        <div className="container mx-auto px-4 py-12 pt-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-4xl font-bold mb-8 text-center">Conditions d'utilisation</h1>
            <p className="text-gray-400 mb-12 text-center">Dernière mise à jour : 14 mars 2025</p>
            
            <div className="bg-gray-800 rounded-xl p-8 shadow-lg mb-12">
              <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4 text-pink-500">1. Acceptation des conditions</h2>
                <p className="mb-4 text-gray-300">
                  En accédant à FloDrama et en utilisant nos services, vous acceptez d'être lié par les présentes conditions d'utilisation, toutes les lois et réglementations applicables, et vous acceptez que vous êtes responsable du respect des lois locales applicables.
                </p>
                <p className="mb-4 text-gray-300">
                  Si vous n'acceptez pas l'une de ces conditions, vous êtes interdit d'utiliser ou d'accéder à ce site. Les contenus présents sur ce site sont protégés par les lois applicables en matière de droits d'auteur et de marques.
                </p>
              </section>
              
              <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4 text-pink-500">2. Licence d'utilisation</h2>
                <p className="mb-4 text-gray-300">
                  Une permission est accordée pour utiliser temporairement FloDrama pour un usage personnel, non commercial, sous réserve des restrictions suivantes :
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-300 space-y-2">
                  <li>Vous ne devez pas modifier ou copier les contenus</li>
                  <li>Vous ne devez pas utiliser les contenus à des fins commerciales</li>
                  <li>Vous ne devez pas tenter de décompiler ou de faire de l'ingénierie inverse sur les logiciels de FloDrama</li>
                  <li>Vous ne devez pas supprimer les mentions de droits d'auteur ou autres mentions de propriété</li>
                  <li>Vous ne devez pas transférer les contenus à une autre personne ou "mettre en miroir" les contenus sur un autre serveur</li>
                </ul>
                <p className="mb-4 text-gray-300">
                  Cette licence sera automatiquement résiliée si vous violez l'une de ces restrictions et pourra être résiliée par FloDrama à tout moment.
                </p>
              </section>
              
              <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4 text-pink-500">3. Comptes utilisateurs</h2>
                <p className="mb-4 text-gray-300">
                  Lorsque vous créez un compte sur FloDrama, vous devez fournir des informations exactes, complètes et à jour. Vous êtes responsable de la confidentialité de votre compte et de votre mot de passe, ainsi que de toutes les activités qui se produisent sous votre compte.
                </p>
                <p className="mb-4 text-gray-300">
                  Vous acceptez de notifier immédiatement FloDrama de toute utilisation non autorisée de votre compte ou de toute autre violation de sécurité. FloDrama ne sera pas responsable des pertes résultant de l'utilisation non autorisée de votre compte.
                </p>
              </section>
              
              <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4 text-pink-500">4. Abonnements et paiements</h2>
                <p className="mb-4 text-gray-300">
                  FloDrama propose différentes formules d'abonnement. En souscrivant à un abonnement, vous acceptez de payer les frais d'abonnement applicables et les taxes associées. Les paiements sont non remboursables, sauf disposition contraire prévue par la loi.
                </p>
                <p className="mb-4 text-gray-300">
                  Nous nous réservons le droit de modifier nos tarifs à tout moment, mais nous vous informerons toujours à l'avance de tout changement de tarif qui vous affecterait.
                </p>
              </section>
              
              <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4 text-pink-500">5. Contenu et droits d'auteur</h2>
                <p className="mb-4 text-gray-300">
                  Tous les contenus disponibles sur FloDrama, y compris les films, séries, images, logos et textes, sont la propriété de FloDrama ou de ses concédants de licence et sont protégés par les lois sur les droits d'auteur et autres lois sur la propriété intellectuelle.
                </p>
                <p className="mb-4 text-gray-300">
                  Vous ne pouvez pas reproduire, distribuer, modifier, afficher publiquement, préparer des œuvres dérivées, ou exploiter de quelque manière que ce soit tout contenu de FloDrama sans autorisation écrite préalable.
                </p>
              </section>
              
              <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4 text-pink-500">6. Limitation de responsabilité</h2>
                <p className="mb-4 text-gray-300">
                  En aucun cas, FloDrama ou ses fournisseurs ne pourront être tenus responsables de tout dommage (y compris, sans limitation, les dommages pour perte de données ou de profit, ou en raison d'une interruption d'activité) découlant de l'utilisation ou de l'impossibilité d'utiliser les contenus de FloDrama, même si FloDrama ou un représentant autorisé de FloDrama a été informé oralement ou par écrit de la possibilité de tels dommages.
                </p>
              </section>
              
              <section className="mb-10">
                <h2 className="text-2xl font-semibold mb-4 text-pink-500">7. Modifications des conditions</h2>
                <p className="mb-4 text-gray-300">
                  FloDrama se réserve le droit de réviser ces conditions d'utilisation à tout moment sans préavis. En utilisant ce site, vous acceptez d'être lié par la version alors en vigueur de ces conditions d'utilisation.
                </p>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-pink-500">8. Contact</h2>
                <p className="mb-4 text-gray-300">
                  Si vous avez des questions concernant ces conditions d'utilisation, veuillez nous contacter à <a href="mailto:hotline@flodrama.com" className="text-pink-500 hover:underline">hotline@flodrama.com</a>.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
        
        <Footer />
      </div>
    </PageTransition>
  );
};

export default TermsPage;
