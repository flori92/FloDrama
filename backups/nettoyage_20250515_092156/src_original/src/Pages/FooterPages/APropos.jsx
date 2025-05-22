/**
 * Page À propos
 * Informations sur FloDrama, sa mission et son histoire
 */

import React from 'react';
import FooterPage from './FooterPage';

const APropos = () => {
  return (
    <FooterPage title="À propos de FloDrama">
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Notre Mission</h2>
        <p className="mb-4">
          FloDrama a été créé avec une mission claire : rendre accessibles au public francophone les meilleures productions audiovisuelles internationales, en particulier les dramas asiatiques, les animes, et les films de Bollywood.
        </p>
        <p>
          Nous croyons fermement que le cinéma et les séries sont des vecteurs puissants de découverte culturelle et d'ouverture sur le monde. À travers notre plateforme, nous souhaitons créer des ponts entre les cultures et offrir une fenêtre sur des univers narratifs riches et diversifiés.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Notre Histoire</h2>
        <p className="mb-4">
          Fondée en 2023 par une équipe de passionnés de cinéma international et de technologies, FloDrama est née d'un constat simple : malgré leur qualité et leur popularité croissante, de nombreux contenus asiatiques et internationaux restaient difficilement accessibles au public francophone.
        </p>
        <p className="mb-4">
          Ce qui a commencé comme un projet entre amis s'est rapidement transformé en une plateforme complète, conçue pour offrir une expérience de visionnage optimale et une interface intuitive permettant de découvrir facilement de nouveaux contenus.
        </p>
        <p>
          Aujourd'hui, FloDrama continue de grandir, enrichissant constamment son catalogue et améliorant ses fonctionnalités pour répondre aux attentes de sa communauté d'utilisateurs.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Notre Équipe</h2>
        <p className="mb-4">
          Derrière FloDrama se trouve une équipe internationale de développeurs, designers, traducteurs et experts en contenu, tous unis par leur passion pour le cinéma et les séries du monde entier.
        </p>
        <p>
          Notre diversité est notre force : elle nous permet de comprendre et de respecter les nuances culturelles des contenus que nous proposons, tout en créant une plateforme qui répond aux standards technologiques les plus élevés.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Nos Valeurs</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><span className="text-flodrama-fuchsia font-medium">Diversité culturelle</span> - Nous célébrons la richesse des cultures du monde à travers leurs expressions cinématographiques.</li>
          <li><span className="text-flodrama-fuchsia font-medium">Accessibilité</span> - Nous nous efforçons de rendre ces contenus accessibles à tous, avec des sous-titres de qualité et une plateforme intuitive.</li>
          <li><span className="text-flodrama-fuchsia font-medium">Innovation</span> - Nous recherchons constamment de nouvelles façons d'améliorer l'expérience utilisateur et d'enrichir notre offre.</li>
          <li><span className="text-flodrama-fuchsia font-medium">Communauté</span> - Nous valorisons les retours de notre communauté et évoluons en fonction de leurs besoins et attentes.</li>
          <li><span className="text-flodrama-fuchsia font-medium">Qualité</span> - Nous nous engageons à offrir des contenus de qualité et une expérience utilisateur sans faille.</li>
        </ul>
      </section>
    </FooterPage>
  );
};

export default APropos;
