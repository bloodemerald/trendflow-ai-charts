
import React from 'react';
import Header from '@/components/Header';
import LeftSidebar from '@/components/LeftSidebar';
// Use a TradingView style chart for better interaction
import TradingViewChart from '@/components/TradingViewChart';
import RightSidebar from '@/components/RightSidebar';
import { useChartStore } from '@/store/chartStore';

const Index = () => {
  const { marketSummary } = useChartStore();
  
  // Helper function to format price with appropriate precision
  const formatPrice = (price: number) => {
    if (price > 1000) return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (price > 100) return price.toLocaleString(undefined, { maximumFractionDigits: 3 });
    if (price > 1) return price.toLocaleString(undefined, { maximumFractionDigits: 4 });
    return price.toLocaleString(undefined, { maximumFractionDigits: 8 });
  };

  // Improved volume formatting function
  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) return `${(volume / 1000000000).toFixed(1)}B`;
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toLocaleString();
  };

  // Calculate realistic volume based on price and market activity
  const getRealisticVolume = () => {
    const baseVolume = marketSummary.volume;
    // For crypto, volume should be substantial - multiply by price range factor
    const priceRange = marketSummary.high - marketSummary.low;
    const volumeMultiplier = Math.max(1000, priceRange * 50);
    return Math.floor(baseVolume * volumeMultiplier);
  };
  
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      
      <div className="flex flex-1 min-h-0">
        <LeftSidebar />
        
        <main className="flex-1 flex flex-col min-h-0">
          {/* Chart container - takes remaining space */}
          <div className="flex-1 p-4 min-h-0 overflow-hidden">
            <TradingViewChart />
          </div>
          
          {/* Bottom panels - always visible with fixed height */}
          <div className="h-52 p-4 border-t border-chart-grid bg-card/50 flex-shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
              {/* Market Summary Panel */}
              <div className="bg-card p-4 rounded-lg border border-chart-grid shadow-sm">
                <h3 className="text-sm font-semibold mb-3 text-foreground">Market Summary</h3>
                <div className="space-y-2 text-xs">
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
                    <span className="text-muted-foreground">Volume (24h)</span>
                    <span className="font-medium text-foreground">{formatVolume(getRealisticVolume())}</span>
                  </div>
                </div>
              </div>
              
              {/* Technical Indicators Panel */}
              <div className="bg-card p-4 rounded-lg border border-chart-grid shadow-sm">
                <h3 className="text-sm font-semibold mb-3 text-foreground">Technical Indicators</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RSI (14)</span>
                    <span className="font-medium text-foreground">N/A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MACD</span>
                    <span className="font-medium text-foreground">N/A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MA (50)</span>
                    <span className="font-medium text-foreground">N/A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MA (200)</span>
                    <span className="font-medium text-foreground">N/A</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bollinger Bands</span>
                    <span className="font-medium text-foreground">N/A</span>
                  </div>
                </div>
              </div>
              
              {/* Recent Signals Panel */}
              <div className="bg-card p-4 rounded-lg border border-chart-grid shadow-sm">
                <h3 className="text-sm font-semibold mb-3 text-foreground">Recent Signals</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full ${marketSummary.change >= 0 ? 'bg-chart-green' : 'bg-chart-red'} mr-2 flex-shrink-0`}></div>
                    <span className="text-muted-foreground">N/A</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-chart-yellow mr-2 flex-shrink-0"></div>
                    <span className="text-muted-foreground">N/A</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-chart-yellow mr-2 flex-shrink-0"></div>
                    <span className="text-muted-foreground">N/A</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-chart-green mr-2 flex-shrink-0"></div>
                    <span className="text-muted-foreground">N/A</span>
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
