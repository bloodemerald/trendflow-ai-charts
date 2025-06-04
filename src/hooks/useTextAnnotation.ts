
import { useState, useRef, useEffect, useCallback } from 'react';

interface DrawingPoint {
  x: number;
  y: number;
}

interface UseTextAnnotationReturn {
  isTextAnnotating: boolean;
  textAnnotationPoint: DrawingPoint | null;
  currentTextValue: string;
  textInputRef: React.RefObject<HTMLInputElement>;
  handleTextChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleTextBlur: () => void;
  handleTextKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  startTextAnnotation: (point: DrawingPoint) => void;
}

export const useTextAnnotation = (): UseTextAnnotationReturn => {
  const [isTextAnnotating, setIsTextAnnotating] = useState(false);
  const [textAnnotationPoint, setTextAnnotationPoint] = useState<DrawingPoint | null>(null);
  const [currentTextValue, setCurrentTextValue] = useState("");
  const textInputRef = useRef<HTMLInputElement>(null);

  const finalizeTextAnnotation = useCallback(() => {
    if (currentTextValue.trim() && textAnnotationPoint) {
      console.log('Text annotation finalized:', currentTextValue, textAnnotationPoint);
    }
    setIsTextAnnotating(false);
    setTextAnnotationPoint(null);
    setCurrentTextValue("");
  }, [currentTextValue, textAnnotationPoint]);

  useEffect(() => {
    if (isTextAnnotating && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [isTextAnnotating]);

  const startTextAnnotation = useCallback((point: DrawingPoint) => {
    setIsTextAnnotating(true);
    setTextAnnotationPoint(point);
    setCurrentTextValue("");
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
