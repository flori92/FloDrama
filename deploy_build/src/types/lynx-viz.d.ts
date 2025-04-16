/**
 * Déclaration des types pour @lynx/viz
 */

import React from 'react';

declare module '@lynx/viz' {
  export interface ChartConfig {
    type: 'line' | 'bar' | 'gauge' | 'list';
    title: string;
    description?: string;
    options?: {
      realtime?: boolean;
      aggregation?: 'avg' | 'sum' | 'min' | 'max';
      interval?: string;
      thresholds?: {
        warning?: number;
        critical?: number;
      };
    };
  }

  export interface ChartData {
    data: any[];
    labels?: string[];
    datasets?: Array<{
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
      fill?: boolean;
    }>;
  }

  export interface ChartOptions {
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    animation?: {
      duration?: number;
      easing?: string;
    };
    scales?: {
      x?: {
        type?: string;
        time?: {
          unit?: string;
        };
      };
      y?: {
        beginAtZero?: boolean;
        suggestedMax?: number;
      };
    };
  }

  export interface DashboardConfig {
    layout: 'grid' | 'flex';
    refresh: string;
    widgets: Array<{
      type: 'chart' | 'alerts' | 'metrics';
      metric?: string;
      display: 'realtime' | 'list' | 'stats' | 'timeline';
      filter?: string;
      period?: string;
    }>;
  }

  export interface LynxChart {
    id: string;
    config: ChartConfig;
    data: ChartData;
    options: ChartOptions;
    update(data: ChartData): void;
    setOptions(options: ChartOptions): void;
    destroy(): void;
  }

  export interface LynxAlert {
    id: string;
    title: string;
    message: string;
    severity: string;
    timestamp: string | Date;
    source?: string;
    data?: Record<string, any>;
    resolve(): void;
  }

  export interface LynxMetric {
    id: string;
    name: string;
    value: number;
    unit?: string;
    timestamp: string | Date;
    trend?: 'up' | 'down' | 'stable';
    threshold?: number;
    isHigherBetter?: boolean;
    isLowerBetter?: boolean;
  }

  export interface LynxViz {
    configure(config: any): void;
    updateChart(name: string, options: ChartConfig): Promise<void>;
    updateWidget(name: string, options: any): Promise<void>;
    refreshDashboard(name: string, options: DashboardConfig): Promise<void>;
  }

  export class LynxChart extends React.Component<{
    id: string;
    config: ChartConfig;
    data: ChartData;
    options: ChartOptions;
  }> {}
  export class LynxAlert extends React.Component<{
    id: string;
    title: string;
    message: string;
    severity: string;
    timestamp: string | Date;
    source?: string;
    data?: Record<string, any>;
  }> {}
  export class LynxMetric extends React.Component<{
    id: string;
    name: string;
    value: number;
    unit?: string;
    timestamp: string | Date;
    trend?: 'up' | 'down' | 'stable';
    threshold?: number;
    isHigherBetter?: boolean;
    isLowerBetter?: boolean;
  }> {}
}
