import React from 'react';
import { THEME } from '@/config/constants';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md' }) => {
  return (
    <div
      className={`animate-spin rounded-full border-4 border-t-transparent ${sizeMap[size]}`}
      style={{
        borderColor: `${THEME.colors.fuchsia[500]}`,
        borderTopColor: 'transparent',
      }}
      role="status"
      aria-label="Chargement..."
    />
  );
};
