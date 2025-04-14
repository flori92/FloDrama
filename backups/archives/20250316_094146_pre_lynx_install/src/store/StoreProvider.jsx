import React from 'react';
import { createStore, useStore } from '@lynx/core';
import { AppConfig } from '../app.config';

// État initial de l'application
const etatInitial = {
  utilisateur: {
    connecte: false,
    preferences: {
      theme: 'sombre',
      langue: 'fr',
      qualiteVideo: AppConfig.ui.components.player.defaultQuality,
      sousTitresActifs: true
    }
  },
  contenu: {
    dramas: [],
    films: [],
    favoris: [],
    recherche: {
      resultats: [],
      enCours: false,
      erreur: null
    }
  },
  interface: {
    chargement: false,
    erreur: null,
    navigation: {
      routeActuelle: 'accueil',
      historique: []
    },
    filtres: {
      categorie: 'tous',
      pays: 'tous',
      annee: 'tous',
      statut: 'tous'
    }
  },
  cache: {
    derniereMiseAJour: null,
    donneesHorsLigne: {}
  }
};

// Actions disponibles
const actions = {
  // Actions utilisateur
  connexionUtilisateur: (state, payload) => ({
    ...state,
    utilisateur: {
      ...state.utilisateur,
      connecte: true,
      ...payload
    }
  }),

  miseAJourPreferences: (state, preferences) => ({
    ...state,
    utilisateur: {
      ...state.utilisateur,
      preferences: {
        ...state.utilisateur.preferences,
        ...preferences
      }
    }
  }),

  // Actions contenu
  chargerDramas: (state, dramas) => ({
    ...state,
    contenu: {
      ...state.contenu,
      dramas
    }
  }),

  ajouterFavori: (state, drama) => ({
    ...state,
    contenu: {
      ...state.contenu,
      favoris: [...state.contenu.favoris, drama]
    }
  }),

  retirerFavori: (state, dramaId) => ({
    ...state,
    contenu: {
      ...state.contenu,
      favoris: state.contenu.favoris.filter(f => f.id !== dramaId)
    }
  }),

  // Actions interface
  definirChargement: (state, chargement) => ({
    ...state,
    interface: {
      ...state.interface,
      chargement
    }
  }),

  definirErreur: (state, erreur) => ({
    ...state,
    interface: {
      ...state.interface,
      erreur
    }
  }),

  changerRoute: (state, route) => ({
    ...state,
    interface: {
      ...state.interface,
      navigation: {
        ...state.interface.navigation,
        routeActuelle: route,
        historique: [...state.interface.navigation.historique, route]
      }
    }
  }),

  appliquerFiltres: (state, filtres) => ({
    ...state,
    interface: {
      ...state.interface,
      filtres: {
        ...state.interface.filtres,
        ...filtres
      }
    }
  }),

  // Actions cache
  mettreAJourCache: (state, donnees) => ({
    ...state,
    cache: {
      derniereMiseAJour: new Date().toISOString(),
      donneesHorsLigne: {
        ...state.cache.donneesHorsLigne,
        ...donnees
      }
    }
  })
};

// Création du store
const store = createStore({
  initialState: etatInitial,
  actions,
  middleware: [
    // Middleware de logging en développement
    (state, action) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Action:', action.type, action.payload);
        console.log('Nouvel état:', state);
      }
      return state;
    },
    // Middleware de persistence
    async (state) => {
      try {
        await localStorage.setItem('flodrama_state', JSON.stringify({
          utilisateur: state.utilisateur,
          contenu: {
            favoris: state.contenu.favoris
          },
          cache: state.cache
        }));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'état:', error);
      }
      return state;
    }
  ]
});

// Contexte pour le store
const StoreContext = React.createContext(null);

// Provider du store
export const StoreProvider = ({ children }) => {
  return (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  );
};

// Hook personnalisé pour utiliser le store
export const useAppStore = () => {
  const store = React.useContext(StoreContext);
  if (!store) {
    throw new Error('useAppStore doit être utilisé dans un StoreProvider');
  }
  return useStore(store);
};

// Sélecteurs pour accéder à l'état
export const selectors = {
  utilisateur: {
    estConnecte: state => state.utilisateur.connecte,
    preferences: state => state.utilisateur.preferences
  },
  contenu: {
    dramas: state => state.contenu.dramas,
    favoris: state => state.contenu.favoris,
    recherche: state => state.contenu.recherche
  },
  interface: {
    chargement: state => state.interface.chargement,
    erreur: state => state.interface.erreur,
    routeActuelle: state => state.interface.navigation.routeActuelle,
    filtres: state => state.interface.filtres
  },
  cache: {
    donnees: state => state.cache.donneesHorsLigne,
    derniereMiseAJour: state => state.cache.derniereMiseAJour
  }
};
