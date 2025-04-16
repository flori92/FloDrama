import { I18nManager } from '@lynx/core';

// Configuration des langues supportées
export const LANGUES_SUPPORTEES = ['fr', 'en', 'ko'];

// Configuration des traductions
const traductions = {
  fr: {
    commun: {
      chargement: 'Chargement...',
      erreur: 'Une erreur est survenue',
      retry: 'Réessayer',
      voir_plus: 'Voir plus',
      voir_moins: 'Voir moins',
      rechercher: 'Rechercher',
      aucun_resultat: 'Aucun résultat trouvé',
    },
    navigation: {
      accueil: 'Accueil',
      dramas: 'Dramas',
      films: 'Films',
      favoris: 'Favoris',
      recherche: 'Recherche',
      parametres: 'Paramètres',
    },
    lecteur: {
      qualite: {
        auto: 'Auto',
        hd: 'HD',
        titre: 'Qualité',
      },
      soustitres: {
        active: 'Activer',
        desactive: 'Désactiver',
        titre: 'Sous-titres',
      },
      controles: {
        play: 'Lecture',
        pause: 'Pause',
        suivant: 'Suivant',
        precedent: 'Précédent',
      },
    },
    dramas: {
      categories: {
        tous: 'Tous',
        action: 'Action',
        comedie: 'Comédie',
        romance: 'Romance',
        thriller: 'Thriller',
        historique: 'Historique',
      },
      filtres: {
        titre: 'Filtres',
        pays: 'Pays',
        annee: 'Année',
        statut: 'Statut',
        appliquer: 'Appliquer',
        reinitialiser: 'Réinitialiser',
      },
      statuts: {
        en_cours: 'En cours',
        termine: 'Terminé',
        a_venir: 'À venir',
      },
    },
    erreurs: {
      reseau: 'Erreur de connexion',
      serveur: 'Erreur serveur',
      auth: 'Erreur d\'authentification',
      validation: 'Erreur de validation',
      non_trouve: 'Page non trouvée',
    },
  },
  en: {
    // English translations...
  },
  ko: {
    // Korean translations...
  },
};

// Configuration du gestionnaire de traductions
export const i18nConfig = {
  defaultLocale: 'fr',
  supportedLocales: LANGUES_SUPPORTEES,
  translations: traductions,
  fallback: 'fr',
  interpolation: {
    prefix: '{{',
    suffix: '}}',
  },
  pluralization: {
    fr: (count) => (count > 1 ? 1 : 0),
    en: (count) => (count !== 1 ? 1 : 0),
    ko: () => 0, // Le coréen n'utilise pas la pluralisation
  },
};

// Initialisation du gestionnaire de traductions
I18nManager.init(i18nConfig);

// Hook personnalisé pour utiliser les traductions
export const useTraduction = (namespace) => {
  const { t, locale, setLocale } = I18nManager.useTranslation();

  return {
    t: (key, options) => t(`${namespace}.${key}`, options),
    locale,
    setLocale,
    isRTL: I18nManager.isRTL,
  };
};

// Utilitaire pour formater les dates selon la locale
export const formaterDate = (date, format = 'long') => {
  const locale = I18nManager.getLocale();
  const options = {
    short: {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    },
    long: {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
    full: {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  };

  return new Date(date).toLocaleDateString(locale, options[format]);
};
