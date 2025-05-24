import { useState, useEffect, useCallback } from 'react';
import { useChartStore } from '../store/chartStore';
import type { ChartData } from '../models/ChartData'; // Ensure this type matches what Chart.tsx expects

interface UseMarketDataReturn {
  chartData: ChartData[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export const useMarketData = (symbol: string, timeFrame: string): UseMarketDataReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false); // Initial state should be false, fetch will set it true
  const [error, setError] = useState<string | null>(null);
  
  // Access chartData and setChartData from useChartStore
  const chartData = useChartStore((state) => state.chartData);
  const setChartData = useChartStore((state) => state.setChartData);

  const fetchMarketData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert symbol format for API (e.g., BTC/USD -> BTC)
      // Assuming symbol format from store is like "BTC/USD"
      const baseSymbol = symbol.split('/')[0]; 
      
      // Map timeframe to API format
      let apiTimeframe;
      let limit = 2000; // Default limit for histo day/hour
      let aggregate = 1;

      switch (timeFrame) {
        case '1m': apiTimeframe = 'minute'; limit = 1440; aggregate = 1; break; // 1 day of 1-min data
        case '5m': apiTimeframe = 'minute'; limit = 288; aggregate = 5; break;  // 1 day of 5-min data
        case '15m': apiTimeframe = 'minute'; limit = 96; aggregate = 15; break; // 1 day of 15-min data
        case '30m': apiTimeframe = 'minute'; limit = 48; aggregate = 30; break; // 1 day of 30-min data
        case '1h': apiTimeframe = 'hour'; limit = 720; aggregate = 1; break;   // 30 days of 1-hour data
        case '4h': apiTimeframe = 'hour'; limit = 180; aggregate = 4; break;   // 30 days of 4-hour data
        case '1d': apiTimeframe = 'day'; limit = 365; aggregate = 1; break;    // 1 year of 1-day data
        case '1w': apiTimeframe = 'day'; limit = 52 * 7; aggregate = 7; break; // 1 year of weekly data (aggregated daily)
        default: apiTimeframe = 'hour'; limit = 720; aggregate = 1; // Default to 1h data for 30 days
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
        timestamp: new Date(item.time * 1000).toISOString(), // Ensure ISOString for consistency
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volumefrom, // Make sure this matches ChartData type
      }));
      
      setChartData(transformedData);
    } catch (err) {
      console.error('Failed to fetch market data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
      // Do not clear data on error, allow chart to show stale data with error message
      // setChartData([]); 
    } finally {
      setIsLoading(false);
    }
  }, [symbol, timeFrame, setChartData]);

  useEffect(() => {
    if (symbol && timeFrame) { // Only fetch if symbol and timeFrame are set
      fetchMarketData(); // Initial fetch

      // Set up polling to refresh data
      // Polling interval based on timeframe (more frequent for smaller timeframes)
      let pollInterval = 60000; // Default 1 minute
      if (timeFrame === '1m') pollInterval = 30000; // 30 seconds for 1-minute chart
      else if (timeFrame === '5m' || timeFrame === '15m' || timeFrame === '30m') pollInterval = 45000; // 45 seconds for 5-30 min charts
      
      const intervalId = setInterval(() => {
        fetchMarketData();
      }, pollInterval); 

      return () => clearInterval(intervalId); // Cleanup interval on unmount or when dependencies change
    }
  }, [symbol, timeFrame, fetchMarketData]); // fetchMarketData is memoized by useCallback

  return { chartData, isLoading, error, refreshData: fetchMarketData };
};

// Make sure ChartData type is defined in 'src/models/ChartData.ts'
// Example:
// export interface ChartData {
//   timestamp: string; // ISO string
//   open: number;
//   high: number;
//   low: number;
//   close: number;
//   volume?: number; // Optional, as some contexts might not use it
//   sma?: number | null; // For indicators
// }
