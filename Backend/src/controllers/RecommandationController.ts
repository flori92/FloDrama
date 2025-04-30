import { Request, Response } from 'express';
import { validationResult, body, param, query } from 'express-validator';
import RecommandationService from '../services/RecommandationService';
import { logger } from '../utils/logger';

/**
 * Contrôleur pour la gestion des recommandations
 * Expose les endpoints REST pour le système de recommandation
 */
class RecommandationController {
  /**
   * Récupère les recommandations pour un utilisateur
   * GET /api/recommandations/:userId
   */
  static getRecommandations = [
    // Validation des paramètres
    param('userId').isString().notEmpty(),
    query('limit').optional().isInt({ min: 1, max: 50 }),

    async (req: Request, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            status: 'error',
            message: 'Paramètres invalides',
            errors: errors.array()
          });
        }

        const { userId } = req.params;
        const limit = parseInt(req.query.limit as string) || 10;

        const recommandations = await RecommandationService.getRecommandations(
          userId,
          limit
        );

        logger.info(`Recommandations récupérées pour l'utilisateur ${userId}`);

        return res.status(200).json({
          status: 'success',
          data: recommandations
        });
      } catch (error) {
        logger.error('Erreur lors de la récupération des recommandations:', error);
        return res.status(500).json({
          status: 'error',
          message: 'Erreur serveur lors de la récupération des recommandations'
        });
      }
    }
  ];

  /**
   * Met à jour les préférences d'un utilisateur
   * PATCH /api/recommandations/:userId/preferences
   */
  static updatePreferences = [
    // Validation des paramètres
    param('userId').isString().notEmpty(),
    body('genresPrefers').optional().isArray(),
    body('languesPreferees').optional().isArray(),
    body('parametres').optional().isObject(),

    async (req: Request, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            status: 'error',
            message: 'Données invalides',
            errors: errors.array()
          });
        }

        const { userId } = req.params;
        const updates = req.body;

        const preferences = await RecommandationService.mettreAJourPreferences(
          userId,
          updates
        );

        logger.info(`Préférences mises à jour pour l'utilisateur ${userId}`);

        return res.status(200).json({
          status: 'success',
          data: preferences
        });
      } catch (error) {
        logger.error('Erreur lors de la mise à jour des préférences:', error);
        return res.status(500).json({
          status: 'error',
          message: 'Erreur serveur lors de la mise à jour des préférences'
        });
      }
    }
  ];

  /**
   * Enregistre un visionnage de contenu
   * POST /api/recommandations/:userId/visionnages
   */
  static enregistrerVisionnage = [
    // Validation des paramètres
    param('userId').isString().notEmpty(),
    body('contenuId').isString().notEmpty(),
    body('tempsVisionnage').isInt({ min: 0 }),
    body('termine').isBoolean(),

    async (req: Request, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            status: 'error',
            message: 'Données invalides',
            errors: errors.array()
          });
        }

        const { userId } = req.params;
        const { contenuId, tempsVisionnage, termine } = req.body;

        await RecommandationService.enregistrerVisionnage(
          userId,
          contenuId,
          tempsVisionnage,
          termine
        );

        logger.info(`Visionnage enregistré pour l'utilisateur ${userId}, contenu ${contenuId}`);

        return res.status(200).json({
          status: 'success',
          message: 'Visionnage enregistré avec succès'
        });
      } catch (error) {
        logger.error('Erreur lors de l\'enregistrement du visionnage:', error);
        return res.status(500).json({
          status: 'error',
          message: 'Erreur serveur lors de l\'enregistrement du visionnage'
        });
      }
    }
  ];
}

export default RecommandationController;
