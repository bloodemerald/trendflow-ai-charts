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

export type DrawingObjectType = 'trendline' | 'rectangle' | 'text' | 'fibonacci';

export type LineStyle = 'solid' | 'dashed' | 'dotted';

export interface DrawingObject {
  id: string;
  type: DrawingObjectType;
  points: DrawingPoint[];
  color: string;
  lineStyle: LineStyle;
  lineWidth: number;
  text?: string;
}

export interface CurrentDrawingSettings {
  color: string;
  lineStyle: LineStyle;
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
  // addAIMessage: (text: string) => void; // To be removed
  isAIAnalyzing: boolean;
  setIsAIAnalyzing: (isAnalyzing: boolean) => void;
  showDrawingSettings: boolean;
  setShowDrawingSettings: (show: boolean) => void;
  // --- BEGIN Drawing-related state ---
  drawings: DrawingObject[];
  currentDrawingSettings: CurrentDrawingSettings;
  selectedDrawingId: string | null;
  // --- END Drawing-related state ---
  // --- BEGIN Zoom-related state ---
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  // --- END Zoom-related state ---
  // --- BEGIN X-axis Zoom-related state ---
  xZoomLevel: number;
  xPanOffset: number;
  setXZoomLevel: (level: number) => void;
  panXAxis: (delta: number) => void;
  // --- END X-axis Zoom-related state ---
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
  setSelectedDrawingId: (id: string | null) => void;
  deleteDrawing: (id: string) => void;
  updateDrawingProperties: (drawingId: string, properties: Partial<Omit<DrawingObject, 'id' | 'type' | 'points'>>) => void;
  clearAllDrawings: () => void;
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
  // --- BEGIN Zoom-related state initialization ---
  zoomLevel: 1,
  setZoomLevel: (level) => set({ zoomLevel: Math.max(0.5, Math.min(5, level)) }),
  zoomIn: () => set((state) => ({ zoomLevel: Math.min(5, state.zoomLevel * 1.2) })),
  zoomOut: () => set((state) => ({ zoomLevel: Math.max(0.5, state.zoomLevel / 1.2) })),
  resetZoom: () => set({ zoomLevel: 1 }),
  // --- END Zoom-related state initialization ---
  // --- BEGIN X-axis Zoom-related state initialization ---
  xZoomLevel: 1, // Default to 1 (all data visible)
  xPanOffset: 0, // Default to 0 (start from the beginning)
  setXZoomLevel: (level) => set((state) => {
    const { chartData, xZoomLevel: currentXZoomLevel, xPanOffset: currentXPanOffset } = state;
    const totalDataPoints = chartData.length;
    const MIN_VIEWABLE_POINTS = 10;

    const minZoomLevel = 1; // Cannot zoom out further than seeing all data
    const maxZoomLevel = totalDataPoints > MIN_VIEWABLE_POINTS ? totalDataPoints / MIN_VIEWABLE_POINTS : 1;
    
    const newXZoomLevel = Math.max(minZoomLevel, Math.min(level, maxZoomLevel));

    if (newXZoomLevel === currentXZoomLevel) return {}; // No change

    // Try to keep the center of the view consistent
    const oldVisiblePoints = Math.max(MIN_VIEWABLE_POINTS, Math.round(totalDataPoints / currentXZoomLevel));
    const oldCenterIndexOffset = currentXPanOffset + oldVisiblePoints / 2;
    
    const newVisiblePoints = Math.max(MIN_VIEWABLE_POINTS, Math.round(totalDataPoints / newXZoomLevel));
    let newXPanOffset = Math.round(oldCenterIndexOffset - newVisiblePoints / 2);
    
    // Clamp newXPanOffset
    const maxPanOffset = Math.max(0, totalDataPoints - newVisiblePoints);
    newXPanOffset = Math.max(0, Math.min(newXPanOffset, maxPanOffset));
    
    return { xZoomLevel: newXZoomLevel, xPanOffset: newXPanOffset };
  }),
  panXAxis: (delta) => set((state) => {
    const { chartData, xZoomLevel, xPanOffset } = state;
    const totalDataPoints = chartData.length;
    const MIN_VIEWABLE_POINTS = 10;
    const visiblePoints = Math.max(MIN_VIEWABLE_POINTS, Math.round(totalDataPoints / xZoomLevel));
    
    let newXPanOffset = xPanOffset + delta;
    
    // Clamp newXPanOffset
    const maxPanOffset = Math.max(0, totalDataPoints - visiblePoints);
    newXPanOffset = Math.max(0, Math.min(newXPanOffset, maxPanOffset));
    
    if (newXPanOffset === xPanOffset) return {}; // No change
    
    return { xPanOffset: newXPanOffset };
  }),
  // --- END X-axis Zoom-related state initialization ---
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
  clearAllDrawings: () => set({ drawings: [], selectedDrawingId: null }),
  // --- END Drawing-related action implementations ---
}));
