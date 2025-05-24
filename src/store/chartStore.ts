
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

// --- BEGIN Drawing-related types ---
export interface DrawingPoint {
  x: number;
  y: number;
}

export type DrawingObjectType = 'trendline' | 'rectangle' | 'text';

export interface DrawingObject {
  id: string;
  type: DrawingObjectType;
  points: DrawingPoint[];
  color: string;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  lineWidth: number;
  text?: string;
}

export interface CurrentDrawingSettings {
  color: string;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  lineWidth: number;
}
// --- END Drawing-related types ---

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
  addIndicator: (indicator: string) => void; // Will be replaced by toggleIndicator
  removeIndicator: (indicator: string) => void; // Will be replaced by toggleIndicator
  toggleIndicator: (indicatorName: string) => void; // Added
  chatMessages: ChatMessage[];
  addUserMessage: (text: string) => void;
  addAIMessage: (text: string) => void;
  isAIAnalyzing: boolean;
  setIsAIAnalyzing: (isAnalyzing: boolean) => void;
  showDrawingSettings: boolean;
  setShowDrawingSettings: (show: boolean) => void;
  // --- BEGIN Drawing-related state ---
  drawings: DrawingObject[];
  currentDrawingSettings: CurrentDrawingSettings;
  selectedDrawingId: string | null; // Added for selection
  // --- END Drawing-related state ---
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
  // --- BEGIN Drawing-related actions ---
  addDrawing: (drawing: DrawingObject) => void;
  updateDrawingSetting: <K extends keyof CurrentDrawingSettings>(
    key: K,
    value: CurrentDrawingSettings[K]
  ) => void;
  setSelectedDrawingId: (id: string | null) => void; // Added for selection
  deleteDrawing: (id: string) => void; // Added for deletion
  updateDrawingProperties: (drawingId: string, properties: Partial<Omit<DrawingObject, 'id' | 'type' | 'points'>>) => void; // Added for property updates
  // --- END Drawing-related actions ---
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
  timeFrame: '1d',
  setTimeFrame: (timeFrame) => set({ timeFrame }),
  chartData: generateMockChartData(),
  setChartData: (data) => {
    set({ chartData: data });
    // After updating chart data, also update market summary
    get().updateMarketSummary();
  },
  activeTool: 'cursor',
  setActiveTool: (tool) => set({ activeTool: tool }),
  indicators: ['sma'], // Keep 'sma' as a default for now, or set to []
  // Remove old addIndicator and removeIndicator
  addIndicator: (indicator) => set((state) => { // This will be effectively replaced
    if (!state.indicators.includes(indicator)) {
      return { indicators: [...state.indicators, indicator] };
    }
    return {};
  }),
  removeIndicator: (indicator) => set((state) => ({ // This will be effectively replaced
    indicators: state.indicators.filter((i) => i !== indicator) 
  })),
  toggleIndicator: (indicatorName) => set((state) => {
    const newIndicators = state.indicators.includes(indicatorName)
      ? state.indicators.filter(ind => ind !== indicatorName)
      : [...state.indicators, indicatorName];
    return { indicators: newIndicators };
  }),
  chatMessages: initialMessages,
  addUserMessage: (text) => set((state) => {
    const newMessage: ChatMessage = {
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
    const newMessage: ChatMessage = {
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
  setIsAIAnalyzing: (isAnalyzing) => set({ isAIAnalyzing: isAnalyzing }),
  showDrawingSettings: false,
  setShowDrawingSettings: (show) => set({ showDrawingSettings: show }),
  // --- BEGIN Drawing-related state initialization ---
  drawings: [],
  currentDrawingSettings: {
    color: '#2196F3', // Default blue color
    lineStyle: 'solid',
    lineWidth: 1,
  },
  selectedDrawingId: null, // Initialized
  // --- END Drawing-related state initialization ---
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
  // --- BEGIN Drawing-related action implementations ---
  addDrawing: (drawing) =>
    set((state) => ({ drawings: [...state.drawings, drawing] })),
  updateDrawingSetting: (key, value) =>
    set((state) => ({
      currentDrawingSettings: {
        ...state.currentDrawingSettings,
        [key]: value,
      },
    })),
  setSelectedDrawingId: (id) => set({ selectedDrawingId: id }),
  deleteDrawing: (id) =>
    set((state) => ({
      drawings: state.drawings.filter((d) => d.id !== id),
      selectedDrawingId: state.selectedDrawingId === id ? null : state.selectedDrawingId,
    })),
  updateDrawingProperties: (drawingId, properties) => set(state => ({
    drawings: state.drawings.map(d => 
      d.id === drawingId ? { ...d, ...properties } : d
    ),
  })),
  // --- END Drawing-related action implementations ---
}));
