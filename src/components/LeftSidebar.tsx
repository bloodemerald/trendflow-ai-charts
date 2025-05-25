
import React from 'react';
import { useChartStore } from '@/store/chartStore';
import type { CurrentDrawingSettings } from '@/store/chartStore'; // Import type
import { 
  ChevronLeft, 
  MousePointer, 
  Crosshair,
  TrendingUp,
  BarChart,
  RectangleHorizontal,
  Type,
  Settings
} from 'lucide-react';

const tools = [
  { id: 'cursor', icon: MousePointer, tooltip: 'Selection Tool' },
  { id: 'crosshair', icon: Crosshair, tooltip: 'Crosshair' },
  { id: 'trendline', icon: TrendingUp, tooltip: 'Trend Line' },
  { id: 'fibonacci', icon: BarChart, tooltip: 'Fibonacci' },
  { id: 'rectangle', icon: RectangleHorizontal, tooltip: 'Rectangle' },
  { id: 'text', icon: Type, tooltip: 'Text' }
];

const LeftSidebar = () => {
  const { 
    activeTool, 
    setActiveTool, 
    showDrawingSettings, 
    setShowDrawingSettings,
    currentDrawingSettings, 
    updateDrawingSetting,
    selectedDrawingId,      // Added
    drawings,               // Added
    updateDrawingProperties // Added
  } = useChartStore();

  const selectedDrawing = drawings.find(d => d.id === selectedDrawingId);
  
  return (
    <div className="flex h-full">
      <div className="w-12 bg-sidebar py-4 flex flex-col items-center border-r border-border"> {/* Updated border */}
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
        <div className="w-48 bg-sidebar border-r border-border p-3"> {/* Updated border */}
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
                {['#2196F3', '#4CAF50', '#FF5252', '#FFD54F', '#9C27B0'].map(color => {
                  const isActive = selectedDrawing ? selectedDrawing.color === color : currentDrawingSettings.color === color;
                  return (
                    <button
                      key={color}
                      className={`w-5 h-5 rounded-full border-2 ${isActive ? 'border-ring' : 'border-transparent'} hover:border-gray-400`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        if (selectedDrawingId && selectedDrawing) {
                          updateDrawingProperties(selectedDrawingId, { color });
                        } else {
                          updateDrawingSetting('color', color);
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground">Line Style</label>
              <div className="flex mt-1 space-x-1">
                {(['solid', 'dashed', 'dotted'] as CurrentDrawingSettings['lineStyle'][]).map(style => {
                  const isActive = selectedDrawing ? selectedDrawing.lineStyle === style : currentDrawingSettings.lineStyle === style;
                  return (
                    <button
                      key={style}
                      className={`w-7 h-7 flex items-center justify-center border rounded ${isActive ? 'border-ring bg-secondary' : 'border-border'} hover:border-gray-400`} {/* Updated active bg and default border */}
                      onClick={() => {
                        if (selectedDrawingId && selectedDrawing) {
                          updateDrawingProperties(selectedDrawingId, { lineStyle: style as any });
                        } else {
                          updateDrawingSetting('lineStyle', style as any);
                        }
                      }}
                    >
                      {style === 'solid' && <div className="w-4 h-0.5 bg-current" />}
                      {style === 'dashed' && <div className="w-4 h-0.5 border-t-2 border-current border-dashed" />}
                      {style === 'dotted' && <div className="w-4 h-0.5 border-t-2 border-current border-dotted" />}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground">
                Width ({selectedDrawing ? selectedDrawing.lineWidth : currentDrawingSettings.lineWidth}px)
              </label>
              <input 
                type="range"
                min={1}
                max={10} 
                value={selectedDrawing ? selectedDrawing.lineWidth : currentDrawingSettings.lineWidth}
                onChange={(e) => {
                  const newWidth = parseInt(e.target.value);
                  if (selectedDrawingId && selectedDrawing) {
                    updateDrawingProperties(selectedDrawingId, { lineWidth: newWidth });
                  } else {
                    updateDrawingSetting('lineWidth', newWidth);
                  }
                }}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer range-sm accent-primary" /* Updated track background */
              />
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default LeftSidebar;
