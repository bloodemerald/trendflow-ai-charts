import React, { useEffect, useRef } from 'react';
import { createChart, CrosshairMode, type IChartApi, type ISeriesApi, CandlestickData } from 'lightweight-charts';
import { useChartStore } from '@/store/chartStore';

const TradingViewChart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const chartData = useChartStore(state => state.chartData);

  // Initialize chart on mount
  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

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
    seriesRef.current = chartRef.current.addCandlestickSeries();
  }, []);

  // Update chart data when store data changes
  useEffect(() => {
    if (!seriesRef.current) return;
    const data: CandlestickData[] = chartData.map(d => ({
      time: Math.floor(new Date(d.timestamp).getTime() / 1000),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    seriesRef.current.setData(data);
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
