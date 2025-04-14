/**
 * Routes d'authentification
 * Définit les endpoints pour l'inscription, la connexion et la gestion des utilisateurs
 */

const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  updateProfile, 
  updatePassword,
  manageFavorites,
  updateWatchHistory
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Routes publiques
router.post('/register', register);
router.post('/login', login);

// Routes protégées (nécessitent une authentification)
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.post('/favorites', protect, manageFavorites);
router.post('/watch-history', protect, updateWatchHistory);

module.exports = router;
