
import React from 'react';
import Header from '@/components/Header';
import LeftSidebar from '@/components/LeftSidebar';
import Chart from '@/components/Chart';
import RightSidebar from '@/components/RightSidebar';
import { useChartStore } from '@/store/chartStore';

const Index = () => {
  const { symbol, timeFrame } = useChartStore();
  
  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-4">
            <h2 className="text-xl font-bold">{symbol}</h2>
            <p className="text-sm text-muted-foreground">Timeframe: {timeFrame}</p>
          </div>
          
          <Chart />
          
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-card p-4 rounded-md border border-chart-grid">
              <h3 className="text-sm font-medium">Market Summary</h3>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Open</span>
                  <span className="font-medium">$45,123.45</span>
                </div>
                <div className="flex justify-between">
                  <span>High</span>
                  <span className="font-medium text-chart-green">$46,872.10</span>
                </div>
                <div className="flex justify-between">
                  <span>Low</span>
                  <span className="font-medium text-chart-red">$44,987.30</span>
                </div>
                <div className="flex justify-between">
                  <span>Volume</span>
                  <span className="font-medium">$1.2B</span>
                </div>
              </div>
            </div>
            
            <div className="bg-card p-4 rounded-md border border-chart-grid">
              <h3 className="text-sm font-medium">Technical Indicators</h3>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>RSI (14)</span>
                  <span className="font-medium">57.3</span>
                </div>
                <div className="flex justify-between">
                  <span>MACD</span>
                  <span className="font-medium text-chart-green">Bullish</span>
                </div>
                <div className="flex justify-between">
                  <span>MA (50)</span>
                  <span className="font-medium">$42,145.20</span>
                </div>
                <div className="flex justify-between">
                  <span>MA (200)</span>
                  <span className="font-medium">$38,723.45</span>
                </div>
              </div>
            </div>
            
            <div className="bg-card p-4 rounded-md border border-chart-grid">
              <h3 className="text-sm font-medium">Recent Signals</h3>
              <div className="mt-2 space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-chart-green mr-2"></div>
                  <span>Bullish crossover on 4H</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-chart-red mr-2"></div>
                  <span>Resistance hit at $46,800</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-chart-yellow mr-2"></div>
                  <span>Volume decreasing</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-chart-green mr-2"></div>
                  <span>Support forming at $44,900</span>
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
