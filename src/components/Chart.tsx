
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useChartStore } from '@/store/chartStore';
import type { DrawingObject, DrawingPoint } from '@/store/chartStore';
import { getStrokeDashArray, hexToRgba, calculateSMA, formatDate } from '@/lib/chartUtils'; // Updated imports
import { v4 as uuidv4 } from 'uuid'; 
import { useTextAnnotation } from '@/hooks/useTextAnnotation';
import { useDrawingTools } from '@/hooks/useDrawingTools';
import { useCrosshair } from '@/hooks/useCrosshair';
import { useMarketData } from '@/hooks/useMarketData';
import { CustomCandlestick } from '@/components/charting/CustomCandlestick';
import { CandlestickTooltip } from '@/components/charting/CandlestickTooltip';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart,
  Bar
} from 'recharts'; // Removed ReferenceLine, Area as they are not used
import { ChartContainer } from '@/components/ui/chart'; // Removed ChartTooltipContent as it's not used
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCcw } from 'lucide-react';

// CustomCandlestick component has been moved to src/components/charting/CustomCandlestick.tsx
// CandlestickTooltip component has been moved to src/components/charting/CandlestickTooltip.tsx

const Chart = () => {
  // Fix the store selector to prevent infinite rerenders - use individual selectors
  const symbol = useChartStore(state => state.symbol);
  const timeFrame = useChartStore(state => state.timeFrame);
  const activeTool = useChartStore(state => state.activeTool);
  const indicators = useChartStore(state => state.indicators);
  const selectedDrawingId = useChartStore(state => state.selectedDrawingId);
  const setSelectedDrawingId = useChartStore(state => state.setSelectedDrawingId);
  const drawings = useChartStore(state => state.drawings);
  const currentDrawingSettings = useChartStore(state => state.currentDrawingSettings);

  // Data fetching hook
  const { 
    chartData, 
    isLoading, 
    error, 
    refreshData 
  } = useMarketData(symbol, timeFrame);

  const [chartDimensions, setChartDimensions] = useState({ width: 800, height: 600 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Text Annotation Hook
  const {
    isTextAnnotating,
    textAnnotationPoint,
    currentTextValue,
    textInputRef,
    handleTextChange,
    handleTextBlur,
    handleTextKeyDown,
    startTextAnnotation, 
  } = useTextAnnotation();

  // Drawing Tools Hook
  const {
    isDrawing,      
    startPoint,     
    currentEndPoint,
    handleMouseDown, 
    handleMouseMove, 
    handleMouseUp,   
  } = useDrawingTools({ svgRef, startTextAnnotation });
  
  // Crosshair Hook
  const { 
    crosshairPosition, 
    handleMouseMoveForCrosshair, 
    handleMouseLeaveForCrosshair 
  } = useCrosshair(activeTool, svgRef);

  // Memoized ref callback
  const svgRefCallback = useCallback((svg: SVGSVGElement | null) => {
    svgRef.current = svg;
    if (svg) {
      const rect = svg.getBoundingClientRect();
      setChartDimensions(prev => {
        if (prev.width !== rect.width || prev.height !== rect.height) {
          return { width: rect.width, height: rect.height };
        }
        return prev;
      });
    }
  }, []);

  // Window resize handler
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

  // formatDate and calculateSMA functions have been moved to src/lib/chartUtils.ts
  // and are imported above.

  // Apply indicators to the data
  const processedData = indicators.includes('sma') && chartData && chartData.length > 0
    ? calculateSMA(chartData, 14) 
    : chartData;

  if (isLoading && (!chartData || chartData.length === 0)) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading chart data...</span>
      </div>
    );
  }

  // const currentPrice = chartData && chartData.length > 0 ? chartData[chartData.length - 1].close : 0; // Not used currently

  // Calculate price range for Y-axis scaling
  const minPrice = processedData && processedData.length > 0 ? Math.min(...processedData.map(d => d.low ?? 0)) : 0;
  const maxPrice = processedData && processedData.length > 0 ? Math.max(...processedData.map(d => d.high ?? 0)) : 100;
  const range = maxPrice - minPrice;
  const paddedMin = minPrice - (range * 0.05);
  const paddedMax = maxPrice + (range * 0.05);
  const paddedRange = paddedMax - paddedMin;

  // Y-axis scaling function
  const yScale = (val: number) => {
    // Ensure paddedRange is not zero to avoid division by zero
    if (paddedRange === 0) return 310 - (280 / 2); // Center if no range
    return 310 - ((val - paddedMin) / paddedRange * 280);
  };

  // Combined mouse move handler
  const originalDrawingMouseMove = handleMouseMove; 
  const combinedHandleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (originalDrawingMouseMove) {
      originalDrawingMouseMove(event);
    }
    handleMouseMoveForCrosshair(event);
  }, [originalDrawingMouseMove, handleMouseMoveForCrosshair]);

  // Combined mouse leave handler
  const svgMouseLeaveHandler = () => {
    handleMouseLeaveForCrosshair();
    // If useDrawingTools provided a mouse leave handler, it would be called here too.
  };
  
  // Keyboard Deletion Effect for drawings (remains in Chart.tsx as it's a global window event listener)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Access store directly for deleteDrawing as it's a window event
      const currentSelectedDrawingId = useChartStore.getState().selectedDrawingId;
      if ((event.key === 'Delete' || event.key === 'Backspace') && currentSelectedDrawingId) {
        // console.log('Deleting drawing (from Chart.tsx window event):', currentSelectedDrawingId);
        useChartStore.getState().deleteDrawing(currentSelectedDrawingId);
        // useChartStore.getState().setSelectedDrawingId(null); // deleteDrawing should handle this
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); 

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
          onClick={refreshData} 
          disabled={isLoading}  
          className="h-8 w-8 p-0"
        >
          {isLoading && (!chartData || chartData.length === 0) ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <div className="flex-1 flex flex-col min-h-0">
        {/* Price chart container */}
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
            onMouseDown={handleMouseDown} 
            onMouseMove={combinedHandleMouseMove} 
            onMouseUp={handleMouseUp}     
            onMouseLeave={svgMouseLeaveHandler} 
          >
            <defs>
              <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {processedData && processedData.length > 0 && processedData.map((entry, index) => {
              // const candleWidth = Math.max(4, (chartDimensions.width - 60) / processedData.length * 0.8);
              const xPos = 40 + (index * ((chartDimensions.width - 60) / processedData.length)); 
              const slotWidth = ((chartDimensions.width - 60) / processedData.length);

              return (
                <CustomCandlestick
                  key={`candle-${index}`}
                  index={index}
                  x={xPos}
                  y={yScale}
                  width={slotWidth}
                  open={entry.open}
                  close={entry.close}
                  high={entry.high}
                  low={entry.low}
                />
              );
            })}
            
            {indicators.includes('sma') && processedData && processedData.length > 0 && processedData.map((entry, index) => {
              if (!entry.sma || index === 0) return null;
              const prevEntry = processedData[index - 1];
              if (!prevEntry || !prevEntry.sma) return null; 
              
              const x1 = 40 + ((index - 1) * ((chartDimensions.width - 60) / processedData.length)) + ((chartDimensions.width - 60) / processedData.length) / 2;
              const x2 = 40 + (index * ((chartDimensions.width - 60) / processedData.length)) + ((chartDimensions.width - 60) / processedData.length) / 2;
              const y1 = yScale(prevEntry.sma);
              const y2 = yScale(entry.sma);
              
              return (
                <line
                  key={`sma-${index}`}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#9C27B0" strokeWidth={1.5}
                />
              );
            })}
            
            {[...Array(6)].map((_, i) => {
              const price = paddedMin + (paddedRange / 5 * i);
              const y = yScale(price);
              return (
                <g key={`price-axis-${i}`}>
                  <line
                    x1={chartDimensions.width - 50} y1={y}
                    x2={chartDimensions.width - 45} y2={y}
                    stroke="rgba(255,255,255,0.3)" strokeWidth={1}
                  />
                  <text
                    x={chartDimensions.width - 40} y={y + 4}
                    fontSize="10" textAnchor="start"
                    fill="rgba(255,255,255,0.7)" fontFamily="monospace"
                  >
                    ${price.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {drawings.map(drawing => {
              const isSelected = drawing.id === selectedDrawingId;
              const baseStrokeWidth = drawing.lineWidth;
              const selectedStrokeWidth = baseStrokeWidth + (isSelected ? 2 : 0);
              const selectionColor = "rgba(0, 150, 255, 0.8)"; 

              if (drawing.type === 'trendline' && drawing.points.length === 2) {
                const [p1, p2] = drawing.points;
                return (
                  <g key={drawing.id} onClick={(e) => { 
                    if (activeTool === 'cursor') { 
                      e.stopPropagation(); 
                      setSelectedDrawingId(drawing.id); 
                    }
                  }}>
                    <line
                      x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                      stroke={drawing.color} strokeWidth={selectedStrokeWidth}
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
                      x={x} y={y} width={width} height={height}
                      stroke={isSelected ? selectionColor : drawing.color}
                      strokeWidth={selectedStrokeWidth}
                      strokeDasharray={getStrokeDashArray(drawing.lineStyle)}
                      fill={hexToRgba(drawing.color, 0.2)}
                      className={activeTool === 'cursor' ? 'cursor-pointer' : ''}
                    />
                  </g>
                );
              } else if (drawing.type === 'fibonacci' && drawing.points.length === 2) {
                const [p1, p2] = drawing.points;
                const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
                const height = p2.y - p1.y;
                const width = p2.x - p1.x;
                
                return (
                  <g key={drawing.id} onClick={(e) => {
                    if (activeTool === 'cursor') {
                      e.stopPropagation();
                      setSelectedDrawingId(drawing.id);
                    }
                  }}>
                    {fibLevels.map((level, index) => {
                      const y = p1.y + (height * level);
                      const x1 = Math.min(p1.x, p2.x);
                      const x2 = Math.max(p1.x, p2.x);
                      const levelColor = index === 0 || index === fibLevels.length - 1 ? drawing.color : hexToRgba(drawing.color, 0.7);
                      
                      return (
                        <g key={`fib-${index}`}>
                          <line
                            x1={x1} y1={y} x2={x2} y2={y}
                            stroke={isSelected ? selectionColor : levelColor}
                            strokeWidth={selectedStrokeWidth}
                            strokeDasharray={index === 0 || index === fibLevels.length - 1 ? "none" : "3,3"}
                            className={activeTool === 'cursor' ? 'cursor-pointer' : ''}
                          />
                          <text
                            x={x2 + 5} y={y + 4}
                            fill={isSelected ? selectionColor : drawing.color}
                            fontSize="10" textAnchor="start"
                          >
                            {(level * 100).toFixed(1)}%
                          </text>
                        </g>
                      );
                    })}
                    {isSelected && (
                      <>
                        <circle cx={p1.x} cy={p1.y} r="4" fill={selectionColor} stroke="white" strokeWidth="1" />
                        <circle cx={p2.x} cy={p2.y} r="4" fill={selectionColor} stroke="white" strokeWidth="1" />
                      </>
                    )}
                  </g>
                );
              } else if (drawing.type === 'text' && drawing.points.length > 0 && drawing.text) {
                const p1 = drawing.points[0];
                const fontSize = 8 + drawing.lineWidth * 2;
                const estimatedTextWidth = drawing.text.length * (fontSize * 0.6); 
                const estimatedTextHeight = fontSize;
                return (
                  <g key={drawing.id} onClick={(e) => {
                    if (activeTool === 'cursor') {
                      e.stopPropagation(); 
                      setSelectedDrawingId(drawing.id);
                    }
                  }}>
                    <text
                      x={p1.x} y={p1.y} fill={drawing.color}
                      fontSize={`${fontSize}px`} textAnchor="start"
                      dominantBaseline="hanging"
                      className={activeTool === 'cursor' ? 'cursor-pointer' : ''}
                    >
                      {drawing.text}
                    </text>
                    {isSelected && (
                      <rect
                        x={p1.x - 2} y={p1.y - 2}
                        width={estimatedTextWidth + 4} height={estimatedTextHeight + 4}
                        stroke={selectionColor} strokeWidth="1"
                        strokeDasharray="3,3" fill="none"
                      />
                    )}
                  </g>
                );
              }
              return null;
            })}

            {isDrawing && startPoint && currentEndPoint && (
              <>
                {activeTool === 'trendline' && (
                  <line
                    x1={startPoint.x} y1={startPoint.y}
                    x2={currentEndPoint.x} y2={currentEndPoint.y}
                    stroke={currentDrawingSettings.color}
                    strokeWidth={currentDrawingSettings.lineWidth}
                    strokeDasharray={getStrokeDashArray(currentDrawingSettings.lineStyle)}
                    opacity={0.7}
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
                    opacity={0.7}
                  />
                )}
                {activeTool === 'fibonacci' && (
                  <g opacity={0.7}>
                    {[0, 0.236, 0.382, 0.5, 0.618, 0.786, 1].map((level, index) => {
                      const height = currentEndPoint.y - startPoint.y;
                      const y = startPoint.y + (height * level);
                      const x1 = Math.min(startPoint.x, currentEndPoint.x);
                      const x2 = Math.max(startPoint.x, currentEndPoint.x);
                      
                      return (
                        <g key={`preview-fib-${index}`}>
                          <line
                            x1={x1} y1={y} x2={x2} y2={y}
                            stroke={currentDrawingSettings.color}
                            strokeWidth={currentDrawingSettings.lineWidth}
                            strokeDasharray={index === 0 || index === 6 ? "none" : "3,3"}
                          />
                          <text
                            x={x2 + 5} y={y + 4}
                            fill={currentDrawingSettings.color}
                            fontSize="10" textAnchor="start"
                          >
                            {(level * 100).toFixed(1)}%
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}
              </>
            )}

            {activeTool === 'crosshair' && crosshairPosition && chartDimensions.width > 0 && chartDimensions.height > 0 && (
              <g pointerEvents="none">
                <line
                  x1={crosshairPosition.x} y1={0}
                  x2={crosshairPosition.x} y2={chartDimensions.height - 30}
                  stroke="rgba(200, 200, 200, 0.7)" strokeWidth={1} strokeDasharray="2,2"
                />
                <line
                  x1={40} y1={crosshairPosition.y}
                  x2={chartDimensions.width - 50} y2={crosshairPosition.y}
                  stroke="rgba(200, 200, 200, 0.7)" strokeWidth={1} strokeDasharray="2,2"
                />
                {(() => {
                  const plotAreaTopY = 30; 
                  const plotAreaHeight = 280; 
                  let priceAtCrosshair = 0;
                  if (paddedRange > 0 && crosshairPosition.y >= plotAreaTopY && crosshairPosition.y <= plotAreaTopY + plotAreaHeight) {
                     priceAtCrosshair = paddedMin + (( (plotAreaTopY + plotAreaHeight) - crosshairPosition.y) / plotAreaHeight) * paddedRange;
                  } else if (crosshairPosition.y < plotAreaTopY) {
                    priceAtCrosshair = paddedMax; 
                  } else {
                    priceAtCrosshair = paddedMin; 
                  }
                  return (
                    <text
                      x={chartDimensions.width - 48} y={crosshairPosition.y + 4}
                      fill="white" fontSize="10" textAnchor="start"
                      style={{ backgroundColor: "rgba(50,50,50,0.7)", padding: "2px" }}
                    >
                      {priceAtCrosshair.toFixed(2)}
                    </text>
                  );
                })()}
                {(() => {
                  const candleAreaWidth = chartDimensions.width - 60 - 40; 
                  const candleSlotWidth = processedData && processedData.length > 0 ? candleAreaWidth / processedData.length : 0;
                  let closestIndex = -1;
                  let minDiff = Infinity;

                  if (processedData && processedData.length > 0 && candleSlotWidth > 0) { 
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
                  if (closestIndex !== -1 && processedData && processedData[closestIndex]) {
                    timeAtCrosshair = formatDate(processedData[closestIndex].timestamp, timeFrame);
                  }
                  
                  return (
                    <text
                      x={crosshairPosition.x + 4} y={chartDimensions.height - 10}
                      fill="white" fontSize="10" textAnchor="start"
                      style={{ backgroundColor: "rgba(50,50,50,0.7)", padding: "2px" }}
                    >
                      {timeAtCrosshair}
                    </text>
                  );
                })()}
              </g>
            )}
          </svg>

          {isTextAnnotating && textAnnotationPoint && (
            <div
              style={{
                position: 'absolute',
                left: `${textAnnotationPoint.x}px`,
                top: `${textAnnotationPoint.y}px`,
                zIndex: 50, 
              }}
            >
              <input
                ref={textInputRef} type="text"
                value={currentTextValue} onChange={handleTextChange}
                onBlur={handleTextBlur} onKeyDown={handleTextKeyDown}
                className="bg-background border border-primary text-xs p-1 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Enter text..."
              />
            </div>
          )}
        </div>

        {/* Volume chart container */}
        <div className="h-32 mt-2 w-full">
          <ChartContainer config={{}} className="dark:bg-card bg-card">
            <BarChart
              data={processedData}
              margin={{ top: 5, right: 50, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value: string) => formatDate(value, timeFrame)} // Pass timeFrame
                stroke="#555"
                tick={{ fill: '#999' }}
              />
              <YAxis
                dataKey="volume" orientation="right"
                tick={{ fill: '#999' }} stroke="#555"
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toLocaleString();
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
    </div>
  );
};

export default Chart;
