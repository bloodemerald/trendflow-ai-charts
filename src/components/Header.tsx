import React from 'react';
import { useChartStore } from '@/store/chartStore';
import type { TimeFrame } from '@/store/chartStore';

const availableTimeFrames: TimeFrame[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'];
// Ensure '1M' is included if it's part of the TimeFrame type and desired.
// The type TimeFrame already includes '1M'.

const Header = () => {
  const { 
    symbol, 
    timeFrame, 
    setSymbol, 
    setTimeFrame,
    indicators,         // Added
    toggleIndicator     // Added
  } = useChartStore();

  const handleSymbolChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSymbol(event.target.value.toUpperCase()); // Symbols are often uppercase
  };

  const handleTimeFrameChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeFrame(event.target.value as TimeFrame);
  };

  return (
    <header className="bg-sidebar border-b border-chart-grid p-2 flex items-center space-x-4 h-14 shrink-0">
      <div>
        <label htmlFor="symbol-input" className="text-xs text-muted-foreground mr-1">
          Symbol:
        </label>
        <input
          id="symbol-input"
          type="text"
          value={symbol}
          onChange={handleSymbolChange}
          className="bg-input text-foreground border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-32"
          placeholder="e.g., BTC/USD"
        />
      </div>
      <div>
        <label htmlFor="timeframe-select" className="text-xs text-muted-foreground mr-1">
          Timeframe:
        </label>
        <select
          id="timeframe-select"
          value={timeFrame}
          onChange={handleTimeFrameChange}
          className="bg-input text-foreground border border-border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {availableTimeFrames.map((tf) => (
            <option key={tf} value={tf}>
              {tf}
            </option>
          ))}
        </select>
      </div>
      <div>
        <button
          onClick={() => toggleIndicator('sma')}
          className={`px-3 py-1 text-sm rounded-md border ${
            indicators.includes('sma') 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-input hover:bg-muted text-foreground'
          }`}
        >
          SMA
        </button>
      </div>
      {/* Placeholder for other header items like App Name or User Profile */}
      <div className="flex-grow"></div> {/* Pushes next items to the right */}
      <div className="text-lg font-semibold text-primary">TradingAI Chart</div>
    </header>
  );
};

export default Header;
