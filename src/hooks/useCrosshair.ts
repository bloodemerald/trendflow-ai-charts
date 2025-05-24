import { useState, useCallback, RefObject, useEffect } from 'react';

interface UseCrosshairReturn {
  crosshairPosition: { x: number; y: number } | null;
  handleMouseMoveForCrosshair: (event: React.MouseEvent<SVGSVGElement>) => void;
  handleMouseLeaveForCrosshair: () => void;
}

export const useCrosshair = (
  activeTool: string | null, 
  svgRef: RefObject<SVGSVGElement>
): UseCrosshairReturn => {
  const [crosshairPosition, setCrosshairPosition] = useState<{ x: number; y: number } | null>(null);

  const handleMouseMoveForCrosshair = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) {
      setCrosshairPosition(null);
      return;
    }
    
    if (activeTool === 'crosshair') {
      const svgRect = svgRef.current.getBoundingClientRect();
      const x = event.clientX - svgRect.left;
      const y = event.clientY - svgRect.top;
      setCrosshairPosition({ x, y });
    } else {
      // If tool is not crosshair, ensure position is null
      if (crosshairPosition !== null) {
        setCrosshairPosition(null);
      }
    }
  }, [activeTool, svgRef, crosshairPosition]); // Added crosshairPosition to deps for the clearing logic

  const handleMouseLeaveForCrosshair = useCallback(() => {
    setCrosshairPosition(null);
  }, []);
  
  // Effect to clear crosshair if activeTool changes and is no longer 'crosshair'
  // This handles cases where mousemove might not fire immediately after tool change
  useEffect(() => {
    if (activeTool !== 'crosshair' && crosshairPosition !== null) {
      setCrosshairPosition(null);
    }
  }, [activeTool, crosshairPosition]);

  return {
    crosshairPosition,
    handleMouseMoveForCrosshair,
    handleMouseLeaveForCrosshair,
  };
};
