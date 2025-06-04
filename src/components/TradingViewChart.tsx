
import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, LineData } from 'lightweight-charts';
import { useChartStore, ChartData } from '@/store/chartStore';

const SMA_PERIOD = 50;

// Helper function to calculate SMA
const calculateSMA = (data: ChartData[], period: number): LineData[] => {
  if (!data || data.length < period) return [];
  const smaValues: LineData[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.close, 0);
    smaValues.push({ time: data[i].time as any, value: sum / period });
  }
  return smaValues;
};

const TradingViewChart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  
  const chartData = useChartStore(state => state.chartData);
  const symbol = useChartStore(state => state.symbol);
  const timeFrame = useChartStore(state => state.timeFrame);
  const indicators = useChartStore(state => state.indicators);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    console.log('[TradingViewChart] Initializing chart...');
    
    try {
      // Clean up any existing chart
      if (chartRef.current) {
        chartRef.current.remove();
      }

      const chart = createChart(containerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#0f172a' },
          textColor: '#e2e8f0',
        },
        grid: {
          vertLines: { color: '#334155' },
          horzLines: { color: '#334155' },
        },
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });

      chartRef.current = chart;
      
      // Add candlestick series using correct API
      const candlestickSeries = chart.addSeries('Candlestick', {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      });
      
      seriesRef.current = candlestickSeries;
      console.log('[TradingViewChart] Chart and series created successfully');
      
    } catch (error) {
      console.error('[TradingViewChart] Error initializing chart:', error);
    }

    // Cleanup function
    return () => {
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (error) {
          console.error('[TradingViewChart] Error during cleanup:', error);
        }
        chartRef.current = null;
        seriesRef.current = null;
        smaSeriesRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once

  // Update chart data
  useEffect(() => {
    if (!seriesRef.current || !chartData) {
      console.log('[TradingViewChart] No series or chartData available');
      return;
    }
    
    console.log('[TradingViewChart] Updating chart with', chartData.length, 'data points');

    try {
      if (chartData.length === 0) {
        seriesRef.current.setData([]);
      } else {
        const mappedData: CandlestickData[] = chartData.map(d => ({
          time: d.time as any,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));
        seriesRef.current.setData(mappedData);
        console.log('[TradingViewChart] Chart data updated successfully');
      }
    } catch (error) {
      console.error('[TradingViewChart] Error updating chart data:', error);
    }
  }, [chartData]);

  // Handle indicators
  useEffect(() => {
    if (!chartRef.current) return;
    
    const smaActive = indicators.includes('sma');
    console.log('[TradingViewChart] SMA indicator active:', smaActive);

    try {
      if (smaActive && !smaSeriesRef.current) {
        // Add SMA series using correct API
        const smaSeries = chartRef.current.addSeries('Line', {
          color: '#FFD700',
          lineWidth: 2,
        });
        smaSeriesRef.current = smaSeries;
        
        // Set SMA data if available
        if (chartData && chartData.length >= SMA_PERIOD) {
          const smaData = calculateSMA(chartData, SMA_PERIOD);
          smaSeries.setData(smaData);
        }
        console.log('[TradingViewChart] SMA series added');
        
      } else if (!smaActive && smaSeriesRef.current) {
        // Remove SMA series
        chartRef.current.removeSeries(smaSeriesRef.current);
        smaSeriesRef.current = null;
        console.log('[TradingViewChart] SMA series removed');
      } else if (smaActive && smaSeriesRef.current && chartData) {
        // Update existing SMA series
        if (chartData.length >= SMA_PERIOD) {
          const smaData = calculateSMA(chartData, SMA_PERIOD);
          smaSeriesRef.current.setData(smaData);
        }
      }
    } catch (error) {
      console.error('[TradingViewChart] Error handling indicators:', error);
    }
  }, [indicators, chartData]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        try {
          chartRef.current.applyOptions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          });
        } catch (error) {
          console.error('[TradingViewChart] Error during resize:', error);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle symbol/timeframe changes
  useEffect(() => {
    console.log(`[TradingViewChart] Symbol: ${symbol}, Timeframe: ${timeFrame}`);
    if (seriesRef.current) {
      try {
        seriesRef.current.setData([]);
      } catch (error) {
        console.error('[TradingViewChart] Error clearing data on symbol/timeframe change:', error);
      }
    }
  }, [symbol, timeFrame]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default TradingViewChart;
