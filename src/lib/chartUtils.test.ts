import { describe, it, expect, vi } from 'vitest';
import { 
  calculateSMA, 
  formatDate, 
  getStrokeDashArray, 
  hexToRgba, 
  isPointNearDrawing 
} from './chartUtils';
import type { ChartDataPointForSMA } from './chartUtils';
import type { DrawingObject, DrawingPoint, LineStyle } from '@/store/chartStore'; // Import actual types

describe('calculateSMA', () => {
  it('should return an empty array for empty data', () => {
    expect(calculateSMA([], 5)).toEqual([]);
  });

  it('should return data with null SMA if data length is less than period', () => {
    const data: ChartDataPointForSMA[] = [{ close: 10 }, { close: 20 }];
    const expected = [{ close: 10, sma: null }, { close: 20, sma: null }];
    expect(calculateSMA(data, 3)).toEqual(expected);
  });

  it('should calculate SMA correctly', () => {
    const data: ChartDataPointForSMA[] = [
      { close: 10 }, { close: 12 }, { close: 11 }, { close: 15 }, { close: 14 }
    ];
    const period = 3;
    const result = calculateSMA(data, period);
    expect(result[0].sma).toBeNull();
    expect(result[1].sma).toBeNull();
    expect(result[2].sma).toBeCloseTo((10 + 12 + 11) / 3);
    expect(result[3].sma).toBeCloseTo((12 + 11 + 15) / 3);
    expect(result[4].sma).toBeCloseTo((11 + 15 + 14) / 3);
  });

  it('should return data of the same length as input', () => {
    const data: ChartDataPointForSMA[] = Array(10).fill(null).map((_, i) => ({ close: i + 1 }));
    expect(calculateSMA(data, 3).length).toBe(10);
  });
   it('should handle period of 1 correctly', () => {
    const data: ChartDataPointForSMA[] = [{ close: 10 }, { close: 20 }];
    const expected = [{ close: 10, sma: 10 }, { close: 20, sma: 20 }];
    expect(calculateSMA(data, 1)).toEqual(expected);
  });

  it('should return null SMAs if period is invalid (e.g., 0 or negative)', () => {
    const data: ChartDataPointForSMA[] = [{ close: 10 }, { close: 20 }];
    const expected = [{ close: 10, sma: null }, { close: 20, sma: null }];
    expect(calculateSMA(data, 0)).toEqual(expected);
    expect(calculateSMA(data, -1)).toEqual(expected);
  });

  it('should handle missing or non-numeric close values gracefully', () => {
    const data: any[] = [{ close: 10 }, { open: 5 }, { close: 'abc' as any }, { close: 20 }];
    const period = 2;
    const result = calculateSMA(data, period);
    expect(result[0].sma).toBeNull(); // Not enough data
    expect(result[1].sma).toBeNull(); // data[0].close is 10, data[1].close is undefined -> NaN
    expect(result[2].sma).toBeNull(); // data[1].close is undefined, data[2].close is 'abc' -> NaN
    expect(result[3].sma).toBeNull(); // data[2].close is 'abc', data[3].close is 20 -> NaN
  });
});

describe('formatDate', () => {
  it('should format for minute timeframes (e.g., 1m, 5m, 15m, 30m) as HH:MM', () => {
    const timestamp = '2023-01-01T14:05:00.000Z'; // 14:05 UTC
    expect(formatDate(timestamp, '1m')).toBe('14:05');
    expect(formatDate(timestamp, '30m')).toBe('14:05');
  });

  it('should format for hourly timeframes (e.g., 1h, 4h) as MM/DD HH:MM', () => {
    const timestamp = '2023-06-15T08:30:00.000Z'; // June 15, 08:30 UTC
    expect(formatDate(timestamp, '1h')).toBe('6/15 08:30');
    expect(formatDate(timestamp, '4h')).toBe('6/15 08:30');
  });

  it('should format for daily/weekly timeframes (e.g., 1d, 1w) as MM/DD', () => {
    const timestamp = '2023-12-25T10:00:00.000Z'; // Dec 25
    expect(formatDate(timestamp, '1d')).toBe('12/25');
    expect(formatDate(timestamp, '1w')).toBe('12/25');
    expect(formatDate(timestamp, 'unknown')).toBe('12/25'); // Default case
  });
});

describe('getStrokeDashArray', () => {
  it("should return 'none' for 'solid'", () => {
    expect(getStrokeDashArray('solid')).toBe('none');
  });
  it("should return '5,5' for 'dashed'", () => {
    expect(getStrokeDashArray('dashed')).toBe('5,5');
  });
  it("should return '1,5' for 'dotted'", () => {
    expect(getStrokeDashArray('dotted')).toBe('1,5');
  });
  it("should return 'none' for an unknown style as default", () => {
    expect(getStrokeDashArray('unknown' as LineStyle)).toBe('none');
  });
});

