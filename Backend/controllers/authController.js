/**
 * Contrôleur d'authentification
 * Gère les fonctionnalités d'inscription, connexion et gestion des utilisateurs
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

/**
 * @desc    Inscription d'un nouvel utilisateur
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Créer un nouvel utilisateur
    const user = await User.create({
      name,
      email,
      password
    });

    // Générer un token JWT
    const token = user.getSignedJwtToken();

    // Répondre avec le token et les informations utilisateur
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences,
        favorites: []
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message
    });
  }
};

/**
 * @desc    Connexion d'un utilisateur
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Valider les entrées
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir un email et un mot de passe'
      });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Vérifier si le mot de passe correspond
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Mettre à jour la date de dernière connexion
    user.lastLogin = Date.now();
    await user.save();

    // Générer un token JWT
    const token = user.getSignedJwtToken();

    // Répondre avec le token et les informations utilisateur
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences,
        favorites: user.favorites
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
};

/**
 * @desc    Obtenir le profil de l'utilisateur connecté
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    // L'utilisateur est déjà disponible dans req.user grâce au middleware d'authentification
    const user = await User.findById(req.user.id).populate('favorites', 'title poster type');

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences,
        favorites: user.favorites,
        watchHistory: user.watchHistory
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
};

/**
 * @desc    Mettre à jour le profil de l'utilisateur
 * @route   PUT /api/auth/me
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, preferences } = req.body;
    
    // Construire l'objet de mise à jour
    const updateData = {};
    if (name) updateData.name = name;
    if (preferences) updateData.preferences = preferences;

    // Mettre à jour le profil
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
      error: error.message
    });
  }
};

/**
 * @desc    Mettre à jour le mot de passe
 * @route   PUT /api/auth/password
 * @access  Private
 */
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Vérifier si les mots de passe sont fournis
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir le mot de passe actuel et le nouveau mot de passe'
      });
    }

    // Récupérer l'utilisateur avec le mot de passe
    const user = await User.findById(req.user.id).select('+password');

    // Vérifier si le mot de passe actuel est correct
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Mot de passe mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du mot de passe',
      error: error.message
    });
  }
};

/**
 * @desc    Gérer les favoris (ajouter/supprimer)
 * @route   POST /api/auth/favorites
 * @access  Private
 */
exports.manageFavorites = async (req, res) => {
  try {
    const { contentId, action } = req.body;

    // Vérifier si contentId et action sont fournis
    if (!contentId || !action) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir l\'ID du contenu et l\'action (add/remove)'
      });
    }

    const user = await User.findById(req.user.id);

    let favorites;
    if (action === 'add') {
      favorites = await user.addToFavorites(contentId);
    } else if (action === 'remove') {
      favorites = await user.removeFromFavorites(contentId);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Action invalide. Utilisez "add" ou "remove"'
      });
    }

    res.status(200).json({
      success: true,
      data: favorites
    });
  } catch (error) {
    console.error('Erreur lors de la gestion des favoris:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la gestion des favoris',
      error: error.message
    });
  }
};

/**
 * @desc    Mettre à jour l'historique de visionnage
 * @route   POST /api/auth/watch-history
 * @access  Private
 */
exports.updateWatchHistory = async (req, res) => {
  try {
    const { contentId, progress } = req.body;

    // Vérifier si contentId et progress sont fournis
    if (!contentId || progress === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir l\'ID du contenu et la progression'
      });
    }

    const user = await User.findById(req.user.id);
    const watchHistory = await user.updateWatchHistory(contentId, progress);

    res.status(200).json({
      success: true,
      data: watchHistory
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'historique de visionnage:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'historique de visionnage',
      error: error.message
    });
  }
};
