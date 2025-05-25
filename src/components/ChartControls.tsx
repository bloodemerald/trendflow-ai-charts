
import React from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Eraser } from 'lucide-react';
import { useChartStore } from '@/store/chartStore';

const ChartControls = () => {
  const { zoomLevel, zoomIn, zoomOut, resetZoom, clearAllDrawings } = useChartStore();

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
      
      <div className="text-xs text-muted-foreground text-center mt-1">
        {Math.round(zoomLevel * 100)}%
      </div>
    </div>
  );
};

export default ChartControls;
