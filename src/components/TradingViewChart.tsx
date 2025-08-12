
import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, LineData, HistogramData } from 'lightweight-charts';
import { useChartStore, ChartData } from '@/store/chartStore';

const SMA_PERIOD = 50;

// Helper function to calculate SMA
const calculateSMA = (data: ChartData[], period: number): LineData[] => {
  if (!data || data.length < period) return [];
  const smaValues: LineData[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.close, 0);
    smaValues.push({ time: data[i].timestamp as any, value: sum / period });
  }
  return smaValues;
};

const TradingViewChart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdSignalSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdHistSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const bbUpperSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLowerSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);


  const { chartData, symbol, timeFrame, indicators, rsi, macd, bollingerBands } = useChartStore(state => ({
    chartData: state.chartData,
    symbol: state.symbol,
    timeFrame: state.timeFrame,
    indicators: state.indicators,
    rsi: state.rsi,
    macd: state.macd,
    bollingerBands: state.bollingerBands,
  }));

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
          time: d.timestamp as any,
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

    // SMA
    const smaActive = indicators.includes('sma');
    if (smaActive && !smaSeriesRef.current) {
      const smaSeries = chartRef.current.addSeries('Line', { color: '#FFD700', lineWidth: 2 });
      smaSeriesRef.current = smaSeries;
    } else if (!smaActive && smaSeriesRef.current) {
      chartRef.current.removeSeries(smaSeriesRef.current);
      smaSeriesRef.current = null;
    }
    if (smaActive && smaSeriesRef.current && chartData.length > 0) {
      smaSeriesRef.current.setData(calculateSMA(chartData, SMA_PERIOD));
    }

    // RSI
    const rsiActive = indicators.includes('rsi');
    if (rsiActive && !rsiSeriesRef.current) {
      const rsiSeries = chartRef.current.addSeries('Line', { color: '#9C27B0', lineWidth: 2, pane: 1 });
      rsiSeriesRef.current = rsiSeries;
    } else if (!rsiActive && rsiSeriesRef.current) {
      chartRef.current.removeSeries(rsiSeriesRef.current);
      rsiSeriesRef.current = null;
    }
    if (rsiActive && rsiSeriesRef.current && rsi.length > 0) {
      rsiSeriesRef.current.setData(rsi.map(d => ({ time: d.time, value: d.value })));
    }

    // MACD
    const macdActive = indicators.includes('macd');
    if (macdActive) {
      if (!macdSeriesRef.current) {
        const macdSeries = chartRef.current.addSeries('Line', { color: '#2962FF', lineWidth: 2, pane: 2 });
        macdSeriesRef.current = macdSeries;
      }
      if (!macdSignalSeriesRef.current) {
        const signalSeries = chartRef.current.addSeries('Line', { color: '#FF6D00', lineWidth: 2, pane: 2 });
        macdSignalSeriesRef.current = signalSeries;
      }
      if (!macdHistSeriesRef.current) {
        const histSeries = chartRef.current.addSeries('Histogram', { color: '#26A69A', pane: 2 });
        macdHistSeriesRef.current = histSeries;
      }
    } else {
      if (macdSeriesRef.current) chartRef.current.removeSeries(macdSeriesRef.current);
      if (macdSignalSeriesRef.current) chartRef.current.removeSeries(macdSignalSeriesRef.current);
      if (macdHistSeriesRef.current) chartRef.current.removeSeries(macdHistSeriesRef.current);
      macdSeriesRef.current = null;
      macdSignalSeriesRef.current = null;
      macdHistSeriesRef.current = null;
    }
    if (macdActive && macd.length > 0) {
      if(macdSeriesRef.current) macdSeriesRef.current.setData(macd.map(d => ({ time: d.time, value: d.macd })));
      if(macdSignalSeriesRef.current) macdSignalSeriesRef.current.setData(macd.map(d => ({ time: d.time, value: d.signal })));
      if(macdHistSeriesRef.current) macdHistSeriesRef.current.setData(macd.map(d => ({ time: d.time, value: d.histogram, color: d.histogram >= 0 ? '#26A69A' : '#EF5350' })));
    }

    // Bollinger Bands
    const bbActive = indicators.includes('bb');
    if (bbActive) {
      if (!bbUpperSeriesRef.current) {
        const upperSeries = chartRef.current.addSeries('Line', { color: '#2196F3', lineWidth: 1 });
        bbUpperSeriesRef.current = upperSeries;
      }
      if (!bbLowerSeriesRef.current) {
        const lowerSeries = chartRef.current.addSeries('Line', { color: '#2196F3', lineWidth: 1 });
        bbLowerSeriesRef.current = lowerSeries;
      }
    } else {
        if (bbUpperSeriesRef.current) chartRef.current.removeSeries(bbUpperSeriesRef.current);
        if (bbLowerSeriesRef.current) chartRef.current.removeSeries(bbLowerSeriesRef.current);
        bbUpperSeriesRef.current = null;
        bbLowerSeriesRef.current = null;
    }
    if (bbActive && bollingerBands.length > 0) {
        if(bbUpperSeriesRef.current) bbUpperSeriesRef.current.setData(bollingerBands.map(d => ({ time: d.time, value: d.upper })));
        if(bbLowerSeriesRef.current) bbLowerSeriesRef.current.setData(bollingerBands.map(d => ({ time: d.time, value: d.lower })));
    }

  }, [indicators, chartData, rsi, macd, bollingerBands]);

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
