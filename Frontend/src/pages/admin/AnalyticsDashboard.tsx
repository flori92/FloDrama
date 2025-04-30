import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types pour les métriques
interface DailyMetric {
  id: string;
  date: string;
  metric_name: string;
  metric_value: number;
  dimensions: {
    dimension_key: string;
    [key: string]: any;
  };
}

interface PageViewsByPath {
  path: string;
  count: number;
  percentage: number;
}

// Composant principal du tableau de bord
const AnalyticsDashboard: React.FC = () => {
  // État pour les métriques
  const [pageViews, setPageViews] = useState<number>(0);
  const [uniqueVisitors, setUniqueVisitors] = useState<number>(0);
  const [pageViewsByPath, setPageViewsByPath] = useState<PageViewsByPath[]>([]);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: subDays(new Date(), 7),
    end: new Date()
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données d'analytics
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setIsLoading(true);
        
        // Initialisation du client Supabase
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Variables d\'environnement Supabase manquantes');
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Formatage des dates pour la requête
        const startDate = format(dateRange.start, 'yyyy-MM-dd');
        const endDate = format(dateRange.end, 'yyyy-MM-dd');
        
        // Récupération des métriques quotidiennes
        const { data: metricsData, error: metricsError } = await supabase
          .from('analytics_daily_metrics')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate);
        
        if (metricsError) {
          throw metricsError;
        }
        
        // Traitement des données pour les vues de page
        const pageViewsMetric = metricsData?.filter(
          (metric: DailyMetric) => metric.metric_name === 'page_views' && metric.dimensions.dimension_key === 'total'
        );
        
        const totalPageViews = pageViewsMetric?.reduce(
          (sum: number, metric: DailyMetric) => sum + metric.metric_value, 0
        ) || 0;
        
        setPageViews(totalPageViews);
        
        // Traitement des données pour les visiteurs uniques
        const uniqueVisitorsMetric = metricsData?.filter(
          (metric: DailyMetric) => metric.metric_name === 'unique_users' && metric.dimensions.dimension_key === 'total'
        );
        
        const totalUniqueVisitors = uniqueVisitorsMetric?.reduce(
          (sum: number, metric: DailyMetric) => sum + metric.metric_value, 0
        ) || 0;
        
        setUniqueVisitors(totalUniqueVisitors);
        
        // Traitement des données pour les vues par chemin
        const pageViewsByPathMetrics = metricsData?.filter(
          (metric: DailyMetric) => metric.metric_name === 'page_views_by_path'
        );
        
        // Agréger les vues par chemin
        const pathMap = new Map<string, number>();
        
        pageViewsByPathMetrics?.forEach((metric: DailyMetric) => {
          const path = metric.dimensions.path || 'unknown';
          const currentCount = pathMap.get(path) || 0;
          pathMap.set(path, currentCount + metric.metric_value);
        });
        
        // Calculer les pourcentages et trier
        const totalPathViews = Array.from(pathMap.values()).reduce((sum, count) => sum + count, 0);
        
        const pathsData = Array.from(pathMap.entries())
          .map(([path, count]) => ({
            path,
            count,
            percentage: totalPathViews > 0 ? (count / totalPathViews) * 100 : 0
          }))
          .sort((a, b) => b.count - a.count);
        
        setPageViewsByPath(pathsData);
        
      } catch (err) {
        console.error('Erreur lors du chargement des données d\'analytics:', err);
        setError('Erreur lors du chargement des données. Veuillez réessayer plus tard.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [dateRange]);

  // Gestion du changement de plage de dates
  const handleDateRangeChange = (days: number) => {
    setDateRange({
      start: subDays(new Date(), days),
      end: new Date()
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tableau de bord Analytics</h1>
      
      {/* Sélecteur de plage de dates */}
      <div className="mb-8">
        <div className="flex space-x-4">
          <button 
            className={`px-4 py-2 rounded ${dateRange.start.getTime() === subDays(new Date(), 7).getTime() ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => handleDateRangeChange(7)}
          >
            7 jours
          </button>
          <button 
            className={`px-4 py-2 rounded ${dateRange.start.getTime() === subDays(new Date(), 30).getTime() ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => handleDateRangeChange(30)}
          >
            30 jours
          </button>
          <button 
            className={`px-4 py-2 rounded ${dateRange.start.getTime() === subDays(new Date(), 90).getTime() ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => handleDateRangeChange(90)}
          >
            90 jours
          </button>
        </div>
        <p className="mt-2 text-gray-600">
          {format(dateRange.start, 'dd MMMM yyyy', { locale: fr })} - {format(dateRange.end, 'dd MMMM yyyy', { locale: fr })}
        </p>
      </div>
      
      {/* Cartes de métriques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Vues de page</h2>
          <p className="text-4xl font-bold">{pageViews.toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Visiteurs uniques</h2>
          <p className="text-4xl font-bold">{uniqueVisitors.toLocaleString()}</p>
        </div>
      </div>
      
      {/* Tableau des pages les plus vues */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Pages les plus vues</h2>
        
        {pageViewsByPath.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chemin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vues
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pourcentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pageViewsByPath.map((pathData, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pathData.path}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pathData.count.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pathData.percentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">Aucune donnée disponible pour cette période.</p>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
