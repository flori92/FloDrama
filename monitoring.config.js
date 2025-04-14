// Configuration du monitoring FloDrama avec Lynx
module.exports = {
  // Configuration générale du service de monitoring
  service: {
    enabled: true,
    name: 'FloDrama Monitoring Service', 
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0', 
    interval: 1000,
    batching: {
      enabled: true,
      size: 100,
      interval: '1m'
    }
  },

  // Configuration des métriques
  metrics: {
    // Métriques de performance
    performance: {
      enabled: true,
      interval: 1000,
      metrics: {
        cpu: {
          enabled: true,
          threshold: 80,
          warning: 70
        },
        memory: {
          enabled: true,
          threshold: '1GB',
          warning: '800MB'
        },
        fps: {
          enabled: true,
          threshold: 30,
          target: 60
        },
        network: {
          enabled: true,
          latency: {
            threshold: 1000,
            warning: 500
          },
          bandwidth: {
            threshold: '5MB',
            warning: '3MB'
          }
        }
      }
    },

    // Métriques d'utilisation
    usage: {
      enabled: true,
      interval: 5000,
      metrics: {
        sessions: {
          enabled: true,
          tracking: ['duration', 'interactions']
        },
        features: {
          enabled: true,
          tracking: ['views', 'clicks', 'duration']
        },
        errors: {
          enabled: true,
          tracking: ['count', 'type', 'stack']
        }
      }
    },

    // Métriques métier
    business: {
      enabled: true,
      interval: 60000,
      metrics: {
        users: {
          enabled: true,
          tracking: ['active', 'new', 'returning']
        },
        content: {
          enabled: true,
          tracking: ['views', 'engagement', 'completion']
        },
        streaming: {
          enabled: true,
          tracking: ['quality', 'buffering', 'drops']
        }
      }
    }
  },

  // Configuration des alertes
  alerts: {
    enabled: true,
    channels: {
      slack: {
        enabled: true,
        webhook: process.env.SLACK_WEBHOOK,
        channel: '#monitoring'
      },
      email: {
        enabled: true,
        recipients: ['equipe@flodrama.fr']
      }
    },
    rules: {
      // Règles de performance
      performance: {
        cpu: {
          threshold: 80,
          duration: '5m',
          severity: 'warning'
        },
        memory: {
          threshold: '1GB',
          duration: '5m',
          severity: 'warning'
        },
        errors: {
          threshold: 10,
          duration: '5m',
          severity: 'error'
        }
      },
      // Règles métier
      business: {
        streaming: {
          bufferingRatio: {
            threshold: 0.1,
            duration: '5m',
            severity: 'warning'
          },
          dropRate: {
            threshold: 0.05,
            duration: '5m',
            severity: 'error'
          }
        }
      }
    },
    throttling: {
      enabled: true,
      period: '5m',
      limit: 10
    }
  },

  // Configuration de la visualisation
  visualization: {
    enabled: true,
    dashboards: {
      main: {
        layout: 'grid',
        refresh: '1m',
        widgets: [
          {
            type: 'chart',
            metric: 'performance',
            display: 'realtime'
          },
          {
            type: 'alerts',
            display: 'list',
            filter: 'active'
          },
          {
            type: 'metrics',
            display: 'stats',
            period: '24h'
          }
        ]
      },
      streaming: {
        layout: 'grid',
        refresh: '30s',
        widgets: [
          {
            type: 'chart',
            metric: 'streaming.quality',
            display: 'realtime'
          },
          {
            type: 'chart',
            metric: 'streaming.buffering',
            display: 'timeline'
          }
        ]
      }
    },
    exports: {
      enabled: true,
      formats: ['pdf', 'csv'],
      scheduling: {
        enabled: true,
        interval: '1d',
        recipients: ['equipe@flodrama.fr']
      }
    }
  },

  // Configuration spécifique aux plateformes
  platform: {
    // Configuration Android
    android: {
      enabled: true,
      metrics: {
        native: {
          memory: true,
          cpu: true,
          battery: true,
          network: true
        },
        app: {
          anr: true,
          crashes: true,
          startup: true
        }
      },
      profiling: {
        enabled: true,
        sampling: 0.1,
        traces: true
      }
    },

    // Configuration iOS
    ios: {
      enabled: true,
      metrics: {
        native: {
          memory: true,
          cpu: true,
          battery: true,
          network: true
        },
        app: {
          crashes: true,
          startup: true,
          memory: true
        }
      },
      profiling: {
        enabled: true,
        sampling: 0.1,
        traces: true
      }
    },

    // Configuration Web
    web: {
      enabled: true,
      metrics: {
        performance: {
          timing: true,
          resources: true,
          paint: true
        },
        errors: {
          javascript: true,
          network: true,
          resources: true
        },
        usage: {
          navigation: true,
          interaction: true,
          visibility: true
        }
      }
    }
  },

  // Configuration du stockage des données
  storage: {
    type: 'timeseries',
    retention: '30d',
    compression: true,
    backup: {
      enabled: true,
      interval: '1d',
      retention: '90d'
    }
  }
};
