
import React from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Eraser, Sparkles } from 'lucide-react'; // Added Sparkles
import { useChartStore } from '@/store/chartStore';

const ChartControls = () => {
  const { zoomLevel, zoomIn, zoomOut, resetZoom, clearAllDrawings, addUserMessage, isAIAnalyzing } = useChartStore(); // Added addUserMessage and isAIAnalyzing

  const handleEraseAll = () => {
    clearAllDrawings();
  };

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-md border border-border">
      <Button
        variant="ghost"
        size="sm"
        onClick={zoomIn}
        disabled={zoomLevel >= 5}
        className="h-8 w-8 p-0"
        title="Zoom In"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={zoomOut}
        disabled={zoomLevel <= 0.5}
        className="h-8 w-8 p-0"
        title="Zoom Out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={resetZoom}
        className="h-8 w-8 p-0 text-xs"
        title="Reset Zoom"
      >
        1:1
      </Button>
      
      <div className="w-full h-px bg-border my-1" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleEraseAll}
        className="h-8 w-8 p-0"
        title="Erase All Drawings"
      >
        <Eraser className="h-4 w-4" />
      </Button>

      <div className="w-full h-px bg-border my-1" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => addUserMessage("Please analyze the current chart data for trends, patterns, and support/resistance levels.")}
        className="h-8 w-auto p-2 flex items-center gap-1 text-xs" // Adjusted for text
        title="Analyze Chart with AI"
        disabled={isAIAnalyzing} // Disable button when AI is analyzing
      >
        <Sparkles className="h-3 w-3" /> {/* Smaller icon */}
        Analyze
      </Button>
      
      <div className="text-xs text-muted-foreground text-center mt-1">
        {Math.round(zoomLevel * 100)}%
      </div>
    </div>
  );
};

export default ChartControls;
