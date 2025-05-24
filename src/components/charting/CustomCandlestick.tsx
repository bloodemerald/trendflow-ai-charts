
import React from 'react';

// Define a props interface for better type safety
interface CustomCandlestickProps {
  x: number;
  // The 'y' prop is actually the yScale function from the parent chart
  y: (value: number) => number; 
  width: number;
  height?: number; // Make this optional since it's not used in calculations
  index: number;
  open: number;
  close: number;
  high: number;
  low: number;
  // xAxis and yAxis objects are often passed by Recharts custom components,
  // but might not be strictly needed if x/y positions are calculated directly
  // For now, keeping them as any if their structure is complex or not fully used.
  xAxis?: any; 
  yAxis?: any;
  fill?: string; // Optional fill color (overridden by bullish/bearish logic)
  stroke?: string; // Optional stroke color (overridden by bullish/bearish logic)
}

export const CustomCandlestick = (props: CustomCandlestickProps) => {
  const { 
    x, y: yScale, width, /*height,*/ index, // height is not directly used for y positions
    open, close, high, low,
    // fill, stroke // these are overridden
  } = props;
  
  // Skip rendering if any required data is missing or invalid
  if (yScale === undefined || typeof yScale !== 'function' || 
      open === undefined || close === undefined || high === undefined || low === undefined) {
    // console.warn('CustomCandlestick: Missing required props', props);
    return null;
  }
  
  // Calculate if candle is bullish (green) or bearish (red)
  const isBullish = close > open;
  const color = isBullish ? '#26A69A' : '#EF5350'; // Standard bullish/bearish colors
  
  // Calculate positions using the passed y-scale function
  const openY = yScale(open);
  const closeY = yScale(close);
  const highY = yScale(high);
  const lowY = yScale(low);
  
  // Calculate candle body
  const bodyY = Math.min(openY, closeY);
  const bodyHeight = Math.max(1, Math.abs(closeY - openY)); // Ensure min height of 1px for visibility
  
  // Center the wick line
  const wickX = x + width / 2;

  // Adjust candle body x position if width is for the entire slot
  // The original Chart.tsx applies width * 0.1 and width * 0.8
  const candleBodyX = x + width * 0.1;
  const candleBodyWidth = width * 0.8;

  return (
    <g key={`candle-${index}`}>
      {/* Wick line from high to low */}
      <line 
        x1={wickX} 
        x2={wickX} 
        y1={highY}
        y2={lowY} 
        stroke={color}
        strokeWidth={1} // Standard wick width
      />
      
      {/* Candle body */}
      <rect 
        x={candleBodyX}
        y={bodyY}
        width={candleBodyWidth} 
        height={bodyHeight}
        fill={color}
        // Optional: add stroke to body if desired, e.g., for better definition
        // stroke={color} 
        // strokeWidth={0.5}
      />
    </g>
  );
};
