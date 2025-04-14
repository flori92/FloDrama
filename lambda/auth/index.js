const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Variables d'environnement
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Connexion à MongoDB Atlas
let cachedDb = null;
const connectToDatabase = async () => {
  if (cachedDb) {
    return cachedDb;
  }
  
  const client = await MongoClient.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  
  const db = client.db('flodrama');
  cachedDb = db;
  return db;
};

// Gestionnaire pour l'inscription
const register = async (event) => {
  try {
    const { name, email, password } = JSON.parse(event.body);
    
    // Validation des entrées
    if (!name || !email || !password) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          message: 'Veuillez fournir un nom, un email et un mot de passe'
        })
      };
    }
    
    const db = await connectToDatabase();
    const users = db.collection('users');
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          message: 'Un utilisateur avec cet email existe déjà'
        })
      };
    }
    
    // Hacher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Créer un nouvel utilisateur
    const newUser = {
      name,
      email,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date(),
      lastLogin: new Date(),
      preferences: {
        theme: 'dark',
        language: 'fr',
        notifications: true,
        subtitles: true
      },
      favorites: [],
      watchHistory: []
    };
    
    await users.insertOne(newUser);
    
    // Générer un token JWT
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Retourner la réponse
    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          preferences: newUser.preferences,
          favorites: []
        }
      })
    };
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Erreur lors de l\'inscription',
        error: error.message
      })
    };
  }
};

// Gestionnaire pour la connexion
const login = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body);
    
    // Validation des entrées
    if (!email || !password) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          message: 'Veuillez fournir un email et un mot de passe'
        })
      };
    }
    
    const db = await connectToDatabase();
    const users = db.collection('users');
    
    // Trouver l'utilisateur
    const user = await users.findOne({ email });
    if (!user) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          message: 'Identifiants invalides'
        })
      };
    }
    
    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          message: 'Identifiants invalides'
        })
      };
    }
    
    // Mettre à jour la date de dernière connexion
    await users.updateOne(
      { _id: user._id },
      { : { lastLogin: new Date() } }
    );
    
    // Générer un token JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Retourner la réponse
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
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
      })
    };
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Erreur lors de la connexion',
        error: error.message
      })
    };
  }
};

// En-têtes CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE'
};

// Gestionnaire principal
exports.handler = async (event) => {
  // Gérer les requêtes OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }
  
  // Router les requêtes
  const path = event.path.split('/').pop();
  
  if (path === 'register' && event.httpMethod === 'POST') {
    return await register(event);
  } else if (path === 'login' && event.httpMethod === 'POST') {
    return await login(event);
  } else {
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Route non trouvée'
      })
    };
  }
};
