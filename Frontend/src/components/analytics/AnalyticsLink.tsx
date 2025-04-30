import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { useAnalytics } from './AnalyticsProvider';

interface AnalyticsLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
  id: string;
  label: string;
  category?: string;
  external?: boolean;
  trackingData?: Record<string, any>;
}

/**
 * Composant Link qui enregistre automatiquement les clics dans l'analytics
 */
const AnalyticsLink: React.FC<AnalyticsLinkProps> = ({
  to,
  id,
  label,
  category = 'navigation',
  external = false,
  trackingData = {},
  children,
  ...props
}) => {
  const { trackUserAction } = useAnalytics();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Enregistrement de l'événement dans l'analytics
    trackUserAction('link_click', {
      link_id: id,
      link_label: label,
      destination: to,
      category,
      external,
      ...trackingData
    });
  };

  // Si c'est un lien externe, utiliser une balise <a> standard
  if (external) {
    return (
      <a
        href={to}
        id={id}
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer"
        data-category={category}
        {...props}
      >
        {children || label}
      </a>
    );
  }

  // Sinon, utiliser le composant Link de react-router-dom
  return (
    <Link
      to={to}
      id={id}
      onClick={handleClick}
      data-category={category}
      {...props}
    >
      {children || label}
    </Link>
  );
};

export default AnalyticsLink;
