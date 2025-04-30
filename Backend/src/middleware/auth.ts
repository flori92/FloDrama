import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

interface JwtPayload {
  userId: string;
  role: string;
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        status: 'error',
        message: 'Token d\'authentification manquant'
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'votre-secret-par-defaut';

    const decoded = jwt.verify(token, secret) as JwtPayload;
    
    // Ajouter les informations de l'utilisateur à la requête
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    next();
  } catch (error) {
    logger.error('Erreur d\'authentification:', error);
    return res.status(403).json({
      status: 'error',
      message: 'Token invalide ou expiré'
    });
  }
};

// Middleware pour vérifier les rôles
export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        status: 'error',
        message: 'Accès non autorisé'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Privilèges insuffisants'
      });
    }

    next();
  };
};

// Déclaration des types pour Express
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}
