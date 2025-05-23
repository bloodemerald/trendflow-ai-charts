import React, { useEffect, useState } from 'react';
import { useChartStore } from '@/store/chartStore';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart,
  Bar,
  ReferenceLine,
  Area
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCcw } from 'lucide-react';

// Custom candlestick component for recharts
const CustomCandlestick = (props: any) => {
  const { 
    x, y, width, height, index,
    open, close, high, low,
    xAxis, yAxis, 
    fill, stroke
  } = props;
  
  // Skip rendering if any required data is missing
  if (!y || !open || !close || !high || !low) {
    return null;
  }
  
  // Calculate if candle is bullish (green) or bearish (red)
  const isBullish = close > open;
  const color = isBullish ? '#26A69A' : '#EF5350';
  
  // Calculate positions
  const openY = y(open);
  const closeY = y(close);
  const highY = y(high);
  const lowY = y(low);
  
  // Calculate candle body
  const bodyY = Math.min(openY, closeY);
  const bodyHeight = Math.abs(closeY - openY);
  
  return (
    <g key={`candle-${index}`}>
      {/* Wick line from high to low */}
      <line 
        x1={x + width / 2} 
        x2={x + width / 2} 
        y1={highY}
        y2={lowY} 
        stroke={color} 
      />
      
      {/* Candle body */}
      <rect 
        x={x + width * 0.1}
        y={bodyY}
        width={width * 0.8} 
        height={Math.max(1, bodyHeight) || 1}
        fill={color}
        stroke="none"
      />
    </g>
  );
};

