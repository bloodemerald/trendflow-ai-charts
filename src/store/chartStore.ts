import { create } from 'zustand';
import { getAIResponse } from '../services/aiService';

type ChartData = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

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
  toggleIndicator: (indicatorName: string) => void; // Added
  chatMessages: ChatMessage[];
  addUserMessage: (text: string) => void;
  // addAIMessage: (text: string) => void; // To be removed
  isAIAnalyzing: boolean;
  setIsAIAnalyzing: (isAnalyzing: boolean) => void;
  isRightSidebarVisible: boolean; // Added for right sidebar visibility
  toggleRightSidebar: () => void; // Added for right sidebar visibility
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
}

// Generate some mock data for initial rendering
const generateMockChartData = (): ChartData[] => {
  const data: ChartData[] = [];
  let basePrice = 100;
  const now = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    
    const open = basePrice + (Math.random() * 2 - 1);
    const close = open + (Math.random() * 4 - 2);
    const high = Math.max(open, close) + (Math.random() * 1);
    const low = Math.min(open, close) - (Math.random() * 1);
    const volume = Math.floor(Math.random() * 1000) + 500;
    
    data.push({
      timestamp: date.toISOString(),
      open,
      high,
      low,
      close,
      volume
    });
    
    basePrice = close;
  }
  
  return data;
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
  chartData: generateMockChartData(),
  setChartData: (data) => {
    set({ chartData: data });
    // After updating chart data, also update market summary
    get().updateMarketSummary();
  },
  indicators: ['sma'], // Keep 'sma' as a default for now, or set to []
  // addIndicator and removeIndicator have been fully deleted.
  toggleIndicator: (indicatorName) => set((state) => {
    const newIndicators = state.indicators.includes(indicatorName)
      ? state.indicators.filter(ind => ind !== indicatorName)
      : [...state.indicators, indicatorName];
    return { indicators: newIndicators };
  }),
  chatMessages: initialMessages,
  addUserMessage: (text) => { // This is the combined and corrected function
    // Add user message and set analyzing state immediately
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        {
          id: Date.now().toString(),
          sender: 'user' as 'user', // Type assertion
          text,
          timestamp: new Date(),
        },
      ],
      isAIAnalyzing: true,
    }));

    // Perform AI call
    // Use get() to access the latest state within this async operation
    const currentMessages = get().chatMessages;
    const currentChartData = get().chartData;

    getAIResponse(currentMessages, currentChartData)
      .then((aiResponseText) => {
        set((state) => ({
          chatMessages: [
            ...state.chatMessages,
            {
              id: Date.now().toString() + '-ai',
              sender: 'ai' as 'ai', // Type assertion
              text: aiResponseText,
              timestamp: new Date(),
            },
          ],
          isAIAnalyzing: false,
        }));
      })
      .catch((error) => {
        console.error("Error getting AI response:", error);
        set((state) => ({
          chatMessages: [
            ...state.chatMessages,
            {
              id: Date.now().toString() + '-error',
              sender: 'ai' as 'ai', // Type assertion
              text: "Sorry, I encountered an error. Please try again.",
              timestamp: new Date(),
            },
          ],
          isAIAnalyzing: false,
        }));
      });
  },
  // addAIMessage is no longer needed as its logic is merged into addUserMessage
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
  updateMarketSummary: () => {
    const { chartData } = get();
    
    if (chartData.length === 0) return;
    
    // Get first and last data points for the period
    const firstPoint = chartData[0];
    const lastPoint = chartData[chartData.length - 1];
    
    // Find highest high and lowest low
    let highestHigh = chartData[0].high;
    let lowestLow = chartData[0].low;
    let totalVolume = 0;
    
    chartData.forEach(point => {
      highestHigh = Math.max(highestHigh, point.high);
      lowestLow = Math.min(lowestLow, point.low);
      totalVolume += point.volume;
    });
    
    // Calculate change and change percentage
    const change = lastPoint.close - firstPoint.open;
    const changePercent = (change / firstPoint.open) * 100;
    
    set({
      marketSummary: {
        open: firstPoint.open,
        high: highestHigh,
        low: lowestLow,
        close: lastPoint.close,
        change,
        changePercent,
        volume: totalVolume
      }
    });
  },
  isRightSidebarVisible: true, // Default to true
  toggleRightSidebar: () => set((state) => ({ isRightSidebarVisible: !state.isRightSidebarVisible })),
}));
