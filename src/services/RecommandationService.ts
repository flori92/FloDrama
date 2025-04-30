// Service de recommandation simplifié pour FloDrama
// Ce service fournit des recommandations de contenu basées sur les préférences utilisateur

export interface ContenuMedia {
  id: string;
  titre: string;
  description: string;
  imageUrl: string;
  type: 'film' | 'serie' | 'anime';
  genres: string[];
  note?: number;
  duree?: number;
}

export interface PreferencesUtilisateur {
  genresPrefers: string[];
  historique: string[];
  favoris: string[];
}

class RecommandationService {
  /**
   * Récupère des recommandations personnalisées pour un utilisateur
   * @param userId Identifiant de l'utilisateur
   * @param preferences Préférences de l'utilisateur
   * @param limit Nombre maximum de recommandations à retourner
   * @returns Liste des contenus recommandés
   */
  async getRecommandations(
    userId: string,
    preferences: PreferencesUtilisateur,
    limit: number = 10
  ): Promise<ContenuMedia[]> {
    try {
      // Dans une implémentation réelle, cela ferait un appel API
      // Pour l'exemple, nous utilisons des données statiques
      const recommandations: ContenuMedia[] = [
        {
          id: '1',
          titre: 'Crash Landing on You',
          description: 'Une héritière sud-coréenne atterrit accidentellement en Corée du Nord après un accident de parapente.',
          imageUrl: '/images/dramas/crash-landing-on-you.jpg',
          type: 'serie',
          genres: ['Romance', 'Drame', 'Comédie'],
          note: 9.2,
          duree: 70
        },
        {
          id: '2',
          titre: 'Itaewon Class',
          description: 'Un ex-détenu et ses amis luttent pour réussir dans le quartier animé d\'Itaewon.',
          imageUrl: '/images/dramas/itaewon-class.jpg',
          type: 'serie',
          genres: ['Drame', 'Affaires'],
          note: 8.7,
          duree: 70
        },
        {
          id: '3',
          titre: 'Demon Slayer',
          description: 'Tanjiro devient un chasseur de démons après que sa famille a été massacrée et sa sœur transformée en démon.',
          imageUrl: '/images/animes/demon-slayer.jpg',
          type: 'anime',
          genres: ['Action', 'Aventure', 'Surnaturel'],
          note: 9.5,
          duree: 24
        },
        {
          id: '4',
          titre: 'Parasite',
          description: 'Une famille pauvre s\'infiltre dans la maison d\'une famille riche, avec des conséquences inattendues.',
          imageUrl: '/images/films/parasite.jpg',
          type: 'film',
          genres: ['Drame', 'Thriller', 'Comédie noire'],
          note: 9.3,
          duree: 132
        },
        {
          id: '5',
          titre: 'Kingdom',
          description: 'Dans la Corée médiévale, un prince héritier enquête sur une mystérieuse épidémie.',
          imageUrl: '/images/dramas/kingdom.jpg',
          type: 'serie',
          genres: ['Historique', 'Horreur', 'Action'],
          note: 8.9,
          duree: 50
        },
        {
          id: '6',
          titre: 'Your Name',
          description: 'Deux adolescents découvrent qu\'ils échangent leurs corps pendant leur sommeil.',
          imageUrl: '/images/animes/your-name.jpg',
          type: 'anime',
          genres: ['Romance', 'Fantastique', 'Drame'],
          note: 9.4,
          duree: 106
        },
        {
          id: '7',
          titre: 'Squid Game',
          description: 'Des personnes endettées participent à des jeux d\'enfants mortels pour gagner une somme d\'argent colossale.',
          imageUrl: '/images/dramas/squid-game.jpg',
          type: 'serie',
          genres: ['Thriller', 'Drame', 'Action'],
          note: 8.8,
          duree: 60
        },
        {
          id: '8',
          titre: 'Attack on Titan',
          description: 'L\'humanité lutte pour sa survie contre des géants mangeurs d\'hommes appelés Titans.',
          imageUrl: '/images/animes/attack-on-titan.jpg',
          type: 'anime',
          genres: ['Action', 'Drame', 'Fantastique'],
          note: 9.6,
          duree: 24
        },
        {
          id: '9',
          titre: 'Oldboy',
          description: 'Un homme cherche à se venger après avoir été emprisonné pendant 15 ans sans explication.',
          imageUrl: '/images/films/oldboy.jpg',
          type: 'film',
          genres: ['Thriller', 'Mystère', 'Action'],
          note: 8.9,
          duree: 120
        },
        {
          id: '10',
          titre: 'Vincenzo',
          description: 'Un avocat italo-coréen de la mafia revient en Corée et utilise ses compétences pour combattre une entreprise corrompue.',
          imageUrl: '/images/dramas/vincenzo.jpg',
          type: 'serie',
          genres: ['Comédie', 'Crime', 'Drame'],
          note: 9.1,
          duree: 80
        }
      ];

      // Filtrer les recommandations selon les préférences
      const filteredRecommandations = this.filterByPreferences(recommandations, preferences);
      
      // Limiter le nombre de résultats
      return filteredRecommandations.slice(0, limit);
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations:', error);
      throw error;
    }
  }

  /**
   * Filtre les contenus selon les préférences de l'utilisateur
   * @param contenus Liste des contenus à filtrer
   * @param preferences Préférences de l'utilisateur
   * @returns Liste filtrée et triée par pertinence
   */
  private filterByPreferences(
    contenus: ContenuMedia[],
    preferences: PreferencesUtilisateur
  ): ContenuMedia[] {
    // Calculer un score de pertinence pour chaque contenu
    const scoredContenus = contenus.map(contenu => {
      let score = 0;
      
      // Score basé sur les genres préférés
      const genreMatches = contenu.genres.filter(genre => 
        preferences.genresPrefers.includes(genre.toLowerCase())
      ).length;
      score += genreMatches * 2;
      
      // Bonus pour les contenus bien notés
      if (contenu.note && contenu.note > 8.5) {
        score += (contenu.note - 8.5) * 2;
      }
      
      // Éviter de recommander des contenus déjà vus
      if (preferences.historique.includes(contenu.id)) {
        score -= 10;
      }
      
      // Bonus pour les favoris (similaires)
      if (preferences.favoris.some(favId => {
        const fav = contenus.find(c => c.id === favId);
        return fav && fav.genres.some(g => contenu.genres.includes(g));
      })) {
        score += 3;
      }
      
      return { ...contenu, score };
    });
    
    // Trier par score décroissant
    return scoredContenus
      .sort((a, b) => (b as any).score - (a as any).score)
      .map(({ score, ...contenu }) => contenu);
  }
}

export default new RecommandationService();
