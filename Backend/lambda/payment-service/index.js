/**
 * Service de paiement FloDrama - Endpoints AWS Lambda
 * 
 * Ce fichier définit les endpoints API pour le service de paiement unifié
 * à déployer sur AWS Lambda avec API Gateway.
 */

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const middy = require('@middy/core');
const jsonBodyParser = require('@middy/http-json-body-parser');
const httpErrorHandler = require('@middy/http-error-handler');
const cors = require('@middy/http-cors');

// Initialiser les clients AWS
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

// Noms des tables DynamoDB
const SUBSCRIPTION_TABLE = process.env.SUBSCRIPTION_TABLE || 'FloDrama-Subscriptions';
const PAYMENT_HISTORY_TABLE = process.env.PAYMENT_HISTORY_TABLE || 'FloDrama-PaymentHistory';
const ANALYTICS_TABLE = process.env.ANALYTICS_TABLE || 'FloDrama-Analytics';

// Identité visuelle FloDrama (pour référence)
const FLODRAMA_VISUAL_IDENTITY = {
  colors: {
    primary: '#3b82f6',     // Bleu signature
    secondary: '#d946ef',   // Fuchsia accent
    background: '#121118',  // Fond principal
    backgroundSecondary: '#1A1926' // Fond secondaire
  },
  gradient: 'linear-gradient(to right, #3b82f6, #d946ef)',
  cornerRadius: '8px',
  transition: '0.3s ease'
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

/**
 * Fonction utilitaire pour créer une réponse API standardisée
 */
const createResponse = (statusCode, body) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(body)
  };
};

/**
 * Fonction utilitaire pour extraire l'ID utilisateur du token JWT
 */
const getUserIdFromToken = async (token) => {
  if (!token) {
    throw new Error('Token d\'authentification manquant');
  }
  
  try {
    // Extraire le token du header Authorization
    const tokenValue = token.replace('Bearer ', '');
    
    // Décoder le token pour obtenir l'ID utilisateur
    // Note: En production, utilisez la méthode appropriée pour votre système d'authentification
    const decoded = await cognitoIdentityServiceProvider.getUser({
      AccessToken: tokenValue
    }).promise();
    
    return decoded.Username;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
    throw new Error('Token d\'authentification invalide');
  }
};

/**
 * Endpoint: GET /subscription
 * Récupère les données d'abonnement de l'utilisateur
 */
const getSubscription = async (event) => {
  try {
    const userId = await getUserIdFromToken(event.headers.Authorization);
    
    const params = {
      TableName: SUBSCRIPTION_TABLE,
      Key: {
        userId: userId
      }
    };
    
    const result = await dynamoDB.get(params).promise();
    
    if (!result.Item) {
      return createResponse(404, {
        message: 'Aucun abonnement trouvé pour cet utilisateur'
      });
    }
    
    return createResponse(200, result.Item);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'abonnement:', error);
    return createResponse(500, {
      message: 'Erreur lors de la récupération de l\'abonnement',
      error: error.message
    });
  }
};

/**
 * Endpoint: PUT /subscription
 * Met à jour les données d'abonnement de l'utilisateur
 */
const updateSubscription = async (event) => {
  try {
    const userId = await getUserIdFromToken(event.headers.Authorization);
    const data = event.body;
    
    // Vérifier si l'abonnement existe
    const getParams = {
      TableName: SUBSCRIPTION_TABLE,
      Key: {
        userId: userId
      }
    };
    
    const existingSubscription = await dynamoDB.get(getParams).promise();
    
    // Préparer les données à mettre à jour
    const subscriptionData = {
      ...data,
      userId: userId,
      updatedAt: new Date().toISOString()
    };
    
    if (!existingSubscription.Item) {
      // Créer un nouvel abonnement
      subscriptionData.createdAt = new Date().toISOString();
    }
    
    const putParams = {
      TableName: SUBSCRIPTION_TABLE,
      Item: subscriptionData
    };
    
    await dynamoDB.put(putParams).promise();
    
    return createResponse(200, subscriptionData);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'abonnement:', error);
    return createResponse(500, {
      message: 'Erreur lors de la mise à jour de l\'abonnement',
      error: error.message
    });
  }
};

