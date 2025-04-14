import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Calendar, Filter, Download, RefreshCw, 
  ArrowUp, ArrowDown, Users, DollarSign 
} from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import unifiedPaymentService, { CONVERSION_EVENTS } from '../../services/UnifiedPaymentService';

/**
 * Tableau de bord d'analyse des conversions pour FloDrama
 * Permet de visualiser et d'analyser les métriques de conversion et le comportement utilisateur
 */
const ConversionDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('last30days');
  const [conversionMetrics, setConversionMetrics] = useState(null);
  const [behaviorMetrics, setBehaviorMetrics] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('conversion_rate');

  // Couleurs conformes à l'identité visuelle FloDrama
  const COLORS = {
    primary: '#3b82f6',     // Bleu signature
    secondary: '#d946ef',   // Fuchsia accent
    success: '#10b981',     // Vert
    warning: '#f59e0b',     // Orange
    danger: '#ef4444',      // Rouge
    background: '#121118',  // Fond principal
    backgroundSecondary: '#1A1926', // Fond secondaire
    text: '#ffffff',        // Texte principal
    textSecondary: '#a8a8b3' // Texte secondaire
  };

  // Charger les données au chargement du composant et lorsque la plage de dates change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Déterminer les dates de début et de fin en fonction de la plage sélectionnée
        const endDate = new Date();
        let startDate = new Date();
        
        switch (dateRange) {
          case 'last7days':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'last30days':
            startDate.setDate(startDate.getDate() - 30);
            break;
          case 'last90days':
            startDate.setDate(startDate.getDate() - 90);
            break;
          case 'lastYear':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
          default:
            startDate.setDate(startDate.getDate() - 30);
        }
        
        // Récupérer les métriques de conversion
        const conversionData = await unifiedPaymentService.getConversionMetrics({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
        
        // Récupérer les métriques de comportement
        const behaviorData = await unifiedPaymentService.getUserBehaviorMetrics({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
        
        setConversionMetrics(conversionData);
        setBehaviorMetrics(behaviorData);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération des métriques:', err);
        setError('Impossible de charger les données. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dateRange]);

  // Fonction pour formater les nombres
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  // Fonction pour formater les pourcentages
  const formatPercent = (num) => {
    if (num === null || num === undefined) return '-';
    return `${num.toFixed(2)}%`;
  };

  // Fonction pour formater les montants
  const formatCurrency = (num) => {
    if (num === null || num === undefined) return '-';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(num);
  };

  // Fonction pour calculer la variation en pourcentage
  const calculateChange = (current, previous) => {
    if (!previous) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(2),
      isPositive: change >= 0
    };
  };

  // Données pour les cartes de métriques
  const metricCards = conversionMetrics ? [
    {
      title: 'Taux de conversion',
      value: formatPercent(conversionMetrics.conversionRate),
      change: calculateChange(conversionMetrics.conversionRate, conversionMetrics.previousPeriod.conversionRate),
      icon: <Users size={24} />,
      color: COLORS.primary
    },
    {
      title: 'Revenu mensuel',
      value: formatCurrency(conversionMetrics.revenue),
      change: calculateChange(conversionMetrics.revenue, conversionMetrics.previousPeriod.revenue),
      icon: <DollarSign size={24} />,
      color: COLORS.secondary
    },
    {
      title: 'Valeur moyenne',
      value: formatCurrency(conversionMetrics.averageOrderValue),
      change: calculateChange(conversionMetrics.averageOrderValue, conversionMetrics.previousPeriod.averageOrderValue),
      icon: <DollarSign size={24} />,
      color: COLORS.success
    },
    {
      title: 'Taux d\'abandon',
      value: formatPercent(conversionMetrics.abandonmentRate),
      change: calculateChange(conversionMetrics.abandonmentRate, conversionMetrics.previousPeriod.abandonmentRate),
      isInverted: true, // Pour cette métrique, une baisse est positive
      icon: <Users size={24} />,
      color: COLORS.warning
    }
  ] : [];

  // Données pour le graphique d'entonnoir de conversion
  const funnelData = conversionMetrics ? [
    { name: 'Visites', value: conversionMetrics.visits },
    { name: 'Sélection plan', value: conversionMetrics.planSelections },
    { name: 'Initiation paiement', value: conversionMetrics.paymentInitiations },
    { name: 'Abonnements', value: conversionMetrics.subscriptions }
  ] : [];

  // Données pour le graphique de répartition des plans
  const planDistributionData = conversionMetrics ? [
    { name: 'Essentiel', value: conversionMetrics.planDistribution.essential },
    { name: 'Premium', value: conversionMetrics.planDistribution.premium },
    { name: 'Ultimate', value: conversionMetrics.planDistribution.ultimate }
  ] : [];

  // Données pour le graphique de comportement utilisateur
  const behaviorData = behaviorMetrics ? [
    { name: 'Temps moyen', value: behaviorMetrics.averageTimeOnPage },
    { name: 'Profondeur défilement', value: behaviorMetrics.averageScrollDepth },
    { name: 'Lecture FAQ', value: behaviorMetrics.faqViews },
    { name: 'Survol plans', value: behaviorMetrics.planHovers }
  ] : [];

  // Données pour le graphique d'évolution des conversions
  const conversionTrendData = conversionMetrics ? conversionMetrics.dailyTrends : [];

  if (loading) {
    return (
      <AdminLayout title="Tableau de bord des conversions">
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
          <p className="ml-4 text-lg text-gray-300">Chargement des données...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Tableau de bord des conversions">
        <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-500">{error}</p>
          <button 
            className="mt-2 px-4 py-2 bg-red-700 hover:bg-red-800 rounded-lg transition-colors"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Tableau de bord des conversions">
      {/* En-tête avec filtres */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-pink-500 bg-clip-text text-transparent">
          Analyse des conversions
        </h1>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <select
              className="appearance-none bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="last7days">7 derniers jours</option>
              <option value="last30days">30 derniers jours</option>
              <option value="last90days">90 derniers jours</option>
              <option value="lastYear">Dernière année</option>
            </select>
            <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
          
          <button className="bg-gray-800 hover:bg-gray-700 text-white rounded-lg p-2 transition-colors">
            <Filter size={20} />
          </button>
          
          <button className="bg-gray-800 hover:bg-gray-700 text-white rounded-lg p-2 transition-colors">
            <Download size={20} />
          </button>
          
          <button 
            className="bg-gray-800 hover:bg-gray-700 text-white rounded-lg p-2 transition-colors"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>
      
      {/* Cartes de métriques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metricCards.map((card, index) => (
          <div 
            key={index} 
            className="bg-gray-800 rounded-lg p-6 border-l-4 shadow-lg"
            style={{ borderLeftColor: card.color }}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-gray-400 text-sm font-medium">{card.title}</h3>
                <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
              </div>
              <div className="p-2 rounded-full" style={{ backgroundColor: `${card.color}20` }}>
                {card.icon}
              </div>
            </div>
            <div className="flex items-center">
              {card.change.isPositive !== card.isInverted ? (
                <ArrowUp className="text-green-500 mr-1" size={16} />
              ) : (
                <ArrowDown className="text-red-500 mr-1" size={16} />
              )}
              <span 
                className={card.change.isPositive !== card.isInverted ? 'text-green-500' : 'text-red-500'}
              >
                {card.change.value}%
              </span>
              <span className="text-gray-400 text-sm ml-2">vs période précédente</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Graphique d'évolution des conversions */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-medium text-white mb-4">Évolution des conversions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={conversionTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3d" />
              <XAxis dataKey="date" stroke="#a8a8b3" />
              <YAxis stroke="#a8a8b3" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1926', borderColor: '#2d2d3d' }} 
                labelStyle={{ color: '#ffffff' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="visits" 
                name="Visites" 
                stroke={COLORS.primary} 
                activeDot={{ r: 8 }} 
              />
              <Line 
                type="monotone" 
                dataKey="conversions" 
                name="Conversions" 
                stroke={COLORS.secondary} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Graphique d'entonnoir de conversion */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-medium text-white mb-4">Entonnoir de conversion</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3d" />
              <XAxis type="number" stroke="#a8a8b3" />
              <YAxis dataKey="name" type="category" stroke="#a8a8b3" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1926', borderColor: '#2d2d3d' }} 
                labelStyle={{ color: '#ffffff' }}
              />
              <Bar dataKey="value" name="Utilisateurs">
                {funnelData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#colorGradient-${index})`} 
                  />
                ))}
              </Bar>
              <defs>
                {funnelData.map((entry, index) => (
                  <linearGradient 
                    key={`gradient-${index}`} 
                    id={`colorGradient-${index}`} 
                    x1="0" y1="0" x2="1" y2="0"
                  >
                    <stop offset="0%" stopColor={COLORS.primary} />
                    <stop offset="100%" stopColor={COLORS.secondary} />
                  </linearGradient>
                ))}
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Graphique de répartition des plans */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-medium text-white mb-4">Répartition des plans</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={planDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {planDistributionData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 0 ? COLORS.primary : index === 1 ? COLORS.secondary : COLORS.success} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1926', borderColor: '#2d2d3d' }} 
                labelStyle={{ color: '#ffffff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Graphique de comportement utilisateur */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-medium text-white mb-4">Comportement utilisateur</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={behaviorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d3d" />
              <XAxis dataKey="name" stroke="#a8a8b3" />
              <YAxis stroke="#a8a8b3" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1A1926', borderColor: '#2d2d3d' }} 
                labelStyle={{ color: '#ffffff' }}
              />
              <Bar dataKey="value" name="Valeur">
                {behaviorData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={`url(#behaviorGradient-${index})`} 
                  />
                ))}
              </Bar>
              <defs>
                {behaviorData.map((entry, index) => (
                  <linearGradient 
                    key={`gradient-${index}`} 
                    id={`behaviorGradient-${index}`} 
                    x1="0" y1="0" x2="0" y2="1"
                  >
                    <stop offset="0%" stopColor={COLORS.secondary} />
                    <stop offset="100%" stopColor={COLORS.primary} />
                  </linearGradient>
                ))}
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Tableau des événements récents */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
        <h3 className="text-lg font-medium text-white mb-4">Événements récents</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-3 px-4 text-gray-400 font-medium">Date</th>
                <th className="py-3 px-4 text-gray-400 font-medium">Événement</th>
                <th className="py-3 px-4 text-gray-400 font-medium">Utilisateur</th>
                <th className="py-3 px-4 text-gray-400 font-medium">Plan</th>
                <th className="py-3 px-4 text-gray-400 font-medium">Montant</th>
                <th className="py-3 px-4 text-gray-400 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {conversionMetrics && conversionMetrics.recentEvents.map((event, index) => (
                <tr key={index} className="border-b border-gray-700">
                  <td className="py-3 px-4 text-white">
                    {new Date(event.timestamp).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 px-4 text-white">{event.event}</td>
                  <td className="py-3 px-4 text-white">{event.userId}</td>
                  <td className="py-3 px-4 text-white">{event.data.planId || '-'}</td>
                  <td className="py-3 px-4 text-white">
                    {event.data.amount ? formatCurrency(event.data.amount) : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span 
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.event === CONVERSION_EVENTS.COMPLETE_PAYMENT 
                          ? 'bg-green-900 bg-opacity-20 text-green-500' 
                          : event.event === CONVERSION_EVENTS.PAYMENT_ERROR
                            ? 'bg-red-900 bg-opacity-20 text-red-500'
                            : 'bg-blue-900 bg-opacity-20 text-blue-500'
                      }`}
                    >
                      {event.event === CONVERSION_EVENTS.COMPLETE_PAYMENT 
                        ? 'Succès' 
                        : event.event === CONVERSION_EVENTS.PAYMENT_ERROR
                          ? 'Échec'
                          : 'Info'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Recommandations */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-medium text-white mb-4">Recommandations d'optimisation</h3>
        <div className="space-y-4">
          {conversionMetrics && conversionMetrics.recommendations.map((recommendation, index) => (
            <div key={index} className="border-l-4 pl-4 py-2" style={{ borderColor: recommendation.priority === 'high' ? COLORS.danger : recommendation.priority === 'medium' ? COLORS.warning : COLORS.success }}>
              <h4 className="font-medium text-white">{recommendation.title}</h4>
              <p className="text-gray-400 mt-1">{recommendation.description}</p>
              <div className="flex items-center mt-2">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  recommendation.priority === 'high' 
                    ? 'bg-red-900 bg-opacity-20 text-red-500' 
                    : recommendation.priority === 'medium'
                      ? 'bg-yellow-900 bg-opacity-20 text-yellow-500'
                      : 'bg-green-900 bg-opacity-20 text-green-500'
                }`}>
                  {recommendation.priority === 'high' 
                    ? 'Priorité haute' 
                    : recommendation.priority === 'medium'
                      ? 'Priorité moyenne'
                      : 'Priorité basse'}
                </span>
                <span className="text-gray-400 text-xs ml-2">Impact estimé: {recommendation.estimatedImpact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style jsx="true">{`
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(59, 130, 246, 0.2);
          border-radius: 50%;
          border-top-color: #d946ef;
          animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AdminLayout>
  );
};

export default ConversionDashboard;
