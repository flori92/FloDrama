/**
 * Point d'entrée pour tous les adaptateurs
 * Exporte tous les adaptateurs pour faciliter l'importation
 */

// Importer les adaptateurs
import lynxCore from './lynx-core';
import * as lynxStyled from './lynx-styled';
import * as reactNavigation from './react-navigation-adapter';

// Exporter les adaptateurs de composants UI
export * from './lynx-core';
export * from './lynx-styled';
export * from './react-navigation-adapter';

// Exporter par défaut un objet avec tous les adaptateurs
const adapters = {
  ...lynxCore,
  ...lynxStyled,
  ...reactNavigation
};

export default adapters;
