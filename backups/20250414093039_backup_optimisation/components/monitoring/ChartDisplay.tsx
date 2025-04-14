import React, { useEffect, useRef } from 'react';

interface ChartDisplayProps {
  title: string;
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  data: any[];
  options?: {
    yAxis?: {
      min?: number;
      max?: number;
    };
    xAxis?: {
      categories?: string[];
    };
    labels?: string[];
    unit?: string;
  };
}

/**
 * Composant d'affichage de graphique pour le tableau de bord de monitoring
 * Simule un composant de graphique sans dépendance externe
 */
export const ChartDisplay: React.FC<ChartDisplayProps> = ({
  title,
  type,
  data,
  options = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner un graphique simulé
    drawSimulatedChart(ctx, canvas.width, canvas.height, type, data, options);
  }, [type, data, options]);

  /**
   * Dessine un graphique simulé sur le canvas
   */
  const drawSimulatedChart = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    chartType: string,
    chartData: any[],
    chartOptions: any
  ) => {
    // Définir les couleurs
    const colors = [
      '#4e73df', // Bleu
      '#1cc88a', // Vert
      '#36b9cc', // Cyan
      '#f6c23e', // Jaune
      '#e74a3b', // Rouge
      '#5a5c69', // Gris
      '#6f42c1', // Violet
      '#fd7e14', // Orange
    ];

    // Dessiner le fond
    ctx.fillStyle = '#f8f9fc';
    ctx.fillRect(0, 0, width, height);

    // Dessiner le cadre
    ctx.strokeStyle = '#e3e6f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    // Dessiner selon le type de graphique
    switch (chartType) {
      case 'line':
        drawLineChart(ctx, width, height, chartData, chartOptions, colors);
        break;
      case 'bar':
        drawBarChart(ctx, width, height, chartData, chartOptions, colors);
        break;
      case 'pie':
      case 'doughnut':
        drawPieChart(ctx, width, height, chartData, chartOptions, colors, chartType === 'doughnut');
        break;
      default:
        drawNoDataMessage(ctx, width, height);
    }
  };

  /**
   * Dessine un graphique en ligne
   */
  const drawLineChart = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: any[],
    options: any,
    colors: string[]
  ) => {
    if (!data || data.length === 0) {
      drawNoDataMessage(ctx, width, height);
      return;
    }

    // Paramètres du graphique
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    const chartBottom = height - padding;
    const chartLeft = padding;

    // Valeurs min/max pour l'axe Y
    const yMin = options.yAxis?.min !== undefined ? options.yAxis.min : 0;
    const yMax = options.yAxis?.max !== undefined 
      ? options.yAxis.max 
      : Math.max(...data.map((d: any) => typeof d === 'number' ? d : d.value || 0)) * 1.1;

    // Dessiner les axes
    ctx.beginPath();
    ctx.strokeStyle = '#ddd';
    ctx.moveTo(chartLeft, padding);
    ctx.lineTo(chartLeft, chartBottom);
    ctx.lineTo(width - padding, chartBottom);
    ctx.stroke();

    // Dessiner les graduations Y
    const yStep = chartHeight / 5;
    const valueStep = (yMax - yMin) / 5;
    
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    
    for (let i = 0; i <= 5; i++) {
      const y = chartBottom - i * yStep;
      const value = yMin + i * valueStep;
      
      ctx.beginPath();
      ctx.moveTo(chartLeft - 5, y);
      ctx.lineTo(chartLeft, y);
      ctx.stroke();
      
      ctx.fillText(value.toFixed(0) + (options.unit || ''), chartLeft - 10, y);
    }

    // Dessiner la ligne
    if (Array.isArray(data[0])) {
      // Plusieurs séries de données
      data.forEach((series: any[], index: number) => {
        drawSingleLine(
          ctx, 
          series, 
          chartLeft, 
          chartBottom, 
          chartWidth, 
          chartHeight, 
          yMin, 
          yMax, 
          colors[index % colors.length]
        );
      });
    } else {
      // Une seule série de données
      drawSingleLine(
        ctx, 
        data, 
        chartLeft, 
        chartBottom, 
        chartWidth, 
        chartHeight, 
        yMin, 
        yMax, 
        colors[0]
      );
    }
  };

  /**
   * Dessine une ligne unique pour un graphique en ligne
   */
  const drawSingleLine = (
    ctx: CanvasRenderingContext2D,
    data: any[],
    chartLeft: number,
    chartBottom: number,
    chartWidth: number,
    chartHeight: number,
    yMin: number,
    yMax: number,
    color: string
  ) => {
    const xStep = chartWidth / (data.length - 1 || 1);
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    data.forEach((point: any, index: number) => {
      const value = typeof point === 'number' ? point : point.value || 0;
      const x = chartLeft + index * xStep;
      const y = chartBottom - ((value - yMin) / (yMax - yMin)) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Ajouter des points
    data.forEach((point: any, index: number) => {
      const value = typeof point === 'number' ? point : point.value || 0;
      const x = chartLeft + index * xStep;
      const y = chartBottom - ((value - yMin) / (yMax - yMin)) * chartHeight;
      
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  /**
   * Dessine un graphique à barres
   */
  const drawBarChart = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: any[],
    options: any,
    colors: string[]
  ) => {
    if (!data || data.length === 0) {
      drawNoDataMessage(ctx, width, height);
      return;
    }

    // Paramètres du graphique
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    const chartBottom = height - padding;
    const chartLeft = padding;

    // Valeurs min/max pour l'axe Y
    const yMin = options.yAxis?.min !== undefined ? options.yAxis.min : 0;
    const yMax = options.yAxis?.max !== undefined 
      ? options.yAxis.max 
      : Math.max(...data.map((d: any) => typeof d === 'number' ? d : d.value || 0)) * 1.1;

    // Dessiner les axes
    ctx.beginPath();
    ctx.strokeStyle = '#ddd';
    ctx.moveTo(chartLeft, padding);
    ctx.lineTo(chartLeft, chartBottom);
    ctx.lineTo(width - padding, chartBottom);
    ctx.stroke();

    // Dessiner les graduations Y
    const yStep = chartHeight / 5;
    const valueStep = (yMax - yMin) / 5;
    
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#666';
    ctx.font = '10px Arial';
    
    for (let i = 0; i <= 5; i++) {
      const y = chartBottom - i * yStep;
      const value = yMin + i * valueStep;
      
      ctx.beginPath();
      ctx.moveTo(chartLeft - 5, y);
      ctx.lineTo(chartLeft, y);
      ctx.stroke();
      
      ctx.fillText(value.toFixed(0) + (options.unit || ''), chartLeft - 10, y);
    }

    // Dessiner les barres
    const barWidth = chartWidth / data.length * 0.8;
    const barSpacing = chartWidth / data.length * 0.2;
    
    data.forEach((item: any, index: number) => {
      const value = typeof item === 'number' ? item : item.value || 0;
      const x = chartLeft + index * (barWidth + barSpacing) + barSpacing / 2;
      const barHeight = ((value - yMin) / (yMax - yMin)) * chartHeight;
      const y = chartBottom - barHeight;
      
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Ajouter des étiquettes
      if (options.xAxis?.categories && options.xAxis.categories[index]) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.fillText(options.xAxis.categories[index], x + barWidth / 2, chartBottom + 5);
      }
    });
  };

  /**
   * Dessine un graphique en camembert ou en anneau
   */
  const drawPieChart = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: any[],
    options: any,
    colors: string[],
    isDoughnut: boolean = false
  ) => {
    if (!data || data.length === 0) {
      drawNoDataMessage(ctx, width, height);
      return;
    }

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;
    
    // Calculer la somme totale
    const total = data.reduce((sum: number, item: any) => {
      const value = typeof item === 'number' ? item : item.value || 0;
      return sum + value;
    }, 0);
    
    // Dessiner les segments
    let startAngle = -Math.PI / 2; // Commencer à midi
    
    data.forEach((item: any, index: number) => {
      const value = typeof item === 'number' ? item : item.value || 0;
      const sliceAngle = (value / total) * Math.PI * 2;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      
      // Dessiner un contour blanc
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Si c'est un graphique en anneau, créer un trou au milieu
      if (isDoughnut) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = 'white';
        ctx.fill();
      }
      
      // Calculer la position de l'étiquette
      const labelAngle = startAngle + sliceAngle / 2;
      const labelRadius = radius * 0.7;
      const labelX = centerX + Math.cos(labelAngle) * labelRadius;
      const labelY = centerY + Math.sin(labelAngle) * labelRadius;
      
      // Dessiner l'étiquette
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Arial';
      
      const percentage = Math.round((value / total) * 100);
      if (percentage > 5) { // Ne pas afficher les étiquettes pour les petits segments
        ctx.fillText(`${percentage}%`, labelX, labelY);
      }
      
      startAngle += sliceAngle;
    });
    
    // Dessiner la légende
    if (options.labels && options.labels.length > 0) {
      const legendY = height - 30;
      const legendItemWidth = width / options.labels.length;
      
      options.labels.forEach((label: string, index: number) => {
        if (index < data.length) {
          const legendX = (index + 0.5) * legendItemWidth;
          
          // Dessiner le carré de couleur
          ctx.fillStyle = colors[index % colors.length];
          ctx.fillRect(legendX - 40, legendY, 10, 10);
          
          // Dessiner le texte
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#333';
          ctx.font = '10px Arial';
          ctx.fillText(label, legendX - 25, legendY + 5);
        }
      });
    }
  };

  /**
   * Affiche un message lorsqu'il n'y a pas de données
   */
  const drawNoDataMessage = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#999';
    ctx.font = '14px Arial';
    ctx.fillText('Aucune donnée disponible', width / 2, height / 2);
  };

  return (
    <div className="chart-display">
      <div className="chart-header">
        <h3 className="chart-title">{title}</h3>
      </div>
      
      <div className="chart-container">
        <canvas 
          ref={canvasRef} 
          width={500} 
          height={300}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      
      <style jsx>{`
        .chart-display {
          background-color: white;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .chart-header {
          margin-bottom: 16px;
        }
        
        .chart-title {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
          color: #333;
        }
        
        .chart-container {
          flex: 1;
          position: relative;
          min-height: 200px;
        }
      `}</style>
    </div>
  );
};

export default ChartDisplay;
