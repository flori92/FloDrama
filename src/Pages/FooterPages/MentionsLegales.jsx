/**
 * Page Mentions Légales
 * Informations légales concernant FloDrama
 */

import React from 'react';
import FooterPage from './FooterPage';

const MentionsLegales = () => {
  return (
    <FooterPage title="Mentions Légales">
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Informations sur l'éditeur</h2>
        <p className="mb-4">
          Le site FloDrama est édité par la société FloDrama SAS, société par actions simplifiée au capital de 50 000 euros, 
          immatriculée au Registre du Commerce et des Sociétés de Paris sous le numéro 123 456 789.
        </p>
        <p className="mb-4">
          <strong>Siège social</strong> : 123 Avenue des Dramas, 75001 Paris, France<br />
          <strong>Numéro de TVA intracommunautaire</strong> : FR 12 345 678 901<br />
          <strong>Directeur de la publication</strong> : Florence Durand, Présidente
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Hébergement</h2>
        <p className="mb-4">
          Le site FloDrama est hébergé par Cloudflare, Inc.<br />
          101 Townsend Street, San Francisco, CA 94107, États-Unis<br />
          <a href="https://www.cloudflare.com" target="_blank" rel="noopener noreferrer" className="text-flodrama-fuchsia hover:underline">www.cloudflare.com</a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Propriété intellectuelle</h2>
        <p className="mb-4">
          L'ensemble du contenu du site FloDrama (structure, textes, logos, images, vidéos, etc.) est protégé par le droit d'auteur 
          et est la propriété exclusive de FloDrama SAS ou de ses partenaires.
        </p>
        <p className="mb-4">
          Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, 
          quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation préalable écrite de FloDrama SAS.
        </p>
        <p>
          Les marques et logos présents sur le site sont des marques déposées par FloDrama SAS ou ses partenaires. 
          Toute reproduction, usage ou apposition de ces marques sans autorisation préalable écrite de FloDrama SAS 
          ou des titulaires respectifs est interdite.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Contenu du site</h2>
        <p className="mb-4">
          FloDrama SAS s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur son site. 
          Toutefois, elle ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition.
        </p>
        <p>
          Les informations présentes sur le site sont susceptibles d'être modifiées à tout moment et sans préavis. 
          FloDrama SAS ne pourra être tenue responsable des éventuelles erreurs, omissions ou des conséquences qui pourraient 
          en découler.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Liens hypertextes</h2>
        <p className="mb-4">
          Le site FloDrama peut contenir des liens hypertextes vers d'autres sites internet. FloDrama SAS n'exerce aucun contrôle 
          sur ces sites et décline toute responsabilité quant à leur contenu.
        </p>
        <p>
          La création de liens hypertextes vers le site FloDrama est soumise à l'autorisation préalable écrite de FloDrama SAS.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Données personnelles</h2>
        <p className="mb-4">
          Les informations concernant la collecte et le traitement des données personnelles sont détaillées dans notre 
          <a href="/footer/confidentialite" className="text-flodrama-fuchsia hover:underline ml-1">Politique de Confidentialité</a>.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-flodrama-fuchsia mb-4">Droit applicable et juridiction compétente</h2>
        <p className="mb-4">
          Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux français seront seuls compétents.
        </p>
        <p>
          Pour toute question relative à ces mentions légales, vous pouvez nous contacter à l'adresse : legal@flodrama.com
        </p>
      </section>
    </FooterPage>
  );
};

export default MentionsLegales;
