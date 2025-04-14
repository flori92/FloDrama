/**
 * Serveur API FloDrama
 * Gère les requêtes API pour l'authentification et les contenus
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const contentRoutes = require('./routes/contentRoutes');
const path = require('path');

// Chargement des variables d'environnement
dotenv.config();

// Connexion à MongoDB Atlas
connectDB();

// Initialisation de l'application Express
const app = express();

// Middleware pour parser le JSON
app.use(express.json());

// Middleware pour les requêtes cross-origin
app.use(cors());

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);

// Route de test pour vérifier que l'API fonctionne
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    message: 'API FloDrama fonctionnelle',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Servir les fichiers statiques en production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../')));
  
  app.get('*', (req, res) => {
    // Exclure les routes API
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.resolve(__dirname, '../', 'index-optimise.html'));
    }
  });
}

// Port pour le serveur API
const PORT = process.env.PORT || 8090;

// Démarrer le serveur
const server = app.listen(PORT, () => {
  console.log(`Serveur API démarré sur le port ${PORT} en mode ${process.env.NODE_ENV}`);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err, promise) => {
  console.error(`Erreur non gérée: ${err.message}`);
  // Fermer le serveur et quitter le processus
  server.close(() => process.exit(1));
});
