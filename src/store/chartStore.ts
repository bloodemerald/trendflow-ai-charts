
import { create } from 'zustand';
import { getAIResponse } from '../services/aiService';
import { calculateRSI, calculateMACD, calculateBollingerBands } from '../lib/indicators';

type ChartData = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

// Export ChartData to be used in other files
export type { ChartData };

export type TimeFrame = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';

type ChatMessage = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
};

interface ChartState {
  symbol: string;
  setSymbol: (symbol: string) => void;
  timeFrame: TimeFrame;
  setTimeFrame: (timeFrame: TimeFrame) => void;
  chartData: ChartData[];
  setChartData: (data: ChartData[]) => void;
  indicators: string[];
  toggleIndicator: (indicatorName: string) => void;
  chatMessages: ChatMessage[];
  addUserMessage: (text: string) => void;
  isAIAnalyzing: boolean;
  setIsAIAnalyzing: (isAnalyzing: boolean) => void;
  isRightSidebarVisible: boolean;
  toggleRightSidebar: () => void;
  marketSummary: {
    open: number;
    high: number;
    low: number;
    close: number;
    change: number;
    changePercent: number;
    volume: number;
  };
  updateMarketSummary: () => void;
  latestSMA50: number | null;
  rsi: { time: number; value: number }[];
  macd: { time: number; macd: number; signal: number; histogram: number }[];
  bollingerBands: { time: number; middle: number; upper: number; lower: number }[];
  calculateIndicators: () => void;
}

const SMA_PERIOD_FOR_SUMMARY = 50;

// Helper to calculate SMA for the last point
const calculateLastSMA = (data: ChartData[], period: number): number | null => {
  if (!data || data.length < period) return null;
  const relevantData = data.slice(data.length - period);
  const sum = relevantData.reduce((acc, val) => acc + val.close, 0);
  return sum / period;
};

// Create initial AI messages
const initialMessages: ChatMessage[] = [
  {
    id: '1',
    sender: 'ai',
    text: 'Welcome to TradingAI! I can help analyze chart patterns and provide trading insights. What would you like to analyze today?',
    timestamp: new Date()
  }
];

export const useChartStore = create<ChartState>((set, get) => ({
  symbol: 'BTC/USD',
  setSymbol: (symbol) => set({ symbol }),
  timeFrame: '1m',
  setTimeFrame: (timeFrame) => set({ timeFrame }),
  chartData: [],
  setChartData: (data) => {
    set({ chartData: data });
    get().updateMarketSummary();
    get().calculateIndicators();
  },
  indicators: ['sma'],
  toggleIndicator: (indicatorName) => set((state) => {
    const newIndicators = state.indicators.includes(indicatorName)
      ? state.indicators.filter(ind => ind !== indicatorName)
      : [...state.indicators, indicatorName];
    return { indicators: newIndicators };
  }),
  chatMessages: initialMessages,
  addUserMessage: async (text) => {
    // Add user message
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        {
          id: Date.now().toString(),
          sender: 'user' as 'user',
          text,
          timestamp: new Date(),
        },
      ],
      isAIAnalyzing: true,
    }));

    const { chartData, chatMessages } = get();
    const aiResponse = await getAIResponse(chatMessages, chartData);

    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        {
          id: Date.now().toString() + '-ai',
          sender: 'ai' as 'ai',
          text: aiResponse,
          timestamp: new Date(),
        },
      ],
      isAIAnalyzing: false,
    }));
  },
  isAIAnalyzing: false,
  setIsAIAnalyzing: (isAnalyzing) => set({ isAIAnalyzing: isAnalyzing }),
  marketSummary: {
    open: 0,
    high: 0,
    low: 0,
    close: 0,
    change: 0,
    changePercent: 0,
    volume: 0
  },
  latestSMA50: null,
  updateMarketSummary: () => {
    const { chartData } = get();
    
    if (chartData.length === 0) {
      set({
        marketSummary: {
          open: 0, high: 0, low: 0, close: 0, change: 0, changePercent: 0, volume: 0
        },
        latestSMA50: null
      });
      return;
    }
    
    const firstPoint = chartData[0];
    const lastPoint = chartData[chartData.length - 1];
    
    let highestHigh = chartData[0].high;
    let lowestLow = chartData[0].low;
    let totalVolume = 0;
    
    chartData.forEach(point => {
      highestHigh = Math.max(highestHigh, point.high);
      lowestLow = Math.min(lowestLow, point.low);
      totalVolume += point.volume;
    });
    
    const change = lastPoint.close - firstPoint.open;
    const changePercent = firstPoint.open === 0 ? 0 : (change / firstPoint.open) * 100;
    
    const latestSMAValue = calculateLastSMA(chartData, SMA_PERIOD_FOR_SUMMARY);

    set({
      marketSummary: {
        open: firstPoint.open,
        high: highestHigh,
        low: lowestLow,
        close: lastPoint.close,
        change,
        changePercent,
        volume: totalVolume
      },
      latestSMA50: latestSMAValue
    });
  },
  isRightSidebarVisible: true,
  toggleRightSidebar: () => set((state) => ({ isRightSidebarVisible: !state.isRightSidebarVisible })),
  rsi: [],
  macd: [],
  bollingerBands: [],
  calculateIndicators: () => {
    const { chartData } = get();
    if (chartData.length > 0) {
      set({
        rsi: calculateRSI(chartData),
        macd: calculateMACD(chartData),
        bollingerBands: calculateBollingerBands(chartData),
      });
    }
  },
}));
