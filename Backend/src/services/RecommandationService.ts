import { Document } from 'mongoose';
import Contenu, { IContenu } from '../models/Contenu';
import PreferencesUtilisateur, { IPreferencesUtilisateur } from '../models/PreferencesUtilisateur';
import Redis from 'ioredis';
import { logger } from '../utils/logger';

interface ScoreContenu {
  contenu: IContenu;
  score: number;
}

class RecommandationService {
  private redis: Redis;
  private static CACHE_TTL = 300; // 5 minutes en secondes
  private static CACHE_PREFIX = 'recommandations:';

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
  }

  /**
   * Calcule un score de recommandation pour un contenu
   */
  private async calculerScore(
    contenu: IContenu,
    preferences: IPreferencesUtilisateur
  ): Promise<number> {
    let score = 0;

    try {
      // Score basé sur les genres préférés
      const genresCommuns = contenu.genres.filter(genre => 
        preferences.genresPrefers.includes(genre)
      );
      score += genresCommuns.length * 2;

      // Score basé sur la note moyenne du genre
      const noteGenre = preferences.notesMoyennes.get(contenu.genres[0]) || 0;
      score += noteGenre;

      // Score basé sur la popularité (vues)
      score += Math.log(contenu.vues + 1) * 0.5;

      // Score basé sur la fraîcheur du contenu
      const ageEnJours = (Date.now() - contenu.dateAjout.getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 5 - Math.log(ageEnJours + 1));

      // Pénalité pour les contenus déjà vus
      const dejaVu = preferences.historique.some(h => h.contenuId === contenu._id.toString());
      if (dejaVu) {
        score -= 3;
      }

      // Bonus pour les contenus favoris
      if (preferences.favoris.includes(contenu._id.toString())) {
        score += 2;
      }

      // Bonus pour la langue préférée
      if (contenu.langue === preferences.parametres.langueAudioPreferee) {
        score += 1;
      }

      return Math.max(0, score); // Score minimum de 0
    } catch (error) {
      logger.error('Erreur lors du calcul du score:', error);
      return 0;
    }
  }

  /**
   * Récupère la clé de cache pour un utilisateur
   */
  private getCacheKey(userId: string, limit: number): string {
    return `${RecommandationService.CACHE_PREFIX}${userId}:${limit}`;
  }

  /**
   * Récupère les recommandations depuis le cache
   */
  private async getFromCache(userId: string, limit: number): Promise<IContenu[] | null> {
    try {
      const cacheKey = this.getCacheKey(userId, limit);
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      logger.error('Erreur lors de la récupération du cache:', error);
      return null;
    }
  }

  /**
   * Sauvegarde les recommandations dans le cache
   */
  private async saveToCache(
    userId: string,
    limit: number,
    recommandations: IContenu[]
  ): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(userId, limit);
      await this.redis.setex(
        cacheKey,
        RecommandationService.CACHE_TTL,
        JSON.stringify(recommandations)
      );
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde dans le cache:', error);
    }
  }

  /**
   * Récupère les recommandations pour un utilisateur
   */
  async getRecommandations(userId: string, limit: number = 10): Promise<IContenu[]> {
    try {
      // Vérifier le cache
      const cachedRecommandations = await this.getFromCache(userId, limit);
      if (cachedRecommandations) {
        return cachedRecommandations;
      }

      // Récupérer les préférences de l'utilisateur
      const preferences = await PreferencesUtilisateur.findOne({ userId });
      if (!preferences) {
        throw new Error('Préférences utilisateur non trouvées');
      }

      // Récupérer les contenus potentiels
      const contenus = await Contenu.find({
        _id: { $nin: preferences.historique.map(h => h.contenuId) }
      }).limit(100); // Limite initiale plus large pour le filtrage

      // Calculer les scores pour chaque contenu
      const scoresPromises: Promise<ScoreContenu>[] = contenus.map(async contenu => ({
        contenu,
        score: await this.calculerScore(contenu, preferences)
      }));

      const scores = await Promise.all(scoresPromises);

      // Trier par score et prendre les meilleurs
      const recommandations = scores
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.contenu);

      // Sauvegarder dans le cache
      await this.saveToCache(userId, limit, recommandations);

      return recommandations;
    } catch (error) {
      logger.error('Erreur lors de la récupération des recommandations:', error);
      throw error;
    }
  }

  /**
   * Met à jour les préférences utilisateur
   */
  async mettreAJourPreferences(
    userId: string,
    updates: Partial<IPreferencesUtilisateur>
  ): Promise<IPreferencesUtilisateur> {
    try {
      const preferences = await PreferencesUtilisateur.findOneAndUpdate(
        { userId },
        { 
          $set: { ...updates, derniereActivite: new Date() }
        },
        { new: true, upsert: true }
      );

      if (!preferences) {
        throw new Error('Erreur lors de la mise à jour des préférences');
      }

      // Invalider le cache des recommandations
      const cachePattern = `${RecommandationService.CACHE_PREFIX}${userId}:*`;
      const keys = await this.redis.keys(cachePattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      return preferences;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des préférences:', error);
      throw error;
    }
  }

  /**
   * Enregistre un visionnage de contenu
   */
  async enregistrerVisionnage(
    userId: string,
    contenuId: string,
    tempsVisionnage: number,
    termine: boolean
  ): Promise<void> {
    try {
      await PreferencesUtilisateur.updateOne(
        { userId },
        {
          $push: {
            historique: {
              contenuId,
              dateVisionnage: new Date(),
              tempsVisionnage,
              termine
            }
          }
        }
      );

      // Mettre à jour les statistiques du contenu
      await Contenu.updateOne(
        { _id: contenuId },
        { $inc: { vues: 1 } }
      );

      // Invalider le cache
      const cachePattern = `${RecommandationService.CACHE_PREFIX}${userId}:*`;
      const keys = await this.redis.keys(cachePattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement du visionnage:', error);
      throw error;
    }
  }
}

// Créer et exporter l'instance unique du service
const recommandationService = new RecommandationService();
export default recommandationService;
