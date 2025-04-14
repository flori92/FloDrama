/**
 * Routes de contenu
 * Définit les endpoints pour la gestion des contenus (dramas, films, animés)
 */

const express = require('express');
const router = express.Router();
const { 
  getContents, 
  getContent, 
  createContent, 
  updateContent, 
  deleteContent,
  addEpisode,
  getPopularContents,
  rateContent
} = require('../controllers/contentController');
const { protect, authorize } = require('../middleware/auth');

// Routes publiques
router.get('/', getContents);
router.get('/popular', getPopularContents);
router.get('/:id', getContent);

// Routes protégées (nécessitent une authentification)
router.post('/:id/rate', protect, rateContent);

// Routes réservées aux administrateurs
router.post('/', protect, authorize('admin'), createContent);
router.put('/:id', protect, authorize('admin'), updateContent);
router.delete('/:id', protect, authorize('admin'), deleteContent);
router.post('/:id/episodes', protect, authorize('admin'), addEpisode);

module.exports = router;
