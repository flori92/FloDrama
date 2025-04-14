/**
 * Serveur mock pour le service de paiement FloDrama
 * 
 * Ce serveur simule les endpoints API du service de paiement
 * pour permettre le développement et les tests en local.
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// Créer l'application Express
const app = express();
const PORT = process.env.PORT || 54112;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Base de données en mémoire pour les tests
const db = {
  subscriptions: new Map(),
  paymentHistory: [],
  analytics: []
};

// Plans d'abonnement
const SUBSCRIPTION_PLANS = {
  ESSENTIAL: {
    id: 'essential',
    name: 'Essentiel',
    description: 'L\'essentiel pour découvrir FloDrama',
    monthlyPrice: 1.99,
    yearlyPrice: 23,
    features: [
      'Accès à tous les dramas',
      'Qualité HD',
      'Visionnage sur 1 écran à la fois'
    ]
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    description: 'Notre offre la plus populaire',
    monthlyPrice: 2.99,
    yearlyPrice: 35,
    features: [
      'Accès à tous les dramas',
      'Qualité Full HD',
      'Visionnage sur 2 écrans à la fois',
      'Sans publicité'
    ]
  },
  ULTIMATE: {
    id: 'ultimate',
    name: 'Ultimate',
    description: 'L\'expérience FloDrama ultime',
    monthlyPrice: 4.99,
    yearlyPrice: 55,
    features: [
      'Accès à tous les dramas',
      'Qualité 4K Ultra HD',
      'Visionnage sur 4 écrans à la fois',
      'Sans publicité',
      'Accès anticipé aux nouveautés'
    ]
  }
};

// Statuts d'abonnement
const SUBSCRIPTION_STATUS = {
  INACTIVE: 'inactive',
  TRIAL: 'trial',
  SUBSCRIBED_TRIAL: 'subscribed_trial',
  ACTIVE: 'active'
};

// Middleware pour simuler l'authentification
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      message: 'Token d\'authentification manquant'
    });
  }
  
  // Simuler la vérification du token (en production, utiliser JWT)
  const token = authHeader.replace('Bearer ', '');
  
  // Pour les tests, accepter n'importe quel token
  req.user = {
    id: 'test-user-' + Math.floor(Math.random() * 1000),
    email: 'test@flodrama.com'
  };
  
  next();
};

// Routes pour les abonnements
app.get('/subscription', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const subscription = db.subscriptions.get(userId);
  
  if (!subscription) {
    return res.status(404).json({
      message: 'Aucun abonnement trouvé pour cet utilisateur'
    });
  }
  
  res.json(subscription);
});

app.post('/subscription', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { planId, paymentMethod, status } = req.body;
  
  // Cas spécial pour la période d'essai
  if (status === SUBSCRIPTION_STATUS.TRIAL) {
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 jours d'essai
    
    const trialSubscription = {
      userId: userId,
      status: SUBSCRIPTION_STATUS.TRIAL,
      startDate: now.toISOString(),
      endDate: trialEndDate.toISOString(),
      autoRenew: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    
    db.subscriptions.set(userId, trialSubscription);
    
    return res.status(201).json(trialSubscription);
  }
  
  // Vérifier si le plan existe
  const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === planId);
  if (!plan) {
    return res.status(400).json({
      message: `Plan d'abonnement invalide: ${planId}`
    });
  }
  
  // Créer l'abonnement
  const now = new Date();
  const subscriptionTrialEndDate = new Date(now);
  subscriptionTrialEndDate.setMonth(subscriptionTrialEndDate.getMonth() + 1); // 1 mois d'essai
  
  const endDate = new Date(subscriptionTrialEndDate);
  endDate.setFullYear(endDate.getFullYear() + 1); // Abonnement d'un an par défaut
  
  const subscriptionData = {
    userId: userId,
    status: SUBSCRIPTION_STATUS.SUBSCRIBED_TRIAL,
    plan: plan,
    startDate: now.toISOString(),
    subscriptionTrialEndDate: subscriptionTrialEndDate.toISOString(),
    endDate: endDate.toISOString(),
    paymentMethod: paymentMethod,
    autoRenew: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
  
  db.subscriptions.set(userId, subscriptionData);
  
  // Enregistrer dans l'historique des paiements
  const paymentHistoryData = {
    id: uuidv4(),
    userId: userId,
    type: 'subscription_created',
    planId: planId,
    amount: paymentMethod.details.billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice,
    currency: 'EUR',
    paymentMethod: paymentMethod,
    timestamp: now.toISOString()
  };
  
  db.paymentHistory.push(paymentHistoryData);
  
  res.status(201).json(subscriptionData);
});

app.put('/subscription', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const data = req.body;
  
  // Vérifier si l'abonnement existe
  const existingSubscription = db.subscriptions.get(userId);
  
  if (!existingSubscription) {
    return res.status(404).json({
      message: 'Aucun abonnement trouvé pour cet utilisateur'
    });
  }
  
  // Mettre à jour l'abonnement
  const updatedSubscription = {
    ...existingSubscription,
    ...data,
    updatedAt: new Date().toISOString()
  };
  
  db.subscriptions.set(userId, updatedSubscription);
  
  res.json(updatedSubscription);
});

// Correction: Utiliser userId au lieu de subscriptionId dans l'URL
app.post('/subscription/:userId/cancel', authMiddleware, (req, res) => {
  const userId = req.params.userId;
  
  // Vérifier si l'abonnement existe
  const existingSubscription = db.subscriptions.get(userId);
  
  if (!existingSubscription) {
    return res.status(404).json({
      message: 'Aucun abonnement trouvé pour cet utilisateur'
    });
  }
  
  // Mettre à jour l'abonnement
  const updatedSubscription = {
    ...existingSubscription,
    autoRenew: false,
    updatedAt: new Date().toISOString()
  };
  
  db.subscriptions.set(userId, updatedSubscription);
  
  // Enregistrer dans l'historique des paiements
  const paymentHistoryData = {
    id: uuidv4(),
    userId: userId,
    type: 'subscription_cancelled',
    planId: existingSubscription.plan?.id,
    timestamp: new Date().toISOString()
  };
  
  db.paymentHistory.push(paymentHistoryData);
  
  res.json(updatedSubscription);
});

// Routes pour les paiements
app.post('/verify-paypal', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const data = req.body;
  
  // Simuler la vérification du paiement PayPal
  
  // Enregistrer la vérification dans l'historique des paiements
  const paymentHistoryData = {
    id: uuidv4(),
    userId: userId,
    type: 'payment_verified',
    orderId: data.orderId,
    payerId: data.payerId,
    amount: data.amount,
    currency: data.currency,
    planId: data.planId,
    billingPeriod: data.billingPeriod,
    timestamp: new Date().toISOString()
  };
  
  db.paymentHistory.push(paymentHistoryData);
  
  res.json({
    verified: true,
    orderId: data.orderId
  });
});

app.get('/payment-history', authMiddleware, (req, res) => {
  const userId = req.user.id;
  
  // Filtrer l'historique des paiements pour cet utilisateur
  const userPaymentHistory = db.paymentHistory.filter(item => item.userId === userId);
  
  // Trier par date (du plus récent au plus ancien)
  userPaymentHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  res.json(userPaymentHistory);
});

// Routes pour les analytics
app.post('/analytics/conversion', (req, res) => {
  const data = req.body;
  
  // Créer l'événement de conversion
  const conversionData = {
    id: uuidv4(),
    userId: data.userId || (req.user ? req.user.id : 'anonymous'),
    sessionId: data.sessionId || 'unknown',
    event: data.event,
    timestamp: data.timestamp || new Date().toISOString(),
    data: data.data || {},
    userAgent: data.userAgent,
    referrer: data.referrer,
    page: data.page
  };
  
  db.analytics.push(conversionData);
  
  res.status(201).json({
    success: true,
    id: conversionData.id
  });
});

app.post('/analytics/behavior', (req, res) => {
  const data = req.body;
  
  // Créer l'événement de comportement
  const behaviorData = {
    id: uuidv4(),
    userId: data.userId || (req.user ? req.user.id : 'anonymous'),
    sessionId: data.sessionId || 'unknown',
    event: data.event,
    timestamp: data.timestamp || new Date().toISOString(),
    page: data.page,
    data: data.data || {},
    userAgent: data.userAgent,
    referrer: data.referrer
  };
  
  db.analytics.push(behaviorData);
  
  res.status(201).json({
    success: true,
    id: behaviorData.id
  });
});

app.get('/analytics/conversion-metrics', authMiddleware, (req, res) => {
  // Simuler les métriques de conversion
  const metrics = {
    conversionRate: 3.5,
    conversionTrend: 9.4,
    revenue: 1250.75,
    revenueTrend: 13.7,
    averageOrderValue: 35.8,
    abandonmentRate: 65.2,
    visits: 1000,
    planSelections: 150,
    paymentInitiations: 80,
    subscriptions: 35,
    planDistribution: {
      essential: 10,
      premium: 20,
      ultimate: 5
    },
    previousPeriod: {
      conversionRate: 3.2,
      revenue: 1100.50,
      averageOrderValue: 34.5,
      abandonmentRate: 68.7
    },
    dailyData: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      visits: Math.floor(Math.random() * 50) + 20,
      conversions: Math.floor(Math.random() * 5) + 1
    })),
    recentEvents: [
      {
        event: 'complete_payment',
        userId: 'user123',
        timestamp: new Date().toISOString(),
        data: {
          planId: 'premium',
          amount: 35,
          currency: 'EUR'
        }
      },
      {
        event: 'cancel_subscription',
        userId: 'user456',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        data: {
          planId: 'essential',
          reason: 'user_initiated'
        }
      }
    ],
    recommendations: [
      {
        title: 'Optimiser le formulaire de paiement',
        description: 'Réduire le nombre de champs requis pour améliorer le taux de conversion.',
        priority: 'high',
        estimatedImpact: '+15% de conversions'
      },
      {
        title: 'Ajouter des témoignages clients',
        description: 'Intégrer des témoignages de clients satisfaits sur la page d\'abonnement.',
        priority: 'medium',
        estimatedImpact: '+8% de conversions'
      },
      {
        title: 'Tester différentes couleurs de bouton',
        description: 'Expérimenter avec différentes couleurs pour le bouton d\'abonnement.',
        priority: 'low',
        estimatedImpact: '+3% de conversions'
      }
    ]
  };
  
  res.json(metrics);
});

app.get('/analytics/behavior-metrics', authMiddleware, (req, res) => {
  // Simuler les métriques de comportement
  const metrics = {
    averageTimeOnPage: 120, // secondes
    averageScrollDepth: 65, // pourcentage
    exitRate: 45, // pourcentage
    faqViews: 30, // pourcentage
    planHovers: 70, // pourcentage
  };
  
  res.json(metrics);
});

// Route pour la santé du serveur
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production'
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  // Couleurs pour la console
  const colors = {
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m'
  };
  
  console.log(`${colors.blue}╔═══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║                                                               ║${colors.reset}`);
  console.log(`${colors.blue}║  ${colors.magenta}███████╗██╗      ██████╗     ██████╗ ██████╗  █████╗ ███╗   ███╗ █████╗${colors.blue}  ║${colors.reset}`);
  console.log(`${colors.blue}║  ${colors.magenta}██╔════╝██║     ██╔═══██╗    ██╔══██╗██╔══██╗██╔══██╗████╗ ████║██╔══██╗${colors.blue} ║${colors.reset}`);
  console.log(`${colors.blue}║  ${colors.magenta}█████╗  ██║     ██║   ██║    ██║  ██║██████╔╝███████║██╔████╔██║███████║${colors.blue} ║${colors.reset}`);
  console.log(`${colors.blue}║  ${colors.magenta}██╔══╝  ██║     ██║   ██║    ██║  ██║██╔══██╗██╔══██║██║╚██╔╝██║██╔══██║${colors.blue} ║${colors.reset}`);
  console.log(`${colors.blue}║  ${colors.magenta}██║     ███████╗╚██████╔╝    ██████╔╝██║  ██║██║  ██║██║ ╚═╝ ██║██║  ██║${colors.blue} ║${colors.reset}`);
  console.log(`${colors.blue}║  ${colors.magenta}╚═╝     ╚══════╝ ╚═════╝     ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝${colors.blue} ║${colors.reset}`);
  console.log(`${colors.blue}║                                                               ║${colors.reset}`);
  console.log(`${colors.blue}╚═══════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`${colors.blue}                 Service de Paiement Unifié                      ${colors.reset}`);
  console.log('');
  console.log(`${colors.green}✅ Serveur mock démarré sur le port ${PORT}${colors.reset}`);
  console.log(`${colors.blue}📋 Endpoints disponibles:${colors.reset}`);
  console.log(`${colors.green}GET    http://localhost:${PORT}/subscription${colors.reset}`);
  console.log(`${colors.green}POST   http://localhost:${PORT}/subscription${colors.reset}`);
  console.log(`${colors.green}PUT    http://localhost:${PORT}/subscription${colors.reset}`);
  console.log(`${colors.green}POST   http://localhost:${PORT}/subscription/{userId}/cancel${colors.reset}`);
  console.log(`${colors.green}POST   http://localhost:${PORT}/verify-paypal${colors.reset}`);
  console.log(`${colors.green}GET    http://localhost:${PORT}/payment-history${colors.reset}`);
  console.log(`${colors.green}POST   http://localhost:${PORT}/analytics/conversion${colors.reset}`);
  console.log(`${colors.green}POST   http://localhost:${PORT}/analytics/behavior${colors.reset}`);
  console.log(`${colors.green}GET    http://localhost:${PORT}/analytics/conversion-metrics${colors.reset}`);
  console.log(`${colors.green}GET    http://localhost:${PORT}/analytics/behavior-metrics${colors.reset}`);
  console.log(`${colors.green}GET    http://localhost:${PORT}/health${colors.reset}`);
  console.log('');
  console.log(`${colors.blue}🔍 Pour tester les endpoints, exécutez: node test-local.js${colors.reset}`);
  console.log(`${colors.blue}🛑 Pour arrêter le serveur, appuyez sur Ctrl+C${colors.reset}`);
});
