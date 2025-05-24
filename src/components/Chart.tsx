
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useChartStore } from '@/store/chartStore';
import type { DrawingObject, DrawingPoint } from '@/store/chartStore'; // Import DrawingObject and DrawingPoint types
import { v4 as uuidv4 } from 'uuid'; // Import uuid
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
  const bodyHeight = Math.max(1, Math.abs(closeY - openY));
  
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
        height={bodyHeight}
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
  const { 
    chartData, 
    setChartData, 
    symbol, 
    timeFrame, 
    activeTool, 
    indicators,
    addDrawing, // Access addDrawing
    currentDrawingSettings, // Access currentDrawingSettings
    selectedDrawingId,      // For selection
    setSelectedDrawingId,   // For selection
    deleteDrawing           // For deletion
  } = useChartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 800, height: 600 });
  const svgRef = useRef<SVGSVGElement>(null);

  // --- BEGIN Drawing state ---
  const [isDrawing, setIsDrawing] = useState(false); // For line/rect drawing
  const [startPoint, setStartPoint] = useState<DrawingPoint | null>(null);
  const [currentEndPoint, setCurrentEndPoint] = useState<DrawingPoint | null>(null);
  // --- END Drawing state ---

  // --- BEGIN Text Annotation State ---
  const [isTextAnnotating, setIsTextAnnotating] = useState(false);
  const [textAnnotationPoint, setTextAnnotationPoint] = useState<DrawingPoint | null>(null);
  const [currentTextValue, setCurrentTextValue] = useState("");
  const textInputRef = useRef<HTMLInputElement>(null);
  // --- END Text Annotation State ---

  // --- BEGIN Crosshair State ---
  const [crosshairPosition, setCrosshairPosition] = useState<{ x: number; y: number } | null>(null);
  // --- END Crosshair State ---

  // Memoized ref callback to prevent infinite loops
  const svgRefCallback = useCallback((svg: SVGSVGElement | null) => {
    svgRef.current = svg;
    if (svg) {
      const rect = svg.getBoundingClientRect();
      // Only update if dimensions actually changed
      setChartDimensions(prev => {
        if (prev.width !== rect.width || prev.height !== rect.height) {
          return { width: rect.width, height: rect.height };
        }
        return prev;
      });
    }
  }, []);

  // Handle window resize to update chart dimensions
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setChartDimensions(prev => {
          if (prev.width !== rect.width || prev.height !== rect.height) {
            return { width: rect.width, height: rect.height };
          }
          return prev;
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading chart data...</span>
      </div>
    );
  }

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].close : 0;

  // Calculate price range for Y-axis scaling
  const minPrice = Math.min(...processedData.map(d => d.low));
  const maxPrice = Math.max(...processedData.map(d => d.high));
  const range = maxPrice - minPrice;
  const paddedMin = minPrice - (range * 0.05);
  const paddedMax = maxPrice + (range * 0.05);
  const paddedRange = paddedMax - paddedMin;

  // Y-axis scaling function
  const yScale = (val: number) => {
    return 310 - ((val - paddedMin) / paddedRange * 280);
  };

  // --- BEGIN Mouse event handlers for drawing ---
  const handleMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    const { activeTool, drawings, setSelectedDrawingId } = useChartStore.getState();
    const svgRect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - svgRect.left;
    const mouseY = event.clientY - svgRect.top;

    if (activeTool === 'cursor') {
      let hitDetected = false;
      // Iterate in reverse to select top-most drawing
      for (let i = drawings.length - 1; i >= 0; i--) {
        const drawing = drawings[i];
        if (isPointNearDrawing(mouseX, mouseY, drawing)) {
          setSelectedDrawingId(drawing.id);
          hitDetected = true;
          console.log('Selected drawing:', drawing.id);
          break; 
        }
      }
      if (!hitDetected) {
        setSelectedDrawingId(null);
        console.log('No drawing selected, deselected all.');
      }
    } else if (activeTool === 'text') {
      if (!isTextAnnotating) {
        setIsTextAnnotating(true);
        setTextAnnotationPoint({ x: mouseX, y: mouseY });
        setCurrentTextValue("");
        console.log('mousedown for text at:', { x: mouseX, y: mouseY });
      }
    } else if (activeTool === 'trendline' || activeTool === 'rectangle') {
      setIsDrawing(true);
      setStartPoint({ x: mouseX, y: mouseY });
      setCurrentEndPoint({ x: mouseX, y: mouseY });
      console.log(`mousedown for ${activeTool} at:`, { x: mouseX, y: mouseY });
    }
  };

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const { activeTool } = useChartStore.getState();
    const svgRect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - svgRect.left;
    const y = event.clientY - svgRect.top;

    if (activeTool === 'crosshair') {
      setCrosshairPosition({ x, y });
    } else if (crosshairPosition !== null) {
      setCrosshairPosition(null);
    }

    if (isDrawing && (activeTool === 'trendline' || activeTool === 'rectangle')) {
      setCurrentEndPoint({ x, y });
      // console.log(`mousemove for drawing ${activeTool} to:`, { x, y });
    }
  };

  const handleMouseLeave = () => {
    setCrosshairPosition(null);
    // Optionally, if you want to cancel drawing when mouse leaves SVG:
    // if (isDrawing) {
    //   setIsDrawing(false);
    //   setStartPoint(null);
    //   setCurrentEndPoint(null);
    //   console.log('Drawing cancelled due to mouse leave');
    // }
  };

  const handleMouseUp = (event: React.MouseEvent<SVGSVGElement>) => {
    const { activeTool, currentDrawingSettings, addDrawing } = useChartStore.getState();
    
    if (activeTool === 'text') {
      // Text annotation finalization is handled by input's onBlur or onKeyDown
      return;
    }

    if (!isDrawing || !startPoint || !currentEndPoint) return;
    if (activeTool !== 'trendline' && activeTool !== 'rectangle') return;

    setIsDrawing(false);
    // const svgRect = event.currentTarget.getBoundingClientRect(); // Not needed if using existing currentEndPoint
    // const x = event.clientX - svgRect.left;
    // const y = event.clientY - svgRect.top;
    // const finalEndPoint = { x, y }; // currentEndPoint should already be up-to-date

    let newDrawingObject: DrawingObject | null = null;

    if (activeTool === 'trendline') {
      newDrawingObject = {
        id: uuidv4(),
        type: 'trendline',
        points: [startPoint, currentEndPoint], // Use currentEndPoint
        color: currentDrawingSettings.color,
        lineStyle: currentDrawingSettings.lineStyle,
        lineWidth: currentDrawingSettings.lineWidth,
      };
    } else if (activeTool === 'rectangle') {
      newDrawingObject = {
        id: uuidv4(),
        type: 'rectangle',
        points: [startPoint, currentEndPoint], // Use currentEndPoint
        color: currentDrawingSettings.color,
        lineStyle: currentDrawingSettings.lineStyle,
        lineWidth: currentDrawingSettings.lineWidth,
      };
    }
    
    if (newDrawingObject) {
      addDrawing(newDrawingObject);
      console.log(`mouseup, added ${activeTool}:`, newDrawingObject);
    }

    setStartPoint(null);
    setCurrentEndPoint(null);
  };
  // --- END Mouse event handlers for drawing ---

  // --- BEGIN Text Annotation Finalization ---
  const finalizeTextAnnotation = () => {
    const { currentDrawingSettings, addDrawing } = useChartStore.getState();
    if (currentTextValue.trim() && textAnnotationPoint) {
      const newTextObject: DrawingObject = {
        id: uuidv4(),
        type: 'text',
        points: [textAnnotationPoint],
        text: currentTextValue.trim(),
        color: currentDrawingSettings.color,
        lineWidth: currentDrawingSettings.lineWidth, // For font size mapping
        lineStyle: currentDrawingSettings.lineStyle, // For consistency
      };
      addDrawing(newTextObject);
      console.log('Added text object:', newTextObject);
    }
    setIsTextAnnotating(false);
    setTextAnnotationPoint(null);
    setCurrentTextValue("");
  };
  // --- END Text Annotation Finalization ---

  // Effect to focus text input when it appears
  useEffect(() => {
    if (isTextAnnotating && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [isTextAnnotating]);

  // --- BEGIN Keyboard Deletion Effect ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { selectedDrawingId, deleteDrawing, setSelectedDrawingId } = useChartStore.getState();
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedDrawingId) {
        console.log('Deleting drawing:', selectedDrawingId);
        deleteDrawing(selectedDrawingId);
        // setSelectedDrawingId(null); // Already handled by deleteDrawing in store if it was selected
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount
  // --- END Keyboard Deletion Effect ---

  // Helper to get strokeDasharray based on line style
  const getStrokeDashArray = (lineStyle: 'solid' | 'dashed' | 'dotted') => {
    switch (lineStyle) {
      case 'dashed':
        return '5,5';
      case 'dotted':
        return '1,5';
      case 'solid':
      default:
        return 'none';
    }
  };

  // Helper to convert hex color to rgba with alpha
  const hexToRgba = (hex: string, alpha: number = 1) => {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // --- BEGIN Hit Detection Logic ---
  const isPointNearDrawing = (mouseX: number, mouseY: number, drawing: DrawingObject): boolean => {
    const tolerance = 8; // pixels
    const { type, points, text, lineWidth: drawingLineWidth } = drawing;
    const currentSettingsLineWidth = useChartStore.getState().currentDrawingSettings.lineWidth;


    if (type === 'trendline' && points.length === 2) {
      const [p1, p2] = points;
      // Bounding box check with tolerance
      const minX = Math.min(p1.x, p2.x) - tolerance;
      const maxX = Math.max(p1.x, p2.x) + tolerance;
      const minY = Math.min(p1.y, p2.y) - tolerance;
      const maxY = Math.max(p1.y, p2.y) + tolerance;
      if (mouseX < minX || mouseX > maxX || mouseY < minY || mouseY > maxY) {
        return false;
      }
      // Distance from point to line segment
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      if (dx === 0 && dy === 0) { // Line is a point
        return Math.hypot(mouseX - p1.x, mouseY - p1.y) <= tolerance;
      }
      const t = ((mouseX - p1.x) * dx + (mouseY - p1.y) * dy) / (dx * dx + dy * dy);
      let closestX, closestY;
      if (t < 0) {
        closestX = p1.x; closestY = p1.y;
      } else if (t > 1) {
        closestX = p2.x; closestY = p2.y;
      } else {
        closestX = p1.x + t * dx;
        closestY = p1.y + t * dy;
      }
      return Math.hypot(mouseX - closestX, mouseY - closestY) <= tolerance;
    } else if (type === 'rectangle' && points.length === 2) {
      const [p1, p2] = points;
      const x = Math.min(p1.x, p2.x);
      const y = Math.min(p1.y, p2.y);
      const width = Math.abs(p1.x - p2.x);
      const height = Math.abs(p1.y - p2.y);
      // Check if point is within the rectangle with tolerance
      return mouseX >= x - tolerance && mouseX <= x + width + tolerance &&
             mouseY >= y - tolerance && mouseY <= y + height + tolerance;
    } else if (type === 'text' && points.length > 0 && text) {
      const p1 = points[0];
      // Estimate bounding box for text, this is a rough approximation
      const fontSize = 8 + (drawingLineWidth || currentSettingsLineWidth) * 2; // Match SVG rendering
      const estimatedWidth = text.length * (fontSize * 0.6); // Rough estimate
      const estimatedHeight = fontSize;
      return mouseX >= p1.x - tolerance && mouseX <= p1.x + estimatedWidth + tolerance &&
             mouseY >= p1.y - tolerance && mouseY <= p1.y + estimatedHeight + tolerance;
    }
    return false;
  };
  // --- END Hit Detection Logic ---


  return (
    <div className="relative h-full flex flex-col">
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
      
      <div className="flex-1 flex flex-col min-h-0">
        {/* Price chart container - takes up most of the space */}
        <div className="flex-1 w-full bg-background border border-border rounded-md relative min-h-0">
          <svg 
            ref={svgRefCallback}
            width="100%" 
            height="100%" 
            className={`overflow-hidden ${
              activeTool === 'cursor' ? 'cursor-default' : 
              activeTool === 'crosshair' ? 'cursor-crosshair' :
              activeTool === 'trendline' || activeTool === 'rectangle' ? 'cursor-crosshair' : 
              activeTool === 'text' ? 'cursor-text' : 'cursor-default'
            }`}
            // Attach mouse event handlers
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave} // Added for crosshair
          >
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Render candlesticks */}
            {processedData.map((entry, index) => {
              const candleWidth = Math.max(4, (chartDimensions.width - 60) / processedData.length * 0.8);
              const xPos = 40 + (index * ((chartDimensions.width - 60) / processedData.length)) + ((chartDimensions.width - 60) / processedData.length - candleWidth) / 2;
              
              const isBullish = entry.close >= entry.open;
              const color = isBullish ? "#26A69A" : "#EF5350";
              
              const openY = yScale(entry.open);
              const closeY = yScale(entry.close);
              const highY = yScale(entry.high);
              const lowY = yScale(entry.low);
              
              const bodyY = Math.min(openY, closeY);
              const bodyHeight = Math.max(1, Math.abs(closeY - openY));
              
              return (
                <g key={`candle-${index}`}>
                  {/* Wick line */}
                  <line
                    x1={xPos + candleWidth / 2}
                    x2={xPos + candleWidth / 2}
                    y1={highY}
                    y2={lowY}
                    stroke={color}
                    strokeWidth={1}
                  />
                  
                  {/* Candle body */}
                  <rect
                    x={xPos}
                    y={bodyY}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={color}
                    stroke={color}
                    strokeWidth={isBullish ? 1 : 0}
                    fillOpacity={isBullish ? 0 : 1}
                  />
                </g>
              );
            })}
            
            {/* SMA line if indicator is active */}
            {indicators.includes('sma') && processedData.map((entry, index) => {
              if (!entry.sma || index === 0) return null;
              
              const prevEntry = processedData[index - 1];
              if (!prevEntry.sma) return null;
              
              const x1 = 40 + ((index - 1) * ((chartDimensions.width - 60) / processedData.length)) + ((chartDimensions.width - 60) / processedData.length) / 2;
              const x2 = 40 + (index * ((chartDimensions.width - 60) / processedData.length)) + ((chartDimensions.width - 60) / processedData.length) / 2;
              const y1 = yScale(prevEntry.sma);
              const y2 = yScale(entry.sma);
              
              return (
                <line
                  key={`sma-${index}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#9C27B0"
                  strokeWidth={1.5}
                />
              );
            })}
            
            {/* Price axis on right */}
            {[...Array(6)].map((_, i) => {
              const price = paddedMin + (paddedRange / 5 * i);
              const y = yScale(price);
              return (
                <g key={`price-axis-${i}`}>
                  <line
                    x1={chartDimensions.width - 50}
                    y1={y}
                    x2={chartDimensions.width - 45}
                    y2={y}
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth={1}
                  />
                  <text
                    x={chartDimensions.width - 40}
                    y={y + 4}
                    fontSize="10"
                    textAnchor="start"
                    fill="rgba(255,255,255,0.7)"
                    fontFamily="monospace"
                  >
                    ${price.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* --- BEGIN Render existing drawings --- */}
            {useChartStore.getState().drawings.map(drawing => {
              const isSelected = drawing.id === useChartStore.getState().selectedDrawingId;
              const baseStrokeWidth = drawing.lineWidth;
              const selectedStrokeWidth = baseStrokeWidth + (isSelected ? 2 : 0);
              const selectionColor = "rgba(0, 150, 255, 0.8)"; // A distinct selection color

              if (drawing.type === 'trendline' && drawing.points.length === 2) {
                const [p1, p2] = drawing.points;
                return (
                  <g key={drawing.id} onClick={(e) => { 
                    if (activeTool === 'cursor') { 
                      e.stopPropagation(); // Prevent SVG mousedown from deselecting
                      setSelectedDrawingId(drawing.id); 
                    }
                  }}>
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={drawing.color}
                      strokeWidth={selectedStrokeWidth}
                      strokeDasharray={getStrokeDashArray(drawing.lineStyle)}
                      className={activeTool === 'cursor' ? 'cursor-pointer' : ''}
                    />
                    {isSelected && (
                      <>
                        <circle cx={p1.x} cy={p1.y} r="4" fill={selectionColor} stroke="white" strokeWidth="1" />
                        <circle cx={p2.x} cy={p2.y} r="4" fill={selectionColor} stroke="white" strokeWidth="1" />
                      </>
                    )}
                  </g>
                );
              } else if (drawing.type === 'rectangle' && drawing.points.length === 2) {
                const p1 = drawing.points[0];
                const p2 = drawing.points[1];
                const x = Math.min(p1.x, p2.x);
                const y = Math.min(p1.y, p2.y);
                const width = Math.abs(p1.x - p2.x);
                const height = Math.abs(p1.y - p2.y);
                return (
                  <g key={drawing.id} onClick={(e) => {
                     if (activeTool === 'cursor') {
                       e.stopPropagation(); 
                       setSelectedDrawingId(drawing.id);
                     }
                  }}>
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      stroke={isSelected ? selectionColor : drawing.color}
                      strokeWidth={selectedStrokeWidth}
                      strokeDasharray={getStrokeDashArray(drawing.lineStyle)}
                      fill={hexToRgba(drawing.color, 0.2)}
                      className={activeTool === 'cursor' ? 'cursor-pointer' : ''}
                    />
                    {/* Optional: Render handles if selected */}
                  </g>
                );
              } else if (drawing.type === 'text' && drawing.points.length > 0 && drawing.text) {
                const p1 = drawing.points[0];
                const fontSize = 8 + drawing.lineWidth * 2;
                // Estimate bounding box for selection visual
                const estimatedTextWidth = drawing.text.length * (fontSize * 0.6); // Rough estimate
                const estimatedTextHeight = fontSize;
                return (
                  <g key={drawing.id} onClick={(e) => {
                    if (activeTool === 'cursor') {
                      e.stopPropagation(); 
                      setSelectedDrawingId(drawing.id);
                    }
                  }}>
                    <text
                      x={p1.x}
                      y={p1.y}
                      fill={drawing.color}
                      fontSize={`${fontSize}px`}
                      textAnchor="start"
                      dominantBaseline="hanging"
                      className={activeTool === 'cursor' ? 'cursor-pointer' : ''}
                    >
                      {drawing.text}
                    </text>
                    {isSelected && (
                      <rect
                        x={p1.x - 2} // Small padding
                        y={p1.y - 2}
                        width={estimatedTextWidth + 4}
                        height={estimatedTextHeight + 4}
                        stroke={selectionColor}
                        strokeWidth="1"
                        strokeDasharray="3,3"
                        fill="none"
                      />
                    )}
                  </g>
                );
              }
              return null;
            })}
            {/* --- END Render existing drawings --- */}

            {/* --- BEGIN Render current drawing preview (for line/rect) --- */}
            {isDrawing && startPoint && currentEndPoint && (
              <>
                {activeTool === 'trendline' && (
                  <line
                    x1={startPoint.x}
                    y1={startPoint.y}
                    x2={currentEndPoint.x}
                    y2={currentEndPoint.y}
                    stroke={currentDrawingSettings.color}
                    strokeWidth={currentDrawingSettings.lineWidth}
                    strokeDasharray={getStrokeDashArray(currentDrawingSettings.lineStyle)}
                    opacity={0.7} // Preview with some transparency
                  />
                )}
                {activeTool === 'rectangle' && (
                  <rect
                    x={Math.min(startPoint.x, currentEndPoint.x)}
                    y={Math.min(startPoint.y, currentEndPoint.y)}
                    width={Math.abs(startPoint.x - currentEndPoint.x)}
                    height={Math.abs(startPoint.y - currentEndPoint.y)}
                    stroke={currentDrawingSettings.color}
                    strokeWidth={currentDrawingSettings.lineWidth}
                    strokeDasharray={getStrokeDashArray(currentDrawingSettings.lineStyle)}
                    fill={hexToRgba(currentDrawingSettings.color, 0.2)}
                    opacity={0.7} // Preview with some transparency
                  />
                )}
              </>
            )}
            {/* --- END Render current drawing preview (for line/rect) --- */}

            {/* --- BEGIN Render Crosshair --- */}
            {activeTool === 'crosshair' && crosshairPosition && chartDimensions.width > 0 && chartDimensions.height > 0 && (
              <g pointerEvents="none">
                {/* Vertical Line */}
                <line
                  x1={crosshairPosition.x}
                  y1={0} // Assuming top of SVG is fine, adjust if plot area has specific top margin
                  x2={crosshairPosition.x}
                  y2={chartDimensions.height - 30} // Adjusted for potential X-axis label area
                  stroke="rgba(200, 200, 200, 0.7)"
                  strokeWidth={1}
                  strokeDasharray="2,2"
                />
                {/* Horizontal Line */}
                <line
                  x1={40} // Adjusted for potential Y-axis label area on left
                  y1={crosshairPosition.y}
                  x2={chartDimensions.width - 50} // Adjusted for Y-axis label area on right
                  y2={crosshairPosition.y}
                  stroke="rgba(200, 200, 200, 0.7)"
                  strokeWidth={1}
                  strokeDasharray="2,2"
                />
                
                {/* Price Value (Y-axis) - Simplified for now, needs accurate inverse of yScale */}
                {(() => {
                  // Simplified inverse of yScale: y = 310 - ((val - paddedMin) / paddedRange * 280)
                  // val = paddedMin + ((310 - y) / 280) * paddedRange
                  // Note: This assumes plot area top is 0 and height is 310, and data part is 280.
                  // This will need careful adjustment based on actual plot area rendering.
                  // The y-axis labels are rendered from y=30 to y=310 (280px height for data)
                  // The `yScale` function maps price to this 30-310 range.
                  const plotAreaTopY = 30; // Approximate top of the price plot area
                  const plotAreaHeight = 280; // Approximate height of the price plot area
                  
                  let priceAtCrosshair = 0;
                  if (paddedRange > 0 && crosshairPosition.y >= plotAreaTopY && crosshairPosition.y <= plotAreaTopY + plotAreaHeight) {
                     priceAtCrosshair = paddedMin + (( (plotAreaTopY + plotAreaHeight) - crosshairPosition.y) / plotAreaHeight) * paddedRange;
                  } else if (crosshairPosition.y < plotAreaTopY) {
                    priceAtCrosshair = paddedMax; // Or some other indicator for out of top bound
                  } else {
                    priceAtCrosshair = paddedMin; // Or some other indicator for out of bottom bound
                  }

                  return (
                    <text
                      x={chartDimensions.width - 48} // Position near right Y-axis
                      y={crosshairPosition.y + 4}
                      fill="white"
                      fontSize="10"
                      textAnchor="start"
                      style={{ backgroundColor: "rgba(50,50,50,0.7)", padding: "2px" }}
                    >
                      {priceAtCrosshair.toFixed(2)}
                    </text>
                  );
                })()}

                {/* Time Value (X-axis) - Simplified, needs accurate inverse of x-scale */}
                {(() => {
                  const candleAreaWidth = chartDimensions.width - 60 - 40; // Total width for candles (width - rightYaxis - leftYaxis)
                  const candleSlotWidth = candleAreaWidth / processedData.length;
                  let closestIndex = -1;
                  let minDiff = Infinity;

                  if (processedData.length > 0) {
                    for (let i = 0; i < processedData.length; i++) {
                      const candleXCenter = 40 + (i * candleSlotWidth) + (candleSlotWidth / 2);
                      const diff = Math.abs(candleXCenter - crosshairPosition.x);
                      if (diff < minDiff) {
                        minDiff = diff;
                        closestIndex = i;
                      }
                    }
                  }
                  
                  let timeAtCrosshair = "";
                  if (closestIndex !== -1 && processedData[closestIndex]) {
                    timeAtCrosshair = formatDate(processedData[closestIndex].timestamp);
                  }
                  
                  return (
                    <text
                      x={crosshairPosition.x + 4}
                      y={chartDimensions.height - 10} // Position near X-axis
                      fill="white"
                      fontSize="10"
                      textAnchor="start"
                      style={{ backgroundColor: "rgba(50,50,50,0.7)", padding: "2px" }}
                    >
                      {timeAtCrosshair}
                    </text>
                  );
                })()}
              </g>
            )}
            {/* --- END Render Crosshair --- */}
          </svg>

          {/* --- BEGIN HTML Text Input Overlay --- */}
          {isTextAnnotating && textAnnotationPoint && (
            <div
              style={{
                position: 'absolute',
                left: `${textAnnotationPoint.x}px`,
                top: `${textAnnotationPoint.y}px`,
                zIndex: 50, // Ensure it's above SVG
              }}
            >
              <input
                ref={textInputRef}
                type="text"
                value={currentTextValue}
                onChange={(e) => setCurrentTextValue(e.target.value)}
                onBlur={finalizeTextAnnotation}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    finalizeTextAnnotation();
                  } else if (e.key === 'Escape') {
                    setIsTextAnnotating(false);
                    setTextAnnotationPoint(null);
                    setCurrentTextValue("");
                  }
                }}
                className="bg-background border border-primary text-xs p-1 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Enter text..."
              />
            </div>
          )}
          {/* --- END HTML Text Input Overlay --- */}
        </div>

        {/* Volume chart container - smaller at bottom */}
        <div className="h-32 mt-2 w-full">
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
      {/* Chart overlay for cursor changes based on active tool */}
      {/* 
        The following div was previously used for cursor changes.
        It's removed because mouse events are now handled directly by the SVG.
        The cursor style is now set on the SVG element itself via Tailwind based on `activeTool`.
      */}
      {/* 
      <div 
        className="absolute inset-0" 
        style={{ 
          cursor: activeTool === 'cursor' ? 'default' : 
                  activeTool === 'trendline' || activeTool === 'rectangle' ? 'crosshair' : 
                  activeTool === 'text' ? 'text' : 'default',
          pointerEvents: activeTool === 'cursor' ? 'none' : 'auto' // Allow events only when a drawing tool is active
        }}
      /> 
      */}
    </div>
  );
};

export default Chart;