describe('hexToRgba', () => {
  it('should convert valid 6-digit hex to rgba', () => {
    expect(hexToRgba('#FF0000', 1)).toBe('rgba(255, 0, 0, 1)');
    expect(hexToRgba('#00FF00', 0.5)).toBe('rgba(0, 255, 0, 0.5)');
  });

  it('should return default for 3-digit hex as current implementation is strict to 6-digits', () => {
    // Current implementation is strict and expects 6 digits after #.
    expect(hexToRgba('#F00', 1)).toBe('rgba(0, 0, 0, 1)'); 
  });

  it('should handle default alpha if not provided (alpha=1)', () => {
    expect(hexToRgba('#0000FF')).toBe('rgba(0, 0, 255, 1)');
  });
  
  it('should return a default color for invalid hex codes (non-hex chars, wrong length)', () => {
    expect(hexToRgba('invalid', 1)).toBe('rgba(0, 0, 0, 1)'); // Not starting with #
    expect(hexToRgba('#12345', 1)).toBe('rgba(0, 0, 0, 1)'); // Invalid length (not 6)
    expect(hexToRgba('#12345G', 1)).toBe('rgba(0, 0, 0, 1)'); // Invalid char 'G' should cause parseInt to be NaN
    expect(hexToRgba('', 1)).toBe('rgba(0, 0, 0, 1)'); // Empty string
    expect(hexToRgba('#', 1)).toBe('rgba(0, 0, 0, 1)'); // Just #
  });
});

describe('isPointNearDrawing', () => {
  // Mock Drawing Objects
  const trendline: DrawingObject = {
    id: 'trend1', type: 'trendline',
    points: [{ x: 10, y: 10 }, { x: 100, y: 100 }],
    color: '#FF0000', lineStyle: 'solid', lineWidth: 2,
  };
  const rectangle: DrawingObject = {
    id: 'rect1', type: 'rectangle',
    points: [{ x: 50, y: 50 }, { x: 150, y: 150 }],
    color: '#00FF00', lineStyle: 'dashed', lineWidth: 1,
  };
  const text: DrawingObject = {
    id: 'text1', type: 'text', text: 'Hello',
    points: [{ x: 200, y: 200 }],
    color: '#0000FF', lineStyle: 'solid', lineWidth: 3, // lineWidth for text maps to font size factor
  };

  // Trendline tests
  describe('trendline', () => {
    it('should be true if point is on the line', () => {
      expect(isPointNearDrawing(55, 55, trendline, 2)).toBe(true);
    });
    it('should be true if point is near the line', () => {
      expect(isPointNearDrawing(50, 55, trendline, 2)).toBe(true); // Within tolerance
    });
    it('should be false if point is far from the line', () => {
      expect(isPointNearDrawing(10, 100, trendline, 2)).toBe(false);
    });
     it('should be true if point is near an endpoint', () => {
      expect(isPointNearDrawing(12, 12, trendline, 2)).toBe(true);
      expect(isPointNearDrawing(98, 98, trendline, 2)).toBe(true);
    });
  });

  // Rectangle tests
  describe('rectangle', () => {
    it('should be true if point is inside the rectangle', () => {
      expect(isPointNearDrawing(100, 100, rectangle, 1)).toBe(true);
    });
    it('should be true if point is on an edge', () => {
      expect(isPointNearDrawing(50, 100, rectangle, 1)).toBe(true); // Left edge
      expect(isPointNearDrawing(100, 50, rectangle, 1)).toBe(true); // Top edge
    });
    it('should be false if point is outside the rectangle', () => {
      expect(isPointNearDrawing(10, 10, rectangle, 1)).toBe(false);
    });
  });

  // Text tests
  describe('text', () => {
    // Note: Text hit detection is approximate. fontSize = 8 + lineWidth * 2
    // For text object: lineWidth = 3, so fontSize = 8 + 3 * 2 = 14
    // Estimated width for "Hello" (5 chars) ~ 5 * 14 * 0.6 = 42
    // Estimated height ~ 14
    // Anchor point (p1) is at 200, 200 (top-left of text)
    it('should be true if point is within estimated text bounds', () => {
      expect(isPointNearDrawing(205, 205, text, 2)).toBe(true); // currentSettingsLineWidth=2 is default if drawing.lineWidth not used
    });
    it('should be false if point is outside estimated text bounds', () => {
      expect(isPointNearDrawing(250, 250, text, 2)).toBe(false);
      expect(isPointNearDrawing(190, 190, text, 2)).toBe(false); // Too far left/up
    });
  });
});
