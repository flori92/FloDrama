import React from 'react';
import { THEME } from '@/config/constants';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = true,
}) => {
  return (
    <div
      className={`
        rounded-lg bg-black p-4 shadow-lg
        ${hoverable ? 'hover:scale-105 transition-transform' : ''}
        ${className}
      `}
      style={{
        background: THEME.colors.background,
        border: `1px solid ${THEME.colors.text.muted}`,
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};
