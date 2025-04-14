/**
 * Script d'initialisation de la base de données MongoDB Atlas
 * Ce script crée des utilisateurs et des contenus de test dans la base de données
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Content = require('../models/Content');

// Chargement des variables d'environnement
dotenv.config({ path: '../../.env' });

// Récupération de l'URI MongoDB depuis les variables d'environnement
const mongoURI = process.env.MONGODB_URI.replace('${MONGODB_PASSWORD}', process.env.MONGODB_PASSWORD);

// Données de test pour les utilisateurs
const users = [
  {
    name: 'Admin FloDrama',
    email: 'admin@flodrama.com',
    password: 'admin123',
    role: 'admin',
    preferences: {
      theme: 'dark',
      language: 'fr',
      notifications: true,
      subtitles: true
    }
  },
  {
    name: 'Utilisateur Test',
    email: 'user@flodrama.com',
    password: 'user123',
    role: 'user',
    preferences: {
      theme: 'dark',
      language: 'fr',
      notifications: true,
      subtitles: true
    }
  },
  {
    name: 'Utilisateur Premium',
    email: 'premium@flodrama.com',
    password: 'premium123',
    role: 'premium',
    preferences: {
      theme: 'dark',
      language: 'fr',
      notifications: true,
      subtitles: true
    }
  }
];

// Données de test pour les contenus
const contents = [
  {
    title: 'Crash Landing on You',
    originalTitle: '사랑의 불시착',
    type: 'drama',
    category: 'romance',
    country: 'corée',
    description: 'Une héritière sud-coréenne atterrit accidentellement en Corée du Nord après un accident de parapente et tombe amoureuse d\'un officier nord-coréen d\'élite.',
    poster: '/assets/images/crash-landing-on-you-poster.jpg',
    backdrop: '/assets/images/crash-landing-on-you-backdrop.jpg',
    releaseYear: 2019,
    totalEpisodes: 16,
    cast: [
      {
        name: 'Hyun Bin',
        character: 'Ri Jeong-hyeok',
        photo: '/assets/images/hyun-bin.jpg'
      },
      {
        name: 'Son Ye-jin',
        character: 'Yoon Se-ri',
        photo: '/assets/images/son-ye-jin.jpg'
      }
    ],
    director: 'Lee Jeong-hyo',
    rating: {
      average: 9.2,
      count: 1250
    },
    tags: ['romance', 'comédie', 'drame', 'populaire'],
    isFeatured: true,
    isTrending: true,
    isCompleted: true,
    trailerUrl: 'https://www.youtube.com/watch?v=eXMjTVL5jqg',
    episodes: [
      {
        number: 1,
        title: 'Épisode 1',
        description: 'Yoon Se-ri, une héritière sud-coréenne, fait un atterrissage forcé en Corée du Nord après un accident de parapente.',
        duration: 70,
        thumbnail: '/assets/images/crash-landing-ep1.jpg',
        videoUrl: 'https://flodrama-content.s3.amazonaws.com/dramas/crash-landing-on-you/ep1.mp4',
        releaseDate: new Date('2019-12-14'),
        subtitles: [
          {
            language: 'fr',
            url: 'https://flodrama-content.s3.amazonaws.com/dramas/crash-landing-on-you/subtitles/ep1-fr.vtt'
          },
          {
            language: 'en',
            url: 'https://flodrama-content.s3.amazonaws.com/dramas/crash-landing-on-you/subtitles/ep1-en.vtt'
          }
        ]
      },
      {
        number: 2,
        title: 'Épisode 2',
        description: 'Ri Jeong-hyeok décide d\'aider Se-ri à retourner en Corée du Sud.',
        duration: 70,
        thumbnail: '/assets/images/crash-landing-ep2.jpg',
        videoUrl: 'https://flodrama-content.s3.amazonaws.com/dramas/crash-landing-on-you/ep2.mp4',
        releaseDate: new Date('2019-12-15'),
        subtitles: [
          {
            language: 'fr',
            url: 'https://flodrama-content.s3.amazonaws.com/dramas/crash-landing-on-you/subtitles/ep2-fr.vtt'
          },
          {
            language: 'en',
            url: 'https://flodrama-content.s3.amazonaws.com/dramas/crash-landing-on-you/subtitles/ep2-en.vtt'
          }
        ]
      }
    ]
  },
  {
    title: 'Parasite',
    originalTitle: '기생충',
    type: 'film',
    category: 'thriller',
    country: 'corée',
    description: 'Une famille pauvre s\'immisce dans la vie d\'une famille riche, avec des conséquences inattendues.',
    poster: '/assets/images/parasite-poster.jpg',
    backdrop: '/assets/images/parasite-backdrop.jpg',
    releaseYear: 2019,
    duration: 132,
    cast: [
      {
        name: 'Song Kang-ho',
        character: 'Kim Ki-taek',
        photo: '/assets/images/song-kang-ho.jpg'
      },
      {
        name: 'Lee Sun-kyun',
        character: 'Park Dong-ik',
        photo: '/assets/images/lee-sun-kyun.jpg'
      }
    ],
    director: 'Bong Joon-ho',
    rating: {
      average: 9.5,
      count: 2300
    },
    tags: ['thriller', 'drame', 'oscar', 'palme d\'or'],
    isFeatured: true,
    isTrending: true,
    isCompleted: true,
    trailerUrl: 'https://www.youtube.com/watch?v=5xH0HfJHsaY'
  },
  {
    title: 'Attack on Titan',
    originalTitle: '進撃の巨人',
    type: 'anime',
    category: 'action',
    country: 'japon',
    description: 'Dans un monde où l\'humanité vit entourée de murs pour se protéger des Titans, des créatures gigantesques qui dévorent les humains, Eren Yeager jure de se venger après que sa ville natale a été détruite et sa mère tuée.',
    poster: '/assets/images/attack-on-titan-poster.jpg',
    backdrop: '/assets/images/attack-on-titan-backdrop.jpg',
    releaseYear: 2013,
    totalEpisodes: 87,
    cast: [],
    director: 'Tetsurō Araki',
    rating: {
      average: 9.0,
      count: 1800
    },
    tags: ['action', 'fantastique', 'drame', 'populaire'],
    isFeatured: true,
    isTrending: true,
    isCompleted: true,
    trailerUrl: 'https://www.youtube.com/watch?v=MGRm4IzK1SQ',
    episodes: [
      {
        number: 1,
        title: 'À toi, dans 2000 ans',
        description: 'L\'humanité vit retranchée derrière des murs pour se protéger des Titans. Le jour où le mur est détruit, Eren voit sa mère se faire dévorer.',
        duration: 24,
        thumbnail: '/assets/images/attack-on-titan-ep1.jpg',
        videoUrl: 'https://flodrama-content.s3.amazonaws.com/animes/attack-on-titan/ep1.mp4',
        releaseDate: new Date('2013-04-07'),
        subtitles: [
          {
            language: 'fr',
            url: 'https://flodrama-content.s3.amazonaws.com/animes/attack-on-titan/subtitles/ep1-fr.vtt'
          },
          {
            language: 'en',
            url: 'https://flodrama-content.s3.amazonaws.com/animes/attack-on-titan/subtitles/ep1-en.vtt'
          }
        ]
      }
    ]
  }
];

// Connexion à MongoDB Atlas
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connexion à MongoDB Atlas établie pour l\'initialisation');
  
  try {
    // Supprimer toutes les données existantes
    await User.deleteMany({});
    await Content.deleteMany({});
    console.log('Données existantes supprimées');
    
    // Hacher les mots de passe des utilisateurs
    const hashedUsers = await Promise.all(
      users.map(async (user) => {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        return user;
      })
    );
    
    // Créer les utilisateurs
    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`${createdUsers.length} utilisateurs créés`);
    
    // Créer les contenus
    const createdContents = await Content.insertMany(contents);
    console.log(`${createdContents.length} contenus créés`);
    
    // Ajouter des favoris pour les utilisateurs
    const testUser = await User.findOne({ email: 'user@flodrama.com' });
    if (testUser) {
      testUser.favorites = [createdContents[0]._id, createdContents[2]._id];
      await testUser.save();
      console.log('Favoris ajoutés pour l\'utilisateur test');
    }
    
    console.log('Initialisation de la base de données terminée avec succès');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    process.exit(1);
  }
}).catch((error) => {
  console.error('Erreur de connexion à MongoDB Atlas:', error);
  process.exit(1);
});
