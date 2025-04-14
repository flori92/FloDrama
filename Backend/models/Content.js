/**
 * Modèle de contenu pour MongoDB
 * Ce modèle définit la structure des données de contenu (dramas, films, animés) dans la base de données
 */

const mongoose = require('mongoose');

// Schéma pour les épisodes
const episodeSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  duration: {
    type: Number, // Durée en minutes
    required: true
  },
  thumbnail: {
    type: String,
    default: '/assets/static/placeholders/thumbnail-placeholder.svg'
  },
  videoUrl: {
    type: String,
    required: true
  },
  releaseDate: {
    type: Date,
    default: Date.now
  },
  subtitles: [{
    language: {
      type: String,
      enum: ['fr', 'en', 'ko', 'jp'],
      required: true
    },
    url: {
      type: String,
      required: true
    }
  }]
});

// Schéma pour les acteurs/actrices
const castSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  character: {
    type: String
  },
  photo: {
    type: String,
    default: '/assets/static/placeholders/profile-placeholder.svg'
  }
});

// Schéma principal de contenu
const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Veuillez fournir un titre'],
    trim: true,
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  originalTitle: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['drama', 'film', 'anime'],
    required: [true, 'Veuillez spécifier le type de contenu']
  },
  category: {
    type: String,
    enum: ['action', 'comédie', 'romance', 'thriller', 'historique', 'fantastique', 'sci-fi', 'slice-of-life'],
    required: [true, 'Veuillez spécifier une catégorie']
  },
  country: {
    type: String,
    enum: ['corée', 'japon', 'chine', 'thaïlande', 'taiwan'],
    required: [true, 'Veuillez spécifier le pays d\'origine']
  },
  description: {
    type: String,
    required: [true, 'Veuillez fournir une description'],
    trim: true
  },
  poster: {
    type: String,
    default: '/assets/static/placeholders/poster-placeholder.svg'
  },
  backdrop: {
    type: String,
    default: '/assets/static/placeholders/backdrop-placeholder.svg'
  },
  releaseYear: {
    type: Number,
    required: [true, 'Veuillez spécifier l\'année de sortie']
  },
  episodes: [episodeSchema],
  totalEpisodes: {
    type: Number,
    default: 1
  },
  duration: {
    type: Number, // Durée en minutes (pour les films)
    default: 0
  },
  cast: [castSchema],
  director: {
    type: String,
    trim: true
  },
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  isFeatured: {
    type: Boolean,
    default: false
  },
  isTrending: {
    type: Boolean,
    default: false
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  trailerUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour mettre à jour la date de modification
contentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Méthode pour calculer la note moyenne
contentSchema.methods.calculateRating = async function(newRating) {
  const currentTotal = this.rating.average * this.rating.count;
  this.rating.count += 1;
  this.rating.average = (currentTotal + newRating) / this.rating.count;
  await this.save();
  return this.rating;
};

module.exports = mongoose.model('Content', contentSchema);
