import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import unifiedPaymentService, { SUBSCRIPTION_PLANS } from '../../services/UnifiedPaymentService';

/**
 * Composant de carte d'abonnement FloDrama
 * Affiche les détails d'un plan d'abonnement avec un bouton de paiement PayPal
 * Respecte l'identité visuelle FloDrama avec le dégradé signature bleu-fuchsia
 */
const SubscriptionCard = ({ planId, onSubscribe, onError }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [paymentInitialized, setPaymentInitialized] = useState(false);

  // Récupérer les détails du plan
  const plan = SUBSCRIPTION_PLANS[planId.toUpperCase()];

  // Initialiser le service de paiement
  useEffect(() => {
    const initializePayment = async () => {
      try {
        setLoading(true);
        await unifiedPaymentService.initialize();
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de l\'initialisation du service de paiement:', err);
        setError('Impossible de charger les options de paiement. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };

    initializePayment();
  }, []);

  // Créer le bouton PayPal lorsque la période de facturation change
  useEffect(() => {
    if (!loading && !error && plan && !paymentInitialized) {
      const paypalContainerId = `paypal-button-${plan.id}`;
      
      // S'assurer que le conteneur existe
      if (document.getElementById(paypalContainerId)) {
        setPaymentInitialized(true);
        
        unifiedPaymentService.createSubscriptionButton(
          paypalContainerId,
          plan.id,
          billingPeriod,
          (details) => {
            // Succès
            if (onSubscribe) {
              onSubscribe(plan.id, billingPeriod, details);
            }
          },
          (err) => {
            // Erreur
            console.error('Erreur de paiement:', err);
            setError('Une erreur est survenue lors du traitement du paiement. Veuillez réessayer.');
            if (onError) {
              onError(err);
            }
          },
          () => {
            // Annulation
            console.log('Paiement annulé par l\'utilisateur');
          }
        );
      }
    }
  }, [loading, error, plan, billingPeriod, paymentInitialized, onSubscribe, onError]);

  // Changer la période de facturation
  const toggleBillingPeriod = () => {
    setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly');
    setPaymentInitialized(false); // Réinitialiser pour recréer le bouton
  };

  if (loading) {
    return (
      <div className="subscription-card subscription-card--loading">
        <div className="subscription-card__loader"></div>
        <p>Chargement des options d'abonnement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subscription-card subscription-card--error">
        <p className="subscription-card__error-message">{error}</p>
        <button 
          className="subscription-card__retry-button"
          onClick={() => window.location.reload()}
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="subscription-card subscription-card--error">
        <p className="subscription-card__error-message">Plan d'abonnement non trouvé.</p>
      </div>
    );
  }

  // Calculer le prix en fonction de la période de facturation
  const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  const savings = billingPeriod === 'yearly' 
    ? Math.round(100 - (plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100) 
    : 0;

  return (
    <div className="subscription-card">
      <div className="subscription-card__header">
        <h3 className="subscription-card__title">{plan.name}</h3>
        <p className="subscription-card__description">{plan.description}</p>
      </div>
      
      <div className="subscription-card__pricing">
        <div className="subscription-card__price">
          <span className="subscription-card__currency">€</span>
          <span className="subscription-card__amount">{price.toFixed(2)}</span>
          <span className="subscription-card__period">
            /{billingPeriod === 'monthly' ? 'mois' : 'an'}
          </span>
        </div>
        
        {billingPeriod === 'yearly' && savings > 0 && (
          <div className="subscription-card__savings">
            Économisez {savings}% par rapport au paiement mensuel
          </div>
        )}
      </div>
      
      <div className="subscription-card__features">
        <h4 className="subscription-card__features-title">Inclus dans ce plan :</h4>
        <ul className="subscription-card__features-list">
          {plan.features.map((feature, index) => (
            <li key={index} className="subscription-card__feature-item">
              <span className="subscription-card__feature-icon">✓</span>
              {feature}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="subscription-card__billing-toggle">
        <span 
          className={`subscription-card__billing-option ${billingPeriod === 'monthly' ? 'active' : ''}`}
          onClick={() => billingPeriod !== 'monthly' && toggleBillingPeriod()}
        >
          Mensuel
        </span>
        <div 
          className="subscription-card__toggle-switch"
          onClick={toggleBillingPeriod}
        >
          <div className={`subscription-card__toggle-slider ${billingPeriod === 'yearly' ? 'yearly' : 'monthly'}`}></div>
        </div>
        <span 
          className={`subscription-card__billing-option ${billingPeriod === 'yearly' ? 'active' : ''}`}
          onClick={() => billingPeriod !== 'yearly' && toggleBillingPeriod()}
        >
          Annuel
        </span>
      </div>
      
      <div className="subscription-card__payment">
        <div id={`paypal-button-${plan.id}`} className="subscription-card__paypal-container"></div>
      </div>
      
      <div className="subscription-card__footer">
        <p className="subscription-card__terms">
          En vous abonnant, vous acceptez nos <a href="/terms">Conditions d'utilisation</a> et notre <a href="/privacy">Politique de confidentialité</a>.
        </p>
      </div>
      
      <style jsx="true">{`
        .subscription-card {
          background-color: #1A1926;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          width: 100%;
          max-width: 380px;
          margin: 0 auto;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .subscription-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
        }
        
        .subscription-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(to right, #3b82f6, #d946ef);
        }
        
        .subscription-card__header {
          margin-bottom: 20px;
          text-align: center;
        }
        
        .subscription-card__title {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px;
          background: linear-gradient(to right, #3b82f6, #d946ef);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .subscription-card__description {
          color: #a8a8b3;
          font-size: 14px;
          margin: 0;
        }
        
        .subscription-card__pricing {
          text-align: center;
          margin-bottom: 24px;
        }
        
        .subscription-card__price {
          display: flex;
          align-items: baseline;
          justify-content: center;
        }
        
        .subscription-card__currency {
          font-size: 20px;
          font-weight: 500;
          color: white;
        }
        
        .subscription-card__amount {
          font-size: 36px;
          font-weight: 700;
          color: white;
          margin: 0 4px;
        }
        
        .subscription-card__period {
          font-size: 16px;
          color: #a8a8b3;
        }
        
        .subscription-card__savings {
          margin-top: 8px;
          font-size: 14px;
          color: #10b981;
          font-weight: 500;
        }
        
        .subscription-card__features {
          margin-bottom: 24px;
        }
        
        .subscription-card__features-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 12px;
          color: white;
        }
        
        .subscription-card__features-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .subscription-card__feature-item {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          color: #e2e2e7;
          font-size: 14px;
        }
        
        .subscription-card__feature-icon {
          margin-right: 8px;
          color: #d946ef;
          font-weight: bold;
        }
        
        .subscription-card__billing-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }
        
        .subscription-card__billing-option {
          font-size: 14px;
          color: #a8a8b3;
          cursor: pointer;
          transition: color 0.3s ease;
        }
        
        .subscription-card__billing-option.active {
          color: white;
          font-weight: 500;
        }
        
        .subscription-card__toggle-switch {
          width: 48px;
          height: 24px;
          background-color: #2d2b38;
          border-radius: 12px;
          margin: 0 12px;
          position: relative;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        
        .subscription-card__toggle-switch:hover {
          background-color: #3a3846;
        }
        
        .subscription-card__toggle-slider {
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(to right, #3b82f6, #d946ef);
          top: 2px;
          left: 2px;
          transition: transform 0.3s ease;
        }
        
        .subscription-card__toggle-slider.yearly {
          transform: translateX(24px);
        }
        
        .subscription-card__payment {
          margin-bottom: 20px;
        }
        
        .subscription-card__paypal-container {
          width: 100%;
        }
        
        .subscription-card__footer {
          text-align: center;
        }
        
        .subscription-card__terms {
          font-size: 12px;
          color: #a8a8b3;
          margin: 0;
        }
        
        .subscription-card__terms a {
          color: #3b82f6;
          text-decoration: none;
          transition: color 0.3s ease;
        }
        
        .subscription-card__terms a:hover {
          color: #d946ef;
        }
        
        .subscription-card--loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }
        
        .subscription-card__loader {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(59, 130, 246, 0.2);
          border-radius: 50%;
          border-top-color: #d946ef;
          animation: spin 1s ease-in-out infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .subscription-card--error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
        }
        
        .subscription-card__error-message {
          color: #ef4444;
          text-align: center;
          margin-bottom: 16px;
        }
        
        .subscription-card__retry-button {
          background: linear-gradient(to right, #3b82f6, #d946ef);
          border: none;
          border-radius: 8px;
          color: white;
          padding: 8px 16px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.3s ease;
        }
        
        .subscription-card__retry-button:hover {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};

SubscriptionCard.propTypes = {
  planId: PropTypes.oneOf(['essential', 'premium', 'ultimate']).isRequired,
  onSubscribe: PropTypes.func,
  onError: PropTypes.func
};

export default SubscriptionCard;
