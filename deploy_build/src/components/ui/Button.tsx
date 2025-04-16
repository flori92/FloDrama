import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// Types pour les boutons
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  ripple?: boolean;
  className?: string;
}

// Composant principal pour les boutons
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      ripple = true,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    // Classes CSS pour les variantes
    const variantClasses = {
      primary: 'bg-primary hover:bg-primary-dark text-white shadow-md hover:shadow-lg',
      secondary: 'bg-secondary hover:bg-secondary-dark text-white shadow-md hover:shadow-lg',
      outline: 'bg-transparent border border-primary text-primary hover:bg-primary/10',
      ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
      link: 'bg-transparent text-primary hover:underline p-0 h-auto shadow-none',
      danger: 'bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg',
      success: 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg'
    };

    // Classes CSS pour les tailles
    const sizeClasses = {
      sm: 'text-xs px-3 py-1.5 rounded-md',
      md: 'text-sm px-4 py-2 rounded-lg',
      lg: 'text-base px-6 py-3 rounded-xl',
      icon: 'p-2 rounded-full aspect-square'
    };

    // Effet de ripple (ondulation) au clic
    const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
      const shouldRipple = ripple; // Renommage de la variable ripple
      if (!shouldRipple || disabled || isLoading) return;
      
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const rippleElement = document.createElement('span');
      rippleElement.style.position = 'absolute';
      rippleElement.style.width = '0';
      rippleElement.style.height = '0';
      rippleElement.style.borderRadius = '50%';
      rippleElement.style.transform = 'translate(-50%, -50%)';
      rippleElement.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
      rippleElement.style.left = `${x}px`;
      rippleElement.style.top = `${y}px`;
      rippleElement.style.pointerEvents = 'none';
      
      button.appendChild(rippleElement);
      
      // Animation de l'effet ripple
      const animation = rippleElement.animate(
        [
          { width: '0', height: '0', opacity: 0.5 },
          { width: '500px', height: '500px', opacity: 0 }
        ],
        {
          duration: 600,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }
      );
      
      animation.onfinish = () => {
        rippleElement.remove();
      };
    };

    return (
      <button
        ref={ref}
        className={cn(
          // Classes de base
          'relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
          // Classes de variante et taille
          variantClasses[variant],
          sizeClasses[size],
          // Largeur complète
          fullWidth && 'w-full',
          // État désactivé
          (disabled || isLoading) && 'opacity-70 cursor-not-allowed',
          // Classe personnalisée
          className
        )}
        disabled={disabled || isLoading}
        onClick={handleRipple}
        {...props}
      >
        {/* Indicateur de chargement */}
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
        
        {/* Contenu du bouton */}
        <span className={cn('flex items-center gap-2', isLoading && 'invisible')}>
          {leftIcon && <span className="inline-flex">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="inline-flex">{rightIcon}</span>}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

// Variantes de boutons prédéfinies
export const PrimaryButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="primary" {...props} />
);
PrimaryButton.displayName = 'PrimaryButton';

export const SecondaryButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="secondary" {...props} />
);
SecondaryButton.displayName = 'SecondaryButton';

export const OutlineButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="outline" {...props} />
);
OutlineButton.displayName = 'OutlineButton';

export const IconButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'size'>>(
  (props, ref) => <Button ref={ref} size="icon" {...props} />
);
IconButton.displayName = 'IconButton';

export const LinkButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="link" {...props} />
);
LinkButton.displayName = 'LinkButton';
