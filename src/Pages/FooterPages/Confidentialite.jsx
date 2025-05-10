/**
 * Page Confidentialité
 * Politique de confidentialité de FloDrama
 */

import React from 'react';
import FooterPage from './FooterPage';

const Confidentialite = () => {
  return (
    <FooterPage title="Politique de Confidentialité">
      <section className="mb-8">
        <p className="mb-4">
          Chez FloDrama, nous accordons une importance capitale à la protection de vos données personnelles. 
          Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations 
          lorsque vous utilisez notre service.
        </p>
        <p className="mb-4">
          Dernière mise à jour : 10 mai 2025
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Collecte des Données</h2>
        <p className="mb-4">
          Nous collectons différents types d'informations pour diverses raisons, notamment pour améliorer votre expérience sur notre plateforme :
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><span className="font-medium">Informations de compte</span> : Lorsque vous créez un compte, nous collectons votre nom, adresse e-mail, et mot de passe.</li>
          <li><span className="font-medium">Informations de profil</span> : Photo de profil et préférences utilisateur.</li>
          <li><span className="font-medium">Données d'utilisation</span> : Historique de visionnage, interactions avec le contenu, préférences de recherche.</li>
          <li><span className="font-medium">Informations techniques</span> : Adresse IP, type d'appareil, navigateur, données de connexion.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Utilisation des Données</h2>
        <p className="mb-4">
          Nous utilisons vos données personnelles pour :
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Fournir, maintenir et améliorer notre service</li>
          <li>Personnaliser votre expérience et vous proposer des contenus adaptés à vos goûts</li>
          <li>Communiquer avec vous concernant votre compte ou nos services</li>
          <li>Détecter et prévenir les activités frauduleuses</li>
          <li>Analyser l'utilisation de notre plateforme pour améliorer nos services</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Partage des Données</h2>
        <p className="mb-4">
          Nous ne vendons pas vos données personnelles à des tiers. Nous pouvons partager certaines informations avec :
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li><span className="font-medium">Prestataires de services</span> : Entreprises qui nous aident à fournir notre service (hébergement, analyse, paiement).</li>
          <li><span className="font-medium">Partenaires</span> : Dans le cadre de collaborations spécifiques, toujours avec votre consentement.</li>
          <li><span className="font-medium">Autorités légales</span> : Si la loi l'exige ou pour protéger nos droits.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Sécurité des Données</h2>
        <p className="mb-4">
          Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données contre l'accès non autorisé, 
          la modification, la divulgation ou la destruction. Ces mesures incluent le chiffrement des données, les contrôles d'accès, 
          et les audits de sécurité réguliers.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Vos Droits</h2>
        <p className="mb-4">
          En tant qu'utilisateur, vous disposez de certains droits concernant vos données personnelles :
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>Accéder à vos données et en obtenir une copie</li>
          <li>Rectifier vos données si elles sont inexactes</li>
          <li>Demander la suppression de vos données dans certaines circonstances</li>
          <li>Limiter ou vous opposer au traitement de vos données</li>
          <li>Retirer votre consentement à tout moment</li>
        </ul>
        <p>
          Pour exercer ces droits, contactez-nous à l'adresse : privacy@flodrama.com
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Cookies et Technologies Similaires</h2>
        <p className="mb-4">
          Nous utilisons des cookies et technologies similaires pour améliorer votre expérience, analyser l'utilisation de notre service, 
          et personnaliser le contenu. Vous pouvez gérer vos préférences concernant les cookies dans les paramètres de votre navigateur 
          ou via notre page "Préférences cookies".
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Modifications de la Politique</h2>
        <p className="mb-4">
          Nous pouvons mettre à jour cette politique de confidentialité périodiquement. Nous vous informerons de tout changement 
          significatif par e-mail ou par une notification sur notre plateforme.
        </p>
        <p>
          Si vous avez des questions concernant cette politique ou vos données personnelles, n'hésitez pas à nous contacter 
          à privacy@flodrama.com.
        </p>
      </section>
    </FooterPage>
  );
};

export default Confidentialite;
