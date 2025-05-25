
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
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <LeftSidebar />
        
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Chart container - fixed height to ensure panels are visible */}
          <div className="flex-1 p-4 min-h-0 max-h-[calc(100vh-200px)]">
            <Chart />
          </div>
          
          {/* Bottom panels - fixed height with scroll if needed */}
          <div className="h-48 p-4 border-t border-chart-grid bg-card/50 overflow-y-auto flex-shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
              {/* Market Summary Panel */}
              <div className="bg-card p-3 rounded-lg border border-chart-grid shadow-sm h-fit">
                <h3 className="text-sm font-semibold mb-2 text-foreground">Market Summary</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Open</span>
                    <span className="font-medium text-foreground">${formatPrice(marketSummary.open)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">High</span>
                    <span className="font-medium text-chart-green">${formatPrice(marketSummary.high)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Low</span>
                    <span className="font-medium text-chart-red">${formatPrice(marketSummary.low)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last</span>
                    <span className="font-medium text-foreground">${formatPrice(marketSummary.close)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Change</span>
                    <span className={`font-medium ${marketSummary.change >= 0 ? 'text-chart-green' : 'text-chart-red'}`}>
                      {marketSummary.change >= 0 ? '+' : ''}{formatPrice(marketSummary.change)} ({marketSummary.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Volume</span>
                    <span className="font-medium text-foreground">{formatVolume(marketSummary.volume)}</span>
                  </div>
                </div>
              </div>
              
              {/* Technical Indicators Panel */}
              <div className="bg-card p-3 rounded-lg border border-chart-grid shadow-sm h-fit">
                <h3 className="text-sm font-semibold mb-2 text-foreground">Technical Indicators</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RSI (14)</span>
                    <span className="font-medium text-foreground">
                      {Math.min(100, Math.max(0, Math.round(50 + (marketSummary.changePercent * 2)))).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MACD</span>
                    <span className={`font-medium ${marketSummary.change >= 0 ? 'text-chart-green' : 'text-chart-red'}`}>
                      {marketSummary.change >= 0 ? 'Bullish' : 'Bearish'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MA (50)</span>
                    <span className="font-medium text-foreground">${formatPrice(marketSummary.close * 0.95)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MA (200)</span>
                    <span className="font-medium text-foreground">${formatPrice(marketSummary.close * 0.9)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bollinger Bands</span>
                    <span className="font-medium text-foreground">
                      {marketSummary.close > marketSummary.open ? 'Upper' : 'Lower'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Recent Signals Panel */}
              <div className="bg-card p-3 rounded-lg border border-chart-grid shadow-sm h-fit">
                <h3 className="text-sm font-semibold mb-2 text-foreground">Recent Signals</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full ${marketSummary.change >= 0 ? 'bg-chart-green' : 'bg-chart-red'} mr-2 flex-shrink-0`}></div>
                    <span className="text-muted-foreground">
                      {marketSummary.change >= 0 
                        ? 'Bullish momentum on current timeframe' 
                        : 'Bearish pressure on current timeframe'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-chart-yellow mr-2 flex-shrink-0"></div>
                    <span className="text-muted-foreground">
                      {marketSummary.high > marketSummary.close * 1.02
                        ? `Resistance hit at $${formatPrice(marketSummary.high)}`
                        : `Approaching resistance at $${formatPrice(marketSummary.close * 1.05)}`}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-chart-yellow mr-2 flex-shrink-0"></div>
                    <span className="text-muted-foreground">
                      Volume {marketSummary.volume > 10000 ? 'increasing' : 'decreasing'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-chart-green mr-2 flex-shrink-0"></div>
                    <span className="text-muted-foreground">
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
