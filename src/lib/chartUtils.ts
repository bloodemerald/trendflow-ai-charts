import type { DrawingObject } from '@/store/chartStore'; // Import DrawingObject type

export const getStrokeDashArray = (lineStyle: 'solid' | 'dashed' | 'dotted') => {
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

export const hexToRgba = (hex: string, alpha: number = 1) => {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
    // console.warn(`Invalid hex color format: ${hex}`);
    return `rgba(0, 0, 0, ${alpha})`; 
  }

  const hexValue = hex.slice(1);
  // Enforce 6-digit hex format (#RRGGBB)
  if (hexValue.length !== 6) {
    // console.warn(`Invalid hex color length: ${hex}. Expected 6 digits after #.`);
    return `rgba(0, 0, 0, ${alpha})`; 
  }

  // Ensure all characters are valid hex digits
  if (!/^[0-9A-Fa-f]{6}$/.test(hexValue)) {
    // console.warn(`Invalid hex characters in: ${hexValue}`);
    return `rgba(0, 0, 0, ${alpha})`;
  }

  const bigint = parseInt(hexValue, 16);
  // This NaN check is now somewhat redundant due to the regex, but good for safety.
  if (Number.isNaN(bigint)) { 
      // console.warn(`parseInt failed for: ${hexValue}`);
      return `rgba(0, 0, 0, ${alpha})`;
  }

  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const isPointNearDrawing = (
  mouseX: number, 
  mouseY: number, 
  drawing: DrawingObject, 
  // currentSettingsLineWidth is passed for text hit detection, 
  // as drawing.lineWidth on a text object might represent its intended font size factor
  // rather than the global setting.
  currentSettingsLineWidth: number = 2 // Default to a sensible line width if not provided
): boolean => {
  const tolerance = 8; // pixels
  const { type, points, text } = drawing;

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
    // Use drawing.lineWidth if available (specific to this text object), 
    // otherwise fall back to currentSettingsLineWidth passed as param.
    const effectiveLineWidth = drawing.lineWidth !== undefined ? drawing.lineWidth : currentSettingsLineWidth;
    const fontSize = 8 + effectiveLineWidth * 2; 
    const estimatedWidth = text.length * (fontSize * 0.6); // Rough estimate
    const estimatedHeight = fontSize;
    return mouseX >= p1.x - tolerance && mouseX <= p1.x + estimatedWidth + tolerance &&
           mouseY >= p1.y - tolerance && mouseY <= p1.y + estimatedHeight + tolerance;
  }
  return false;
};

// Define a basic type for data points used in SMA calculation
export interface ChartDataPointForSMA {
  close: number;
  // Allow other properties, like timestamp, open, high, low, volume, etc.
  [key: string]: any; 
}

/**
 * Calculates the Simple Moving Average (SMA) for a given dataset and period.
 * @param data - Array of data points, each an object with at least a 'close' property.
 * @param period - The period over which to calculate the SMA.
 * @returns An array of the same data points, with an added 'sma' property (null if SMA cannot be calculated).
 */
export const calculateSMA = (data: ChartDataPointForSMA[], period: number): Array<ChartDataPointForSMA & { sma: number | null }> => {
  if (!data || period <= 0) {
    return (data || []).map(d => ({ ...d, sma: null }));
  }

  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push({ ...data[i], sma: null });
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        // Ensure data[i-j] and data[i-j].close exist and are numbers
        if (data[i-j] && typeof data[i-j].close === 'number') {
          sum += data[i-j].close;
        } else {
          // console.warn(`Invalid data point at index ${i-j} for SMA calculation.`);
          sum = NaN; 
          break;
        }
      }
      result.push({ ...data[i], sma: Number.isNaN(sum) ? null : sum / period });
    }
  }
  return result;
};

/**
 * Formats a timestamp string based on the given timeframe.
 * @param timestamp - The timestamp string (parsable by new Date()).
 * @param timeFrame - The timeframe string (e.g., '1m', '1h', '1d').
 * @returns A formatted date string.
 */
export const formatDate = (timestamp: string, timeFrame: string): string => {
  const date = new Date(timestamp);
  
  if (['1m', '5m', '15m', '30m'].includes(timeFrame)) {
    // HH:MM
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } 
  if (['1h', '4h'].includes(timeFrame)) {
    // MM/DD HH:MM
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  // Default for '1d', '1w', or any other case (e.g., '1Y')
  // MM/DD
  return `${date.getMonth() + 1}/${date.getDate()}`;
};
