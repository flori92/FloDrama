/**
 * SubscriptionHistory
 * 
 * Composant pour afficher l'historique des abonnements de l'utilisateur.
 */

import React, { useState, useEffect } from 'react';
import { useSubscription } from '../../services/SubscriptionService';
import { SUBSCRIPTION_STATUS } from '../../services/SubscriptionService';

const SubscriptionHistory = ({ className }) => {
  const { subscriptionData } = useSubscription();
  const [history, setHistory] = useState([]);

  // Simuler un historique d'abonnement pour la démonstration
  // Dans une application réelle, cela viendrait d'une API
  useEffect(() => {
    if (subscriptionData) {
      // Récupérer l'historique depuis le localStorage
      const storedHistory = localStorage.getItem('flodrama_subscription_history');
      let subscriptionHistory = storedHistory ? JSON.parse(storedHistory) : [];
      
      // Si l'utilisateur a un abonnement actif et qu'il n'y a pas d'entrée correspondante dans l'historique
      if (subscriptionData.plan && 
          !subscriptionHistory.some(item => 
            item.planId === subscriptionData.plan.id && 
            new Date(item.date).toDateString() === new Date(subscriptionData.startDate).toDateString()
          )) {
        // Ajouter l'abonnement actuel à l'historique
        const newHistoryItem = {
          id: Date.now().toString(),
          planId: subscriptionData.plan.id,
          planName: subscriptionData.plan.name,
          date: subscriptionData.startDate,
          endDate: subscriptionData.endDate,
          price: subscriptionData.plan.monthlyPrice,
          status: subscriptionData.status
        };
        
        subscriptionHistory = [newHistoryItem, ...subscriptionHistory];
        localStorage.setItem('flodrama_subscription_history', JSON.stringify(subscriptionHistory));
      }
      
      setHistory(subscriptionHistory);
    }
  }, [subscriptionData]);

  if (!history.length) {
    return null;
  }

  return (
    <div className={`rounded-lg p-4 ${className}`}>
      <h2 className="text-xl font-bold mb-4">Historique de vos abonnements</h2>
      
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Plan
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Prix
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {history.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{item.planName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">
                    {new Date(item.date).toLocaleDateString()}
                    {item.endDate && ` - ${new Date(item.endDate).toLocaleDateString()}`}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">{item.price.toFixed(2)}€/mois</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    item.status === SUBSCRIPTION_STATUS.ACTIVE 
                      ? 'bg-green-100 text-green-800' 
                      : item.status === SUBSCRIPTION_STATUS.TRIAL || item.status === SUBSCRIPTION_STATUS.SUBSCRIBED_TRIAL
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.status === SUBSCRIPTION_STATUS.ACTIVE 
                      ? 'Actif' 
                      : item.status === SUBSCRIPTION_STATUS.TRIAL
                        ? 'Essai initial'
                        : item.status === SUBSCRIPTION_STATUS.SUBSCRIBED_TRIAL
                          ? 'Essai après abonnement'
                          : 'Inactif'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubscriptionHistory;
