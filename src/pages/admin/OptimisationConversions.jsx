import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  Grid, 
  GridItem, 
  Stat, 
  StatLabel, 
  StatNumber, 
  StatHelpText, 
  StatArrow, 
  Button, 
  Select, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel,
  Badge,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import paymentApiService from '../../services/api/PaymentApiService';
import { createLogger } from '../../utils/LoggingUtils';

// Couleurs de l'identité visuelle FloDrama
const COLORS = {
  blue: '#3b82f6',
  fuchsia: '#d946ef',
  background: '#121118',
  secondaryBackground: '#1A1926',
  gradient: 'linear-gradient(to right, #3b82f6, #d946ef)',
  text: '#ffffff',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444'
};

// Périodes disponibles pour les filtres
const PERIODS = [
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
  { value: '90d', label: '90 derniers jours' },
  { value: 'year', label: 'Année en cours' }
];

// Logger pour cette page
const logger = createLogger('OptimisationConversions');

/**
 * Composant de tableau de bord d'optimisation des conversions
 * Affiche des métriques avancées et des recommandations pour améliorer les taux de conversion
 */
const OptimisationConversions = () => {
  // États pour les données et filtres
  const [conversionData, setConversionData] = useState(null);
  const [behaviorData, setBehaviorData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Couleurs pour les graphiques
  const bgColor = useColorModeValue(COLORS.secondaryBackground, COLORS.secondaryBackground);
  const textColor = useColorModeValue(COLORS.text, COLORS.text);
  const cardBg = useColorModeValue('rgba(26, 25, 38, 0.8)', 'rgba(26, 25, 38, 0.8)');

  // Chargement des données
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Récupérer les métriques de conversion
        const conversionMetrics = await paymentApiService.getConversionMetrics({ 
          period: selectedPeriod 
        });
        setConversionData(conversionMetrics);
        
        // Récupérer les métriques de comportement
        const behaviorMetrics = await paymentApiService.getUserBehaviorMetrics({ 
          period: selectedPeriod 
        });
        setBehaviorData(behaviorMetrics);
        
        setError(null);
      } catch (err) {
        logger.error('Erreur lors du chargement des données:', err);
        setError('Impossible de charger les données. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedPeriod]);

  // Calcul des métriques dérivées
  const metrics = useMemo(() => {
    if (!conversionData) return null;
    
    return {
      conversionRate: conversionData.conversionRate,
      conversionTrend: conversionData.conversionTrend,
      revenue: conversionData.revenue,
      revenueTrend: conversionData.revenueTrend,
      averageOrderValue: conversionData.averageOrderValue,
      planDistribution: conversionData.planDistribution,
      dailyData: conversionData.dailyData,
      recommendations: conversionData.recommendations || []
    };
  }, [conversionData]);

  // Calcul des métriques de comportement
  const behavior = useMemo(() => {
    if (!behaviorData) return null;
    
    return {
      averageTimeOnPage: behaviorData.averageTimeOnPage,
      averageScrollDepth: behaviorData.averageScrollDepth,
      exitRate: behaviorData.exitRate,
      faqViews: behaviorData.faqViews,
      planHovers: behaviorData.planHovers
    };
  }, [behaviorData]);

  // Données pour le graphique de tendance des conversions
  const conversionTrendData = useMemo(() => {
    if (!metrics || !metrics.dailyData) return [];
    return metrics.dailyData.map(item => ({
      date: new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      visits: item.visits,
      conversions: item.conversions,
      rate: ((item.conversions / item.visits) * 100).toFixed(1)
    }));
  }, [metrics]);

  // Données pour le graphique de distribution des plans
  const planDistributionData = useMemo(() => {
    if (!metrics || !metrics.planDistribution) return [];
    return Object.entries(metrics.planDistribution).map(([key, value]) => ({
      name: key === 'essential' ? 'Essentiel' : key === 'premium' ? 'Premium' : 'Ultimate',
      value
    }));
  }, [metrics]);

  // Couleurs pour le graphique de distribution des plans
  const PLAN_COLORS = [COLORS.blue, COLORS.fuchsia, '#9333ea'];

  // Gestion du changement de période
  const handlePeriodChange = (e) => {
    setSelectedPeriod(e.target.value);
  };

  // Rendu du composant
  return (
    <Box 
      p={6} 
      bg={bgColor} 
      color={textColor} 
      minH="100vh"
    >
      <Flex direction="column" maxW="1400px" mx="auto">
        {/* En-tête */}
        <Flex justifyContent="space-between" alignItems="center" mb={6}>
          <Box>
            <Heading 
              as="h1" 
              size="xl" 
              mb={2}
              bgGradient={COLORS.gradient}
              bgClip="text"
            >
              Optimisation des Conversions
            </Heading>
            <Text fontSize="md" color="gray.400">
              Analysez et optimisez les taux de conversion des abonnements
            </Text>
          </Box>
          
          <Select 
            value={selectedPeriod} 
            onChange={handlePeriodChange} 
            w="200px"
            bg={cardBg}
            borderColor="gray.600"
          >
            {PERIODS.map(period => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </Select>
        </Flex>

        {loading ? (
          <Flex justify="center" align="center" h="300px">
            <Text>Chargement des données...</Text>
          </Flex>
        ) : error ? (
          <Flex justify="center" align="center" h="300px">
            <Text color={COLORS.error}>{error}</Text>
          </Flex>
        ) : (
          <>
            {/* Métriques principales */}
            <Grid templateColumns="repeat(4, 1fr)" gap={6} mb={8}>
              <GridItem>
                <Box p={5} borderRadius="lg" bg={cardBg} boxShadow="md">
                  <Stat>
                    <StatLabel fontSize="sm" color="gray.400">Taux de Conversion</StatLabel>
                    <StatNumber fontSize="2xl" fontWeight="bold">
                      {metrics.conversionRate}%
                    </StatNumber>
                    <StatHelpText>
                      <StatArrow type={metrics.conversionTrend > 0 ? 'increase' : 'decrease'} />
                      {Math.abs(metrics.conversionTrend)}% vs période précédente
                    </StatHelpText>
                  </Stat>
                </Box>
              </GridItem>
              
              <GridItem>
                <Box p={5} borderRadius="lg" bg={cardBg} boxShadow="md">
                  <Stat>
                    <StatLabel fontSize="sm" color="gray.400">Revenus Générés</StatLabel>
                    <StatNumber fontSize="2xl" fontWeight="bold">
                      {metrics.revenue} €
                    </StatNumber>
                    <StatHelpText>
                      <StatArrow type={metrics.revenueTrend > 0 ? 'increase' : 'decrease'} />
                      {Math.abs(metrics.revenueTrend)}% vs période précédente
                    </StatHelpText>
                  </Stat>
                </Box>
              </GridItem>
              
              <GridItem>
                <Box p={5} borderRadius="lg" bg={cardBg} boxShadow="md">
                  <Stat>
                    <StatLabel fontSize="sm" color="gray.400">Valeur Moyenne</StatLabel>
                    <StatNumber fontSize="2xl" fontWeight="bold">
                      {metrics.averageOrderValue} €
                    </StatNumber>
                    <StatHelpText>
                      par abonnement
                    </StatHelpText>
                  </Stat>
                </Box>
              </GridItem>
              
              <GridItem>
                <Box p={5} borderRadius="lg" bg={cardBg} boxShadow="md">
                  <Stat>
                    <StatLabel fontSize="sm" color="gray.400">Temps Moyen sur Page</StatLabel>
                    <StatNumber fontSize="2xl" fontWeight="bold">
                      {behavior.averageTimeOnPage}s
                    </StatNumber>
                    <StatHelpText>
                      Profondeur de défilement: {behavior.averageScrollDepth}%
                    </StatHelpText>
                  </Stat>
                </Box>
              </GridItem>
            </Grid>
            
            {/* Onglets d'analyse */}
            <Tabs 
              variant="enclosed" 
              colorScheme="blue" 
              onChange={(index) => setActiveTab(index)}
              mb={8}
            >
              <TabList>
                <Tab _selected={{ color: COLORS.blue, borderColor: COLORS.blue }}>Tendances</Tab>
                <Tab _selected={{ color: COLORS.fuchsia, borderColor: COLORS.fuchsia }}>Distribution</Tab>
                <Tab _selected={{ color: COLORS.blue, borderColor: COLORS.blue }}>Comportement</Tab>
                <Tab _selected={{ color: COLORS.fuchsia, borderColor: COLORS.fuchsia }}>Recommandations</Tab>
              </TabList>
              
              <TabPanels>
                {/* Onglet Tendances */}
                <TabPanel>
                  <Box p={5} borderRadius="lg" bg={cardBg} boxShadow="md" mb={6}>
                    <Heading size="md" mb={4}>Tendance des Conversions</Heading>
                    <Box h="400px">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={conversionTrendData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="date" stroke="gray" />
                          <YAxis yAxisId="left" stroke={COLORS.blue} />
                          <YAxis yAxisId="right" orientation="right" stroke={COLORS.fuchsia} />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: COLORS.secondaryBackground, borderColor: 'gray' }} 
                            labelStyle={{ color: 'white' }}
                          />
                          <Legend />
                          <Line 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="visits" 
                            name="Visites" 
                            stroke={COLORS.blue} 
                            activeDot={{ r: 8 }} 
                          />
                          <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="conversions" 
                            name="Conversions" 
                            stroke={COLORS.fuchsia} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                  
                  <Box p={5} borderRadius="lg" bg={cardBg} boxShadow="md">
                    <Heading size="md" mb={4}>Taux de Conversion Quotidien</Heading>
                    <Box h="300px">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={conversionTrendData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="date" stroke="gray" />
                          <YAxis stroke="gray" />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: COLORS.secondaryBackground, borderColor: 'gray' }} 
                            labelStyle={{ color: 'white' }}
                          />
                          <Bar 
                            dataKey="rate" 
                            name="Taux de Conversion (%)" 
                            fill="url(#colorGradient)" 
                            radius={[4, 4, 0, 0]}
                          />
                          <defs>
                            <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor={COLORS.blue} />
                              <stop offset="100%" stopColor={COLORS.fuchsia} />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                </TabPanel>
                
                {/* Onglet Distribution */}
                <TabPanel>
                  <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                    <GridItem>
                      <Box p={5} borderRadius="lg" bg={cardBg} boxShadow="md" h="100%">
                        <Heading size="md" mb={4}>Distribution des Plans</Heading>
                        <Box h="400px">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={planDistributionData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={150}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {planDistributionData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={PLAN_COLORS[index % PLAN_COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                contentStyle={{ backgroundColor: COLORS.secondaryBackground, borderColor: 'gray' }} 
                                labelStyle={{ color: 'white' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                      </Box>
                    </GridItem>
                    
                    <GridItem>
                      <Box p={5} borderRadius="lg" bg={cardBg} boxShadow="md" h="100%">
                        <Heading size="md" mb={4}>Analyse des Plans</Heading>
                        <Grid templateColumns="repeat(1, 1fr)" gap={4}>
                          {planDistributionData.map((plan, index) => (
                            <Box 
                              key={plan.name} 
                              p={4} 
                              borderRadius="md" 
                              borderLeft="4px solid" 
                              borderLeftColor={PLAN_COLORS[index]}
                              bg="rgba(0,0,0,0.2)"
                            >
                              <Flex justify="space-between" align="center">
                                <Text fontWeight="bold" fontSize="lg">{plan.name}</Text>
                                <Badge 
                                  colorScheme={index === 0 ? "blue" : index === 1 ? "purple" : "pink"}
                                  borderRadius="full" 
                                  px={3} 
                                  py={1}
                                >
                                  {plan.value} abonnements
                                </Badge>
                              </Flex>
                              <Text mt={2} fontSize="sm" color="gray.400">
                                {index === 0 && "Plan d'entrée de gamme, idéal pour les nouveaux utilisateurs."}
                                {index === 1 && "Plan le plus populaire, offre le meilleur rapport qualité-prix."}
                                {index === 2 && "Plan premium avec toutes les fonctionnalités exclusives."}
                              </Text>
                              <Flex mt={3} justify="space-between">
                                <Text fontSize="sm">
                                  Taux de rétention: 
                                  <Text as="span" fontWeight="bold" ml={1}>
                                    {index === 0 ? "65%" : index === 1 ? "78%" : "92%"}
                                  </Text>
                                </Text>
                                <Text fontSize="sm">
                                  Taux d'annulation: 
                                  <Text as="span" fontWeight="bold" ml={1}>
                                    {index === 0 ? "35%" : index === 1 ? "22%" : "8%"}
                                  </Text>
                                </Text>
                              </Flex>
                            </Box>
                          ))}
                        </Grid>
                      </Box>
                    </GridItem>
                  </Grid>
                </TabPanel>
                
                {/* Onglet Comportement */}
                <TabPanel>
                  <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                    <GridItem>
                      <Box p={5} borderRadius="lg" bg={cardBg} boxShadow="md">
                        <Heading size="md" mb={4}>Métriques de Comportement</Heading>
                        <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                          <Box p={4} borderRadius="md" bg="rgba(0,0,0,0.2)">
                            <Text color="gray.400" fontSize="sm">Temps Moyen sur Page</Text>
                            <Text fontSize="2xl" fontWeight="bold">{behavior.averageTimeOnPage}s</Text>
                          </Box>
                          <Box p={4} borderRadius="md" bg="rgba(0,0,0,0.2)">
                            <Text color="gray.400" fontSize="sm">Profondeur de Défilement</Text>
                            <Text fontSize="2xl" fontWeight="bold">{behavior.averageScrollDepth}%</Text>
                          </Box>
                          <Box p={4} borderRadius="md" bg="rgba(0,0,0,0.2)">
                            <Text color="gray.400" fontSize="sm">Taux de Sortie</Text>
                            <Text fontSize="2xl" fontWeight="bold">{behavior.exitRate}%</Text>
                          </Box>
                          <Box p={4} borderRadius="md" bg="rgba(0,0,0,0.2)">
                            <Text color="gray.400" fontSize="sm">Vues de la FAQ</Text>
                            <Text fontSize="2xl" fontWeight="bold">{behavior.faqViews}</Text>
                          </Box>
                        </Grid>
                        
                        <Box mt={6}>
                          <Heading size="sm" mb={3}>Interactions avec les Plans</Heading>
                          <Box p={4} borderRadius="md" bg="rgba(0,0,0,0.2)">
                            <Flex align="center" justify="space-between">
                              <Text>Survols des Plans</Text>
                              <Text fontWeight="bold">{behavior.planHovers}</Text>
                            </Flex>
                            <Box mt={2} w="100%" h="8px" bg="gray.700" borderRadius="full" overflow="hidden">
                              <Box 
                                w={`${(behavior.planHovers / 100) * 100}%`} 
                                h="100%" 
                                bgGradient={COLORS.gradient}
                                borderRadius="full"
                              />
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </GridItem>
                    
                    <GridItem>
                      <Box p={5} borderRadius="lg" bg={cardBg} boxShadow="md">
                        <Heading size="md" mb={4}>Points de Friction</Heading>
                        <Box p={4} borderRadius="md" bg="rgba(0,0,0,0.2)" mb={4}>
                          <Flex justify="space-between" align="center" mb={2}>
                            <Text fontWeight="bold">Formulaire de Paiement</Text>
                            <Badge colorScheme="red">Élevé</Badge>
                          </Flex>
                          <Text fontSize="sm" color="gray.400" mb={2}>
                            40% des utilisateurs abandonnent pendant la saisie des informations de paiement.
                          </Text>
                          <Button size="sm" colorScheme="blue" variant="outline">
                            Voir les détails
                          </Button>
                        </Box>
                        
                        <Box p={4} borderRadius="md" bg="rgba(0,0,0,0.2)" mb={4}>
                          <Flex justify="space-between" align="center" mb={2}>
                            <Text fontWeight="bold">Choix du Plan</Text>
                            <Badge colorScheme="orange">Moyen</Badge>
                          </Flex>
                          <Text fontSize="sm" color="gray.400" mb={2}>
                            25% des utilisateurs hésitent plus de 2 minutes sur la page de sélection des plans.
                          </Text>
                          <Button size="sm" colorScheme="blue" variant="outline">
                            Voir les détails
                          </Button>
                        </Box>
                        
                        <Box p={4} borderRadius="md" bg="rgba(0,0,0,0.2)">
                          <Flex justify="space-between" align="center" mb={2}>
                            <Text fontWeight="bold">Confirmation d'Abonnement</Text>
                            <Badge colorScheme="green">Faible</Badge>
                          </Flex>
                          <Text fontSize="sm" color="gray.400" mb={2}>
                            10% des utilisateurs ne terminent pas le processus après la confirmation du paiement.
                          </Text>
                          <Button size="sm" colorScheme="blue" variant="outline">
                            Voir les détails
                          </Button>
                        </Box>
                      </Box>
                    </GridItem>
                  </Grid>
                </TabPanel>
                
                {/* Onglet Recommandations */}
                <TabPanel>
                  <Box p={5} borderRadius="lg" bg={cardBg} boxShadow="md">
                    <Heading size="md" mb={4}>Recommandations d'Optimisation</Heading>
                    <Grid templateColumns="repeat(1, 1fr)" gap={4}>
                      {metrics.recommendations.map((recommendation, index) => (
                        <Box 
                          key={index} 
                          p={4} 
                          borderRadius="md" 
                          bg="rgba(0,0,0,0.2)"
                          borderLeft="4px solid" 
                          borderLeftColor={
                            recommendation.priority === 'high' ? COLORS.error : 
                            recommendation.priority === 'medium' ? COLORS.warning : 
                            COLORS.success
                          }
                        >
                          <Flex justify="space-between" align="center" mb={2}>
                            <Heading size="sm">{recommendation.title}</Heading>
                            <Badge 
                              colorScheme={
                                recommendation.priority === 'high' ? "red" : 
                                recommendation.priority === 'medium' ? "orange" : 
                                "green"
                              }
                            >
                              {recommendation.priority === 'high' ? "Priorité Haute" : 
                               recommendation.priority === 'medium' ? "Priorité Moyenne" : 
                               "Priorité Basse"}
                            </Badge>
                          </Flex>
                          <Text fontSize="sm" color="gray.400" mb={3}>
                            {recommendation.description}
                          </Text>
                          <Flex justify="space-between" align="center">
                            <Text fontSize="sm" fontWeight="bold" color={COLORS.success}>
                              Impact estimé: {recommendation.estimatedImpact}
                            </Text>
                            <Button 
                              size="sm" 
                              bgGradient={COLORS.gradient}
                              _hover={{
                                bgGradient: COLORS.gradient,
                                opacity: 0.8
                              }}
                            >
                              Appliquer
                            </Button>
                          </Flex>
                        </Box>
                      ))}
                    </Grid>
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </>
        )}
      </Flex>
    </Box>
  );
};

export default OptimisationConversions;