/**
 * Endpoint: POST /subscription
 * Crée un nouvel abonnement pour l'utilisateur
 */
const createSubscription = async (event) => {
  try {
    const userId = await getUserIdFromToken(event.headers.Authorization);
    const data = event.body;
    
    // Vérifier si le plan existe
    const planId = data.planId;
    const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === planId);
    if (!plan) {
      return createResponse(400, {
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
      paymentMethod: data.paymentMethod,
      autoRenew: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    
    const params = {
      TableName: SUBSCRIPTION_TABLE,
      Item: subscriptionData
    };
    
    await dynamoDB.put(params).promise();
    
    // Enregistrer dans l'historique des paiements
    const paymentHistoryData = {
      id: uuidv4(),
      userId: userId,
      type: 'subscription_created',
      planId: planId,
      amount: data.paymentMethod.details.billingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice,
      currency: 'EUR',
      paymentMethod: data.paymentMethod,
      timestamp: now.toISOString()
    };
    
    const paymentHistoryParams = {
      TableName: PAYMENT_HISTORY_TABLE,
      Item: paymentHistoryData
    };
    
    await dynamoDB.put(paymentHistoryParams).promise();
    
    return createResponse(201, subscriptionData);
  } catch (error) {
    console.error('Erreur lors de la création de l\'abonnement:', error);
    return createResponse(500, {
      message: 'Erreur lors de la création de l\'abonnement',
      error: error.message
    });
  }
};

/**
 * Endpoint: POST /subscription/{id}/cancel
 * Annule un abonnement (désactive le renouvellement automatique)
 */
const cancelSubscription = async (event) => {
  try {
    const userId = await getUserIdFromToken(event.headers.Authorization);
    const subscriptionId = event.pathParameters.id;
    
    // Vérifier si l'abonnement existe
    const getParams = {
      TableName: SUBSCRIPTION_TABLE,
      Key: {
        userId: userId
      }
    };
    
    const result = await dynamoDB.get(getParams).promise();
    
    if (!result.Item) {
      return createResponse(404, {
        message: 'Aucun abonnement trouvé pour cet utilisateur'
      });
    }
    
    // Mettre à jour l'abonnement
    const updateParams = {
      TableName: SUBSCRIPTION_TABLE,
      Key: {
        userId: userId
      },
      UpdateExpression: 'set autoRenew = :autoRenew, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':autoRenew': false,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };
    
    const updateResult = await dynamoDB.update(updateParams).promise();
    
    // Enregistrer dans l'historique des paiements
    const paymentHistoryData = {
      id: uuidv4(),
      userId: userId,
      type: 'subscription_cancelled',
      planId: result.Item.plan?.id,
      timestamp: new Date().toISOString()
    };
    
    const paymentHistoryParams = {
      TableName: PAYMENT_HISTORY_TABLE,
      Item: paymentHistoryData
    };
    
    await dynamoDB.put(paymentHistoryParams).promise();
    
    return createResponse(200, updateResult.Attributes);
  } catch (error) {
    console.error('Erreur lors de l\'annulation de l\'abonnement:', error);
    return createResponse(500, {
      message: 'Erreur lors de l\'annulation de l\'abonnement',
      error: error.message
    });
  }
};

/**
 * Endpoint: POST /verify-paypal
 * Vérifie un paiement PayPal
 */
const verifyPayPalPayment = async (event) => {
  try {
    const userId = await getUserIdFromToken(event.headers.Authorization);
    const data = event.body;
    
    // En production, vérifier le paiement auprès de PayPal
    // Pour ce prototype, nous simulons une vérification réussie
    
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
    
    const paymentHistoryParams = {
      TableName: PAYMENT_HISTORY_TABLE,
      Item: paymentHistoryData
    };
    
    await dynamoDB.put(paymentHistoryParams).promise();
    
    return createResponse(200, {
      verified: true,
      orderId: data.orderId
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du paiement PayPal:', error);
    return createResponse(500, {
      message: 'Erreur lors de la vérification du paiement PayPal',
      error: error.message
    });
  }
};

/**
 * Endpoint: GET /payment-history
 * Récupère l'historique des paiements de l'utilisateur
 */
const getPaymentHistory = async (event) => {
  try {
    const userId = await getUserIdFromToken(event.headers.Authorization);
    
    const params = {
      TableName: PAYMENT_HISTORY_TABLE,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false // Ordre décroissant par clé de tri (timestamp)
    };
    
    const result = await dynamoDB.query(params).promise();
    
    return createResponse(200, result.Items);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique des paiements:', error);
    return createResponse(500, {
      message: 'Erreur lors de la récupération de l\'historique des paiements',
      error: error.message
    });
  }
};

/**
 * Endpoint: POST /analytics/conversion
 * Enregistre un événement de conversion
 */
const trackConversion = async (event) => {
  try {
    // L'authentification est facultative pour cet endpoint
    let userId = 'anonymous';
    try {
      if (event.headers.Authorization) {
        userId = await getUserIdFromToken(event.headers.Authorization);
      }
    } catch (error) {
      console.warn('Utilisateur non authentifié pour le suivi de conversion');
    }
    
    const data = event.body;
    
    // Créer l'événement de conversion
    const conversionData = {
      id: uuidv4(),
      userId: data.userId || userId,
      sessionId: data.sessionId || 'unknown',
      event: data.event,
      timestamp: data.timestamp || new Date().toISOString(),
      data: data.data || {},
      userAgent: data.userAgent,
      referrer: data.referrer,
      page: data.page
    };
    
    const params = {
      TableName: ANALYTICS_TABLE,
      Item: conversionData
    };
    
    await dynamoDB.put(params).promise();
    
    return createResponse(201, {
      success: true,
      id: conversionData.id
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'événement de conversion:', error);
    return createResponse(500, {
      message: 'Erreur lors de l\'enregistrement de l\'événement de conversion',
      error: error.message
    });
  }
};

/**
 * Endpoint: POST /analytics/behavior
 * Enregistre un événement de comportement utilisateur
 */
const trackUserBehavior = async (event) => {
  try {
    // L'authentification est facultative pour cet endpoint
    let userId = 'anonymous';
    try {
      if (event.headers.Authorization) {
        userId = await getUserIdFromToken(event.headers.Authorization);
      }
    } catch (error) {
      console.warn('Utilisateur non authentifié pour le suivi de comportement');
    }
    
    const data = event.body;
    
    // Créer l'événement de comportement
    const behaviorData = {
      id: uuidv4(),
      userId: data.userId || userId,
      sessionId: data.sessionId || 'unknown',
      event: data.event,
      timestamp: data.timestamp || new Date().toISOString(),
      page: data.page,
      data: data.data || {},
      userAgent: data.userAgent,
      referrer: data.referrer
    };
    
    const params = {
      TableName: ANALYTICS_TABLE,
      Item: behaviorData
    };
    
    await dynamoDB.put(params).promise();
    
    return createResponse(201, {
      success: true,
      id: behaviorData.id
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'événement de comportement:', error);
    return createResponse(500, {
      message: 'Erreur lors de l\'enregistrement de l\'événement de comportement',
      error: error.message
    });
  }
};

/**
 * Endpoint: GET /analytics/conversion-metrics
 * Récupère les métriques de conversion
 */
const getConversionMetrics = async (event) => {
  try {
    // Vérifier les autorisations (seuls les administrateurs devraient avoir accès)
    const userId = await getUserIdFromToken(event.headers.Authorization);
    
    // En production, vérifier si l'utilisateur est administrateur
    
    // Récupérer les paramètres de filtrage
    const queryParams = event.queryStringParameters || {};
    const startDate = queryParams.startDate ? new Date(queryParams.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = queryParams.endDate ? new Date(queryParams.endDate) : new Date();
    
    // Calculer les métriques de conversion
    // Dans une implémentation réelle, ces données seraient calculées à partir de la table d'analyse
    
    // Exemple de métriques
    const metrics = {
      conversionRate: 3.5,
      revenue: 1250.75,
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
      dailyTrends: Array.from({ length: 30 }, (_, i) => ({
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
    
    return createResponse(200, metrics);
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques de conversion:', error);
    return createResponse(500, {
      message: 'Erreur lors de la récupération des métriques de conversion',
      error: error.message
    });
  }
};

/**
 * Endpoint: GET /analytics/behavior-metrics
 * Récupère les métriques de comportement utilisateur
 */
const getUserBehaviorMetrics = async (event) => {
  try {
    // Vérifier les autorisations (seuls les administrateurs devraient avoir accès)
    const userId = await getUserIdFromToken(event.headers.Authorization);
    
    // En production, vérifier si l'utilisateur est administrateur
    
    // Récupérer les paramètres de filtrage
    const queryParams = event.queryStringParameters || {};
    const startDate = queryParams.startDate ? new Date(queryParams.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = queryParams.endDate ? new Date(queryParams.endDate) : new Date();
    
    // Calculer les métriques de comportement
    // Dans une implémentation réelle, ces données seraient calculées à partir de la table d'analyse
    
    // Exemple de métriques
    const metrics = {
      averageTimeOnPage: 120, // secondes
      averageScrollDepth: 65, // pourcentage
      exitRate: 45, // pourcentage
      faqViews: 30, // pourcentage
      planHovers: 70, // pourcentage
    };
    
    return createResponse(200, metrics);
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques de comportement:', error);
    return createResponse(500, {
      message: 'Erreur lors de la récupération des métriques de comportement',
      error: error.message
    });
  }
};

// Définir les handlers avec middleware
const getSubscriptionHandler = middy(getSubscription)
  .use(httpErrorHandler())
  .use(cors());

const updateSubscriptionHandler = middy(updateSubscription)
  .use(jsonBodyParser())
  .use(httpErrorHandler())
  .use(cors());

const createSubscriptionHandler = middy(createSubscription)
  .use(jsonBodyParser())
  .use(httpErrorHandler())
  .use(cors());

const cancelSubscriptionHandler = middy(cancelSubscription)
  .use(httpErrorHandler())
  .use(cors());

const verifyPayPalPaymentHandler = middy(verifyPayPalPayment)
  .use(jsonBodyParser())
  .use(httpErrorHandler())
  .use(cors());

const getPaymentHistoryHandler = middy(getPaymentHistory)
  .use(httpErrorHandler())
  .use(cors());

const trackConversionHandler = middy(trackConversion)
  .use(jsonBodyParser())
  .use(httpErrorHandler())
  .use(cors());

const trackUserBehaviorHandler = middy(trackUserBehavior)
  .use(jsonBodyParser())
  .use(httpErrorHandler())
  .use(cors());

const getConversionMetricsHandler = middy(getConversionMetrics)
  .use(httpErrorHandler())
  .use(cors());

const getUserBehaviorMetricsHandler = middy(getUserBehaviorMetrics)
  .use(httpErrorHandler())
  .use(cors());

// Exporter les handlers
module.exports = {
  getSubscription: getSubscriptionHandler,
  updateSubscription: updateSubscriptionHandler,
  createSubscription: createSubscriptionHandler,
  cancelSubscription: cancelSubscriptionHandler,
  verifyPayPalPayment: verifyPayPalPaymentHandler,
  getPaymentHistory: getPaymentHistoryHandler,
  trackConversion: trackConversionHandler,
  trackUserBehavior: trackUserBehaviorHandler,
  getConversionMetrics: getConversionMetricsHandler,
  getUserBehaviorMetrics: getUserBehaviorMetricsHandler
};
