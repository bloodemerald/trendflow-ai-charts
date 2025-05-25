
import { useState, useCallback, useEffect, RefObject } from 'react';
import { useChartStore } from '@/store/chartStore';
import type { DrawingPoint, DrawingObject } from '@/store/chartStore';
// No direct import of useTextAnnotation needed here if startTextAnnotation is passed as a prop
import { v4 as uuidv4 } from 'uuid';
import { isPointNearDrawing } from '@/lib/chartUtils'; // Import from chartUtils
// getStrokeDashArray and hexToRgba are not directly used in this hook, but in Chart.tsx for rendering.
// If they were used here for some logic, they would be imported.

interface UseDrawingToolsProps {
  svgRef: RefObject<SVGSVGElement>;
  startTextAnnotation: (point: DrawingPoint) => void; // Callback to initiate text annotation
}

interface UseDrawingToolsReturn {
  isDrawing: boolean;
  startPoint: DrawingPoint | null;
  currentEndPoint: DrawingPoint | null;
  handleMouseDown: (event: React.MouseEvent<SVGSVGElement>) => void;
  handleMouseMove: (event: React.MouseEvent<SVGSVGElement>) => void;
  handleMouseUp: (event: React.MouseEvent<SVGSVGElement>) => void;
}

export const useDrawingTools = ({ svgRef, startTextAnnotation }: UseDrawingToolsProps): UseDrawingToolsReturn => {
  const {
    activeTool,
    currentDrawingSettings,
    addDrawing,
    drawings,
    selectedDrawingId,
    setSelectedDrawingId,
    deleteDrawing,
  } = useChartStore();

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<DrawingPoint | null>(null);
  const [currentEndPoint, setCurrentEndPoint] = useState<DrawingPoint | null>(null);

  const handleMouseDown = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const mouseX = event.clientX - svgRect.left;
    const mouseY = event.clientY - svgRect.top;

    const point = { x: mouseX, y: mouseY };

    if (activeTool === 'cursor') {
      let hitDetected = false;
      for (let i = drawings.length - 1; i >= 0; i--) {
        const drawing = drawings[i];
        if (isPointNearDrawing(mouseX, mouseY, drawing, currentDrawingSettings.lineWidth)) {
          setSelectedDrawingId(drawing.id);
          hitDetected = true;
          break;
        }
      }
      if (!hitDetected) {
        setSelectedDrawingId(null);
      }
    } else if (activeTool === 'text') {
      // Call the callback to start text annotation, provided by useTextAnnotation hook via Chart.tsx
      startTextAnnotation(point);
    } else if (activeTool === 'trendline' || activeTool === 'rectangle' || activeTool === 'fibonacci') {
      setIsDrawing(true);
      setStartPoint(point);
      setCurrentEndPoint(point);
    }
    // Crosshair logic is handled directly in Chart.tsx or a dedicated hook
  }, [activeTool, drawings, setSelectedDrawingId, svgRef, currentDrawingSettings.lineWidth, startTextAnnotation]);

  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || (activeTool !== 'trendline' && activeTool !== 'rectangle' && activeTool !== 'fibonacci')) return;
    if (!svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const x = event.clientX - svgRect.left;
    const y = event.clientY - svgRect.top;
    setCurrentEndPoint({ x, y });
    // console.log(`Drawing ${activeTool} moved (from hook) to:`, { x, y });
  }, [isDrawing, activeTool, svgRef]);

  const handleMouseUp = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !startPoint || !currentEndPoint || (activeTool !== 'trendline' && activeTool !== 'rectangle' && activeTool !== 'fibonacci')) {
      return;
    }
    
    // const svgRect = svgRef.current?.getBoundingClientRect(); // Not strictly needed if currentEndPoint is up-to-date
    // if (!svgRect) return;
    // const x = event.clientX - svgRect.left; // currentEndPoint should have the latest coordinates
    // const y = event.clientY - svgRect.top;
    // const finalEndPoint = { x, y };

    let newDrawingObject: DrawingObject | null = null;

    if (activeTool === 'trendline') {
      newDrawingObject = {
        id: uuidv4(),
        type: 'trendline',
        points: [startPoint, currentEndPoint], // Use currentEndPoint from state
        color: currentDrawingSettings.color,
        lineStyle: currentDrawingSettings.lineStyle,
        lineWidth: currentDrawingSettings.lineWidth,
      };
    } else if (activeTool === 'rectangle') {
      newDrawingObject = {
        id: uuidv4(),
        type: 'rectangle',
        points: [startPoint, currentEndPoint], // Use currentEndPoint from state
        color: currentDrawingSettings.color,
        lineStyle: currentDrawingSettings.lineStyle,
        lineWidth: currentDrawingSettings.lineWidth,
      };
    } else if (activeTool === 'fibonacci') {
      newDrawingObject = {
        id: uuidv4(),
        type: 'fibonacci',
        points: [startPoint, currentEndPoint], // Use currentEndPoint from state
        color: currentDrawingSettings.color,
        lineStyle: currentDrawingSettings.lineStyle,
        lineWidth: currentDrawingSettings.lineWidth,
      };
    }

    if (newDrawingObject) {
      addDrawing(newDrawingObject);
      // console.log(`Drawing ${activeTool} finished (from hook):`, newDrawingObject);
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentEndPoint(null);
  }, [isDrawing, startPoint, currentEndPoint, activeTool, currentDrawingSettings, addDrawing, /*svgRef*/]);

  // Keyboard Deletion Effect
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedDrawingId) {
        // console.log('Deleting drawing (from hook):', selectedDrawingId);
        deleteDrawing(selectedDrawingId);
        // setSelectedDrawingId(null); // Handled by deleteDrawing in store if it was selected
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedDrawingId, deleteDrawing]);

  return {
    isDrawing,
    startPoint,
    currentEndPoint,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};
