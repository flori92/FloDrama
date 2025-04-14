/**
 * Adaptateurs pour les fonctionnalités @lynx/core
 * Ce fichier simule les fonctionnalités du package @lynx/core qui n'est pas disponible
 */
import React from 'react';

// Composants UI de base
export const View = ({ style, children, testID, ...props }) => (
  <div data-testid={testID} style={{ display: 'flex', flexDirection: 'column', ...style }} {...props}>
    {children}
  </div>
);

export const Text = ({ style, children, numberOfLines, testID, ...props }) => {
  const textStyle = {
    margin: 0,
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
    <p data-testid={testID} style={textStyle} {...props}>
      {children}
    </p>
  );
};

export const ScrollView = ({ horizontal, style, children, showsHorizontalScrollIndicator, testID, ...props }) => {
  const scrollViewStyle = {
    overflowX: horizontal ? 'auto' : 'hidden',
    overflowY: horizontal ? 'hidden' : 'auto',
    WebkitOverflowScrolling: 'touch',
    display: 'flex',
    flexDirection: horizontal ? 'row' : 'column',
    ...style,
    ...(showsHorizontalScrollIndicator === false && {
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
      '&::-webkit-scrollbar': {
        display: 'none'
      }
    })
  };

  return (
    <div data-testid={testID} style={scrollViewStyle} {...props}>
      {children}
    </div>
  );
};

export const TouchableOpacity = ({ style, onPress, children, testID, ...props }) => {
  const touchableStyle = {
    cursor: 'pointer',
    userSelect: 'none',
    ...style
  };

  return (
    <div 
      data-testid={testID} 
      style={touchableStyle} 
      onClick={onPress} 
      role="button" 
      tabIndex={0} 
      {...props}
    >
      {children}
    </div>
  );
};

export const Image = ({ source, style, resizeMode, testID, ...props }) => {
  const imageStyle = {
    maxWidth: '100%',
    ...style,
    objectFit: resizeMode === 'cover' 
      ? 'cover' 
      : resizeMode === 'contain' 
        ? 'contain' 
        : resizeMode === 'stretch' 
          ? 'fill' 
          : 'cover'
  };

  return (
    <img 
      data-testid={testID} 
      src={source?.uri || source} 
      style={imageStyle} 
      alt="" 
      {...props} 
    />
  );
};

// Composants spécifiques à Lynx
export const LynxView = View;
export const LynxText = Text;
export const LynxImage = Image;
export const LynxScrollView = ScrollView;
export const LynxTouchable = TouchableOpacity;
export const LynxButton = ({ title, onPress, ...props }) => (
  <TouchableOpacity onPress={onPress} {...props}>
    <Text>{title}</Text>
  </TouchableOpacity>
);
export const LynxSpinner = ({ size, color, ...props }) => (
  <div 
    style={{ 
      width: size === 'large' ? 36 : 24, 
      height: size === 'large' ? 36 : 24,
      borderRadius: '50%',
      borderWidth: 2,
      borderStyle: 'solid',
      borderColor: `${color || '#000'} transparent ${color || '#000'} transparent`,
      animation: 'spin 1.2s linear infinite',
      ...props.style
    }} 
    {...props}
  />
);
export const LynxTextInput = ({ value, onChangeText, placeholder, style, ...props }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChangeText && onChangeText(e.target.value)}
    placeholder={placeholder}
    style={{
      padding: '8px 12px',
      borderRadius: '4px',
      border: '1px solid #ccc',
      fontSize: '14px',
      ...style
    }}
    {...props}
  />
);
export const Video = ({ source, style, ...props }) => (
  <video 
    src={source?.uri || source} 
    style={style} 
    controls 
    {...props}
  />
);

// Classes utilitaires
export class Network {
  static instance = null;

  static getInstance() {
    if (!Network.instance) {
      Network.instance = new Network();
    }
    return Network.instance;
  }

  async get(url, options = {}) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        ...options
      });
      if (!response.ok) {
        throw new Error(`Network error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Network GET error:', error);
      throw error;
    }
  }

  async post(url, data, options = {}) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(data),
        ...options
      });
      if (!response.ok) {
        throw new Error(`Network error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Network POST error:', error);
      throw error;
    }
  }
}

export class Cache {
  static instance = null;
  cache = new Map();
  defaultDuration = 5 * 60 * 1000; // 5 minutes

  static getInstance() {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  set(key, value, customDuration) {
    const expiry = Date.now() + (customDuration || this.defaultDuration);
    this.cache.set(key, { value, expiry });
    return true;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  remove(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
    return true;
  }
}

// Classe Network pour gérer les requêtes réseau
export class LynxNetwork extends Network {}

// Classe Cache pour gérer le cache local
export class LynxCache extends Cache {}

// Service de base pour l'héritage
export class LynxService {
  constructor() {
    this.events = {};
  }
  
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return this;
  }
  
  off(event, callback) {
    if (!this.events[event]) return this;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
    return this;
  }
  
  emit(event, ...args) {
    if (!this.events[event]) return false;
    this.events[event].forEach(callback => {
      callback(...args);
    });
    return true;
  }
}

// Gestionnaire de thème
export const ThemeProvider = ({ children, theme }) => {
  return React.Children.only(children);
};

// Gestionnaire d'internationalisation
export const I18nManager = {
  configure: (config) => {},
  t: (key, options = {}) => key,
  setLocale: (locale) => {},
  getLocale: () => 'fr',
};

// Gestionnaire de store
export const createStore = (initialState = {}) => {
  let state = initialState;
  const listeners = new Set();

  const getState = () => state;

  const setState = (newState) => {
    state = typeof newState === 'function' ? newState(state) : newState;
    listeners.forEach(listener => listener(state));
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { getState, setState, subscribe };
};

export const useStore = (store) => {
  const [state, setState] = React.useState(store.getState());

  React.useEffect(() => {
    const unsubscribe = store.subscribe(setState);
    return unsubscribe;
  }, [store]);

  return [state, store.setState];
};

// Animation hook
export const useAnimation = (config = {}) => {
  const [value, setValue] = React.useState(config.initialValue || 0);
  
  const start = (toValue, duration = 300, easing = 'linear') => {
    const startTime = Date.now();
    const initialValue = value;
    
    const animate = () => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      setValue(initialValue + (toValue - initialValue) * progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  };
  
  return { value, start };
};

// Exporter un objet par défaut pour les imports de type import '@lynx/core/testing'
const lynxCore = {
  testing: {
    mockComponent: (component) => component,
    render: (component) => component,
  }
};

// Exporter les composants et classes
const lynxCoreExports = {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Network,
  Cache,
  LynxView,
  LynxText,
  LynxImage,
  LynxScrollView,
  LynxTouchable,
  LynxButton,
  LynxSpinner,
  LynxTextInput,
  Video,
  LynxNetwork,
  LynxCache,
  LynxService,
  ThemeProvider,
  I18nManager,
  createStore,
  useStore,
  useAnimation,
  ...lynxCore
};

export default lynxCoreExports;
