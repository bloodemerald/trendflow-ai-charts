
import React from 'react';
import { useChartStore } from '@/store/chartStore';
import { 
  ChevronLeft, 
  MousePointer, 
  Crosshair,
  TrendingUp,
  BarChart,
  Rectangle,
  Type,
  Settings
} from 'lucide-react';

const tools = [
  { id: 'cursor', icon: MousePointer, tooltip: 'Selection Tool' },
  { id: 'crosshair', icon: Crosshair, tooltip: 'Crosshair' },
  { id: 'trendline', icon: TrendingUp, tooltip: 'Trend Line' },
  { id: 'fibonacci', icon: BarChart, tooltip: 'Fibonacci' },
  { id: 'rectangle', icon: Rectangle, tooltip: 'Rectangle' },
  { id: 'text', icon: Type, tooltip: 'Text' }
];

const LeftSidebar = () => {
  const { activeTool, setActiveTool, showDrawingSettings, setShowDrawingSettings } = useChartStore();
  
  return (
    <div className="flex h-full">
      <div className="w-12 bg-sidebar py-4 flex flex-col items-center border-r border-chart-grid">
        {tools.map((tool) => (
          <div key={tool.id} className="relative group mb-4">
            <button
              className={`tool-button ${activeTool === tool.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTool(tool.id as any);
                if (['trendline', 'fibonacci', 'rectangle', 'text'].includes(tool.id)) {
                  setShowDrawingSettings(true);
                }
              }}
            >
              <tool.icon size={16} />
            </button>
            <div className="absolute left-full ml-2 px-2 py-1 bg-chart-tooltip text-xs rounded hidden group-hover:block z-10">
              {tool.tooltip}
            </div>
          </div>
        ))}
        
        <div className="mt-auto relative group">
          <button 
            className="tool-button"
            onClick={() => setShowDrawingSettings(!showDrawingSettings)}
          >
            <Settings size={16} />
          </button>
          <div className="absolute left-full ml-2 px-2 py-1 bg-chart-tooltip text-xs rounded hidden group-hover:block z-10">
            Settings
          </div>
        </div>
      </div>
      
      {showDrawingSettings && (
        <div className="w-48 bg-sidebar border-r border-chart-grid p-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Drawing Settings</h3>
            <button onClick={() => setShowDrawingSettings(false)}>
              <ChevronLeft size={16} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Color</label>
              <div className="flex mt-1 space-x-1">
                {['#2196F3', '#4CAF50', '#FF5252', '#FFD54F', '#9C27B0'].map(color => (
                  <button
                    key={color}
                    className="w-5 h-5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground">Line Style</label>
              <div className="flex mt-1 space-x-1">
                <button className="w-6 h-6 flex items-center justify-center border border-chart-grid rounded">
                  <div className="w-4 h-0.5 bg-current" />
                </button>
                <button className="w-6 h-6 flex items-center justify-center border border-chart-grid rounded">
                  <div className="w-4 h-0.5 bg-current border-dashed" style={{ borderTopStyle: 'dashed' }} />
                </button>
                <button className="w-6 h-6 flex items-center justify-center border border-chart-grid rounded">
                  <div className="w-4 h-0.5 bg-current border-dotted" style={{ borderTopStyle: 'dotted' }} />
                </button>
              </div>
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground">Width</label>
              <input 
                type="range"
                min={1}
                max={5}
                defaultValue={2}
                className="w-full h-1.5 bg-chart-grid rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default LeftSidebar;
