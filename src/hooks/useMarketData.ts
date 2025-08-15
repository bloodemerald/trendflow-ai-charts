
import { useState, useEffect, useCallback } from 'react';
import { useChartStore } from '../store/chartStore';
import type { ChartData } from '../store/chartStore';

interface UseMarketDataReturn {
  chartData: ChartData[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export const useMarketData = (symbol: string, timeFrame: string): UseMarketDataReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Access chartData and setChartData from useChartStore
  const chartData = useChartStore((state) => state.chartData);
  const setChartData = useChartStore((state) => state.setChartData);

  const fetchMarketData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert symbol format for API (e.g., BTC/USD -> BTC)
      const baseSymbol = symbol.split('/')[0]; 
      
      // Map timeframe to API format
      let apiTimeframe;
      let limit = 2000;
      let aggregate = 1;

      switch (timeFrame) {
        case '1m': apiTimeframe = 'minute'; limit = 1440; aggregate = 1; break;
        case '5m': apiTimeframe = 'minute'; limit = 288; aggregate = 5; break;
        case '15m': apiTimeframe = 'minute'; limit = 96; aggregate = 15; break;
        case '30m': apiTimeframe = 'minute'; limit = 48; aggregate = 30; break;
        case '1h': apiTimeframe = 'hour'; limit = 720; aggregate = 1; break;
        case '4h': apiTimeframe = 'hour'; limit = 180; aggregate = 4; break;
        case '1d': apiTimeframe = 'day'; limit = 365; aggregate = 1; break;
        case '1w': apiTimeframe = 'day'; limit = 52 * 7; aggregate = 7; break;
        default: apiTimeframe = 'hour'; limit = 720; aggregate = 1;
      }
      
      const API_URL = `https://min-api.cryptocompare.com/data/v2/histo${apiTimeframe}?fsym=${baseSymbol}&tsym=USD&limit=${limit}&aggregate=${aggregate}`;
      
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText} (Status: ${response.status})`);
      }
      
      const data = await response.json();
      
      if (data.Response === 'Error') {
        throw new Error(data.Message || 'Unknown API Error');
      }
      
      if (!data.Data || !data.Data.Data) {
        throw new Error('Invalid data structure from API');
      }
      
      // Transform data to match our chart data format
      const transformedData: ChartData[] = data.Data.Data.map((item: any) => ({
        time: item.time, // Use timestamp directly
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volumefrom,
      }));
      
      // Only set data if it's different to prevent loops
      if (JSON.stringify(transformedData) !== JSON.stringify(chartData)) {
        setChartData(transformedData);
      }
    } catch (err) {
      console.error('Failed to fetch market data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
    } finally {
      setIsLoading(false);
    }
  }, [symbol, timeFrame, setChartData]); // Removed chartData from dependencies to prevent loops

  useEffect(() => {
    if (symbol && timeFrame) {
      fetchMarketData();

      let pollInterval = 60000;
      if (timeFrame === '1m') pollInterval = 30000;
      else if (timeFrame === '5m' || timeFrame === '15m' || timeFrame === '30m') pollInterval = 45000;
      
      const intervalId = setInterval(() => {
        fetchMarketData();
      }, pollInterval); 

      return () => clearInterval(intervalId);
    }
  }, [symbol, timeFrame, fetchMarketData]);

  return { chartData, isLoading, error, refreshData: fetchMarketData };
};
