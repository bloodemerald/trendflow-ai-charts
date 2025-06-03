
import * as React from 'react';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useChartStore } from '@/store/chartStore';
import type { DrawingObject, DrawingPoint } from '@/store/chartStore';
import { getStrokeDashArray, hexToRgba, calculateSMA, formatDate } from '@/lib/chartUtils';
import { v4 as uuidv4 } from 'uuid'; 
import { useTextAnnotation } from '@/hooks/useTextAnnotation';
import { useDrawingTools } from '@/hooks/useDrawingTools';
import { useCrosshair } from '@/hooks/useCrosshair';
import { useMarketData } from '@/hooks/useMarketData';
import { CustomCandlestick } from '@/components/charting/CustomCandlestick';
import { CandlestickTooltip } from '@/components/charting/CandlestickTooltip';
import ChartControls from '@/components/ChartControls';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart,
  Bar
} from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCcw } from 'lucide-react';

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
  const zoomLevel = useChartStore(state => state.zoomLevel); // Vertical zoom
  const zoomIn = useChartStore(state => state.zoomIn); // Vertical zoom in
  const zoomOut = useChartStore(state => state.zoomOut); // Vertical zoom out
  const xZoomLevel = useChartStore(state => state.xZoomLevel); // Horizontal zoom
  const xPanOffset = useChartStore(state => state.xPanOffset); // Horizontal pan
  const setXZoomLevel = useChartStore(state => state.setXZoomLevel); // Action for horizontal zoom
  const panXAxis = useChartStore(state => state.panXAxis); // Action for horizontal panning

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

  // Calculate price range for Y-axis scaling with zoom
  const minPrice = processedData && processedData.length > 0 ? Math.min(...processedData.map(d => d.low ?? 0)) : 0;
  const maxPrice = processedData && processedData.length > 0 ? Math.max(...processedData.map(d => d.high ?? 0)) : 100;
  const range = maxPrice - minPrice;
  const zoomedRange = range / zoomLevel;
  const centerPrice = (maxPrice + minPrice) / 2;
  const paddedMin = centerPrice - (zoomedRange * 0.55);
  const paddedMax = centerPrice + (zoomedRange * 0.55);
  const paddedRange = paddedMax - paddedMin;

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
  };
  
  // Keyboard Deletion Effect for drawings (remains in Chart.tsx as it's a global window event listener)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Access store directly for deleteDrawing as it's a window event
      const currentSelectedDrawingId = useChartStore.getState().selectedDrawingId;
      if ((event.key === 'Delete' || event.key === 'Backspace') && currentSelectedDrawingId) {
        useChartStore.getState().deleteDrawing(currentSelectedDrawingId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); 

  // Vertical Zoom with Ctrl + Mouse Wheel, Horizontal Zoom with Ctrl + Shift + Mouse Wheel, Pan with Ctrl + Horizontal Scroll
  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const PAN_SPEED = 2; // Number of data points to shift per pan event

    const handleWheelInteraction = (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault(); // Prevent default page scroll when Ctrl is pressed

        if (event.shiftKey) {
          // Horizontal Zoom (Ctrl + Shift + Vertical Scroll)
          const currentXZoom = useChartStore.getState().xZoomLevel;
          if (event.deltaY < 0) {
            setXZoomLevel(currentXZoom * 1.2);
          } else {
            setXZoomLevel(currentXZoom / 1.2);
          }
        } else {
          // Check for horizontal scroll for panning vs. vertical scroll for zooming
          // Prioritize deltaX if it's significantly larger than deltaY, or if deltaY is near zero
          const hasSignificantDeltaX = Math.abs(event.deltaX) > Math.abs(event.deltaY) && Math.abs(event.deltaX) > 0.5;
          const hasAnyDeltaX = Math.abs(event.deltaX) > 0.5; // Threshold to consider deltaX active
          const hasAnyDeltaY = Math.abs(event.deltaY) > 0.5; // Threshold to consider deltaY active

          if (hasAnyDeltaX && !hasAnyDeltaY) { // Only horizontal scroll
            panXAxis(event.deltaX > 0 ? PAN_SPEED : -PAN_SPEED);
          } else if (hasSignificantDeltaX) { // Prefer horizontal pan if deltaX is dominant
            panXAxis(event.deltaX > 0 ? PAN_SPEED : -PAN_SPEED);
          } else if (hasAnyDeltaY) { // Otherwise, if deltaY is present, do vertical zoom
            if (event.deltaY < 0) {
              zoomIn();
            } else {
              zoomOut();
            }
          }
        }
      }
    };

    svgElement.addEventListener('wheel', handleWheelInteraction, { passive: false });

    return () => {
      svgElement.removeEventListener('wheel', handleWheelInteraction);
    };
  }, [svgRef, zoomIn, zoomOut, setXZoomLevel, panXAxis]);

  // Calculate visible data based on xZoomLevel and xPanOffset
  const MIN_VIEWABLE_POINTS = 10;
  const totalDataPoints = processedData?.length || 0;
  
  let visibleData = processedData;
  let currentStartIndex = xPanOffset;

  if (totalDataPoints > 0) {
    const pointsToShow = Math.max(MIN_VIEWABLE_POINTS, Math.round(totalDataPoints / xZoomLevel));
    currentStartIndex = Math.max(0, Math.min(xPanOffset, totalDataPoints - pointsToShow));
    const endIndex = Math.min(totalDataPoints, currentStartIndex + pointsToShow);
    visibleData = processedData.slice(currentStartIndex, endIndex);
  }

  // Calculate price range for Y-axis scaling with zoom (using full processedData for stable Y-axis unless visibleData is preferred)
  const yAxisMinPrice = processedData && processedData.length > 0 ? Math.min(...processedData.map(d => d.low ?? 0)) : 0;
  const yAxisMaxPrice = processedData && processedData.length > 0 ? Math.max(...processedData.map(d => d.high ?? 0)) : 100;
  const yRange = yAxisMaxPrice - yAxisMinPrice;
  const yZoomedRange = yRange / zoomLevel; // zoomLevel is vertical zoom
  const yCenterPrice = (yAxisMaxPrice + yAxisMinPrice) / 2;
  const yPaddedMin = yCenterPrice - (yZoomedRange * 0.55);
  const yPaddedMax = yCenterPrice + (yZoomedRange * 0.55);
  const yPaddedRange = yPaddedMax - yPaddedMin;

  // Y-axis scaling function
  const yScale = (val: number) => {
    if (yPaddedRange === 0) return chartDimensions.height * 0.85 * 0.5;
    const plotHeight = chartDimensions.height * 0.70;
    const plotTopMargin = chartDimensions.height * 0.05;
    return plotTopMargin + plotHeight - (((val - yPaddedMin) / yPaddedRange) * plotHeight);
  };

  return (
    <div className="relative h-full flex flex-col">
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-destructive/10 text-destructive p-2 rounded-t-md z-10">
          {error}
        </div>
      )}
      
      <ChartControls />
      
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
            
            {/* X-Axis Labels - Custom rendering based on visibleData */}
            {visibleData && visibleData.length > 0 && chartDimensions.width > 0 && [...Array(Math.min(10, visibleData.length))].map((_, i) => {
              const dataIndex = Math.floor(i * (visibleData.length / Math.min(10, visibleData.length)));
              const entry = visibleData[dataIndex];
              if (!entry) return null;
              const X_AXIS_MARGIN_LEFT = 50;
              const X_AXIS_MARGIN_RIGHT = 60;
              const plotAreaWidth = chartDimensions.width - X_AXIS_MARGIN_LEFT - X_AXIS_MARGIN_RIGHT;
              const x = X_AXIS_MARGIN_LEFT + (dataIndex * (plotAreaWidth / visibleData.length)) + (plotAreaWidth / visibleData.length / 2);
              
              return (
                <text
                  key={`x-label-${i}`}
                  x={x}
                  y={chartDimensions.height - 35}
                  fontSize="10" textAnchor="middle"
                  fill="rgba(255,255,255,0.7)" fontFamily="monospace"
                >
                  {formatDate(entry.timestamp, timeFrame)}
                </text>
              );
            })}

            {visibleData && visibleData.length > 0 && visibleData.map((entry, index) => {
              const X_AXIS_MARGIN_LEFT = 50;
              const X_AXIS_MARGIN_RIGHT = 60;
              const plotAreaWidth = chartDimensions.width - X_AXIS_MARGIN_LEFT - X_AXIS_MARGIN_RIGHT;
              const slotWidth = plotAreaWidth / visibleData.length;
              const xPos = X_AXIS_MARGIN_LEFT + (index * slotWidth); 

              return (
                <CustomCandlestick
                  key={`candle-${currentStartIndex + index}`}
                  index={currentStartIndex + index}
                  x={xPos + slotWidth * 0.1}
                  y={yScale}
                  width={slotWidth * 0.8}
                  open={entry.open}
                  close={entry.close}
                  high={entry.high}
                  low={entry.low}
                />
              );
            })}
            
            {indicators.includes('sma') && visibleData && visibleData.length > 0 && visibleData.map((entry, index) => {
              if (!entry.sma || index === 0) return null;
              
              const prevEntryOriginalIndex = currentStartIndex + index - 1;
              const prevEntry = prevEntryOriginalIndex >= 0 ? processedData[prevEntryOriginalIndex] : null;

              if (!prevEntry || !prevEntry.sma) return null; 
              
              const X_AXIS_MARGIN_LEFT = 50;
              const X_AXIS_MARGIN_RIGHT = 60;
              const plotAreaWidth = chartDimensions.width - X_AXIS_MARGIN_LEFT - X_AXIS_MARGIN_RIGHT;
              const slotWidth = plotAreaWidth / visibleData.length;

              const x1 = X_AXIS_MARGIN_LEFT + ((index - 1) * slotWidth) + slotWidth / 2;
              const x2 = X_AXIS_MARGIN_LEFT + (index * slotWidth) + slotWidth / 2;
              const y1 = yScale(prevEntry.sma);
              const y2 = yScale(entry.sma);
              
              return (
                <line
                  key={`sma-${currentStartIndex + index}`}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#9C27B0" strokeWidth={1.5}
                />
              );
            })}
            
            {/* Y-Axis Labels - Right Side */}
            {[...Array(6)].map((_, i) => {
              const price = yPaddedMin + (yPaddedRange / 5 * i);
              const y = yScale(price);
              const X_AXIS_MARGIN_RIGHT = 60;
              return (
                <g key={`price-axis-${i}`}>
                  <line
                    x1={chartDimensions.width - X_AXIS_MARGIN_RIGHT + 5} y1={y}
                    x2={chartDimensions.width - X_AXIS_MARGIN_RIGHT + 10} y2={y}
                    stroke="rgba(255,255,255,0.3)" strokeWidth={1}
                  />
                  <text
                    x={chartDimensions.width - X_AXIS_MARGIN_RIGHT + 15} y={y + 4}
                    fontSize="10" textAnchor="start"
                    fill="rgba(255,255,255,0.7)" fontFamily="monospace"
                  >
                    ${price.toFixed(2)}
                  </text>
                </g>
              );
            })}
            
            {(() => {
              const X_AXIS_MARGIN_LEFT = 50;
              const X_AXIS_MARGIN_RIGHT = 60;
              const currentPlotAreaWidth = chartDimensions.width > (X_AXIS_MARGIN_LEFT + X_AXIS_MARGIN_RIGHT) ? chartDimensions.width - X_AXIS_MARGIN_LEFT - X_AXIS_MARGIN_RIGHT : 0;

              const Y_SCALE_PLOT_TOP = 30;
              const Y_SCALE_PLOT_HEIGHT = 280;
              const originalVerticalZoomLevel = 1;
              const dataMinPrice = minPrice;
              const dataMaxPrice = maxPrice;
              const originalPriceRange = dataMaxPrice - dataMinPrice;
              const originalZoomedPriceRange = originalPriceRange / originalVerticalZoomLevel;
              const originalCenterPrice = (dataMaxPrice + dataMinPrice) / 2;
              const originalPaddedMinPrice = originalCenterPrice - (originalZoomedPriceRange * 0.55);
              const originalPaddedPriceRange = (originalCenterPrice + (originalZoomedPriceRange * 0.55)) - originalPaddedMinPrice;

              const screenYToPrice = (screenY: number): number => {
                if (originalPaddedPriceRange === 0) return originalCenterPrice;
                return originalPaddedMinPrice + (((Y_SCALE_PLOT_TOP + Y_SCALE_PLOT_HEIGHT - screenY) / Y_SCALE_PLOT_HEIGHT) * originalPaddedPriceRange);
              };
              
              const priceToCurrentScreenY = yScale;

              const originalTotalDataPoints = totalDataPoints;
              const originalSlotWidth = originalTotalDataPoints > 0 && currentPlotAreaWidth > 0 ? currentPlotAreaWidth / originalTotalDataPoints : 0;

              const screenXToOriginalDataIndex = (screenX: number): number => {
                if (originalSlotWidth === 0) return 0;
                const screenXRelativeToPlot = screenX - X_AXIS_MARGIN_LEFT;
                return screenXRelativeToPlot / originalSlotWidth;
              };

              const currentSlotWidth = visibleData.length > 0 && currentPlotAreaWidth > 0 ? currentPlotAreaWidth / visibleData.length : 0;

              const originalDataIndexToCurrentScreenX = (dataIndex: number): number => {
                if (currentPlotAreaWidth <= 0 || currentSlotWidth <= 0) {
                  return X_AXIS_MARGIN_LEFT;
                }
                return X_AXIS_MARGIN_LEFT + (dataIndex - currentStartIndex) * currentSlotWidth + currentSlotWidth / 2;
              };
              
              const transformPoint = (p: DrawingPoint): DrawingPoint => {
                const originalDataIndex = screenXToOriginalDataIndex(p.x);
                const priceValue = screenYToPrice(p.y);
                return {
                  x: originalDataIndexToCurrentScreenX(originalDataIndex),
                  y: priceToCurrentScreenY(priceValue),
                };
              };

              return drawings.map(drawing => {
                const isSelected = drawing.id === selectedDrawingId;
                const baseStrokeWidth = drawing.lineWidth;
                const selectedStrokeWidth = baseStrokeWidth + (isSelected ? 2 : 0);
                const selectionColor = "rgba(0, 150, 255, 0.8)";

                if (drawing.points.length === 0) return null;

                if (drawing.type === 'trendline' && drawing.points.length === 2) {
                  const tp1 = transformPoint(drawing.points[0]);
                  const tp2 = transformPoint(drawing.points[1]);
                  return (
                    <g key={drawing.id} onClick={(e) => { if (activeTool === 'cursor') { e.stopPropagation(); setSelectedDrawingId(drawing.id); } }}>
                      <line
                        x1={tp1.x} y1={tp1.y} x2={tp2.x} y2={tp2.y}
                        stroke={drawing.color} strokeWidth={selectedStrokeWidth}
                        strokeDasharray={getStrokeDashArray(drawing.lineStyle)}
                        className={activeTool === 'cursor' ? 'cursor-pointer' : ''}
                      />
                      {isSelected && (
                        <>
                          <circle cx={tp1.x} cy={tp1.y} r="4" fill={selectionColor} stroke="white" strokeWidth="1" />
                          <circle cx={tp2.x} cy={tp2.y} r="4" fill={selectionColor} stroke="white" strokeWidth="1" />
                        </>
                      )}
                    </g>
                  );
                } else if (drawing.type === 'rectangle' && drawing.points.length === 2) {
                  const tp1 = transformPoint(drawing.points[0]);
                  const tp2 = transformPoint(drawing.points[1]);
                  const x = Math.min(tp1.x, tp2.x);
                  const y = Math.min(tp1.y, tp2.y);
                  const width = Math.abs(tp1.x - tp2.x);
                  const height = Math.abs(tp1.y - tp2.y);
                  return (
                    <g key={drawing.id} onClick={(e) => { if (activeTool === 'cursor') { e.stopPropagation(); setSelectedDrawingId(drawing.id); } }}>
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
                  const tp1 = transformPoint(drawing.points[0]);
                  const tp2 = transformPoint(drawing.points[1]);
                  const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
                  const transformedHeight = tp2.y - tp1.y;

                  return (
                    <g key={drawing.id} onClick={(e) => { if (activeTool === 'cursor') { e.stopPropagation(); setSelectedDrawingId(drawing.id); } }}>
                      {fibLevels.map((level, index) => {
                        const y = tp1.y + (transformedHeight * level);
                        const x1 = Math.min(tp1.x, tp2.x); 
                        const x2 = Math.max(tp1.x, tp2.x);
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
                          <circle cx={tp1.x} cy={tp1.y} r="4" fill={selectionColor} stroke="white" strokeWidth="1" />
                          <circle cx={tp2.x} cy={tp2.y} r="4" fill={selectionColor} stroke="white" strokeWidth="1" />
                        </>
                      )}
                    </g>
                  );
                } else if (drawing.type === 'text' && drawing.points.length > 0 && drawing.text) {
                  const tp1 = transformPoint(drawing.points[0]);
                  const fontSize = 8 + drawing.lineWidth * 2; 
                  const estimatedTextWidth = drawing.text.length * (fontSize * 0.6); 
                  const estimatedTextHeight = fontSize;
                  return (
                    <g key={drawing.id} onClick={(e) => { if (activeTool === 'cursor') { e.stopPropagation(); setSelectedDrawingId(drawing.id); } }}>
                      <text
                        x={tp1.x} y={tp1.y} fill={drawing.color}
                        fontSize={`${fontSize}px`} textAnchor="start"
                        dominantBaseline="hanging"
                        className={activeTool === 'cursor' ? 'cursor-pointer' : ''}
                      >
                        {drawing.text}
                      </text>
                      {isSelected && (
                        <rect
                          x={tp1.x - 2} y={tp1.y - 2}
                          width={estimatedTextWidth + 4} height={estimatedTextHeight + 4}
                          stroke={selectionColor} strokeWidth="1"
                          strokeDasharray="3,3" fill="none"
                        />
                      )}
                    </g>
                  );
                }
                return null;
              });
            })()}

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
                  if (yPaddedRange > 0 && crosshairPosition.y >= plotAreaTopY && crosshairPosition.y <= plotAreaTopY + plotAreaHeight) {
                     priceAtCrosshair = yPaddedMin + (( (plotAreaTopY + plotAreaHeight) - crosshairPosition.y) / plotAreaHeight) * yPaddedRange;
                  } else if (crosshairPosition.y < plotAreaTopY) {
                    priceAtCrosshair = yPaddedMax; 
                  } else {
                    priceAtCrosshair = yPaddedMin; 
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
                  const X_AXIS_MARGIN_LEFT = 50;
                  const X_AXIS_MARGIN_RIGHT = 60;
                  const candleAreaWidth = chartDimensions.width - X_AXIS_MARGIN_LEFT - X_AXIS_MARGIN_RIGHT; 
                  const candleSlotWidth = visibleData && visibleData.length > 0 ? candleAreaWidth / visibleData.length : 0;
                  let closestIndexInVisibleData = -1;
                  let minDiff = Infinity;

                  if (visibleData && visibleData.length > 0 && candleSlotWidth > 0) { 
                    for (let i = 0; i < visibleData.length; i++) {
                      const candleXCenter = X_AXIS_MARGIN_LEFT + (i * candleSlotWidth) + (candleSlotWidth / 2);
                      const diff = Math.abs(candleXCenter - crosshairPosition.x);
                      if (diff < minDiff && crosshairPosition.x >= X_AXIS_MARGIN_LEFT && crosshairPosition.x <= chartDimensions.width - X_AXIS_MARGIN_RIGHT) {
                        minDiff = diff;
                        closestIndexInVisibleData = i;
                      }
                    }
                  }
                  
                  let timeAtCrosshair = "";
                  if (closestIndexInVisibleData !== -1 && visibleData && visibleData[closestIndexInVisibleData]) {
                    timeAtCrosshair = formatDate(visibleData[closestIndexInVisibleData].timestamp, timeFrame);
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
              data={visibleData}
              margin={{ top: 5, right: 60, left: 30, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value: string, index: number) => {
                  const numTicks = Math.min(10, visibleData?.length || 0);
                  if (visibleData && (visibleData.length <= numTicks || index % Math.floor(visibleData.length / numTicks) === 0)) {
                    return formatDate(value, timeFrame);
                  }
                  return "";
                }} 
                stroke="#555"
                tick={{ fill: '#999', fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                dataKey="volume" orientation="right"
                tick={{ fill: '#999', fontSize: 10 }} stroke="#555"
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                  return value.toLocaleString();
                }}
                width={40}
              />
              <Tooltip
                content={<CandlestickTooltip />}
                position={{ y: 0 }}
              />
              <Bar
                dataKey="volume"
                fill="rgba(33, 150, 243, 0.7)"
              />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
};

export default Chart;
