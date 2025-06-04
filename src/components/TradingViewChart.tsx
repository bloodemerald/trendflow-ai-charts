
import React, { useEffect, useRef } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';
import { useChartStore } from '@/store/chartStore';

const TradingViewChart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const chartData = useChartStore(state => state.chartData);

  // Initialize chart on mount
  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    console.log('Initializing chart...');
    
    try {
      chartRef.current = createChart(containerRef.current, {
        layout: {
          background: { type: 'solid', color: '#0f172a' },
          textColor: '#e2e8f0',
        },
        grid: {
          vertLines: { color: '#334155' },
          horzLines: { color: '#334155' },
        },
        crosshair: { mode: CrosshairMode.Normal },
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });

      console.log('Chart created:', chartRef.current);
      console.log('Available methods:', Object.getOwnPropertyNames(chartRef.current));
      
      seriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      });
      
      console.log('Candlestick series added:', seriesRef.current);
    } catch (error) {
      console.error('Error initializing chart:', error);
    }

    // Cleanup function
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, []);

  // Update chart data when store data changes
  useEffect(() => {
    if (!seriesRef.current || !chartData.length) return;
    
    console.log('Updating chart data with', chartData.length, 'points');
    
    try {
      const data: CandlestickData[] = chartData.map(d => ({
        time: Math.floor(new Date(d.timestamp).getTime() / 1000) as any,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));
      
      seriesRef.current.setData(data);
      console.log('Chart data updated successfully');
    } catch (error) {
      console.error('Error updating chart data:', error);
    }
  }, [chartData]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default TradingViewChart;
