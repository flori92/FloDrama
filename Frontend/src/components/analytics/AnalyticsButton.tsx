import React from 'react';
import { useAnalytics } from './AnalyticsProvider';

interface AnalyticsButtonProps {
  id: string;
  label: string;
  action: string;
  category?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

/**
 * Bouton qui enregistre automatiquement les clics dans l'analytics
 */
const AnalyticsButton: React.FC<AnalyticsButtonProps> = ({
  id,
  label,
  action,
  category = 'ui',
  variant = 'primary',
  size = 'medium',
  onClick,
  className = '',
  disabled = false,
  children
}) => {
  const { trackUserAction } = useAnalytics();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Enregistrement de l'événement dans l'analytics
    trackUserAction('button_click', {
      button_id: id,
      button_label: label,
      action,
      category,
      variant,
      size
    });

    // Exécution du callback onClick si fourni
    if (onClick) {
      onClick();
    }
  };

  // Classes CSS en fonction des propriétés
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50',
    text: 'text-blue-600 hover:underline'
  };

  const sizeClasses = {
    small: 'px-2 py-1 text-sm',
    medium: 'px-4 py-2',
    large: 'px-6 py-3 text-lg'
  };

  const baseClasses = 'rounded focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      id={id}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
      data-action={action}
      data-category={category}
    >
      {children || label}
    </button>
  );
};

export default AnalyticsButton;
