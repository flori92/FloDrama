import express from 'express';
import RecommandationController from '../controllers/RecommandationController';
import { authenticateJWT } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

/**
 * @swagger
 * /api/recommandations/{userId}:
 *   get:
 *     summary: Récupère les recommandations pour un utilisateur
 *     tags: [Recommandations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Liste des contenus recommandés
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 */
router.get(
  '/:userId',
  authenticateJWT,
  rateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30 // limite de 30 requêtes par fenêtre
  }),
  RecommandationController.getRecommandations
);

/**
 * @swagger
 * /api/recommandations/{userId}/preferences:
 *   patch:
 *     summary: Met à jour les préférences d'un utilisateur
 *     tags: [Recommandations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               genresPrefers:
 *                 type: array
 *                 items:
 *                   type: string
 *               languesPreferees:
 *                 type: array
 *                 items:
 *                   type: string
 *               parametres:
 *                 type: object
 *     responses:
 *       200:
 *         description: Préférences mises à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 */
router.patch(
  '/:userId/preferences',
  authenticateJWT,
  rateLimiter({
    windowMs: 1 * 60 * 1000,
    max: 10
  }),
  RecommandationController.updatePreferences
);

/**
 * @swagger
 * /api/recommandations/{userId}/visionnages:
 *   post:
 *     summary: Enregistre un visionnage de contenu
 *     tags: [Recommandations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contenuId
 *               - tempsVisionnage
 *               - termine
 *             properties:
 *               contenuId:
 *                 type: string
 *               tempsVisionnage:
 *                 type: integer
 *                 minimum: 0
 *               termine:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Visionnage enregistré avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Non autorisé
 */
router.post(
  '/:userId/visionnages',
  authenticateJWT,
  rateLimiter({
    windowMs: 1 * 60 * 1000,
    max: 60
  }),
  RecommandationController.enregistrerVisionnage
);

export default router;
