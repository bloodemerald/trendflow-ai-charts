
import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChartStore } from '@/store/chartStore';

const Header = () => {
  const { symbol, setSymbol, timeFrame, setTimeFrame } = useChartStore();
  const [searchValue, setSearchValue] = useState('');

  const timeFrames = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue) {
      setSymbol(searchValue);
      setSearchValue('');
    }
  };

  return (
    <header className="flex items-center justify-between p-4 bg-card border-b border-chart-grid">
      <div className="flex items-center space-x-2">
        <h1 className="text-lg font-bold">TradingAI</h1>
        <div className="flex items-center bg-secondary rounded-md px-2 py-1 ml-4">
          <span className="text-sm font-medium">{symbol}</span>
          <ChevronDown className="h-4 w-4 ml-1" />
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search symbols (e.g. BTC/USD, ETH/USD)"
            className="pl-8 bg-secondary"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
      </form>

      <div className="flex items-center">
        <div className="flex space-x-1 mr-4">
          {timeFrames.map((tf) => (
            <button
              key={tf}
              className={`timeframe-button ${timeFrame === tf ? 'active' : ''}`}
              onClick={() => setTimeFrame(tf as any)}
            >
              {tf}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" className="ml-2">
          Indicators
        </Button>
        <Button size="sm" className="ml-2">
          Share
        </Button>
      </div>
    </header>
  );
};

export default Header;
