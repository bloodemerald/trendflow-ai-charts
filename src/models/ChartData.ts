
export interface ChartData {
  timestamp: string; // ISO string
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number; // Required to match store ChartData type
  sma?: number | null; // For indicators
}
