/**
 * Adaptateur pour react-native
 * Fournit des composants de base de react-native pour une utilisation dans un environnement web
 */
import React from 'react';

// Composants de base adaptés
export const View = ({ style, children, ...props }) => (
  <div style={{ ...style }} {...props}>
    {children}
  </div>
);

export const Text = ({ style, children, numberOfLines, ...props }) => {
  const textStyle = {
    ...style,
    ...(numberOfLines && {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: '-webkit-box',
      WebkitLineClamp: numberOfLines,
      WebkitBoxOrient: 'vertical'
    })
  };
  
  return (
    <span style={textStyle} {...props}>
      {children}
    </span>
  );
};

export const TouchableOpacity = ({ style, onPress, children, ...props }) => (
  <div 
    style={{ 
      ...style, 
      cursor: 'pointer',
      userSelect: 'none'
    }} 
    onClick={onPress}
    {...props}
  >
    {children}
  </div>
);

export const Image = ({ source, style, ...props }) => (
  <img 
    src={source.uri || source} 
    style={style} 
    alt={props.alt || ""}
    {...props} 
  />
);

export const ScrollView = ({ style, children, ...props }) => (
  <div 
    style={{ 
      ...style, 
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch'
    }} 
    {...props}
  >
    {children}
  </div>
);

export const Switch = ({ 
  value, 
  onValueChange, 
  disabled, 
  trackColor, 
  thumbColor,
  style,
  ...props 
}) => {
  const trackStyle = {
    position: 'relative',
    width: 40,
    height: 20,
    borderRadius: 10,
    backgroundColor: value 
      ? (trackColor?.true || '#4cd964') 
      : (trackColor?.false || '#e5e5e5'),
    transition: 'background-color 0.2s',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    ...style
  };
  
  const thumbStyle = {
    position: 'absolute',
    top: 2,
    left: value ? 22 : 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: thumbColor || '#ffffff',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
    transition: 'left 0.2s'
  };
  
  return (
    <div 
      style={trackStyle} 
      onClick={() => !disabled && onValueChange(!value)}
      {...props}
    >
      <div style={thumbStyle} />
    </div>
  );
};

export const FlatList = ({ 
  data, 
  renderItem, 
  keyExtractor, 
  style, 
  contentContainerStyle,
  ...props 
}) => (
  <div style={style} {...props}>
    <div style={contentContainerStyle}>
      {data.map((item, index) => (
        <React.Fragment key={keyExtractor ? keyExtractor(item, index) : index}>
          {renderItem({ item, index })}
        </React.Fragment>
      ))}
    </div>
  </div>
);

export const TextInput = ({ 
  style, 
  value, 
  onChangeText, 
  placeholder,
  multiline,
  numberOfLines,
  ...props 
}) => {
  const inputStyle = {
    ...style,
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px'
  };
  
  if (multiline) {
    return (
      <textarea 
        style={inputStyle}
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
        rows={numberOfLines || 4}
        {...props}
      />
    );
  }
  
  return (
    <input 
      type="text"
      style={inputStyle}
      value={value}
      onChange={(e) => onChangeText(e.target.value)}
      placeholder={placeholder}
      {...props}
    />
  );
};

export const ActivityIndicator = ({ size, color, ...props }) => {
  const sizeValue = size === 'large' ? 36 : size === 'small' ? 18 : 24;
  
  return (
    <div 
      style={{
        width: sizeValue,
        height: sizeValue,
        borderRadius: '50%',
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: `${color || '#999'} transparent ${color || '#999'} transparent`,
        animation: 'spin 1s linear infinite',
        ...props.style
      }}
      {...props}
    />
  );
};

// Utilitaires
export const StyleSheet = {
  create: (styles) => styles,
  flatten: (styles) => {
    if (Array.isArray(styles)) {
      return Object.assign({}, ...styles);
    }
    return styles;
  }
};

export const Alert = {
  alert: (title, message, buttons = [{ text: 'OK' }]) => {
    if (typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`);
    }
  }
};

export const Dimensions = {
  get: () => ({
    window: {
      width: typeof window !== 'undefined' ? window.innerWidth : 0,
      height: typeof window !== 'undefined' ? window.innerHeight : 0
    },
    screen: {
      width: typeof window !== 'undefined' ? window.screen.width : 0,
      height: typeof window !== 'undefined' ? window.screen.height : 0
    }
  })
};

export const Platform = {
  OS: 'web',
  select: (obj) => obj.web || obj.default
};

// Exporter un objet avec toutes les fonctionnalités
const reactNativeAdapter = {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
  FlatList,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Dimensions,
  Platform
};

export default reactNativeAdapter;
