
import React, { useEffect, useRef } from 'react';
import { useChartStore } from '@/store/chartStore';
import { 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Bar,
  BarChart,
  Line,
  ComposedChart
} from 'recharts';

// Basic candlestick representation using composed chart
// In a real app, you'd use a more specialized charting library for proper candlesticks
const CandlestickChart = () => {
  const { chartData, timeFrame, activeTool, indicators } = useChartStore();
  const chartRef = useRef<HTMLDivElement>(null);

  // Format date based on timeframe
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    if (['1m', '5m', '15m', '30m'].includes(timeFrame)) {
      return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    } 
    if (['1h', '4h'].includes(timeFrame)) {
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
    }
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Calculate SMA (Simple Moving Average)
  const calculateSMA = (data: any[], period: number) => {
    const result = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push({ ...data[i], sma: null });
        continue;
      }
      
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      
      result.push({
        ...data[i],
        sma: sum / period,
      });
    }
    
    return result;
  };

  // Apply indicators to the data
  const processedData = indicators.includes('sma')
    ? calculateSMA(chartData, 14)
    : chartData;

  return (
    <div className="chart-container" ref={chartRef}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={processedData}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatDate}
            stroke="#555"
            tick={{ fill: '#999' }}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            tick={{ fill: '#999' }}
            stroke="#555" 
            orientation="right"
          />
          {/* Add a second YAxis specifically for volume with yAxisId */}
          <YAxis 
            yAxisId="volume"
            domain={['auto', 'auto']} 
            tick={{ fill: '#999' }}
            stroke="#555"
            orientation="left"
            hide
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#2A2F45', border: 'none' }}
            labelStyle={{ color: '#E0E0E0' }}
            itemStyle={{ color: '#E0E0E0' }}
          />
          
          {/* Candlesticks */}
          {processedData.map((d, i) => (
            <rect
              key={i}
              x={i * (100 / processedData.length) + '%'}
              width={(100 / processedData.length / 2) + '%'}
              y={d.open < d.close ? '50%' : '30%'} // This is simplified; real implementation would use scales
              height="20%"
              fill={d.open < d.close ? '#4CAF50' : '#FF5252'}
            />
          ))}
          
          {/* Volume bars - Fixed by adding yAxisId that matches the second YAxis */}
          <Bar 
            dataKey="volume" 
            fill="rgba(33, 150, 243, 0.3)" 
            yAxisId="volume" 
            barSize={3} 
          />
          
          {/* SMA Line if indicator is active */}
          {indicators.includes('sma') && (
            <Line 
              type="monotone" 
              dataKey="sma" 
              stroke="#9C27B0" 
              dot={false} 
              strokeWidth={1} 
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Chart overlay for cursor changes based on active tool */}
      <div 
        className="absolute inset-0" 
        style={{ cursor: activeTool === 'cursor' ? 'default' : 'crosshair' }}
      />
    </div>
  );
};

export default CandlestickChart;
