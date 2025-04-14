/**
 * Modèle Utilisateur pour MongoDB
 * Ce modèle définit la structure des données utilisateur dans la base de données
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Schéma utilisateur
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Veuillez fournir un nom'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  email: {
    type: String,
    required: [true, 'Veuillez fournir un email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Veuillez fournir un email valide'
    ]
  },
  password: {
    type: String,
    required: [true, 'Veuillez fournir un mot de passe'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    select: false // Ne pas inclure le mot de passe dans les requêtes par défaut
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'dark'
    },
    language: {
      type: String,
      enum: ['fr', 'en', 'ko', 'jp'],
      default: 'fr'
    },
    notifications: {
      type: Boolean,
      default: true
    },
    subtitles: {
      type: Boolean,
      default: true
    }
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  }],
  watchHistory: [{
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content'
    },
    progress: {
      type: Number,
      default: 0
    },
    lastWatched: {
      type: Date,
      default: Date.now
    }
  }],
  role: {
    type: String,
    enum: ['user', 'premium', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
});

// Middleware pour hacher le mot de passe avant l'enregistrement
userSchema.pre('save', async function(next) {
  // Ne pas rehacher le mot de passe s'il n'a pas été modifié
  if (!this.isModified('password')) {
    next();
  }
  
  // Génération du sel et hachage du mot de passe
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Méthode pour générer un JWT
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Méthode pour vérifier si le mot de passe est correct
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Méthode pour ajouter un contenu aux favoris
userSchema.methods.addToFavorites = async function(contentId) {
  if (!this.favorites.includes(contentId)) {
    this.favorites.push(contentId);
    await this.save();
  }
  return this.favorites;
};

// Méthode pour supprimer un contenu des favoris
userSchema.methods.removeFromFavorites = async function(contentId) {
  this.favorites = this.favorites.filter(
    favorite => favorite.toString() !== contentId.toString()
  );
  await this.save();
  return this.favorites;
};

// Méthode pour mettre à jour l'historique de visionnage
userSchema.methods.updateWatchHistory = async function(contentId, progress) {
  const historyItem = this.watchHistory.find(
    item => item.content.toString() === contentId.toString()
  );
  
  if (historyItem) {
    historyItem.progress = progress;
    historyItem.lastWatched = Date.now();
  } else {
    this.watchHistory.push({
      content: contentId,
      progress,
      lastWatched: Date.now()
    });
  }
  
  await this.save();
  return this.watchHistory;
};

module.exports = mongoose.model('User', userSchema);
