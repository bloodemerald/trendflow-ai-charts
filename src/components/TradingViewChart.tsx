
import React, { useEffect, useRef } from 'react';
import { createChart, CrosshairMode, ColorType, LineData } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';
import { useChartStore, ChartData } from '@/store/chartStore'; // Import ChartData type

const SMA_PERIOD = 50; // Define SMA period

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
  const smaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null); // Ref for SMA series
  const chartData = useChartStore(state => state.chartData);
  const symbol = useChartStore(state => state.symbol);
  const timeFrame = useChartStore(state => state.timeFrame);
  const indicators = useChartStore(state => state.indicators);

  // Initialize chart on mount
  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    console.log('[TradingViewChart] Initializing chart...');
    
    try {
      chartRef.current = createChart(containerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#0f172a' },
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

      console.log('[TradingViewChart] Chart created:', chartRef.current);
      
      seriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      });
      
      console.log('[TradingViewChart] Candlestick series added:', seriesRef.current);
    } catch (error) {
      console.error('[TradingViewChart] Error initializing chart:', error);
    }

    // Cleanup function
    return () => {
      if (chartRef.current) {
        // Remove all series before removing the chart
        if (seriesRef.current) chartRef.current.removeSeries(seriesRef.current);
        if (smaSeriesRef.current) chartRef.current.removeSeries(smaSeriesRef.current);
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
        smaSeriesRef.current = null;
      }
    };
  }, []);

  // Update chart data when store data changes
  useEffect(() => {
    if (!chartData) { // chartData could be initially null or undefined from the store
      console.log('[TradingViewChart] chartData is null or undefined.');
      if (seriesRef.current) seriesRef.current.setData([]);
      if (smaSeriesRef.current) smaSeriesRef.current.setData([]);
      return;
    }
    
    console.log('[TradingViewChart] Received chartData from store:', chartData.length, 'points');

    if (seriesRef.current) {
      if (!chartData.length) {
        console.log('[TradingViewChart] chartData is empty, clearing main series data.');
        seriesRef.current.setData([]);
      } else {
        console.log('[TradingViewChart] Updating main chart with', chartData.length, 'data points');
        try {
          const mappedData: CandlestickData[] = chartData.map(d => ({
            time: d.time as any,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          }));
          seriesRef.current.setData(mappedData);
          console.log('[TradingViewChart] Main chart data updated successfully');
        } catch (error) {
          console.error('[TradingViewChart] Error updating main chart data:', error);
        }
      }
    }

    // Update SMA series if it exists and 'sma' indicator is active
    if (smaSeriesRef.current && indicators.includes('sma')) {
      if (!chartData.length) {
        console.log('[TradingViewChart] chartData is empty, clearing SMA series data.');
        smaSeriesRef.current.setData([]);
      } else {
        console.log('[TradingViewChart] Recalculating and updating SMA data.');
        try {
          const smaData = calculateSMA(chartData, SMA_PERIOD);
          smaSeriesRef.current.setData(smaData);
          console.log('[TradingViewChart] SMA data updated successfully');
        } catch (error) {
          console.error('[TradingViewChart] Error updating SMA data:', error);
        }
      }
    }
  }, [chartData, indicators]); // Add indicators to dependency array

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

  // Effect for symbol or timeFrame changes
  useEffect(() => {
    console.log(`[TradingViewChart] Symbol changed to ${symbol} or Timeframe changed to ${timeFrame}`);
    if (seriesRef.current) {
      console.log('[TradingViewChart] Clearing chart data due to symbol/timeframe change.');
      seriesRef.current.setData([]);
      // Here you would typically fetch new data based on the new symbol/timeframe
    }
  }, [symbol, timeFrame]);

  // Effect for indicators changes
  useEffect(() => {
    if (!chartRef.current) return;
    console.log(`[TradingViewChart] Indicators changed: [${indicators.join(', ')}]`);

    const smaActive = indicators.includes('sma');

    if (smaActive && !smaSeriesRef.current) {
      // Add SMA series
      console.log('[TradingViewChart] Adding SMA series...');
      try {
        smaSeriesRef.current = chartRef.current.addLineSeries({
          color: '#FFD700', // Gold color for SMA
          lineWidth: 2,
        });
        console.log('[TradingViewChart] SMA series added.');
        if (chartData && chartData.length >= SMA_PERIOD) {
          const smaData = calculateSMA(chartData, SMA_PERIOD);
          smaSeriesRef.current.setData(smaData);
          console.log('[TradingViewChart] SMA data set after adding series.');
        }
      } catch (error) {
        console.error('[TradingViewChart] Error adding SMA series:', error);
      }
    } else if (!smaActive && smaSeriesRef.current) {
      // Remove SMA series
      console.log('[TradingViewChart] Removing SMA series...');
      try {
        chartRef.current.removeSeries(smaSeriesRef.current);
        smaSeriesRef.current = null;
        console.log('[TradingViewChart] SMA series removed.');
      } catch (error) {
        console.error('[TradingViewChart] Error removing SMA series:', error);
      }
    }
  }, [indicators, chartData]); // chartData is needed here to set initial data if series is added

  return <div ref={containerRef} className="w-full h-full" />;
};

export default TradingViewChart;
