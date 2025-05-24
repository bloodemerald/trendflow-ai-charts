
export interface ChartData {
  timestamp: string; // ISO string
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number; // Optional, as some contexts might not use it
  sma?: number | null; // For indicators
}
