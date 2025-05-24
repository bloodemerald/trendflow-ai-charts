
import { useState, useRef, useEffect, useCallback } from 'react';
import { useChartStore } from '@/store/chartStore';
import type { DrawingPoint, DrawingObject } from '@/store/chartStore';
import { v4 as uuidv4 } from 'uuid';

interface UseTextAnnotationReturn {
  isTextAnnotating: boolean;
  textAnnotationPoint: DrawingPoint | null;
  currentTextValue: string;
  textInputRef: React.RefObject<HTMLInputElement>;
  handleTextChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleTextBlur: () => void;
  handleTextKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  startTextAnnotation: (point: DrawingPoint) => void;
  // Not returning finalizeTextAnnotation directly, it's called by onBlur and onKeyDown
}

export const useTextAnnotation = (): UseTextAnnotationReturn => {
  // Fix the store selector to prevent infinite rerenders - use individual selectors
  const addDrawing = useChartStore(state => state.addDrawing);
  const currentDrawingSettings = useChartStore(state => state.currentDrawingSettings);

  const [isTextAnnotating, setIsTextAnnotating] = useState(false);
  const [textAnnotationPoint, setTextAnnotationPoint] = useState<DrawingPoint | null>(null);
  const [currentTextValue, setCurrentTextValue] = useState("");
  const textInputRef = useRef<HTMLInputElement>(null);

  const finalizeTextAnnotation = useCallback(() => {
    if (currentTextValue.trim() && textAnnotationPoint) {
      const newTextObject: DrawingObject = {
        id: uuidv4(),
        type: 'text',
        points: [textAnnotationPoint],
        text: currentTextValue.trim(),
        color: currentDrawingSettings.color,
        lineWidth: currentDrawingSettings.lineWidth, // Used for font size mapping
        lineStyle: currentDrawingSettings.lineStyle, // For consistency if needed elsewhere
      };
      addDrawing(newTextObject);
      // console.log('Added text object (from hook):', newTextObject);
    }
    setIsTextAnnotating(false);
    setTextAnnotationPoint(null);
    setCurrentTextValue("");
  }, [currentTextValue, textAnnotationPoint, addDrawing, currentDrawingSettings]);

  useEffect(() => {
    if (isTextAnnotating && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [isTextAnnotating]);

  const startTextAnnotation = useCallback((point: DrawingPoint) => {
    setIsTextAnnotating(true);
    setTextAnnotationPoint(point);
    setCurrentTextValue("");
    // console.log('Text annotation started (from hook) at:', point);
  }, []);

  const handleTextChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTextValue(event.target.value);
  }, []);

  const handleTextBlur = useCallback(() => {
    finalizeTextAnnotation();
  }, [finalizeTextAnnotation]);

  const handleTextKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      finalizeTextAnnotation();
    } else if (event.key === 'Escape') {
      setIsTextAnnotating(false);
      setTextAnnotationPoint(null);
      setCurrentTextValue("");
    }
  }, [finalizeTextAnnotation]);

  return {
    isTextAnnotating,
    textAnnotationPoint,
    currentTextValue,
    textInputRef,
    handleTextChange,
    handleTextBlur,
    handleTextKeyDown,
    startTextAnnotation,
  };
};
