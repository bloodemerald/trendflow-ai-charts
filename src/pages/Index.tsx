
import React from 'react';
import Header from '@/components/Header';
import LeftSidebar from '@/components/LeftSidebar';
import Chart from '@/components/Chart';
import RightSidebar from '@/components/RightSidebar';
import { useChartStore } from '@/store/chartStore';

const Index = () => {
  const { symbol, timeFrame, marketSummary } = useChartStore();
  
  // Helper function to format price with appropriate precision
  const formatPrice = (price: number) => {
    if (price > 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (price > 100) return price.toLocaleString(undefined, { maximumFractionDigits: 3 });
    if (price > 1) return price.toLocaleString(undefined, { maximumFractionDigits: 4 });
    return price.toLocaleString(undefined, { maximumFractionDigits: 8 });
  };

  // Helper function to format volume
  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) return `${(volume / 1000000000).toFixed(2)}B`;
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(2)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(2)}K`;
    return volume.toString();
  };
  
  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Chart header - Symbol and Timeframe now in global Header component */}
          {/* <div className="p-4 pb-2">
            <h2 className="text-xl font-bold">{symbol}</h2>
            <p className="text-sm text-muted-foreground">Timeframe: {timeFrame}</p>
          </div> */}
          
          {/* Full-height chart container */}
          <div className="flex-1 p-4 min-h-0"> {/* Added padding to match the removed header's style */}
            <Chart />
          </div>
          
          {/* Bottom panels - Market Summary */}
          <div className="p-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card p-4 rounded-md border border-chart-grid">
                <h3 className="text-sm font-medium">Market Summary</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Open</span>
                    <span className="font-medium">${formatPrice(marketSummary.open)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>High</span>
                    <span className="font-medium text-chart-green">${formatPrice(marketSummary.high)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Low</span>
                    <span className="font-medium text-chart-red">${formatPrice(marketSummary.low)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last</span>
                    <span className="font-medium">${formatPrice(marketSummary.close)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Change</span>
                    <span className={`font-medium ${marketSummary.change >= 0 ? 'text-chart-green' : 'text-chart-red'}`}>
                      {marketSummary.change >= 0 ? '+' : ''}{formatPrice(marketSummary.change)} ({marketSummary.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Volume</span>
                    <span className="font-medium">{formatVolume(marketSummary.volume)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-card p-4 rounded-md border border-chart-grid">
                <h3 className="text-sm font-medium">Technical Indicators</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>RSI (14)</span>
                    <span className="font-medium">
                      {Math.round(50 + (marketSummary.changePercent * 2)).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>MACD</span>
                    <span className={`font-medium ${marketSummary.change >= 0 ? 'text-chart-green' : 'text-chart-red'}`}>
                      {marketSummary.change >= 0 ? 'Bullish' : 'Bearish'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>MA (50)</span>
                    <span className="font-medium">${formatPrice(marketSummary.close * 0.95)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MA (200)</span>
                    <span className="font-medium">${formatPrice(marketSummary.close * 0.9)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-card p-4 rounded-md border border-chart-grid">
                <h3 className="text-sm font-medium">Recent Signals</h3>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full ${marketSummary.change >= 0 ? 'bg-chart-green' : 'bg-chart-red'} mr-2`}></div>
                    <span>
                      {marketSummary.change >= 0 
                        ? 'Bullish momentum on current timeframe' 
                        : 'Bearish pressure on current timeframe'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-chart-yellow mr-2"></div>
                    <span>
                      {marketSummary.high > marketSummary.close * 1.02
                        ? `Resistance hit at $${formatPrice(marketSummary.high)}`
                        : `Approaching resistance at $${formatPrice(marketSummary.close * 1.05)}`}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-chart-yellow mr-2"></div>
                    <span>
                      Volume {marketSummary.volume > 10000 ? 'increasing' : 'decreasing'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-chart-green mr-2"></div>
                    <span>
                      {`Support forming at $${formatPrice(marketSummary.low)}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <RightSidebar />
      </div>
    </div>
  );
};

export default Index;
