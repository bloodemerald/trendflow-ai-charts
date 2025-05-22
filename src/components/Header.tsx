
import React, { useState } from 'react';
import { Search, ChevronDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChartStore } from '@/store/chartStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { symbol, setSymbol, timeFrame, setTimeFrame } = useChartStore();
  const [searchValue, setSearchValue] = useState('');
  const [invalidSymbol, setInvalidSymbol] = useState(false);

  const timeFrames = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'];
  
  // Popular cryptocurrency pairs
  const popularPairs = [
    'BTC/USD', 'ETH/USD', 'SOL/USD', 'XRP/USD', 'ADA/USD', 
    'DOT/USD', 'DOGE/USD', 'SHIB/USD', 'AVAX/USD', 'LINK/USD'
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue) {
      // Basic validation to ensure a valid pair format
      const isValidSymbol = /^[A-Za-z0-9]{2,10}\/[A-Za-z0-9]{2,10}$/.test(searchValue);
      
      if (isValidSymbol) {
        setSymbol(searchValue.toUpperCase());
        setSearchValue('');
        setInvalidSymbol(false);
      } else {
        setInvalidSymbol(true);
        setTimeout(() => setInvalidSymbol(false), 3000);
      }
    }
  };

  const selectSymbol = (pair: string) => {
    setSymbol(pair);
  };

  return (
    <header className="flex items-center justify-between p-4 bg-card border-b border-chart-grid">
      <div className="flex items-center space-x-2">
        <h1 className="text-lg font-bold">TradingAI</h1>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center bg-secondary rounded-md px-2 py-1 ml-4 cursor-pointer hover:bg-secondary/80">
              <span className="text-sm font-medium">{symbol}</span>
              <ChevronDown className="h-4 w-4 ml-1" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[150px]">
            {popularPairs.map((pair) => (
              <DropdownMenuItem 
                key={pair} 
                onClick={() => selectSymbol(pair)}
                className={symbol === pair ? "bg-primary/20" : ""}
              >
                {pair}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4 relative">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search symbols (e.g. BTC/USD, ETH/USD)"
            className={`pl-8 bg-secondary ${invalidSymbol ? 'border-destructive' : ''}`}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          {invalidSymbol && (
            <div className="absolute top-full left-0 right-0 mt-1 p-1 bg-destructive/10 text-destructive text-xs rounded flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Invalid format. Use SYMBOL/CURRENCY (e.g. BTC/USD)
            </div>
          )}
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
