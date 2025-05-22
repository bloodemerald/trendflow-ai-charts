
import { create } from 'zustand';

type ChartData = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type TimeFrame = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M';

type Tool = 'cursor' | 'crosshair' | 'trendline' | 'fibonacci' | 'rectangle' | 'text';

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
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  indicators: string[];
  addIndicator: (indicator: string) => void;
  removeIndicator: (indicator: string) => void;
  chatMessages: ChatMessage[];
  addUserMessage: (text: string) => void;
  addAIMessage: (text: string) => void;
  isAIAnalyzing: boolean;
  setIsAIAnalyzing: (isAnalyzing: boolean) => void;
  showDrawingSettings: boolean;
  setShowDrawingSettings: (show: boolean) => void;
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

export const useChartStore = create<ChartState>((set) => ({
  symbol: 'BTC/USD',
  setSymbol: (symbol) => set({ symbol }),
  timeFrame: '1d',
  setTimeFrame: (timeFrame) => set({ timeFrame }),
  chartData: generateMockChartData(),
  setChartData: (data) => set({ chartData: data }),
  activeTool: 'cursor',
  setActiveTool: (tool) => set({ activeTool: tool }),
  indicators: ['sma'],
  addIndicator: (indicator) => set((state) => ({ 
    indicators: [...state.indicators, indicator] 
  })),
  removeIndicator: (indicator) => set((state) => ({ 
    indicators: state.indicators.filter((i) => i !== indicator) 
  })),
  chatMessages: initialMessages,
  addUserMessage: (text) => set((state) => {
    const newMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date()
    };
    return { 
      chatMessages: [...state.chatMessages, newMessage],
      isAIAnalyzing: true
    };
  }),
  addAIMessage: (text) => set((state) => {
    const newMessage = {
      id: Date.now().toString(),
      sender: 'ai',
      text,
      timestamp: new Date()
    };
    return { 
      chatMessages: [...state.chatMessages, newMessage],
      isAIAnalyzing: false
    };
  }),
  isAIAnalyzing: false,
  setIsAIAnalyzing: (isAnalyzing) => set({ isAIAnalyzing }),
  showDrawingSettings: false,
  setShowDrawingSettings: (show) => set({ showDrawingSettings: show })
}));
