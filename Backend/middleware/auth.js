/**
 * Middleware d'authentification
 * Vérifie si l'utilisateur est authentifié via JWT
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware pour protéger les routes
 * Vérifie le token JWT dans les en-têtes et authentifie l'utilisateur
 */
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Vérifier si le token est présent dans les en-têtes
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Extraire le token du format "Bearer [token]"
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Vérifier si le token est dans les cookies
      token = req.cookies.token;
    }
    
    // Vérifier si le token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé. Authentification requise.'
      });
    }
    
    try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Ajouter l'utilisateur à la requête
      req.user = await User.findById(decoded.id);
      
      // Vérifier si l'utilisateur existe toujours
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé avec ce token'
        });
      }
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }
  } catch (error) {
    console.error('Erreur dans le middleware d\'authentification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * Middleware pour restreindre l'accès aux rôles spécifiques
 * @param {...String} roles - Les rôles autorisés
 * @returns {Function} Middleware
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Vérifier si le rôle de l'utilisateur est dans la liste des rôles autorisés
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Le rôle ${req.user.role} n'est pas autorisé à accéder à cette ressource`
      });
    }
    next();
  };
};
