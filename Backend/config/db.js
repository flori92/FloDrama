/**
 * Configuration de la connexion à MongoDB Atlas
 * Ce module gère la connexion à la base de données MongoDB Atlas
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Chargement des variables d'environnement
dotenv.config();

// Récupération de l'URI MongoDB depuis les variables d'environnement
const mongoURI = process.env.MONGODB_URI.replace('${MONGODB_PASSWORD}', process.env.MONGODB_PASSWORD);

// Options de connexion MongoDB
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: true,
};

/**
 * Établit la connexion à MongoDB Atlas
 * @returns {Promise} Une promesse résolue lorsque la connexion est établie
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(mongoURI, options);
    console.log(`MongoDB connecté: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Erreur de connexion à MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
