
import React, { useEffect, useState } from 'react';
import { useChartStore } from '@/store/chartStore';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
  ComposedChart,
  Line
} from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCcw } from 'lucide-react';

// Custom candlestick component for recharts
const CustomCandlestick = (props: any) => {
  const { x, y, width, height, open, close, high, low } = props;
  const isGrowing = close > open;
  const color = isGrowing ? '#4CAF50' : '#FF5252';
  const bodyHeight = Math.abs(close - open);
  const bodyY = isGrowing ? close : open;
  
  return (
    <g>
      {/* Wick line */}
      <line 
        x1={x + width / 2} 
        y1={y + high} 
        x2={x + width / 2} 
        y2={y + low} 
        stroke={color} 
        strokeWidth={1}
      />
      {/* Candle body */}
      <rect 
        x={x} 
        y={y + bodyY} 
        width={width} 
        height={bodyHeight || 1} // Ensure at least 1px height
        fill={color} 
      />
    </g>
  );
};

const Chart = () => {
  const { chartData, setChartData, symbol, timeFrame, activeTool, indicators } = useChartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Function to fetch market data
  const fetchMarketData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert symbol format for API (e.g., BTC/USD -> BTCUSD)
      const formattedSymbol = symbol.replace('/', '');
      
      // Map timeframe to API format
      const apiTimeframe = timeFrame === '1d' ? 'day' : 
                          timeFrame === '1h' ? 'hour' : 
                          timeFrame === '1w' ? 'week' : 'hour';
      
      // Use CryptoCompare API for cryptocurrency data
      const response = await fetch(
        `https://min-api.cryptocompare.com/data/v2/histo${apiTimeframe}?fsym=${formattedSymbol.split('USD')[0]}&tsym=USD&limit=50`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.Response === 'Error') {
        throw new Error(data.Message);
      }
      
      // Transform data to match our chart data format
      const transformedData = data.Data.Data.map((item: any) => ({
        timestamp: new Date(item.time * 1000).toISOString(),
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volumefrom
      }));
      
      setChartData(transformedData);
    } catch (err) {
      console.error('Failed to fetch market data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
      // Fall back to generated data if fetch fails
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on initial load and when symbol or timeframe changes
  useEffect(() => {
    fetchMarketData();
    // Set up polling to refresh data
    const interval = setInterval(() => {
      fetchMarketData();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, [symbol, timeFrame]);

  // Apply indicators to the data
  const processedData = indicators.includes('sma')
    ? calculateSMA(chartData, 14)
    : chartData;

  if (isLoading && chartData.length === 0) {
    return (
      <div className="chart-container flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading chart data...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-destructive/10 text-destructive p-2 rounded-t-md z-10">
          {error}
        </div>
      )}
      
      <div className="absolute top-2 right-2 z-10">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={fetchMarketData} 
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <div className="chart-container">
        <ChartContainer config={{}} className="h-[500px]">
          {/* Main price chart */}
          <ComposedChart
            data={processedData}
            margin={{ top: 20, right: 50, left: 20, bottom: 5 }}
            className="w-full h-[350px]"
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
            
            {/* Candlesticks */}
            {chartData.map((d, i) => (
              <CustomCandlestick
                key={i}
                x={(i * 100) / chartData.length + '%'}
                width={(100 / chartData.length) * 0.6 + '%'}
                open={d.open}
                close={d.close}
                high={d.high - d.low}
                low={0}
                y={0}
              />
            ))}
            
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
            
            {/* Add reference line for current price */}
            {chartData.length > 0 && (
              <ReferenceLine
                y={chartData[chartData.length - 1].close}
                stroke="#2196F3"
                strokeDasharray="3 3"
              />
            )}
          </ComposedChart>

          {/* Volume chart */}
          <BarChart
            data={processedData}
            margin={{ top: 5, right: 50, left: 20, bottom: 5 }}
            className="w-full h-[150px]"
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatDate}
              stroke="#555"
              tick={{ fill: '#999' }}
            />
            <YAxis
              dataKey="volume"
              orientation="right"
              tick={{ fill: '#999' }}
              stroke="#555"
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                return value;
              }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#2A2F45', border: 'none' }}
              labelStyle={{ color: '#E0E0E0' }}
              itemStyle={{ color: '#E0E0E0' }}
              formatter={(value: any) => [new Intl.NumberFormat().format(value), 'Volume']}
            />
            <Bar
              dataKey="volume"
              fill="rgba(33, 150, 243, 0.3)"
            />
          </BarChart>
        </ChartContainer>
      </div>
      
      {/* Chart overlay for cursor changes based on active tool */}
      <div 
        className="absolute inset-0" 
        style={{ cursor: activeTool === 'cursor' ? 'default' : 'crosshair',
                pointerEvents: 'none' }}
      />
    </div>
  );
};

export default Chart;
