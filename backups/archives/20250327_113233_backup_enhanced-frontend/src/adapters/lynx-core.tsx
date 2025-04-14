/**
 * Adaptateur pour @lynx/core
 * Fournit des composants UI de base et des classes utilitaires
 */
import React from 'react';

// Composants UI de base
export const View = ({ style, children, testID, ...props }: any) => (
  <div data-testid={testID} style={{ display: 'flex', flexDirection: 'column', ...style }} {...props}>
    {children}
  </div>
);

export const Text = ({ style, children, numberOfLines, testID, ...props }: any) => {
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

export const ScrollView = ({ horizontal, style, children, showsHorizontalScrollIndicator, testID, ...props }: any) => {
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

export const TouchableOpacity = ({ style, onPress, children, testID, ...props }: any) => {
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

export const Image = ({ source, style, resizeMode, testID, ...props }: any) => {
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

// Classes utilitaires
export class Network {
  static instance: Network | null = null;

  static getInstance(): Network {
    if (!Network.instance) {
      Network.instance = new Network();
    }
    return Network.instance;
  }

  async get(url: string, options: any = {}): Promise<any> {
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

  async post(url: string, data: any, options: any = {}): Promise<any> {
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
  static instance: Cache | null = null;
  cache = new Map<string, { value: any, expiry: number }>();
  defaultDuration = 5 * 60 * 1000; // 5 minutes

  static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  set(key: string, value: any, customDuration?: number): boolean {
    const expiry = Date.now() + (customDuration || this.defaultDuration);
    this.cache.set(key, { value, expiry });
    return true;
  }

  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  remove(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): boolean {
    this.cache.clear();
    return true;
  }
}

// Exporter les composants et classes
const lynxCoreExports = {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Network,
  Cache
};

export default lynxCoreExports;