// Custom tooltip for candlestick data
const CandlestickTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border p-3 rounded-md shadow-md">
        <p className="font-medium text-sm mb-1">{new Date(data.timestamp).toLocaleString()}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <span className="text-muted-foreground text-xs">Open:</span>
          <span className="font-mono text-xs font-medium">${data.open.toFixed(2)}</span>
          
          <span className="text-muted-foreground text-xs">High:</span>
          <span className="font-mono text-xs font-medium text-green-500">${data.high.toFixed(2)}</span>
          
          <span className="text-muted-foreground text-xs">Low:</span>
          <span className="font-mono text-xs font-medium text-red-500">${data.low.toFixed(2)}</span>
          
          <span className="text-muted-foreground text-xs">Close:</span>
          <span className="font-mono text-xs font-medium">${data.close.toFixed(2)}</span>
          
          <span className="text-muted-foreground text-xs">Volume:</span>
          <span className="font-mono text-xs font-medium">{data.volume.toLocaleString()}</span>
        </div>
      </div>
    );
  }
  
  return null;
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
      let apiTimeframe;
      switch (timeFrame) {
        case '1m': apiTimeframe = 'minute'; break;
        case '5m': apiTimeframe = 'minute'; break;
        case '15m': apiTimeframe = 'minute'; break;
        case '30m': apiTimeframe = 'minute'; break;
        case '1h': apiTimeframe = 'hour'; break;
        case '4h': apiTimeframe = 'hour'; break;
        case '1d': apiTimeframe = 'day'; break;
        case '1w': apiTimeframe = 'week'; break;
        default: apiTimeframe = 'hour';
      }
      
      // For minute-level data, we need to specify how many minutes
      let limit = 50;
      let aggregation = 1;
      
      if (apiTimeframe === 'minute') {
        switch (timeFrame) {
          case '5m': aggregation = 5; break;
          case '15m': aggregation = 15; break;
          case '30m': aggregation = 30; break;
          default: aggregation = 1;
        }
      } else if (apiTimeframe === 'hour' && timeFrame === '4h') {
        aggregation = 4;
      }
      
      // Use CryptoCompare API for cryptocurrency data
      const response = await fetch(
        `https://min-api.cryptocompare.com/data/v2/histo${apiTimeframe}?fsym=${formattedSymbol.split('USD')[0]}&tsym=USD&limit=${limit}&aggregate=${aggregation}`
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
    // Set up polling to refresh data based on timeframe
    const interval = setInterval(() => {
      fetchMarketData();
    }, timeFrame === '1m' ? 30000 : 60000); // Refresh more frequently for 1m charts
    
    return () => clearInterval(interval);
  }, [symbol, timeFrame]);

  // Apply indicators to the data
  const processedData = indicators.includes('sma')
    ? calculateSMA(chartData, 14)
    : chartData;

  if (isLoading && chartData.length === 0) {
    return (
      <div className="chart-container flex items-center justify-center h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading chart data...</span>
      </div>
    );
  }

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].close : 0;

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
        {/* Price chart container */}
        <div className="h-[350px] w-full bg-background border border-border rounded-md">
          <ChartContainer config={{}} className="dark:bg-card bg-card">
            <svg width="100%" height="350">
              <g>
                {/* Background grid */}
                <CartesianGrid 
                  height={310} 
                  width="100%" 
                  strokeDasharray="3 3" 
                  vertical={true} 
                  horizontal={true}
                  stroke="rgba(255,255,255,0.1)"
                />
                
                {/* X and Y axis will be handled manually since we're custom rendering */}
                
                {/* Render candlesticks */}
                {processedData.map((entry, index) => {
                  const xPos = (index / processedData.length) * 100;
                  const width = (90 / processedData.length);
                  
                  // Y-axis scaling functions (simplified for example)
                  const yScale = (val: number) => {
                    // Find min and max values in data for scaling
                    const minPrice = Math.min(...processedData.map(d => d.low));
                    const maxPrice = Math.max(...processedData.map(d => d.high));
                    const range = maxPrice - minPrice;
                    // Padding of 5% at top and bottom
                    const paddedMin = minPrice - (range * 0.05);
                    const paddedMax = maxPrice + (range * 0.05);
                    const paddedRange = paddedMax - paddedMin;
                    
                    // Invert Y coordinate (SVG y is top-to-bottom)
                    return 310 - ((val - paddedMin) / paddedRange * 280);
                  };
                  
                  return (
                    <g key={`candle-group-${index}`} transform={`translate(${xPos}%, 0)`}>
                      {/* Draw candle wick (high to low) */}
                      <line
                        x1={width / 2}
                        x2={width / 2}
                        y1={yScale(entry.high)}
                        y2={yScale(entry.low)}
                        stroke={entry.close >= entry.open ? "#26A69A" : "#EF5350"}
                        strokeWidth={1}
                      />
                      
                      {/* Draw candle body */}
                      <rect
                        x={width * 0.1}
                        y={Math.min(yScale(entry.open), yScale(entry.close))}
                        width={width * 0.8}
                        height={Math.max(1, Math.abs(yScale(entry.close) - yScale(entry.open)))}
                        fill={entry.close >= entry.open ? "#26A69A" : "#EF5350"}
                      />
                    </g>
                  );
                })}
                
                {/* SMA line if indicator is active */}
                {indicators.includes('sma') && processedData.filter(d => d.sma).map((entry, index) => {
                  // Only render if we have a previous point to connect to
                  if (index > 0 && processedData[index - 1].sma) {
                    const minPrice = Math.min(...processedData.map(d => d.low));
                    const maxPrice = Math.max(...processedData.map(d => d.high));
                    const range = maxPrice - minPrice;
                    const paddedMin = minPrice - (range * 0.05);
                    const paddedMax = maxPrice + (range * 0.05);
                    const paddedRange = paddedMax - paddedMin;
                    
                    const yScale = (val: number) => 310 - ((val - paddedMin) / paddedRange * 280);
                    
                    const x1 = ((index - 1) / processedData.length) * 100;
                    const x2 = (index / processedData.length) * 100;
                    const y1 = yScale(processedData[index - 1].sma);
                    const y2 = yScale(entry.sma);
                    
                    return (
                      <line
                        key={`sma-${index}`}
                        x1={`${x1}%`}
                        y1={y1}
                        x2={`${x2}%`}
                        y2={y2}
                        stroke="#9C27B0"
                        strokeWidth={1.5}
                      />
                    );
                  }
                  return null;
                })}
                
                {/* Price axis on right */}
                <g transform="translate(95%, 0)">
                  {[...Array(5)].map((_, i) => {
                    const minPrice = Math.min(...processedData.map(d => d.low));
                    const maxPrice = Math.max(...processedData.map(d => d.high));
                    const range = maxPrice - minPrice;
                    const step = range / 4;
                    const price = minPrice + (step * i);
                    return (
                      <g key={`price-${i}`}>
                        <line
                          x1="0"
                          y1={310 - (i * 70)}
                          x2="-5"
                          y2={310 - (i * 70)}
                          stroke="rgba(255,255,255,0.5)"
                        />
                        <text
                          x="5"
                          y={310 - (i * 70) + 4}
                          fontSize="10"
                          textAnchor="start"
                          fill="rgba(255,255,255,0.7)"
                        >
                          {price.toFixed(2)}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </g>
            </svg>
          </ChartContainer>
        </div>

        {/* Volume chart container */}
        <div className="h-[150px] mt-4 w-full">
          <ChartContainer config={{}} className="dark:bg-card bg-card">
            <BarChart
              data={processedData}
              margin={{ top: 5, right: 50, left: 20, bottom: 5 }}
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
                content={<CandlestickTooltip />}
              />
              <Bar
                dataKey="volume"
                fill="rgba(33, 150, 243, 0.3)"
              />
            </BarChart>
          </ChartContainer>
        </div>
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
