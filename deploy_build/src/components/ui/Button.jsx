import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Composant Button réutilisable avec effets de survol
 * Inspiré du design de CinePulse
 * @param {Object} props - Propriétés du composant
 * @param {string} props.variant - Variante du bouton ('primary', 'secondary', 'outline', 'text')
 * @param {string} props.size - Taille du bouton ('sm', 'md', 'lg')
 * @param {React.ReactNode} props.children - Contenu du bouton
 * @param {Function} props.onClick - Fonction appelée au clic
 * @param {string} props.className - Classes CSS additionnelles
 * @param {React.ReactNode} props.leftIcon - Icône à gauche du texte
 * @param {React.ReactNode} props.rightIcon - Icône à droite du texte
 * @param {boolean} props.isFullWidth - Si le bouton doit prendre toute la largeur
 * @param {boolean} props.isDisabled - Si le bouton est désactivé
 * @param {boolean} props.isLoading - Si le bouton est en chargement
 * @param {string} props.type - Type du bouton HTML ('button', 'submit', 'reset')
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  className = '',
  leftIcon,
  rightIcon,
  isFullWidth = false,
  isDisabled = false,
  isLoading = false,
  type = 'button',
  ...props
}) => {
  // Styles de base
  const baseStyles = 'font-medium rounded-full focus:outline-none transition-all';
  
  // Styles de variante
  const variantStyles = {
    primary: 'bg-accent text-white hover:bg-accent-hover',
    secondary: 'bg-button-secondary text-white hover:bg-opacity-80',
    outline: 'bg-transparent border border-accent text-accent hover:bg-accent hover:bg-opacity-10',
    text: 'bg-transparent text-accent hover:bg-accent hover:bg-opacity-10'
  };
  
  // Styles de taille
  const sizeStyles = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-5 text-base',
    lg: 'py-3 px-7 text-lg'
  };
  
  // Styles pour le bouton désactivé
  const disabledStyles = isDisabled 
    ? 'opacity-50 cursor-not-allowed' 
    : 'hover:transform hover:scale-105 active:scale-95';
  
  // Styles pour la largeur
  const widthStyles = isFullWidth ? 'w-full' : '';
  
  // Animations
  const buttonVariants = {
    initial: { 
      boxShadow: '0 0 0 rgba(var(--color-accent-rgb), 0)'
    },
    hover: { 
      boxShadow: '0 0 15px rgba(var(--color-accent-rgb), 0.5)',
      y: -2,
      transition: { duration: 0.2 }
    },
    tap: { 
      scale: 0.95,
      boxShadow: '0 0 0 rgba(var(--color-accent-rgb), 0)',
      transition: { duration: 0.1 }
    },
    disabled: {
      boxShadow: '0 0 0 rgba(var(--color-accent-rgb), 0)',
      scale: 1,
      y: 0
    }
  };

  // Combinaison des styles
  const buttonStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${widthStyles} ${className}`;

  return (
    <motion.button
      type={type}
      className={`inline-flex items-center justify-center gap-2 ${buttonStyles}`}
      onClick={isDisabled || isLoading ? undefined : onClick}
      initial="initial"
      whileHover={isDisabled || isLoading ? "disabled" : "hover"}
      whileTap={isDisabled || isLoading ? "disabled" : "tap"}
      variants={buttonVariants}
      disabled={isDisabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      
      {!isLoading && leftIcon && <span>{leftIcon}</span>}
      <span>{children}</span>
      {!isLoading && rightIcon && <span>{rightIcon}</span>}
    </motion.button>
  );
};

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'text']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  isFullWidth: PropTypes.bool,
  isDisabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset'])
};

export default Button;
